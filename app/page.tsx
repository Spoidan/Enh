import { getDashboardStats } from '@/lib/actions/dashboard'
import { getRevenueChartData } from '@/lib/actions/finance'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { PaymentStatusChart } from '@/components/charts/payment-status-chart'
import { IncomeExpensesChart } from '@/components/charts/income-expenses-chart'
import { SalesBreakdownChart } from '@/components/charts/sales-breakdown-chart'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Users,
  GraduationCap,
  CreditCard,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Landmark,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

export default async function DashboardPage() {
  const [stats, revenueData] = await Promise.all([
    getDashboardStats(),
    getRevenueChartData(30),
  ])

  const metricCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents.toLocaleString(),
      sub: `${stats.totalClasses} classes`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue),
      sub: 'Fee payments this month',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Pending Fees',
      value: formatCurrency(stats.totalPending),
      sub: `${stats.paymentStatus.noPay} students unpaid`,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      title: 'Bank Balance',
      value: formatCurrency(stats.bankBalance),
      sub: `${formatCurrency(stats.totalExpensesAmount)} expenses`,
      icon: Landmark,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Total Income',
      value: formatCurrency(stats.totalIncome),
      sub: 'All time',
      icon: DollarSign,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {metricCards.map(({ title, value, sub, icon: Icon, color, bg }) => (
          <Card key={title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <CardDescription>Daily fee payments — last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats.revenueChart} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment Status</CardTitle>
            <CardDescription>Student payment breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentStatusChart
              fullyPaid={stats.paymentStatus.fullyPaid}
              partial={stats.paymentStatus.partial}
              noPay={stats.paymentStatus.noPay}
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Income vs Expenses</CardTitle>
            <CardDescription>Last 30 days daily comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeExpensesChart data={revenueData} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Sales Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sales Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <SalesBreakdownChart
                uniformSales={stats.salesBreakdown.uniformSales}
                bookSales={stats.salesBreakdown.bookSales}
                otherSales={stats.salesBreakdown.otherSales}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Classes by Pending Fees */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Classes — Pending Fees</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.classPending.length === 0 ? (
              <p className="text-sm text-muted-foreground">All classes are up to date!</p>
            ) : (
              <div className="space-y-3">
                {stats.classPending.map((cls, i) => (
                  <div key={cls.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{cls.name}</span>
                        <span className="text-sm font-semibold text-destructive">{formatCurrency(cls.pending)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-destructive rounded-full"
                          style={{
                            width: `${Math.min(100, (cls.pending / (stats.classPending[0]?.pending || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        t.type === 'payment'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {t.type === 'payment'
                          ? <CreditCard className="h-3.5 w-3.5 text-green-600" />
                          : <ShoppingBag className="h-3.5 w-3.5 text-blue-600" />
                        }
                      </div>
                      <div>
                        <p className="text-xs font-medium leading-none">{t.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(t.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(t.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
