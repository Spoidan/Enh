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
        Name: s.name,
        'Roll #': s.rollNumber,
        Class: s.class.name,
        Parent: s.parentName ?? '',
        Phone: s.parentPhone ?? '',
        Status: s.isActive ? 'Active' : 'Inactive',
        Enrolled: formatDate(s.createdAt),
      })),
      'student-report.csv'
    )
  }

  const exportClassReport = () => {
    downloadCSV(
      classes.map(c => ({
        Class: c.name,
        Section: c.section ?? '',
        'Grade Level': c.gradeLevel ?? '',
        Students: c._count.students,
        Capacity: c.capacity ?? '',
      })),
      'class-report.csv'
    )
  }

  const exportFinancialReport = () => {
    downloadCSV([{
      'Total Income': summary.totalIncome,
      'Fee Payments': summary.totalPayments,
      'Bank Deposits': summary.totalDeposits,
      'Sales Revenue': summary.totalSales,
      'Total Expenses': summary.totalExpenses,
      'Net Balance': summary.netBalance,
    }], 'financial-summary.csv')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm">Analytics and exportable reports</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Students</p>
                <p className="text-2xl font-bold mt-1">{totalStudents}</p>
                <p className="text-xs text-muted-foreground">{activeStudents} active</p>
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
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Net Balance</p>
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
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Fully Paid</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{paymentStats.fullyPaid}</p>
              <p className="text-xs text-muted-foreground">students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{paymentStats.noPay}</p>
              <p className="text-xs text-muted-foreground">students</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Trend (90 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment Status</CardTitle>
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
          <CardTitle className="text-base">Income vs Expenses (90 days)</CardTitle>
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
              <p className="font-semibold text-sm">Student Report</p>
              <p className="text-xs text-muted-foreground">{totalStudents} students</p>
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
              <p className="font-semibold text-sm">Class Report</p>
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
              <p className="font-semibold text-sm">Financial Summary</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(summary.totalIncome)} total</p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
