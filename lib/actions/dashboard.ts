'use server'

import { db } from '@/lib/db'

function getExpectedFeeForTerm(
  fee: {
    amount: number
    paymentFrequency: string
    amountT1: number | null
    amountT2: number | null
    amountT3: number | null
    specificTrimester: number | null
  },
  termNumber: number | undefined
): number {
  if (termNumber === undefined) {
    // Full year total
    if (fee.paymentFrequency === 'per_trimester') {
      return (fee.amountT1 ?? 0) + (fee.amountT2 ?? 0) + (fee.amountT3 ?? 0)
    }
    return fee.amount
  }

  switch (fee.paymentFrequency) {
    case 'annual_t1':
      return termNumber === 1 ? fee.amount : 0
    case 'per_trimester':
      if (termNumber === 1) return fee.amountT1 ?? 0
      if (termNumber === 2) return fee.amountT2 ?? 0
      if (termNumber === 3) return fee.amountT3 ?? 0
      return 0
    case 'specific_trimester':
      return fee.specificTrimester === termNumber ? fee.amount : 0
    default:
      return termNumber === 1 ? fee.amount : 0
  }
}

export async function getDashboardStats(opts?: {
  startDate?: Date
  endDate?: Date
  yearStartDate?: Date
  yearEndDate?: Date
  schoolYearId?: string
  termNumber?: number
}) {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const { startDate, endDate, yearStartDate, yearEndDate, schoolYearId, termNumber } = opts ?? {}

  const periodFilter = startDate && endDate
    ? { gte: startDate, lte: endDate }
    : undefined

  const yearFilter = yearStartDate && yearEndDate
    ? { gte: yearStartDate, lte: yearEndDate }
    : undefined

  const recentWindowStart = startDate ?? thirtyDaysAgo

  const [
    totalStudents,
    totalClasses,
    periodPaymentsAgg,
    bankDepositsAgg,
    periodExpensesAgg,
    periodSalariesAgg,
    yearPaymentsAgg,
    yearSalesAgg,
    recentPayments,
    recentSales,
    salesByType,
    revenueByDay,
  ] = await Promise.all([
    db.student.count({ where: { isActive: true } }),
    db.class.count(),

    // Card 1: payments in the selected period
    db.payment.aggregate({
      where: { date: periodFilter ?? { gte: firstOfMonth } },
      _sum: { amount: true },
    }),

    // Card 3: bank deposits in period
    db.deposit.aggregate({
      where: periodFilter ? { date: periodFilter } : undefined,
      _sum: { amount: true },
    }),

    // Card 3: expenses in period
    db.expense.aggregate({
      where: periodFilter ? { date: periodFilter } : undefined,
      _sum: { amount: true },
    }),

    // Card 3: salary payments in period
    db.salaryPayment.aggregate({
      where: periodFilter ? { date: periodFilter } : undefined,
      _sum: { amount: true },
    }),

    // Card 4: total student payments for the entire school year
    db.payment.aggregate({
      where: yearFilter ? { date: yearFilter } : undefined,
      _sum: { amount: true },
    }),

    // Card 4: total sales for the entire school year
    db.sale.aggregate({
      where: yearFilter ? { date: yearFilter } : undefined,
      _sum: { amount: true },
    }),

    // Recent transactions
    db.payment.findMany({
      where: { date: { gte: recentWindowStart, ...(endDate ? { lte: endDate } : {}) } },
      include: { student: { include: { class: true } } },
      orderBy: { date: 'desc' },
      take: 10,
    }),
    db.sale.findMany({
      where: { date: { gte: recentWindowStart, ...(endDate ? { lte: endDate } : {}) } },
      include: { item: true, student: { include: { class: true } } },
      orderBy: { date: 'desc' },
      take: 10,
    }),

    // Sales breakdown by type
    db.inventoryItem.findMany({
      include: {
        sales: {
          select: { amount: true },
          where: periodFilter ? { date: periodFilter } : undefined,
        },
      },
    }),

    // Revenue by day for chart
    db.payment.findMany({
      where: { date: { gte: recentWindowStart, ...(endDate ? { lte: endDate } : {}) } },
      select: { amount: true, date: true },
      orderBy: { date: 'asc' },
    }),
  ])

  // ── Card 1: Period revenue ────────────────────────────────────────────────────
  const periodRevenue = periodPaymentsAgg._sum.amount ?? 0

  // ── Card 3: Bank balance = deposits - expenses - salaries ─────────────────────
  const bankDeposits = bankDepositsAgg._sum.amount ?? 0
  const periodExpenses = periodExpensesAgg._sum.amount ?? 0
  const periodSalaries = periodSalariesAgg._sum.amount ?? 0
  const bankBalance = bankDeposits - periodExpenses - periodSalaries

  // ── Card 4: Total year income = year payments + year sales ────────────────────
  const yearPayments = yearPaymentsAgg._sum.amount ?? 0
  const yearSales = yearSalesAgg._sum.amount ?? 0
  const totalIncome = yearPayments + yearSales

  // ── Card 2: Pending fees ──────────────────────────────────────────────────────
  let totalPending = 0
  let fullyPaid = 0, partial = 0, noPay = 0
  const classPendingMap = new Map<string, number>()

  if (schoolYearId) {
    // Enrollment-based fee calculation using YearFeeStructure
    const enrollments = await db.studentEnrollment.findMany({
      where: { schoolYearId, status: 'active' },
      include: {
        student: {
          include: {
            payments: {
              where: periodFilter ? { date: periodFilter } : undefined,
              select: { amount: true },
            },
            extraFees: true,
            discounts: true,
          },
        },
        class: {
          include: {
            yearFeeStructures: { where: { schoolYearId } },
          },
        },
      },
    })

    for (const enrollment of enrollments) {
      const feeStructures = enrollment.class.yearFeeStructures

      let expected = 0
      for (const fee of feeStructures) {
        expected += getExpectedFeeForTerm(fee, termNumber)
      }

      // Extra fees for this trimester (or all trimesters)
      for (const ef of enrollment.student.extraFees) {
        if (termNumber === undefined || ef.trimester === null || ef.trimester === termNumber) {
          expected += ef.amount
        }
      }

      // Discounts for this trimester (or all trimesters)
      for (const d of enrollment.student.discounts) {
        if (termNumber === undefined || d.trimester === null || d.trimester === termNumber) {
          expected -= d.amount
        }
      }
      expected = Math.max(0, expected)

      const paid = enrollment.student.payments.reduce((s, p) => s + p.amount, 0)
      const pending = Math.max(0, expected - paid)

      totalPending += pending

      if (paid === 0) noPay++
      else if (expected > 0 && paid >= expected) fullyPaid++
      else partial++

      const clsPending = classPendingMap.get(enrollment.class.name) ?? 0
      classPendingMap.set(enrollment.class.name, clsPending + pending)
    }
  } else {
    // Fallback: use old feeStructures approach
    const classes = await db.class.findMany({
      include: {
        students: {
          where: { isActive: true },
          include: {
            payments: {
              select: { amount: true },
              where: periodFilter ? { date: periodFilter } : undefined,
            },
          },
        },
        feeStructures: { where: { isActive: true } },
      },
    })

    for (const cls of classes) {
      const due = cls.feeStructures.reduce((s, f) => s + f.amount, 0)
      let clsPending = 0
      for (const student of cls.students) {
        const paid = student.payments.reduce((s, p) => s + p.amount, 0)
        const pending = Math.max(0, due - paid)
        clsPending += pending
        totalPending += pending
        if (paid === 0) noPay++
        else if (due > 0 && paid >= due) fullyPaid++
        else partial++
      }
      classPendingMap.set(cls.name, clsPending)
    }
  }

  const classPending = Array.from(classPendingMap.entries())
    .map(([name, pending]) => ({ name, pending }))
    .sort((a, b) => b.pending - a.pending)

  // ── Sales breakdown by type ────────────────────────────────────────────────────
  const uniformSales = salesByType
    .filter(i => i.type === 'uniform')
    .reduce((s, i) => s + i.sales.reduce((a, sale) => a + sale.amount, 0), 0)
  const bookSales = salesByType
    .filter(i => i.type === 'book')
    .reduce((s, i) => s + i.sales.reduce((a, sale) => a + sale.amount, 0), 0)
  const otherSales = salesByType
    .filter(i => i.type !== 'uniform' && i.type !== 'book')
    .reduce((s, i) => s + i.sales.reduce((a, sale) => a + sale.amount, 0), 0)

  // ── Revenue by day for chart ───────────────────────────────────────────────────
  const revenueMap = new Map<string, number>()
  for (const p of revenueByDay) {
    const key = p.date.toISOString().split('T')[0]
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + p.amount)
  }
  const revenueChart = Array.from(revenueMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }))

  // ── Recent transactions ────────────────────────────────────────────────────────
  const recentTransactions = [
    ...recentPayments.map(p => ({
      id: p.id,
      type: 'payment' as const,
      description: `Paiement de frais — ${p.student.name}`,
      amount: p.amount,
      date: p.date,
      class: p.student.class.name,
    })),
    ...recentSales.map(s => ({
      id: s.id,
      type: 'sale' as const,
      description: `${s.item.name} — ${s.student?.name ?? 'Client'}`,
      amount: s.amount,
      date: s.date,
      class: s.student?.class?.name ?? '—',
    } as { id: string; type: 'sale'; description: string; amount: number; date: Date; class: string })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10)

  return {
    totalStudents,
    totalClasses,
    periodRevenue,
    totalPending,
    bankBalance,
    bankDeposits,
    periodExpenses,
    periodSalaries,
    totalIncome,
    paymentStatus: { fullyPaid, partial, noPay },
    classPending: classPending.slice(0, 5),
    salesBreakdown: { uniformSales, bookSales, otherSales },
    revenueChart,
    recentTransactions,
  }
}
