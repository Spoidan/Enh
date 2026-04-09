'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Search, TrendingDown, TrendingUp, Users, Plus, Trash2,
  ChevronDown, ChevronUp, DollarSign, CalendarDays,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getClassesForOverview,
  getClassPaymentOverview,
  type StudentPaymentSummary,
  type ClassPaymentOverview,
  type ExtraFeeSummary,
  type DiscountSummary,
} from '@/lib/actions/payment-overview'
import { getSchoolYearsSimple } from '@/lib/actions/enrollments'
import { addExtraFee, deleteExtraFee } from '@/lib/actions/extra-fees'
import { addDiscount, deleteDiscount } from '@/lib/actions/discounts'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

type ClassOption = { id: string; name: string; gradeLevel: string | null; section: string | null }
type SchoolYear = { id: string; name: string; isActive: boolean }

const TRIMESTER_LABELS: Record<number, string> = {
  0: 'Toute l\'année',
  1: 'Trimestre 1',
  2: 'Trimestre 2',
  3: 'Trimestre 3',
}

function StatusBadge({ status }: { status: StudentPaymentSummary['status'] }) {
  if (status === 'paid') {
    return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Payé intégralement</Badge>
  }
  if (status === 'partial') {
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Partiel</Badge>
  }
  return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Non payé</Badge>
}

