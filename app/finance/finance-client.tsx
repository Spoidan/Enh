'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Download, TrendingUp, TrendingDown, DollarSign, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IncomeExpensesChart } from '@/components/charts/income-expenses-chart'
import { createDeposit, deleteDeposit, createExpense, deleteExpense } from '@/lib/actions/finance'
import { formatCurrency, formatDate, downloadCSV } from '@/lib/utils'
import type { Deposit, Expense } from '@/app/generated/prisma/client'

const EXPENSE_CATEGORIES = [
  'Salaries', 'Utilities', 'Maintenance', 'Supplies', 'Equipment',
  'Transport', 'Marketing', 'Food', 'Security', 'Other',
]

interface Props {
  summary: {
    totalPayments: number
    totalDeposits: number
    totalSales: number
    totalIncome: number
    totalExpenses: number
    netBalance: number
  }
  deposits: { deposits: Deposit[]; total: number; pages: number }
  expenses: { expenses: Expense[]; total: number; pages: number }
  chartData: { date: string; income: number; expenses: number }[]
  initialTab: string
  currentPage: number
}

export function FinanceClient({ summary, deposits, expenses, chartData, initialTab, currentPage }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeposit, setShowDeposit] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const handleDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createDeposit({
        date: fd.get('date') as string,
        amount: Number(fd.get('amount')),
        source: fd.get('source') as string,
        bankName: (fd.get('bankName') as string) || undefined,
        reference: (fd.get('reference') as string) || undefined,
        notes: (fd.get('notes') as string) || undefined,
      })
      toast.success('Deposit recorded')
      setShowDeposit(false)
      router.refresh()
    } catch {
      toast.error('Failed to record deposit')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createExpense({
        date: fd.get('date') as string,
        amount: Number(fd.get('amount')),
        category: fd.get('category') as string,
        description: (fd.get('description') as string) || undefined,
        payee: (fd.get('payee') as string) || undefined,
        reference: (fd.get('reference') as string) || undefined,
      })
      toast.success('Expense recorded')
      setShowExpense(false)
      router.refresh()
    } catch {
      toast.error('Failed to record expense')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDeposit = (id: string) => {
    if (!confirm('Delete this deposit?')) return
    startTransition(async () => {
      await deleteDeposit(id)
      toast.success('Deposit deleted')
      router.refresh()
    })
  }

  const handleDeleteExpense = (id: string) => {
    if (!confirm('Delete this expense?')) return
    startTransition(async () => {
      await deleteExpense(id)
      toast.success('Expense deleted')
      router.refresh()
    })
  }

  const summaryCards = [
    { title: 'Total Income', value: formatCurrency(summary.totalIncome), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { title: 'Total Expenses', value: formatCurrency(summary.totalExpenses), icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { title: 'Net Balance', value: formatCurrency(summary.netBalance), icon: DollarSign, color: summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Fee Payments', value: formatCurrency(summary.totalPayments), icon: Landmark, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Finance</h1>
        <p className="text-muted-foreground text-sm">Financial overview and transaction management</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                  <p className="text-xl font-bold mt-1">{value}</p>
                </div>
                <div className={`rounded-lg p-2 ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deposits">Deposits ({deposits.total})</TabsTrigger>
          <TabsTrigger value="expenses">Expenses ({expenses.total})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Income vs Expenses (Last 30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <IncomeExpensesChart data={chartData} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Fee Payments</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(summary.totalPayments)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Bank Deposits</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">{formatCurrency(summary.totalDeposits)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Sales Revenue</p>
                <p className="text-2xl font-bold mt-1 text-purple-600">{formatCurrency(summary.totalSales)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deposits" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{deposits.total} deposits totaling {formatCurrency(deposits.deposits.reduce((s, d) => s + d.amount, 0))}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() =>
                downloadCSV(deposits.deposits.map(d => ({
                  Date: formatDate(d.date), Amount: d.amount, Source: d.source,
                  Bank: d.bankName ?? '', Reference: d.reference ?? '', Notes: d.notes ?? '',
                })), 'deposits.csv')
              }>
                <Download className="h-4 w-4" />Export
              </Button>
              <Button size="sm" onClick={() => setShowDeposit(true)}>
                <Plus className="h-4 w-4" />Add Deposit
              </Button>
            </div>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bank</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reference</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.deposits.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No deposits yet</td></tr>
                  ) : (
                    deposits.deposits.map(d => (
                      <tr key={d.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3">{formatDate(d.date)}</td>
                        <td className="px-4 py-3 font-medium">{d.source}</td>
                        <td className="px-4 py-3 text-muted-foreground">{d.bankName ?? '—'}</td>
                        <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(d.amount)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{d.reference ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteDeposit(d.id)} disabled={isPending}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{expenses.total} expenses totaling {formatCurrency(expenses.expenses.reduce((s, e) => s + e.amount, 0))}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() =>
                downloadCSV(expenses.expenses.map(e => ({
                  Date: formatDate(e.date), Category: e.category, Amount: e.amount,
                  Description: e.description ?? '', Payee: e.payee ?? '',
                })), 'expenses.csv')
              }>
                <Download className="h-4 w-4" />Export
              </Button>
              <Button size="sm" onClick={() => setShowExpense(true)}>
                <Plus className="h-4 w-4" />Add Expense
              </Button>
            </div>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payee</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.expenses.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No expenses yet</td></tr>
                  ) : (
                    expenses.expenses.map(e => (
                      <tr key={e.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3">{formatDate(e.date)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{e.category}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{e.description ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{e.payee ?? '—'}</td>
                        <td className="px-4 py-3 font-semibold text-destructive">{formatCurrency(e.amount)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteExpense(e.id)} disabled={isPending}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deposit Dialog */}
      <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record Deposit</DialogTitle></DialogHeader>
          <form onSubmit={handleDeposit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount *</Label>
                  <Input name="amount" type="number" min="0" step="0.01" required placeholder="1000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input name="date" type="date" required defaultValue={today} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Source *</Label>
                <Input name="source" required placeholder="e.g., Fee Collection, Donation" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Bank Name</Label>
                  <Input name="bankName" placeholder="Optional" />
                </div>
                <div className="space-y-1.5">
                  <Label>Reference #</Label>
                  <Input name="reference" placeholder="Optional" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input name="notes" placeholder="Optional notes" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDeposit(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Record Deposit'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={showExpense} onOpenChange={setShowExpense}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
          <form onSubmit={handleExpense}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount *</Label>
                  <Input name="amount" type="number" min="0" step="0.01" required placeholder="500" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input name="date" type="date" required defaultValue={today} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select name="category" required>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input name="description" placeholder="What was this expense for?" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Payee</Label>
                  <Input name="payee" placeholder="Who was paid?" />
                </div>
                <div className="space-y-1.5">
                  <Label>Reference #</Label>
                  <Input name="reference" placeholder="Optional" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowExpense(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Record Expense'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
