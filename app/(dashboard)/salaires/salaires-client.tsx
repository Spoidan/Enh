'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  createStaff,
  deleteStaff,
  createSalaryPayment,
  createBulkSalaryPayments,
} from '@/lib/actions/salaires'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Trash2, CreditCard, Loader2, Users } from 'lucide-react'

type Staff = {
  id: string
  name: string
  role: string | null
  monthlySalary: number
  payments: { id: string; month: number; year: number; amount: number; status: string }[]
}

type Payment = {
  id: string
  amount: number
  month: number
  year: number
  status: string
  staff: { name: string }
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]
const TODAY = new Date().toISOString().split('T')[0]
const CURRENT_MONTH = new Date().getMonth() + 1

// ── Bulk Payment Modal ────────────────────────────────────────────────────────
function BulkPaymentDialog({ staff }: { staff: Staff[] }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [amounts, setAmounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(staff.map(s => [s.id, s.monthlySalary]))
  )
  const [month, setMonth] = useState(CURRENT_MONTH)
  const [year, setYear] = useState(CURRENT_YEAR)
  const [date, setDate] = useState(TODAY)
  const [notes, setNotes] = useState('')
  const [pending, startTransition] = useTransition()

  const allSelected = staff.length > 0 && selected.size === staff.length

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(staff.map(s => s.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const total = Array.from(selected).reduce((sum, id) => sum + (amounts[id] ?? 0), 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selected.size === 0) {
      toast.error('Sélectionnez au moins un employé')
      return
    }

    const payments = Array.from(selected).map(id => ({ staffId: id, amount: amounts[id] ?? 0 }))
    startTransition(async () => {
      const res = await createBulkSalaryPayments({ payments, month, year, date, notes: notes || undefined })
      if (res && 'error' in res) {
        toast.error(res.error as string)
      } else {
        toast.success(`Paiements enregistrés avec succès pour ${res.count} employé(s)`)
        setOpen(false)
        setSelected(new Set())
        setNotes('')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2" disabled={staff.length === 0}>
          <Users className="h-4 w-4" />
          Paiement groupé
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paiement groupé des salaires</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Date + Period */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Mois *</Label>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                {MONTHS.map(m => (
                  <option key={m} value={m}>{getMonthName(m)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Année *</Label>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Date de paiement *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>

          {/* Employee list */}
          <div className="rounded-lg border overflow-hidden">
            {/* Select All */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/50 border-b">
              <input
                type="checkbox"
                id="selectAll"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded"
              />
              <label htmlFor="selectAll" className="text-sm font-semibold cursor-pointer">
                Sélectionner tout ({staff.length} employés)
              </label>
            </div>
            <div className="divide-y">
              {staff.map(s => (
                <div key={s.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${selected.has(s.id) ? 'bg-primary/5' : ''}`}>
                  <input
                    type="checkbox"
                    id={`emp-${s.id}`}
                    checked={selected.has(s.id)}
                    onChange={() => toggleOne(s.id)}
                    className="h-4 w-4 rounded shrink-0"
                  />
                  <label htmlFor={`emp-${s.id}`} className="flex-1 min-w-0 cursor-pointer">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.role ?? '—'}</p>
                  </label>
                  <div className="shrink-0 w-36">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={amounts[s.id] ?? s.monthlySalary}
                      onChange={e => setAmounts(prev => ({ ...prev, [s.id]: Number(e.target.value) }))}
                      className="h-8 text-right text-sm tabular-nums"
                      disabled={!selected.has(s.id)}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 w-8">BIF</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes (optionnel)</Label>
            <Input
              placeholder="Ex: Salaires du mois d'avril 2026..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Total + Submit */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <p className="text-sm text-muted-foreground">
                {selected.size} employé(s) sélectionné(s)
              </p>
              <p className="text-lg font-bold">
                Total à payer : <span className="text-primary">{formatCurrency(total)}</span>
              </p>
            </div>
            <Button type="submit" disabled={pending || selected.size === 0} className="gap-2 min-w-36">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? 'Enregistrement...' : 'Confirmer le paiement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function SalairesClient({
  staff,
  payments,
}: {
  staff: Staff[]
  payments: Payment[]
}) {
  const [addStaffOpen, setAddStaffOpen] = useState(false)
  const [addPaymentOpen, setAddPaymentOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleAddStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createStaff(fd)
      if (res && 'error' in res) toast.error(res.error as string)
      else { toast.success('Personnel ajouté'); setAddStaffOpen(false) }
    })
  }

  function handleAddPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createSalaryPayment(fd)
      if (res && 'error' in res) toast.error(res.error as string)
      else { toast.success('Paiement enregistré'); setAddPaymentOpen(false) }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteStaff(id)
      if (res && 'error' in res) toast.error(res.error as string)
      else toast.success('Personnel supprimé')
    })
  }

  return (
    <div className="space-y-6">
      {/* Staff List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle>Personnel ({staff.length})</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <BulkPaymentDialog staff={staff} />
            <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau membre du personnel</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddStaff} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="role">Poste / Fonction</Label>
                    <Input id="role" name="role" placeholder="Enseignant, Directeur..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="monthlySalary">Salaire mensuel (BIF) *</Label>
                    <Input id="monthlySalary" name="monthlySalary" type="number" required min={0} />
                  </div>
                  <Button type="submit" disabled={pending} className="w-full gap-2">
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Enregistrer
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun membre du personnel enregistré.
            </p>
          ) : (
            <div className="divide-y">
              {staff.map(s => {
                const last = s.payments[0]
                return (
                  <div key={s.id} className="flex items-center justify-between py-3 gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.name}</p>
                      <p className="text-sm text-muted-foreground">{s.role ?? '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">{formatCurrency(s.monthlySalary)} / mois</p>
                      {last ? (
                        <p className="text-xs text-muted-foreground">Dernier: {getMonthName(last.month)} {last.year}</p>
                      ) : (
                        <p className="text-xs text-destructive">Aucun paiement</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(s.id)}
                      disabled={pending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Individual Payment */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Paiements individuels</CardTitle>
          <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" disabled={staff.length === 0}>
                <CreditCard className="h-4 w-4" /> Nouveau paiement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Paiement de salaire</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPayment} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="staffId">Personnel *</Label>
                  <select
                    id="staffId"
                    name="staffId"
                    required
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Sélectionner...</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {formatCurrency(s.monthlySalary)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="month">Mois *</Label>
                    <select id="month" name="month" required className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                      {MONTHS.map(m => <option key={m} value={m}>{getMonthName(m)}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="year">Année *</Label>
                    <select id="year" name="year" required className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Montant (BIF) *</Label>
                  <Input id="amount" name="amount" type="number" required min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date">Date de paiement *</Label>
                  <Input id="date" name="date" type="date" required defaultValue={TODAY} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" />
                </div>
                <Button type="submit" disabled={pending} className="w-full gap-2">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun paiement enregistré.
            </p>
          ) : (
            <div className="divide-y">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-3 gap-4">
                  <div>
                    <p className="font-medium">{p.staff.name}</p>
                    <p className="text-sm text-muted-foreground">{getMonthName(p.month)} {p.year}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{formatCurrency(p.amount)}</span>
                    <Badge variant={p.status === 'payé' ? 'default' : 'secondary'}>{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
