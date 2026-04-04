'use client'

import { useState, useEffect, useTransition } from 'react'
import { Search, TrendingDown, TrendingUp, DollarSign, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
} from '@/lib/actions/payment-overview'
import { formatCurrency } from '@/lib/utils'

type ClassOption = { id: string; name: string; gradeLevel: string | null; section: string | null }

function StatusBadge({ status }: { status: StudentPaymentSummary['status'] }) {
  if (status === 'paid') {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
        Payé intégralement
      </Badge>
    )
  }
  if (status === 'partial') {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
        Partiel
      </Badge>
    )
  }
  return (
    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
      Non payé
    </Badge>
  )
}

export default function PaymentOverviewPage() {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [overview, setOverview] = useState<ClassPaymentOverview | null>(null)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getClassesForOverview().then(data => {
      setClasses(data as ClassOption[])
    })
  }, [])

  useEffect(() => {
    if (!selectedClassId) { setOverview(null); return }
    startTransition(async () => {
      const data = await getClassPaymentOverview(selectedClassId)
      setOverview(data)
    })
  }, [selectedClassId])

  const filtered = overview?.students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.includes(search)
  ) ?? []

  const selectedClass = classes.find(c => c.id === selectedClassId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Aperçu des paiements</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Situation des paiements par classe
        </p>
      </div>

      {/* Class selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-72">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une classe..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {overview && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un élève..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        )}
      </div>

      {/* Summary cards */}
      {overview && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                <DollarSign className="h-3.5 w-3.5" />
                Frais attendus
              </div>
              <p className="text-xl font-bold">{formatCurrency(overview.summary.totalExpected)}</p>
              <p className="text-xs text-muted-foreground">{filtered.length} élèves</p>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                Total collecté
              </div>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(overview.summary.totalCollected)}
              </p>
              <p className="text-xs text-muted-foreground">{overview.summary.countPaid} entièrement payés</p>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <div className="flex items-center gap-2 text-red-600 text-xs font-medium">
                <TrendingDown className="h-3.5 w-3.5" />
                Solde impayé
              </div>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(overview.summary.totalOutstanding)}
              </p>
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
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Élève</th>
                  <th className="text-left font-medium px-4 py-3">N° d&apos;immatriculation</th>
                  <th className="text-right font-medium px-4 py-3">Frais attendus</th>
                  <th className="text-right font-medium px-4 py-3">Montant payé</th>
                  <th className="text-right font-medium px-4 py-3">Solde</th>
                  <th className="text-center font-medium px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isPending ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      Chargement...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      {search ? 'Aucun élève trouvé.' : 'Aucun élève dans cette classe.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(student => (
                    <tr
                      key={student.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        student.status === 'unpaid' ? 'bg-red-50/30' :
                        student.status === 'partial' ? 'bg-yellow-50/30' :
                        'bg-green-50/10'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">{student.name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {student.rollNumber}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatCurrency(student.totalExpected)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-green-700">
                        {formatCurrency(student.totalPaid)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums font-medium ${
                        student.balance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {student.balance > 0 ? `-${formatCurrency(student.balance)}` : formatCurrency(0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={student.status} />
                      </td>
                    </tr>
                  ))
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
    </div>
  )
}
