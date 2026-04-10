'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MonthlyFinanceChart } from '@/components/charts/monthly-finance-chart'
import { PaymentStatusChart } from '@/components/charts/payment-status-chart'
import { ExpenseBreakdownChart } from '@/components/charts/expense-breakdown-chart'
import { formatCurrency, downloadCSV, formatDate } from '@/lib/utils'
import {
  Download, Users, TrendingUp, TrendingDown, DollarSign,
  Landmark, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import type { Student, Class } from '@/app/generated/prisma/client'

interface ClassRow {
  name: string
  enrolledCount: number
  collected: number
  expected: number
  recoveryRate: number | null
  fullyPaidCount: number
  partialCount: number
  unpaidCount: number
}

interface TermRow {
  name: string
  revenue: number
  expenses: number
  salaries: number
  balance: number
}

interface Props {
  summary: {
    totalPayments: number
    totalDeposits: number
    totalSales: number
    totalIncome: number
    totalExpenses: number
    totalSalaries: number
    netBalance: number
  }
  monthlyData: { month: string; income: number; expenses: number }[]
  expenseBreakdown: { category: string; amount: number }[]
  paymentStats: { fullyPaid: number; partial: number; noPay: number }
  classRows: ClassRow[]
  termRows: TermRow[]
  students: (Student & { class: Class })[]
  classes: (Class & { _count: { students: number } })[]
  yearName: string
}

export function ReportsClient({
  summary, monthlyData, expenseBreakdown, paymentStats,
  classRows, termRows, students, classes, yearName,
}: Props) {
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.isActive).length
  const totalEnrolled = paymentStats.fullyPaid + paymentStats.partial + paymentStats.noPay
  const payRate = totalEnrolled > 0
    ? Math.round((paymentStats.fullyPaid / totalEnrolled) * 100)
    : 0

  const exportStudents = () => downloadCSV(
    students.map(s => ({
      Nom: s.name,
      'N° Immatriculation': s.rollNumber ?? '',
      Classe: s.class.name,
      Parent: s.parentName ?? '',
      Téléphone: s.parentPhone ?? '',
      Statut: s.isActive ? 'Actif' : 'Inactif',
      Inscription: formatDate(s.createdAt),
    })),
    'rapport-eleves.csv'
  )

  const exportClasses = () => downloadCSV(
    classes.map(c => ({
      Classe: c.name,
      Section: c.section ?? '',
      Niveau: c.gradeLevel ?? '',
      Élèves: c._count.students,
      Capacité: c.capacity ?? '',
    })),
    'rapport-classes.csv'
  )

  const exportFinancial = () => downloadCSV([{
    'Année scolaire': yearName,
    'Paiements de frais (BIF)': summary.totalPayments,
    'Revenus des ventes (BIF)': summary.totalSales,
    'Total Revenus (BIF)': summary.totalIncome,
    'Total Dépenses (BIF)': summary.totalExpenses,
    'Total Salaires (BIF)': summary.totalSalaries,
    'Solde Net (BIF)': summary.netBalance,
  }], 'rapport-financier.csv')

  const exportClasses2 = () => downloadCSV(
    classRows.map(c => ({
      Classe: c.name,
      'Élèves inscrits': c.enrolledCount,
      'Collecté (BIF)': c.collected,
      'Attendu (BIF)': c.expected,
      'Taux de recouvrement (%)': c.recoveryRate ?? '—',
      'Entièrement payés': c.fullyPaidCount,
      Partiels: c.partialCount,
      'Non payés': c.unpaidCount,
    })),
    'rapport-classes-paiements.csv'
  )

  const statCards = [
    {
      label: 'Élèves actifs',
      value: activeStudents.toLocaleString('fr-FR'),
      sub: `${totalStudents} au total`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Revenus de l\'année',
      value: formatCurrency(summary.totalIncome),
      sub: 'Frais + ventes',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Total Dépenses',
      value: formatCurrency(summary.totalExpenses + summary.totalSalaries),
      sub: 'Dépenses + salaires',
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Total Salaires',
      value: formatCurrency(summary.totalSalaries),
      sub: 'Masse salariale',
      icon: Landmark,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: 'Solde Net',
      value: formatCurrency(summary.netBalance),
      sub: 'Revenus − charges',
      icon: DollarSign,
      color: summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600',
      bg: summary.netBalance >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Taux de paiement',
      value: `${payRate}%`,
      sub: `${paymentStats.fullyPaid} élèves à jour`,
      icon: CheckCircle2,
      color: payRate >= 70 ? 'text-green-600' : payRate >= 40 ? 'text-yellow-600' : 'text-red-600',
      bg: payRate >= 70 ? 'bg-green-50 dark:bg-green-900/20' : payRate >= 40 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rapports</h1>
          <p className="text-muted-foreground text-sm">
            Analyses et statistiques
            {yearName && <span className="ml-1 font-medium text-foreground">— {yearName}</span>}
          </p>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">{label}</p>
                  <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                </div>
                <div className={`rounded-lg p-2 shrink-0 ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly chart + Payment status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Revenus vs Dépenses mensuels
              {yearName && <span className="ml-1 font-normal text-muted-foreground">— {yearName}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyFinanceChart data={monthlyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Statut des paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentStatusChart
              fullyPaid={paymentStats.fullyPaid}
              partial={paymentStats.partial}
              noPay={paymentStats.noPay}
            />
          </CardContent>
        </Card>
      </div>

      {/* Expense breakdown + Financial summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Répartition des dépenses par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseBreakdownChart data={expenseBreakdown} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Récapitulatif financier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Paiements de frais</span>
                <span className="font-semibold text-green-600">{formatCurrency(summary.totalPayments)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Revenus des ventes</span>
                <span className="font-semibold text-green-600">{formatCurrency(summary.totalSales)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Dépôts bancaires</span>
                <span className="font-semibold text-blue-600">{formatCurrency(summary.totalDeposits)}</span>
              </div>
              <div className="flex justify-between py-2 border-b font-medium">
                <span>Total Revenus</span>
                <span className="text-green-700">{formatCurrency(summary.totalIncome)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Dépenses (finance)</span>
                <span className="font-semibold text-red-600">{formatCurrency(summary.totalExpenses)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Salaires</span>
                <span className="font-semibold text-orange-600">{formatCurrency(summary.totalSalaries)}</span>
              </div>
              <div className="flex justify-between py-2 border-b font-medium">
                <span>Total Dépenses</span>
                <span className="text-red-700">{formatCurrency(summary.totalExpenses + summary.totalSalaries)}</span>
              </div>
              <div className="flex justify-between py-2 text-base font-bold">
                <span>Solde Net</span>
                <span className={summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(summary.netBalance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-trimester table */}
      {termRows.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Résultats par trimestre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Trimestre</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Revenus</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Dépenses</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Salaires</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Solde</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {termRows.map((t) => (
                    <tr key={t.name} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{t.name}</td>
                      <td className="px-3 py-2 text-right text-green-600 tabular-nums">{formatCurrency(t.revenue)}</td>
                      <td className="px-3 py-2 text-right text-red-600 tabular-nums">{formatCurrency(t.expenses)}</td>
                      <td className="px-3 py-2 text-right text-orange-600 tabular-nums">{formatCurrency(t.salaries)}</td>
                      <td className={`px-3 py-2 text-right font-semibold tabular-nums ${t.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(t.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-class table */}
      {classRows.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recouvrement par classe</CardTitle>
            <Button variant="outline" size="sm" onClick={exportClasses2}>
              <Download className="h-3.5 w-3.5 mr-1" />Exporter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Classe</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Inscrits</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Collecté</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Attendu</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Taux</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Statuts</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {classRows.map((c) => (
                    <tr key={c.name} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{c.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.enrolledCount}</td>
                      <td className="px-3 py-2 text-right text-green-600 tabular-nums font-medium">{formatCurrency(c.collected)}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">
                        {c.expected > 0 ? formatCurrency(c.expected) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {c.recoveryRate !== null ? (
                          <Badge
                            variant="outline"
                            className={
                              c.recoveryRate >= 80
                                ? 'border-green-300 text-green-700 bg-green-50'
                                : c.recoveryRate >= 50
                                ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                                : 'border-red-300 text-red-700 bg-red-50'
                            }
                          >
                            {c.recoveryRate}%
                          </Badge>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <span className="text-green-600 flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3" />{c.fullyPaidCount}
                          </span>
                          <span className="text-yellow-600 flex items-center gap-0.5">
                            <AlertTriangle className="h-3 w-3" />{c.partialCount}
                          </span>
                          <span className="text-red-600 flex items-center gap-0.5">
                            <AlertTriangle className="h-3 w-3" />{c.unpaidCount}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={exportStudents}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Rapport Élèves</p>
              <p className="text-xs text-muted-foreground">{totalStudents} élèves</p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={exportClasses}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Rapport Classes</p>
              <p className="text-xs text-muted-foreground">{classes.length} classes</p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={exportFinancial}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Rapport Financier</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(summary.totalIncome)} total</p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
