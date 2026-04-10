'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Download, TrendingUp, TrendingDown, DollarSign, Landmark, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MonthlyFinanceChart } from '@/components/charts/monthly-finance-chart'
import { ExpenseBreakdownChart } from '@/components/charts/expense-breakdown-chart'
import { createDeposit, deleteDeposit, createExpense, deleteExpense } from '@/lib/actions/finance'
import { formatCurrency, formatDate, downloadCSV } from '@/lib/utils'
import type { Deposit, Expense } from '@/app/generated/prisma/client'

const EXPENSE_CATEGORIES = [
  'Salaires', 'Eau & Électricité', 'Maintenance', 'Fournitures', 'Équipement',
  'Transport', 'Communication', 'Alimentation', 'Sécurité', 'Autre',
]

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
  deposits: { deposits: Deposit[]; total: number; pages: number }
  expenses: { expenses: Expense[]; total: number; pages: number }
  monthlyData: { month: string; income: number; expenses: number }[]
  expenseBreakdown: { category: string; amount: number }[]
  initialTab: string
  depositPage: number
  expensePage: number
  expenseStartDate: string
  expenseEndDate: string
  yearName: string
}

function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number
  pages: number
  onPage: (p: number) => void
}) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between pt-3 border-t">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
      >
        Précédent
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} sur {pages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPage(page + 1)}
        disabled={page >= pages}
      >
        Suivant
      </Button>
    </div>
  )
}

