'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Plus, Search, Download, Pencil, Trash2, Eye, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { createStudent, deleteStudent } from '@/lib/actions/students'
import { updateEnrollmentStatus } from '@/lib/actions/enrollments'
import { downloadCSV } from '@/lib/utils'
import type { Student, Class } from '@/app/generated/prisma/client'

type StudentRow = Student & {
  class: Class
  enrollmentStatus?: string
  inactiveReason?: string | null
  enrollmentId?: string
}

interface Props {
  students: StudentRow[]
  classes: (Class & { _count: { students: number } })[]
  total: number
  pages: number
  currentPage: number
  schoolYears: { id: string; name: string; isActive: boolean }[]
  activeYearId: string | null
}

const INACTIVE_REASONS = [
  { value: 'Renvoyé', label: 'Renvoyé' },
  { value: 'Transféré', label: 'Transféré' },
  { value: 'Abandon', label: 'Abandon' },
  { value: 'Autre', label: 'Autre' },
]

function StatusDot({ status }: { status?: string }) {
  const active = status !== 'inactive'
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full mr-1.5 ${active ? 'bg-green-500' : 'bg-gray-400'}`}
    />
  )
}

export function StudentsClient({
  students,
  classes,
  total,
  pages,
  currentPage,
  schoolYears,
  activeYearId,
}: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [inactiveDialog, setInactiveDialog] = useState<StudentRow | null>(null)
  const [inactiveReason, setInactiveReason] = useState('Renvoyé')

  const push = (updates: Record<string, string | undefined>) => {
    const p = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    p.delete('page')
    router.push(`/students?${p}`)
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Supprimer ${name} ? Cette action est irréversible.`)) return
    startTransition(async () => {
      await deleteStudent(id)
      toast.success(`${name} supprimé`)
      router.refresh()
    })
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createStudent({
        name: fd.get('name') as string,
        rollNumber: fd.get('rollNumber') as string,
        classId: fd.get('classId') as string,
        parentName: (fd.get('parentName') as string) || undefined,
        parentPhone: (fd.get('parentPhone') as string) || undefined,
        parentEmail: (fd.get('parentEmail') as string) || undefined,
        gender: (fd.get('gender') as string) || undefined,
        dateOfBirth: (fd.get('dateOfBirth') as string) || undefined,
      })
      toast.success('Élève créé avec succès')
      setShowCreate(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleStatus = async (student: StudentRow) => {
    const currentStatus = student.enrollmentStatus ?? (student.isActive ? 'active' : 'inactive')
    if (currentStatus === 'active') {
      setInactiveDialog(student)
    } else {
      // Reactivate
      if (!activeYearId) return toast.error('Aucune année scolaire active')
      startTransition(async () => {
        await updateEnrollmentStatus({
          studentId: student.id,
          schoolYearId: activeYearId,
          status: 'active',
        })
        toast.success(`${student.name} réactivé`)
        router.refresh()
      })
    }
  }

  const handleConfirmInactive = async () => {
    if (!inactiveDialog || !activeYearId) return
    startTransition(async () => {
      await updateEnrollmentStatus({
        studentId: inactiveDialog.id,
        schoolYearId: activeYearId,
        status: 'inactive',
        inactiveReason,
      })
      toast.success(`${inactiveDialog.name} marqué inactif`)
      setInactiveDialog(null)
      router.refresh()
    })
  }

  const handleExport = () => {
    downloadCSV(
      students.map(s => ({
        Nom: s.name,
        Matricule: s.rollNumber,
        Classe: s.class.name,
        Statut: s.enrollmentStatus === 'inactive' ? 'Inactif' : 'Actif',
        'Date de naissance': s.dateOfBirth
          ? new Date(s.dateOfBirth).toLocaleDateString('fr-FR')
          : '',
        Parent: s.parentName ?? '',
        Téléphone: s.parentPhone ?? '',
        Email: s.parentEmail ?? '',
        Genre: s.gender ?? '',
      })),
      'eleves.csv'
    )
  }

  const currentYearId = sp.get('yearId') ?? activeYearId ?? ''
  const currentStatus = sp.get('status') ?? 'active'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Élèves</h1>
          <p className="text-muted-foreground text-sm">{total} élève{total !== 1 ? 's' : ''} inscrits</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/students/promouvoir">
              <GraduationCap className="h-4 w-4" />
              Promouvoir
            </Link>
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Ajouter un élève
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher nom, matricule, parent..."
            className="pl-9"
            defaultValue={sp.get('search') ?? ''}
            onChange={e => push({ search: e.target.value || undefined })}
          />
        </div>

        {/* School year filter */}
        {schoolYears.length > 0 && (
          <Select
            value={currentYearId}
            onValueChange={v => push({ yearId: v === 'all' ? undefined : v })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Année scolaire" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              {schoolYears.map(y => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}{y.isActive ? ' (active)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Class filter */}
        <Select
          defaultValue={sp.get('classId') ?? 'all'}
          onValueChange={v => push({ classId: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Toutes les classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {classes.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={currentStatus}
          onValueChange={v => push({ status: v })}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="inactive">Inactifs</SelectItem>
            <SelectItem value="all">Tous</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Matricule</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Classe</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date de naissance</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Parent</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Téléphone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    Aucun élève trouvé
                  </td>
                </tr>
              ) : (
                students.map(s => {
                  const enrollmentStatus = s.enrollmentStatus ?? (s.isActive ? 'active' : 'inactive')
                  const isActive = enrollmentStatus === 'active'
                  const dob = s.dateOfBirth
                    ? new Date(s.dateOfBirth).toLocaleDateString('fr-FR')
                    : null

                  return (
                    <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.rollNumber}</td>
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center">
                          <StatusDot status={enrollmentStatus} />
                          {s.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{s.class.name}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {dob ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.parentName ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.parentPhone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(s)}
                          disabled={isPending || !activeYearId}
                          title={isActive ? 'Cliquer pour marquer inactif' : 'Cliquer pour réactiver'}
                        >
                          <Badge
                            variant={isActive ? 'success' : 'outline'}
                            className="cursor-pointer hover:opacity-80"
                          >
                            {isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </button>
                        {!isActive && s.inactiveReason && (
                          <span className="text-xs text-muted-foreground ml-1">({s.inactiveReason})</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/students/${s.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/students/${s.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(s.id, s.name)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} sur {pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => {
                  const p = new URLSearchParams(sp.toString())
                  p.set('page', String(currentPage - 1))
                  router.push(`/students?${p}`)
                }}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= pages}
                onClick={() => {
                  const p = new URLSearchParams(sp.toString())
                  p.set('page', String(currentPage + 1))
                  router.push(`/students?${p}`)
                }}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un élève</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input id="name" name="name" required placeholder="Jean Dupont" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rollNumber">Matricule *</Label>
                  <Input id="rollNumber" name="rollNumber" required placeholder="2024001" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Classe *</Label>
                  <Select name="classId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth">Date de naissance</Label>
                  <Input id="dateOfBirth" name="dateOfBirth" type="date" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Genre</Label>
                <Select name="gender">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculin</SelectItem>
                    <SelectItem value="female">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parentName">Nom du parent/tuteur</Label>
                <Input id="parentName" name="parentName" placeholder="Marie Dupont" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="parentPhone">Téléphone parent</Label>
                  <Input id="parentPhone" name="parentPhone" placeholder="+257 79 000 000" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parentEmail">Email parent</Label>
                  <Input id="parentEmail" name="parentEmail" type="email" placeholder="parent@email.com" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button type="submit" disabled={creating}>{creating ? 'Enregistrement...' : 'Créer l\'élève'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inactive reason dialog */}
      <Dialog open={!!inactiveDialog} onOpenChange={() => setInactiveDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Marquer comme inactif</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Élève : <strong>{inactiveDialog?.name}</strong>
            </p>
            <div className="space-y-1.5">
              <Label>Motif</Label>
              <Select value={inactiveReason} onValueChange={setInactiveReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INACTIVE_REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInactiveDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleConfirmInactive} disabled={isPending}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
