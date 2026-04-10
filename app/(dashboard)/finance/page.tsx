import { db } from '@/lib/db'
import {
  getDeposits,
  getExpenses,
  getFinancialSummary,
  getMonthlyChartData,
  getExpenseBreakdown,
} from '@/lib/actions/finance'
import { FinanceClient } from './finance-client'

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string
    dpage?: string
    epage?: string
    estartDate?: string
    eendDate?: string
  }>
}) {
  const { tab = 'overview', dpage, epage, estartDate, eendDate } = await searchParams
  const depositPage = Math.max(1, Number(dpage ?? 1))
  const expensePage = Math.max(1, Number(epage ?? 1))

  // Get active school year for monthly chart date range
  const activeYear = await db.schoolYear.findFirst({
    where: { isActive: true },
    select: { startDate: true, endDate: true, name: true },
  })

  const yearStart = activeYear?.startDate ?? new Date(new Date().getFullYear(), 0, 1)
  const yearEnd = activeYear?.endDate ?? new Date()

  const [summary, deposits, expenses, monthlyData, expenseBreakdown] = await Promise.all([
    getFinancialSummary(),
    getDeposits({ page: depositPage }),
    getExpenses({ page: expensePage, startDate: estartDate, endDate: eendDate }),
    getMonthlyChartData(yearStart, yearEnd),
    getExpenseBreakdown(yearStart, yearEnd),
  ])

  return (
    <FinanceClient
      summary={summary}
      deposits={deposits}
      expenses={expenses}
      monthlyData={monthlyData}
      expenseBreakdown={expenseBreakdown}
      initialTab={tab}
      depositPage={depositPage}
      expensePage={expensePage}
      expenseStartDate={estartDate ?? ''}
      expenseEndDate={eendDate ?? ''}
      yearName={activeYear?.name ?? ''}
    />
  )
}
