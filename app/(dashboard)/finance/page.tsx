import { getDeposits, getExpenses, getFinancialSummary, getRevenueChartData } from '@/lib/actions/finance'
import { FinanceClient } from './finance-client'

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const { tab = 'overview', page: pageStr } = await searchParams
  const page = Number(pageStr ?? 1)

  const [summary, deposits, expenses, chartData] = await Promise.all([
    getFinancialSummary(),
    getDeposits({ page }),
    getExpenses({ page }),
    getRevenueChartData(30),
  ])

  return (
    <FinanceClient
      summary={summary}
      deposits={deposits}
      expenses={expenses}
      chartData={chartData}
      initialTab={tab}
      currentPage={page}
    />
  )
}
