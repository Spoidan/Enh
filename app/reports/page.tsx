import { getFinancialSummary, getRevenueChartData } from '@/lib/actions/finance'
import { getStudents } from '@/lib/actions/students'
import { getClasses } from '@/lib/actions/classes'
import { getPaymentStats } from '@/lib/actions/payments'
import { ReportsClient } from './reports-client'

export default async function ReportsPage() {
  const [summary, chartData, { students }, classes, paymentStats] = await Promise.all([
    getFinancialSummary(),
    getRevenueChartData(90),
    getStudents({ limit: 1000 }),
    getClasses(),
    getPaymentStats(),
  ])

  return (
    <ReportsClient
      summary={summary}
      chartData={chartData}
      students={students}
      classes={classes}
      paymentStats={paymentStats}
    />
  )
}
