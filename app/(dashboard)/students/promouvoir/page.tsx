'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, GraduationCap, CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  getSchoolYearsSimple,
  getStudentsForPromotion,
  promoteStudents,
} from '@/lib/actions/enrollments'
import { getClasses } from '@/lib/actions/classes'

type SchoolYear = { id: string; name: string; isActive: boolean }
type ClassOption = { id: string; name: string; _count: { students: number } }
type EnrolledStudent = {
  id: string
  studentId: string
  status: string
  student: {
    id: string
    name: string
    rollNumber: string
    gender: string | null
    dateOfBirth: Date | null
  }
}

export default function PromouvoirPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [sourceYearId, setSourceYearId] = useState('')
  const [sourceClassId, setSourceClassId] = useState('')
  const [destYearId, setDestYearId] = useState('')
  const [destClassId, setDestClassId] = useState('')
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingStudents, setLoadingStudents] = useState(false)

  useEffect(() => {
    Promise.all([getSchoolYearsSimple(), getClasses()]).then(([years, cls]) => {
      setSchoolYears(years)
      setClasses(cls as ClassOption[])
      // Default source to active year
      const active = years.find(y => y.isActive)
      if (active) setSourceYearId(active.id)
    })
  }, [])

  useEffect(() => {
    if (!sourceYearId || !sourceClassId) {
      setStudents([])
      setSelectedIds(new Set())
      return
    }
    setLoadingStudents(true)
    getStudentsForPromotion(sourceYearId, sourceClassId)
      .then(data => {
        setStudents(data as EnrolledStudent[])
        setSelectedIds(new Set(data.filter(e => e.status === 'active').map(e => e.studentId)))
      })
      .finally(() => setLoadingStudents(false))
  }, [sourceYearId, sourceClassId])

  const toggleAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(students.map(e => e.studentId)))
    }
  }

  const toggleStudent = (studentId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }

  const handlePromote = () => {
    if (!sourceYearId || !sourceClassId || !destYearId || !destClassId) {
      return toast.error('Veuillez remplir tous les champs')
    }
    if (selectedIds.size === 0) {
      return toast.error('Sélectionnez au moins un élève')
    }
    if (sourceYearId === destYearId && sourceClassId === destClassId) {
      return toast.error('La source et la destination ne peuvent pas être identiques')
    }

    startTransition(async () => {
      const result = await promoteStudents({
        sourceYearId,
        sourceClassId,
        destYearId,
        destClassId,
        studentIds: Array.from(selectedIds),
      })
      toast.success(`${result.promoted} élève${result.promoted > 1 ? 's' : ''} promu${result.promoted > 1 ? 's' : ''} avec succès`)
      router.push('/students')
    })
  }

  const sourceYear = schoolYears.find(y => y.id === sourceYearId)
  const destYear = schoolYears.find(y => y.id === destYearId)
  const sourceClass = classes.find(c => c.id === sourceClassId)
  const destClass = classes.find(c => c.id === destClassId)
  const allSelected = students.length > 0 && selectedIds.size === students.length

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/students"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Promouvoir les élèves
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Transférer des élèves d&apos;une année/classe vers une autre
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Année scolaire source *</Label>
              <Select value={sourceYearId} onValueChange={setSourceYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une année..." />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map(y => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}{y.isActive ? ' (active)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Classe source *</Label>
              <Select value={sourceClassId} onValueChange={setSourceClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une classe..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {sourceYear && sourceClass && (
              <p className="text-xs text-muted-foreground">
                Source : <strong>{sourceYear.name}</strong> — <strong>{sourceClass.name}</strong>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Destination */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Destination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Année scolaire destination *</Label>
              <Select value={destYearId} onValueChange={setDestYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une année..." />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map(y => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}{y.isActive ? ' (active)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Classe destination *</Label>
              <Select value={destClassId} onValueChange={setDestClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une classe..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {destYear && destClass && (
              <p className="text-xs text-muted-foreground">
                Destination : <strong>{destYear.name}</strong> — <strong>{destClass.name}</strong>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student list */}
      {sourceYearId && sourceClassId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">
              Élèves à promouvoir
              {students.length > 0 && (
                <span className="ml-2 text-muted-foreground font-normal text-sm">
                  ({selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''} sur {students.length})
                </span>
              )}
            </CardTitle>
            {students.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {allSelected ? (
                  <><CheckSquare className="h-4 w-4 mr-1" />Tout désélectionner</>
                ) : (
                  <><Square className="h-4 w-4 mr-1" />Sélectionner tout</>
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>
            ) : students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun élève dans cette classe pour l&apos;année scolaire sélectionnée.
              </p>
            ) : (
              <div className="space-y-2">
                {students.map(e => {
                  const selected = selectedIds.has(e.studentId)
                  return (
                    <div
                      key={e.studentId}
                      onClick={() => toggleStudent(e.studentId)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/30'
                      }`}
                    >
                      <div className="shrink-0 text-muted-foreground">
                        {selected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{e.student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Matricule : {e.student.rollNumber}
                          {e.student.gender && ` · ${e.student.gender === 'male' ? 'Masculin' : 'Féminin'}`}
                          {e.student.dateOfBirth && ` · ${new Date(e.student.dateOfBirth).toLocaleDateString('fr-FR')}`}
                        </p>
                      </div>
                      <Badge
                        variant={e.status === 'active' ? 'success' : 'outline'}
                        className="shrink-0"
                      >
                        {e.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pb-6">
        <div className="text-sm text-muted-foreground">
          {selectedIds.size > 0 && destYear && destClass && (
            <span>
              {selectedIds.size} élève{selectedIds.size > 1 ? 's' : ''} seront inscrits dans{' '}
              <strong>{destYear.name} — {destClass.name}</strong>
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/students">Annuler</Link>
          </Button>
          <Button
            onClick={handlePromote}
            disabled={
              isPending ||
              !sourceYearId ||
              !sourceClassId ||
              !destYearId ||
              !destClassId ||
              selectedIds.size === 0
            }
          >
            {isPending ? 'Promotion en cours...' : `Promouvoir (${selectedIds.size})`}
          </Button>
        </div>
      </div>
    </div>
  )
}
