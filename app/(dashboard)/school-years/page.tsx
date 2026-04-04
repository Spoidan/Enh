'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  CalendarDays,
  CheckCircle2,
  Archive,
  ChevronDown,
  ChevronRight,
  BookOpen,
  DollarSign,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  getSchoolYears,
  createSchoolYear,
  setActiveSchoolYear,
  archiveSchoolYear,
  deleteSchoolYear,
  createTerm,
  setActiveTerm,
  deleteTerm,
  getClasses,
  upsertYearFeeStructure,
  deleteYearFeeStructure,
} from '@/lib/actions/school-years'
import { formatCurrency } from '@/lib/utils'

type Term = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  isActive: boolean
}

type YearFeeStructure = {
  id: string
  classId: string
  amount: number
  description: string | null
  class: { id: string; name: string; gradeLevel: string | null }
}

type SchoolYear = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  isActive: boolean
  isArchived: boolean
  terms: Term[]
  yearFeeStructures: YearFeeStructure[]
}

type ClassOption = { id: string; name: string; gradeLevel: string | null }

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SchoolYearsPage() {
  const [years, setYears] = useState<SchoolYear[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<Record<string, 'terms' | 'fees'>>({})
  const [isPending, startTransition] = useTransition()

  // Dialogs
  const [showAddYear, setShowAddYear] = useState(false)
  const [showAddTerm, setShowAddTerm] = useState<string | null>(null) // schoolYearId
  const [showAddFee, setShowAddFee] = useState<string | null>(null)   // schoolYearId

  const load = () => {
    Promise.all([getSchoolYears(), getClasses()]).then(([ys, cls]) => {
      setYears(ys as SchoolYear[])
      setClasses(cls as ClassOption[])
    })
  }

  useEffect(() => { load() }, [])

  const toggleYear = (id: string) => {
    setExpandedYears(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const getTab = (yearId: string) => activeTab[yearId] ?? 'terms'
  const setTab = (yearId: string, tab: 'terms' | 'fees') =>
    setActiveTab(prev => ({ ...prev, [yearId]: tab }))

  // Add School Year
  const handleAddYear = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await createSchoolYear({
        name: fd.get('name') as string,
        startDate: fd.get('startDate') as string,
        endDate: fd.get('endDate') as string,
        isActive: fd.get('isActive') === 'on',
      })
      toast.success('Année scolaire créée')
      setShowAddYear(false)
      load()
    })
  }

  // Activate school year
  const handleActivate = (id: string) => {
    if (!confirm('Définir cette année comme active ? L\'année actuellement active sera désactivée.')) return
    startTransition(async () => {
      await setActiveSchoolYear(id)
      toast.success('Année scolaire activée')
      load()
    })
  }

  // Archive school year
  const handleArchive = (id: string) => {
    if (!confirm('Archiver cette année scolaire ?')) return
    startTransition(async () => {
      await archiveSchoolYear(id)
      toast.success('Année archivée')
      load()
    })
  }

  // Delete school year
  const handleDeleteYear = (id: string) => {
    if (!confirm('Supprimer définitivement cette année scolaire ? Cette action est irréversible.')) return
    startTransition(async () => {
      await deleteSchoolYear(id)
      toast.success('Année scolaire supprimée')
      load()
    })
  }

  // Add Term
  const handleAddTerm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!showAddTerm) return
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await createTerm({
        schoolYearId: showAddTerm,
        name: fd.get('name') as string,
        startDate: fd.get('startDate') as string,
        endDate: fd.get('endDate') as string,
        isActive: fd.get('isActive') === 'on',
      })
      toast.success('Trimestre créé')
      setShowAddTerm(null)
      load()
    })
  }

  // Activate term
  const handleActivateTerm = (termId: string, schoolYearId: string) => {
    startTransition(async () => {
      await setActiveTerm(termId, schoolYearId)
      toast.success('Trimestre activé')
      load()
    })
  }

  // Delete term
  const handleDeleteTerm = (termId: string) => {
    if (!confirm('Supprimer ce trimestre ?')) return
    startTransition(async () => {
      await deleteTerm(termId)
      toast.success('Trimestre supprimé')
      load()
    })
  }

  // Add/update fee
  const handleUpsertFee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!showAddFee) return
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await upsertYearFeeStructure(
        showAddFee,
        fd.get('classId') as string,
        Number(fd.get('amount')),
        (fd.get('description') as string) || undefined
      )
      toast.success('Frais enregistrés')
      setShowAddFee(null)
      load()
    })
  }

  // Delete fee
  const handleDeleteFee = (id: string) => {
    startTransition(async () => {
      await deleteYearFeeStructure(id)
      toast.success('Frais supprimés')
      load()
    })
  }

  const activeYears = years.filter(y => !y.isArchived)
  const archivedYears = years.filter(y => y.isArchived)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Années scolaires</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gérez les années scolaires, trimestres et structures de frais
          </p>
        </div>
        <Button onClick={() => setShowAddYear(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle année
        </Button>
      </div>

      {/* Active years */}
      {activeYears.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3 rounded-xl border border-dashed">
          <CalendarDays className="h-12 w-12 opacity-30" />
          <p className="font-medium">Aucune année scolaire</p>
          <p className="text-sm">Créez votre première année scolaire pour commencer</p>
        </div>
      )}

      <div className="space-y-3">
        {activeYears.map(year => (
          <div key={year.id} className="rounded-xl border overflow-hidden">
            {/* Year header */}
            <div
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                year.isActive ? 'bg-primary/5' : 'bg-card'
              }`}
              onClick={() => toggleYear(year.id)}
            >
              {expandedYears.has(year.id) ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{year.name}</span>
                  {year.isActive && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                      <Star className="h-2.5 w-2.5 mr-1" />
                      Active
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(year.startDate)} → {formatDate(year.endDate)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {year.terms.length} trimestre{year.terms.length !== 1 ? 's' : ''} ·{' '}
                  {year.yearFeeStructures.length} structure{year.yearFeeStructures.length !== 1 ? 's' : ''} de frais
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                {!year.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleActivate(year.id)}
                    disabled={isPending}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Activer
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Archiver"
                  onClick={() => handleArchive(year.id)}
                  disabled={isPending || year.isActive}
                >
                  <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  title="Supprimer"
                  onClick={() => handleDeleteYear(year.id)}
                  disabled={isPending || year.isActive}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Expanded content */}
            {expandedYears.has(year.id) && (
              <div className="border-t">
                {/* Tabs */}
                <div className="flex gap-0 border-b bg-muted/20">
                  {(['terms', 'fees'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setTab(year.id, tab)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        getTab(year.id) === tab
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab === 'terms' ? (
                        <><BookOpen className="h-3.5 w-3.5" /> Trimestres</>
                      ) : (
                        <><DollarSign className="h-3.5 w-3.5" /> Frais par classe</>
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {/* Terms tab */}
                  {getTab(year.id) === 'terms' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Trimestres / Semestres</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setShowAddTerm(year.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter
                        </Button>
                      </div>

                      {year.terms.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          Aucun trimestre défini.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {year.terms.map(term => (
                            <div
                              key={term.id}
                              className="flex items-center gap-3 rounded-lg border px-3 py-2"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{term.name}</span>
                                  {term.isActive && (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs py-0">
                                      Actif
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(term.startDate)} → {formatDate(term.endDate)}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                {!term.isActive && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleActivateTerm(term.id, year.id)}
                                    disabled={isPending}
                                  >
                                    Activer
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteTerm(term.id)}
                                  disabled={isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fees tab */}
                  {getTab(year.id) === 'fees' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Frais par classe pour {year.name}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setShowAddFee(year.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Définir frais
                        </Button>
                      </div>

                      {year.yearFeeStructures.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          Aucune structure de frais définie pour cette année.
                        </p>
                      ) : (
                        <div className="rounded-lg border overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left font-medium px-3 py-2">Classe</th>
                                <th className="text-right font-medium px-3 py-2">Montant annuel</th>
                                <th className="text-left font-medium px-3 py-2">Description</th>
                                <th className="px-3 py-2" />
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {year.yearFeeStructures.map(fee => (
                                <tr key={fee.id} className="hover:bg-muted/20">
                                  <td className="px-3 py-2 font-medium">{fee.class.name}</td>
                                  <td className="px-3 py-2 text-right tabular-nums">
                                    {formatCurrency(fee.amount)}
                                  </td>
                                  <td className="px-3 py-2 text-muted-foreground text-xs">
                                    {fee.description || '—'}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteFee(fee.id)}
                                      disabled={isPending}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Archived years */}
      {archivedYears.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Années archivées
          </p>
          {archivedYears.map(year => (
            <div
              key={year.id}
              className="flex items-center gap-3 rounded-xl border px-4 py-3 opacity-60"
            >
              <Archive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{year.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(year.startDate)} → {formatDate(year.endDate)}
              </span>
              <div className="ml-auto flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleActivate(year.id)}
                  disabled={isPending}
                >
                  Restaurer
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteYear(year.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Dialogs ── */}

      {/* Add School Year */}
      <Dialog open={showAddYear} onOpenChange={setShowAddYear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle année scolaire</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddYear}>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input name="name" required placeholder="ex. 2026-2027" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date de début *</Label>
                  <Input name="startDate" type="date" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Date de fin *</Label>
                  <Input name="endDate" type="date" required />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="isActive" className="rounded" />
                Définir comme année active
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddYear(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Term */}
      <Dialog open={!!showAddTerm} onOpenChange={() => setShowAddTerm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un trimestre</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTerm}>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input name="name" required placeholder="ex. Trimestre 1, Semestre A" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date de début *</Label>
                  <Input name="startDate" type="date" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Date de fin *</Label>
                  <Input name="endDate" type="date" required />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="isActive" className="rounded" />
                Trimestre actif
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddTerm(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>Ajouter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Update Fee */}
      <Dialog open={!!showAddFee} onOpenChange={() => setShowAddFee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Définir les frais pour une classe</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpsertFee}>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label>Classe *</Label>
                <select
                  name="classId"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Sélectionner une classe...</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Montant annuel total (BIF) *</Label>
                <Input name="amount" type="number" min="0" step="100" required placeholder="ex. 150000" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input name="description" placeholder="ex. Frais de scolarité annuels" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddFee(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
