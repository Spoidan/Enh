export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import {
  getFinancialSummary,
  getMonthlyChartData,
  getExpenseBreakdown,
} from '@/lib/actions/finance'
import { getStudents } from '@/lib/actions/students'
import { getClasses } from '@/lib/actions/classes'
import { getPaymentStats } from '@/lib/actions/payments'
import { ReportsClient } from './reports-client'

export default async function ReportsPage() {
  // Resolve active school year
  const activeYear = await db.schoolYear.findFirst({
    where: { isActive: true },
    include: { terms: { orderBy: { startDate: 'asc' } } },
  })

  const terms = activeYear?.terms ?? []
  const yearStart = terms.length > 0
    ? terms[0].startDate
    : (activeYear?.startDate ?? new Date(new Date().getFullYear(), 0, 1))
  const yearEnd = terms.length > 0
    ? terms[terms.length - 1].endDate
    : (activeYear?.endDate ?? new Date())
  const yearFilter = { gte: yearStart, lte: yearEnd }

  // Per-trimester aggregation
  const termRows = activeYear?.terms?.length
    ? await Promise.all(
        activeYear.terms.map(async (term) => {
          const tf = { gte: term.startDate, lte: term.endDate }
          const [pmts, exps, sals] = await Promise.all([
            db.payment.aggregate({ where: { date: tf }, _sum: { amount: true } }),
            db.expense.aggregate({ where: { date: tf }, _sum: { amount: true } }),
            db.salaryPayment.aggregate({ where: { date: tf }, _sum: { amount: true } }),
          ])
          const revenue  = pmts._sum.amount ?? 0
          const expenses = exps._sum.amount ?? 0
          const salaries = sals._sum.amount ?? 0
          return { name: term.name, revenue, expenses, salaries, balance: revenue - expenses - salaries }
        })
      )
    : []

  // Per-class stats (enrolled students + payments collected this year)
  const rawClassStats = await db.class.findMany({
    orderBy: { name: 'asc' },
    include: {
      yearFeeStructures: true,
      enrollments: {
        where: activeYear
          ? { schoolYearId: activeYear.id, status: 'active' }
          : { status: 'active' },
        include: {
          student: {
            include: {
              payments: { where: { date: yearFilter }, select: { amount: true } },
            },
          },
        },
      },
    },
  })

  const classRows = rawClassStats
    .map((cls) => {
      const feeStructures = cls.yearFeeStructures.filter(
        (f) => !activeYear || f.schoolYearId === activeYear.id
      )
      const expectedPerStudent = feeStructures.reduce((s, f) => s + f.amount, 0)
      const enrolledCount = cls.enrollments.length

      let collected = 0, fullyPaidCount = 0, partialCount = 0, unpaidCount = 0
      for (const enr of cls.enrollments) {
        const paid = enr.student.payments.reduce((s, p) => s + p.amount, 0)
        collected += paid
        if (paid === 0) unpaidCount++
        else if (expectedPerStudent > 0 && paid >= expectedPerStudent) fullyPaidCount++
        else partialCount++
      }

      const expected = expectedPerStudent * enrolledCount
      const recoveryRate = expected > 0 ? Math.round((collected / expected) * 100) : null

      return { name: cls.name, enrolledCount, collected, expected, recoveryRate, fullyPaidCount, partialCount, unpaidCount }
    })
    .filter((c) => c.enrolledCount > 0)
    .sort((a, b) => b.collected - a.collected)

  // All other data in parallel
  const [summary, monthlyData, expenseBreakdown, paymentStats, { students }, classes] =
    await Promise.all([
      getFinancialSummary(yearStart, yearEnd),
      getMonthlyChartData(yearStart, yearEnd),
      getExpenseBreakdown(yearStart, yearEnd),
      getPaymentStats(),
      getStudents({ limit: 2000 }),
      getClasses(),
    ])

  return (
    <ReportsClient
      summary={summary}
      monthlyData={monthlyData}
      expenseBreakdown={expenseBreakdown}
      paymentStats={paymentStats}
      classRows={classRows}
      termRows={termRows}
      students={students}
      classes={classes}
      yearName={activeYear?.name ?? ''}
    />
  )
}
