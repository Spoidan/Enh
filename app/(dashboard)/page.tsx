export const dynamic = 'force-dynamic'

import { getDashboardStats } from '@/lib/actions/dashboard'
import { getRevenueChartData } from '@/lib/actions/finance'
import { getSchoolYears } from '@/lib/actions/school-years'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { PaymentStatusChart } from '@/components/charts/payment-status-chart'
import { IncomeExpensesChart } from '@/components/charts/income-expenses-chart'
import { SalesBreakdownChart } from '@/components/charts/sales-breakdown-chart'
import { DashboardFilters } from '@/components/dashboard-filters'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Landmark,
  CreditCard,
  ShoppingBag,
  ArrowUpRight,
  Banknote,
} from 'lucide-react'
import { Suspense } from 'react'

interface PageProps {
  searchParams: Promise<{ yearId?: string; termId?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { yearId, termId } = params

  // Fetch school years for filters
  const schoolYears = await getSchoolYears()

  // Determine active year as default
  const activeYear = schoolYears.find(y => y.isActive)
  const resolvedYearId = yearId || activeYear?.id || ''
  const selectedYear = schoolYears.find(y => y.id === resolvedYearId)

  // Determine term date range
  let startDate: Date | undefined
  let endDate: Date | undefined

  if (termId && selectedYear) {
    const term = selectedYear.terms.find((t: { id: string }) => t.id === termId)
    if (term) {
      startDate = new Date((term as { startDate: Date | string }).startDate)
      endDate = new Date((term as { endDate: Date | string }).endDate)
    }
  } else if (resolvedYearId && selectedYear) {
    startDate = new Date((selectedYear as { startDate: Date | string }).startDate)
    endDate = new Date((selectedYear as { endDate: Date | string }).endDate)
  }

  const [stats, revenueData] = await Promise.all([
    getDashboardStats(startDate && endDate ? { startDate, endDate } : undefined),
    getRevenueChartData(30),
  ])

  const activeTerm = selectedYear?.terms.find((t: { isActive: boolean }) => t.isActive)
  const resolvedTermId = termId || activeTerm?.id || ''

  const metricCards = [
    {
      title: 'Total Élèves',
      value: stats.totalStudents.toLocaleString('fr-FR'),
      sub: `${stats.totalClasses} classes`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: resolvedYearId ? 'Revenus de la période' : 'Revenus du mois',
      value: formatCurrency(stats.monthlyRevenue),
      sub: 'Paiements de frais',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Frais impayés',
      value: formatCurrency(stats.totalPending),
      sub: `${stats.paymentStatus.noPay} élèves non payés`,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      title: 'Solde bancaire',
      value: formatCurrency(stats.bankBalance),
      sub: `${formatCurrency(stats.totalExpensesAmount)} de dépenses`,
      icon: Landmark,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Revenus totaux',
      value: formatCurrency(stats.totalIncome),
      sub: 'Toute période confondue',
      icon: Banknote,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bienvenue. Voici un aperçu de la situation actuelle.
          </p>
        </div>
        <Suspense fallback={null}>
          <DashboardFilters
            schoolYears={schoolYears.map(y => ({
              id: y.id,
              name: y.name,
              isActive: y.isActive,
              terms: y.terms.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })),
            }))}
            selectedYearId={resolvedYearId}
            selectedTermId={resolvedTermId}
          />
        </Suspense>
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
            <CardTitle className="text-base">Tendance des revenus</CardTitle>
            <CardDescription>Paiements de frais journaliers — 30 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats.revenueChart} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Statut des paiements</CardTitle>
            <CardDescription>Répartition par statut de paiement</CardDescription>
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
            <CardTitle className="text-base">Revenus vs Dépenses</CardTitle>
            <CardDescription>Comparaison journalière — 30 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeExpensesChart data={revenueData} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Répartition des ventes</CardTitle>
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
            <CardTitle className="text-base">Classes — Frais impayés</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.classPending.length === 0 ? (
              <p className="text-sm text-muted-foreground">Toutes les classes sont à jour !</p>
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
            <CardTitle className="text-base">Transactions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune transaction</p>
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
