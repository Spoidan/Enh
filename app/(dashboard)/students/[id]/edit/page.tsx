'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getStudent, updateStudent } from '@/lib/actions/students'
import { getClasses } from '@/lib/actions/classes'
import { use } from 'react'

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [student, setStudent] = useState<Awaited<ReturnType<typeof getStudent>>>(null)
  const [classes, setClasses] = useState<Awaited<ReturnType<typeof getClasses>>>([])

  useEffect(() => {
    Promise.all([getStudent(id), getClasses()]).then(([s, c]) => {
      setStudent(s)
      setClasses(c)
    })
  }, [id])

  if (!student) return <div className="p-6 text-muted-foreground">Chargement...</div>

  const dobValue = student.dateOfBirth
    ? new Date(student.dateOfBirth).toISOString().split('T')[0]
    : ''

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updateStudent(id, {
          name: fd.get('name') as string,
          rollNumber: fd.get('rollNumber') as string,
          classId: fd.get('classId') as string,
          parentName: (fd.get('parentName') as string) || undefined,
          parentPhone: (fd.get('parentPhone') as string) || undefined,
          parentEmail: (fd.get('parentEmail') as string) || undefined,
          address: (fd.get('address') as string) || undefined,
          gender: (fd.get('gender') as string) || undefined,
          dateOfBirth: (fd.get('dateOfBirth') as string) || undefined,
        })
        toast.success('Élève mis à jour')
        router.push(`/students/${id}`)
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Échec de la mise à jour')
      }
    })
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/students/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Modifier l&apos;élève</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Informations de l&apos;élève</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nom complet *</Label>
                <Input name="name" defaultValue={student.name} required />
              </div>
              <div className="space-y-1.5">
                <Label>Matricule *</Label>
                <Input name="rollNumber" defaultValue={student.rollNumber} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Classe *</Label>
                <Select name="classId" defaultValue={student.classId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date de naissance</Label>
                <Input name="dateOfBirth" type="date" defaultValue={dobValue} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Genre</Label>
              <Select name="gender" defaultValue={student.gender ?? ''}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculin</SelectItem>
                  <SelectItem value="female">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nom du parent</Label>
              <Input name="parentName" defaultValue={student.parentName ?? ''} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Téléphone parent</Label>
                <Input name="parentPhone" defaultValue={student.parentPhone ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label>Email parent</Label>
                <Input name="parentEmail" type="email" defaultValue={student.parentEmail ?? ''} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input name="address" defaultValue={student.address ?? ''} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
