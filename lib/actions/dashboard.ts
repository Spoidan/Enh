'use server'

import { db } from '@/lib/db'

export async function getDashboardStats(opts?: {
  startDate?: Date
  endDate?: Date
}) {
  const now = new Date()
  const startDate = opts?.startDate
  const endDate = opts?.endDate
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Date range for filtered queries
  const dateFilter = startDate && endDate
    ? { gte: startDate, lte: endDate }
    : undefined

  const recentWindowStart = startDate ?? thirtyDaysAgo

  const [
    totalStudents,
    totalClasses,
    monthlyPayments,
    allPayments,
    allSales,
    allExpenses,
    allDeposits,
    allSalaries,
    recentPayments,
    recentSales,
    classesByFees,
    salesByType,
    revenueByDay,
    paymentStatus,
  ] = await Promise.all([
    db.student.count(),
    db.class.count(),
    db.payment.aggregate({
      where: { date: dateFilter ?? { gte: firstOfMonth } },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: dateFilter ? { date: dateFilter } : undefined,
      _sum: { amount: true },
    }),
    db.sale.aggregate({
      where: dateFilter ? { date: dateFilter } : undefined,
      _sum: { amount: true },
    }),
    db.expense.aggregate({
      where: dateFilter ? { date: dateFilter } : undefined,
      _sum: { amount: true },
    }),
    db.deposit.aggregate({
      where: dateFilter ? { date: dateFilter } : undefined,
      _sum: { amount: true },
    }),
    // Total salary payments paid
    db.salaryPayment.aggregate({
      where: dateFilter ? { date: dateFilter } : undefined,
      _sum: { amount: true },
    }),
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
    // Top classes by pending fees
    db.class.findMany({
      include: {
        students: {
          include: {
            payments: dateFilter ? { where: { date: dateFilter } } : true,
            class: { include: { feeStructures: true } },
          },
        },
        feeStructures: { where: { isActive: true } },
      },
    }),
    // Sales breakdown by type
    db.inventoryItem.findMany({
      include: {
        sales: {
          select: { amount: true },
          where: dateFilter ? { date: dateFilter } : undefined,
        },
      },
    }),
    // Revenue by day
    db.payment.findMany({
      where: { date: { gte: recentWindowStart, ...(endDate ? { lte: endDate } : {}) } },
      select: { amount: true, date: true },
      orderBy: { date: 'asc' },
    }),
    // Payment status across all students
    db.student.findMany({
      include: {
        class: { include: { feeStructures: { where: { isActive: true } } } },
        payments: {
          select: { amount: true },
          where: dateFilter ? { date: dateFilter } : undefined,
        },
      },
    }),
  ])

  const totalPaid = allPayments._sum.amount ?? 0
  const totalSalesRevenue = allSales._sum.amount ?? 0
  const totalExpensesAmount = allExpenses._sum.amount ?? 0
  const totalDeposits = allDeposits._sum.amount ?? 0
  const totalSalariesAmount = allSalaries._sum.amount ?? 0
  const totalIncome = totalPaid + totalSalesRevenue + totalDeposits
  // Bank balance = all income - operating expenses - salary payments
  const bankBalance = totalIncome - totalExpensesAmount - totalSalariesAmount
  const monthlyRevenue = monthlyPayments._sum.amount ?? 0

  // Pending fees calc
  let totalPending = 0
  let fullyPaid = 0, partial = 0, noPay = 0
  const classPending: { name: string; pending: number }[] = []

  for (const cls of classesByFees) {
    const monthlyDue = cls.feeStructures.reduce((s, f) => s + f.amount, 0)
    let clsPending = 0
    for (const student of cls.students) {
      const due = monthlyDue
      const paid = student.payments.reduce((s, p) => s + p.amount, 0)
      const pending = Math.max(0, due - paid)
      clsPending += pending
      totalPending += pending
      if (paid === 0) noPay++
      else if (paid >= due) fullyPaid++
      else partial++
    }
    classPending.push({ name: cls.name, pending: clsPending })
  }

  classPending.sort((a, b) => b.pending - a.pending)

  // Sales by type
  const uniformSales = salesByType
    .filter(i => i.type === 'uniform')
    .reduce((s, i) => s + i.sales.reduce((a, sale) => a + sale.amount, 0), 0)
  const bookSales = salesByType
    .filter(i => i.type === 'book')
    .reduce((s, i) => s + i.sales.reduce((a, sale) => a + sale.amount, 0), 0)
  const otherSales = totalSalesRevenue - uniformSales - bookSales

  // Revenue by day
  const revenueMap = new Map<string, number>()
  for (const p of revenueByDay) {
    const key = p.date.toISOString().split('T')[0]
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + p.amount)
  }
  const revenueChart = Array.from(revenueMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }))

  // Recent transactions merged
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
    } as {
      id: string
      type: 'sale'
      description: string
      amount: number
      date: Date
      class: string
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10)

  return {
    totalStudents,
    totalClasses,
    monthlyRevenue,
    totalPending,
    bankBalance,
    totalIncome,
    totalExpensesAmount,
    totalSalariesAmount,
    paymentStatus: { fullyPaid, partial, noPay },
    classPending: classPending.slice(0, 5),
    salesBreakdown: { uniformSales, bookSales, otherSales },
    revenueChart,
    recentTransactions,
  }
}
