'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { PaymentStatusChart } from '@/components/charts/payment-status-chart'
import { IncomeExpensesChart } from '@/components/charts/income-expenses-chart'
import { formatCurrency, downloadCSV, formatDate } from '@/lib/utils'
import { Download, TrendingUp, Users, DollarSign } from 'lucide-react'
import type { Student, Class } from '@/app/generated/prisma/client'

interface Props {
  summary: {
    totalPayments: number
    totalDeposits: number
    totalSales: number
    totalIncome: number
    totalExpenses: number
    netBalance: number
  }
  chartData: { date: string; income: number; expenses: number }[]
  students: (Student & { class: Class })[]
  classes: (Class & { _count: { students: number } })[]
  paymentStats: {
    recentPayments: unknown[]
    fullyPaid: number
    partial: number
    noPay: number
  }
}

export function ReportsClient({ summary, chartData, students, classes, paymentStats }: Props) {
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.isActive).length

  const revenueData = chartData.map(d => ({ date: d.date, amount: d.income }))

  const exportStudentReport = () => {
    downloadCSV(
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
  }

  const exportClassReport = () => {
    downloadCSV(
      classes.map(c => ({
        Classe: c.name,
        Section: c.section ?? '',
        Niveau: c.gradeLevel ?? '',
        Élèves: c._count.students,
        Capacité: c.capacity ?? '',
      })),
      'rapport-classes.csv'
    )
  }

  const exportFinancialReport = () => {
    downloadCSV([{
      'Total Revenus': summary.totalIncome,
      'Paiements de frais': summary.totalPayments,
      'Dépôts bancaires': summary.totalDeposits,
      'Revenus des ventes': summary.totalSales,
      'Total Dépenses': summary.totalExpenses,
      'Solde Net': summary.netBalance,
    }], 'rapport-financier.csv')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rapports</h1>
        <p className="text-muted-foreground text-sm">Analyses et rapports exportables</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Élèves</p>
                <p className="text-2xl font-bold mt-1">{totalStudents}</p>
                <p className="text-xs text-muted-foreground">{activeStudents} actifs</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Solde Net</p>
                <p className={`text-2xl font-bold mt-1 ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netBalance)}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Entièrement payés</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{paymentStats.fullyPaid}</p>
              <p className="text-xs text-muted-foreground">élèves</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Non payés</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{paymentStats.noPay}</p>
              <p className="text-xs text-muted-foreground">élèves</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tendance des revenus (90 jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData} />
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenus vs Dépenses (90 jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeExpensesChart data={chartData} />
        </CardContent>
      </Card>

      {/* Export Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={exportStudentReport}>
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
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={exportClassReport}>
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
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={exportFinancialReport}>
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