// ── Extra Fees Modal ────────────────────────────────────────────────────────
function AddExtraFeeModal({
  student,
  onClose,
  onAdded,
}: {
  student: { id: string; name: string }
  onClose: () => void
  onAdded: () => void
}) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [trimester, setTrimester] = useState('0')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!description.trim() || isNaN(amt) || amt <= 0) return
    const trimNum = parseInt(trimester)

    startTransition(async () => {
      const result = await addExtraFee({
        studentId: student.id,
        description: description.trim(),
        amount: amt,
        trimester: trimNum > 0 ? trimNum : undefined,
      })
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Frais supplémentaires ajoutés')
        onAdded()
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-2xl shadow-xl w-full max-w-md space-y-5 p-6">
        <div>
          <h2 className="text-lg font-bold">Ajouter des frais supplémentaires</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Élève : <strong>{student.name}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Ex: Frais de laboratoire, Transport..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Montant (BIF)</label>
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Trimestre associé</label>
            <Select value={trimester} onValueChange={setTrimester}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Toute l&apos;année</SelectItem>
                <SelectItem value="1">Trimestre 1</SelectItem>
                <SelectItem value="2">Trimestre 2</SelectItem>
                <SelectItem value="3">Trimestre 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Enregistrement...' : 'Confirmer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add Discount Modal ───────────────────────────────────────────────────────
function AddDiscountModal({
  student,
  onClose,
  onAdded,
}: {
  student: { id: string; name: string }
  onClose: () => void
  onAdded: () => void
}) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [trimester, setTrimester] = useState('0')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!description.trim() || isNaN(amt) || amt <= 0) return
    const trimNum = parseInt(trimester)

    startTransition(async () => {
      const result = await addDiscount({
        studentId: student.id,
        description: description.trim(),
        amount: amt,
        trimester: trimNum > 0 ? trimNum : undefined,
      })
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Remise ajoutée')
        onAdded()
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-2xl shadow-xl w-full max-w-md space-y-5 p-6">
        <div>
          <h2 className="text-lg font-bold">Ajouter une remise</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Élève : <strong>{student.name}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Ex: Remise sociale, Bourse, Réduction famille..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Montant de la remise (BIF)</label>
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Trimestre associé</label>
            <Select value={trimester} onValueChange={setTrimester}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Toute l&apos;année</SelectItem>
                <SelectItem value="1">Trimestre 1</SelectItem>
                <SelectItem value="2">Trimestre 2</SelectItem>
                <SelectItem value="3">Trimestre 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Enregistrement...' : 'Confirmer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Fee Breakdown ────────────────────────────────────────────────────────────
function FeeBreakdown({
  student,
  onDeleteFee,
  onDeleteDiscount,
}: {
  student: StudentPaymentSummary
  onDeleteFee: (id: string) => void
  onDeleteDiscount: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="px-4 pb-3 bg-muted/20 border-t text-sm">
      <div className="pt-2 space-y-1">
        <div className="flex justify-between text-muted-foreground">
          <span>Frais de base</span>
          <span>{formatCurrency(student.baseFee)}</span>
        </div>
        {student.extraFees.map((ef: ExtraFeeSummary) => (
          <div key={ef.id} className="flex justify-between items-center">
            <span className="text-yellow-700">
              + {ef.description}
              {ef.trimester && <span className="text-xs ml-1 text-muted-foreground">(T{ef.trimester})</span>}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-yellow-700 tabular-nums">{formatCurrency(ef.amount)}</span>
              <button
                onClick={() => {
                  startTransition(async () => {
                    const result = await deleteExtraFee(ef.id)
                    if (result.success) {
                      toast.success('Frais supprimé')
                      onDeleteFee(ef.id)
                    }
                  })
                }}
                disabled={isPending}
                className="text-destructive hover:text-destructive/80 p-0.5 rounded"
                title="Supprimer ce frais"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        {student.discounts.map((d: DiscountSummary) => (
          <div key={d.id} className="flex justify-between items-center">
            <span className="text-blue-700">
              − {d.description}
              {d.trimester && <span className="text-xs ml-1 text-muted-foreground">(T{d.trimester})</span>}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-blue-700 tabular-nums">-{formatCurrency(d.amount)}</span>
              <button
                onClick={() => {
                  startTransition(async () => {
                    const result = await deleteDiscount(d.id)
                    if (result.success) {
                      toast.success('Remise supprimée')
                      onDeleteDiscount(d.id)
                    }
                  })
                }}
                disabled={isPending}
                className="text-destructive hover:text-destructive/80 p-0.5 rounded"
                title="Supprimer cette remise"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-between font-semibold border-t pt-1 mt-1">
          <span>Total attendu</span>
          <span>{formatCurrency(student.totalExpected)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Fee Frequency Badge ───────────────────────────────────────────────────────
function FeeFrequencyInfo({ feeStructure }: { feeStructure: ClassPaymentOverview['feeStructure'] }) {
  if (!feeStructure) return null
  const { paymentFrequency, amountT1, amountT2, amountT3, specificTrimester } = feeStructure

  if (paymentFrequency === 'annual_t1') {
    return (
      <div className="rounded-lg border bg-blue-50 text-blue-700 px-3 py-2 text-xs flex items-center gap-2">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
        <span>Frais annuels payables au <strong>1er trimestre</strong></span>
      </div>
    )
  }
  if (paymentFrequency === 'per_trimester') {
    return (
      <div className="rounded-lg border bg-blue-50 text-blue-700 px-3 py-2 text-xs flex items-center gap-2 flex-wrap">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
        <span>Frais par trimestre :</span>
        <span>T1 : {formatCurrency(amountT1 ?? 0)}</span>
        <span>T2 : {formatCurrency(amountT2 ?? 0)}</span>
        <span>T3 : {formatCurrency(amountT3 ?? 0)}</span>
      </div>
    )
  }
  if (paymentFrequency === 'specific_trimester') {
    return (
      <div className="rounded-lg border bg-blue-50 text-blue-700 px-3 py-2 text-xs flex items-center gap-2">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
        <span>Frais dus uniquement au <strong>Trimestre {specificTrimester}</strong></span>
      </div>
    )
  }
  return null
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function PaymentOverviewPage() {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedYearId, setSelectedYearId] = useState<string>('')
  const [selectedTrimester, setSelectedTrimester] = useState<number>(0)
  const [overview, setOverview] = useState<ClassPaymentOverview | null>(null)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [addFeeFor, setAddFeeFor] = useState<{ id: string; name: string } | null>(null)
  const [addDiscountFor, setAddDiscountFor] = useState<{ id: string; name: string } | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([getClassesForOverview(), getSchoolYearsSimple()]).then(([cls, years]) => {
      setClasses(cls as ClassOption[])
      setSchoolYears(years)
      const active = years.find(y => y.isActive)
      if (active) setSelectedYearId(active.id)
    })
  }, [])

  function loadOverview(classId: string, yearId?: string, trimester?: number) {
    if (!classId) { setOverview(null); return }
    startTransition(async () => {
      const data = await getClassPaymentOverview(classId, {
        schoolYearId: yearId || selectedYearId || undefined,
        trimester: trimester ?? selectedTrimester,
      })
      setOverview(data)
    })
  }

  useEffect(() => {
    loadOverview(selectedClassId, selectedYearId, selectedTrimester)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedYearId, selectedTrimester])

  function toggleRow(id: string) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleExtraFeeDeleted() {
    loadOverview(selectedClassId, selectedYearId, selectedTrimester)
  }

  const filtered = overview?.students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.rollNumber ?? '').includes(search)
  ) ?? []

  const selectedClass = classes.find(c => c.id === selectedClassId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Aperçu des paiements</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Situation des paiements par classe</p>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* School year */}
        {schoolYears.length > 0 && (
          <Select value={selectedYearId} onValueChange={setSelectedYearId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Année scolaire..." />
            </SelectTrigger>
            <SelectContent>
              {schoolYears.map(y => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}{y.isActive ? ' (active)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Class */}
        <div className="w-64">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une classe..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Trimester tabs */}
        {overview && (
          <div className="flex rounded-lg border overflow-hidden">
            {[0, 1, 2, 3].map(t => (
              <button
                key={t}
                onClick={() => setSelectedTrimester(t)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-r last:border-r-0 ${
                  selectedTrimester === t
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                {t === 0 ? 'Annuel' : `T${t}`}
              </button>
            ))}
          </div>
        )}

        {overview && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un élève..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-56"
            />
          </div>
        )}
      </div>

      {/* Fee frequency info */}
      {overview?.feeStructure && (
        <FeeFrequencyInfo feeStructure={overview.feeStructure} />
      )}

      {/* Summary cards */}
      {overview && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                <DollarSign className="h-3.5 w-3.5" />
                Frais attendus
                {selectedTrimester > 0 && <span className="text-primary">(T{selectedTrimester})</span>}
              </div>
              <p className="text-xl font-bold">{formatCurrency(overview.summary.totalExpected)}</p>
              <p className="text-xs text-muted-foreground">{filtered.length} élèves</p>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                Total collecté
              </div>
              <p className="text-xl font-bold text-green-600">{formatCurrency(overview.summary.totalCollected)}</p>
              <p className="text-xs text-muted-foreground">{overview.summary.countPaid} entièrement payés</p>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <div className="flex items-center gap-2 text-red-600 text-xs font-medium">
                <TrendingDown className="h-3.5 w-3.5" />
                Solde impayé
              </div>
              <p className="text-xl font-bold text-red-600">{formatCurrency(overview.summary.totalOutstanding)}</p>
              <p className="text-xs text-muted-foreground">{overview.summary.countUnpaid} non payés</p>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                <Users className="h-3.5 w-3.5" />
                Paiements partiels
              </div>
              <p className="text-xl font-bold text-yellow-600">{overview.summary.countPartial}</p>
              <p className="text-xs text-muted-foreground">élèves avec paiement partiel</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                Taux de recouvrement — {selectedClass?.name}
                {selectedTrimester > 0 && ` (${TRIMESTER_LABELS[selectedTrimester]})`}
              </span>
              <span className="text-muted-foreground">
                {overview.summary.totalExpected > 0
                  ? Math.round((overview.summary.totalCollected / overview.summary.totalExpected) * 100)
                  : 0}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{
                  width: `${overview.summary.totalExpected > 0
                    ? Math.min(100, (overview.summary.totalCollected / overview.summary.totalExpected) * 100)
                    : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(overview.summary.totalCollected)} collectés</span>
              <span>{formatCurrency(overview.summary.totalOutstanding)} restants</span>
            </div>
          </div>

          {/* Students table */}
          <div className="rounded-xl border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left font-medium px-4 py-3 w-8"></th>
                  <th className="text-left font-medium px-4 py-3">Élève</th>
                  <th className="text-left font-medium px-4 py-3">N° matricule</th>
                  <th className="text-right font-medium px-4 py-3">
                    Frais attendus
                    {selectedTrimester > 0 && <span className="text-primary ml-1">(T{selectedTrimester})</span>}
                  </th>
                  <th className="text-right font-medium px-4 py-3">Montant payé</th>
                  <th className="text-right font-medium px-4 py-3">Solde</th>
                  <th className="text-center font-medium px-4 py-3">Statut</th>
                  <th className="text-center font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isPending ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Chargement...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      {search ? 'Aucun élève trouvé.' : 'Aucun élève dans cette classe pour cette année.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(student => {
                    const isExpanded = expandedRows.has(student.id)
                    const hasExtra = student.extraFees.length > 0
                    return (
                      <>
                        <tr
                          key={student.id}
                          className={`hover:bg-muted/20 transition-colors ${
                            student.status === 'unpaid' ? 'bg-red-50/30' :
                            student.status === 'partial' ? 'bg-yellow-50/30' :
                            'bg-green-50/10'
                          }`}
                        >
                          <td className="px-2 py-3 text-center">
                            <button
                              onClick={() => toggleRow(student.id)}
                              className="p-1 rounded hover:bg-muted/50 text-muted-foreground"
                              title="Voir le détail des frais"
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {student.name}
                            {hasExtra && (
                              <span className="ml-1.5 inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">
                                +{student.extraFees.length} extra
                              </span>
                            )}
                            {student.discounts.length > 0 && (
                              <span className="ml-1.5 inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                                -{student.discounts.length} remise{student.discounts.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{student.rollNumber ?? '—'}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(student.totalExpected)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-green-700">{formatCurrency(student.totalPaid)}</td>
                          <td className={`px-4 py-3 text-right tabular-nums font-medium ${student.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {student.balance > 0 ? `-${formatCurrency(student.balance)}` : formatCurrency(0)}
                          </td>
                          <td className="px-4 py-3 text-center"><StatusBadge status={student.status} /></td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={() => setAddFeeFor({ id: student.id, name: student.name })}
                              >
                                <Plus className="h-3 w-3" />
                                Frais supp.
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                                onClick={() => setAddDiscountFor({ id: student.id, name: student.name })}
                              >
                                <Plus className="h-3 w-3" />
                                Remise
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${student.id}-breakdown`}>
                            <td colSpan={8} className="p-0">
                              <FeeBreakdown
                                student={student}
                                onDeleteFee={handleExtraFeeDeleted}
                                onDeleteDiscount={handleExtraFeeDeleted}
                              />
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!selectedClassId && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Users className="h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">Sélectionnez une classe</p>
          <p className="text-sm">Choisissez une classe pour voir la situation des paiements</p>
        </div>
      )}

      {/* Add Extra Fee Modal */}
      {addFeeFor && (
        <AddExtraFeeModal
          student={addFeeFor}
          onClose={() => setAddFeeFor(null)}
          onAdded={() => loadOverview(selectedClassId, selectedYearId, selectedTrimester)}
        />
      )}

      {/* Add Discount Modal */}
      {addDiscountFor && (
        <AddDiscountModal
          student={addDiscountFor}
          onClose={() => setAddDiscountFor(null)}
          onAdded={() => loadOverview(selectedClassId, selectedYearId, selectedTrimester)}
        />
      )}
    </div>
  )
}