export function FinanceClient({
  summary,
  deposits,
  expenses,
  monthlyData,
  expenseBreakdown,
  initialTab,
  depositPage,
  expensePage,
  expenseStartDate,
  expenseEndDate,
  yearName,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeposit, setShowDeposit] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filterStart, setFilterStart] = useState(expenseStartDate)
  const [filterEnd, setFilterEnd] = useState(expenseEndDate)

  const today = new Date().toISOString().split('T')[0]

  const buildUrl = (params: Record<string, string | number>) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v !== '' && v !== 0) q.set(k, String(v)) })
    return `/finance?${q.toString()}`
  }

  const handleDepositPage = (p: number) => {
    router.push(buildUrl({ tab: 'deposits', dpage: p, epage: expensePage }))
  }

  const handleExpensePage = (p: number) => {
    router.push(buildUrl({ tab: 'expenses', dpage: depositPage, epage: p, estartDate: filterStart, eendDate: filterEnd }))
  }

  const handleExpenseFilter = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(buildUrl({ tab: 'expenses', dpage: depositPage, epage: 1, estartDate: filterStart, eendDate: filterEnd }))
  }

  const handleClearFilter = () => {
    setFilterStart('')
    setFilterEnd('')
    router.push(buildUrl({ tab: 'expenses', dpage: depositPage, epage: 1 }))
  }

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
      toast.success('Dépôt enregistré')
      setShowDeposit(false)
      router.refresh()
    } catch {
      toast.error("Erreur lors de l'enregistrement du dépôt")
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
      toast.success('Dépense enregistrée')
      setShowExpense(false)
      router.refresh()
    } catch {
      toast.error("Erreur lors de l'enregistrement de la dépense")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDeposit = (id: string) => {
    if (!confirm('Supprimer ce dépôt ?')) return
    startTransition(async () => {
      await deleteDeposit(id)
      toast.success('Dépôt supprimé')
      router.refresh()
    })
  }

  const handleDeleteExpense = (id: string) => {
    if (!confirm('Supprimer cette dépense ?')) return
    startTransition(async () => {
      await deleteExpense(id)
      toast.success('Dépense supprimée')
      router.refresh()
    })
  }

  const summaryCards = [
    { title: 'Total Revenus', value: formatCurrency(summary.totalIncome), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { title: 'Total Dépenses', value: formatCurrency(summary.totalExpenses), icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { title: 'Solde Net', value: formatCurrency(summary.netBalance), icon: DollarSign, color: summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Paiements de frais', value: formatCurrency(summary.totalPayments), icon: Landmark, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Finance</h1>
        <p className="text-muted-foreground text-sm">Aperçu financier et gestion des transactions</p>
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
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="deposits">Dépôts ({deposits.total})</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses ({expenses.total})</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Revenus vs Dépenses mensuels
                {yearName && <span className="ml-2 text-sm font-normal text-muted-foreground">— {yearName}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyFinanceChart data={monthlyData} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Répartition des dépenses par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseBreakdownChart data={expenseBreakdown} />
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Paiements de frais</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(summary.totalPayments)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Dépôts bancaires</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{formatCurrency(summary.totalDeposits)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Revenus des ventes</p>
                  <p className="text-2xl font-bold mt-1 text-purple-600">{formatCurrency(summary.totalSales)}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Deposits Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="deposits" className="mt-4 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {deposits.total} dépôt(s) — total {formatCurrency(deposits.deposits.reduce((s, d) => s + d.amount, 0))}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() =>
                downloadCSV(deposits.deposits.map(d => ({
                  Date: formatDate(d.date), Montant: d.amount, Source: d.source,
                  Banque: d.bankName ?? '', Référence: d.reference ?? '', Notes: d.notes ?? '',
                })), 'depots.csv')
              }>
                <Download className="h-4 w-4 mr-1" />Exporter
              </Button>
              <Button size="sm" onClick={() => setShowDeposit(true)}>
                <Plus className="h-4 w-4 mr-1" />Ajouter dépôt
              </Button>
            </div>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Banque</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Montant</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Référence</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.deposits.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Aucun dépôt</td></tr>
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
            <div className="px-4 pb-3">
              <Pagination page={depositPage} pages={deposits.pages} onPage={handleDepositPage} />
            </div>
          </Card>
        </TabsContent>

        {/* ── Expenses Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="expenses" className="mt-4 space-y-4">
          {/* Date filter */}
          <form onSubmit={handleExpenseFilter} className="flex flex-wrap items-end gap-3 p-3 rounded-lg border bg-muted/20">
            <Filter className="h-4 w-4 text-muted-foreground self-center" />
            <div className="space-y-1">
              <Label className="text-xs">Début</Label>
              <Input
                type="date"
                value={filterStart}
                onChange={e => setFilterStart(e.target.value)}
                className="h-8 text-sm w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fin</Label>
              <Input
                type="date"
                value={filterEnd}
                onChange={e => setFilterEnd(e.target.value)}
                className="h-8 text-sm w-36"
              />
            </div>
            <Button type="submit" size="sm" variant="outline" className="h-8">Filtrer</Button>
            {(filterStart || filterEnd) && (
              <Button type="button" size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={handleClearFilter}>
                Réinitialiser
              </Button>
            )}
          </form>

          <div className="flex flex-wrap justify-between items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {expenses.total} dépense(s) — total {formatCurrency(expenses.expenses.reduce((s, e) => s + e.amount, 0))}
              {(expenseStartDate || expenseEndDate) && (
                <span className="ml-1 text-xs">(filtrées)</span>
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() =>
                downloadCSV(expenses.expenses.map(e => ({
                  Date: formatDate(e.date), Catégorie: e.category, Montant: e.amount,
                  Description: e.description ?? '', Bénéficiaire: e.payee ?? '',
                })), 'depenses.csv')
              }>
                <Download className="h-4 w-4 mr-1" />Exporter
              </Button>
              <Button size="sm" onClick={() => setShowExpense(true)}>
                <Plus className="h-4 w-4 mr-1" />Ajouter dépense
              </Button>
            </div>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Catégorie</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bénéficiaire</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Montant</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.expenses.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Aucune dépense</td></tr>
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
            <div className="px-4 pb-3">
              <Pagination page={expensePage} pages={expenses.pages} onPage={handleExpensePage} />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deposit Dialog */}
      <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
        <DialogContent className="sm:max-w-md w-full">
          <DialogHeader><DialogTitle>Enregistrer un dépôt</DialogTitle></DialogHeader>
          <form onSubmit={handleDeposit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Montant (BIF) *</Label>
                  <Input name="amount" type="number" min="0" step="1" required placeholder="100 000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input name="date" type="date" required defaultValue={today} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Source *</Label>
                <Input name="source" required placeholder="Ex: Collecte de frais, Don..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nom de la banque</Label>
                  <Input name="bankName" placeholder="Optionnel" />
                </div>
                <div className="space-y-1.5">
                  <Label>Référence</Label>
                  <Input name="reference" placeholder="Optionnel" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input name="notes" placeholder="Notes optionnelles" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDeposit(false)}>Annuler</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={showExpense} onOpenChange={setShowExpense}>
        <DialogContent className="sm:max-w-md w-full">
          <DialogHeader><DialogTitle>Enregistrer une dépense</DialogTitle></DialogHeader>
          <form onSubmit={handleExpense}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Montant (BIF) *</Label>
                  <Input name="amount" type="number" min="0" step="1" required placeholder="50 000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input name="date" type="date" required defaultValue={today} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Catégorie *</Label>
                <Select name="category" required>
                  <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input name="description" placeholder="Objet de la dépense..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Bénéficiaire</Label>
                  <Input name="payee" placeholder="Qui a été payé ?" />
                </div>
                <div className="space-y-1.5">
                  <Label>Référence</Label>
                  <Input name="reference" placeholder="Optionnel" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowExpense(false)}>Annuler</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
