'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Plus, Search, Download, Upload, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { downloadCSV } from '@/lib/utils'
import type { Student, Class } from '@/app/generated/prisma/client'

type StudentWithClass = Student & { class: Class }

interface Props {
  students: StudentWithClass[]
  classes: (Class & { _count: { students: number } })[]
  total: number
  pages: number
  currentPage: number
}

export function StudentsClient({ students, classes, total, pages, currentPage }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const search = (value: string) => {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set('search', value)
    else params.delete('search')
    params.delete('page')
    router.push(`/students?${params}`)
  }

  const filterClass = (value: string) => {
    const params = new URLSearchParams(sp.toString())
    if (value && value !== 'all') params.set('classId', value)
    else params.delete('classId')
    params.delete('page')
    router.push(`/students?${params}`)
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteStudent(id)
      toast.success(`${name} deleted`)
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
        parentName: fd.get('parentName') as string || undefined,
        parentPhone: fd.get('parentPhone') as string || undefined,
        parentEmail: fd.get('parentEmail') as string || undefined,
        gender: fd.get('gender') as string || undefined,
      })
      toast.success('Student created successfully')
      setShowCreate(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create student')
    } finally {
      setCreating(false)
    }
  }

  const handleExport = () => {
    downloadCSV(
      students.map(s => ({
        Name: s.name,
        'Roll Number': s.rollNumber,
        Class: s.class.name,
        Parent: s.parentName ?? '',
        Phone: s.parentPhone ?? '',
        Email: s.parentEmail ?? '',
        Gender: s.gender ?? '',
      })),
      'students.csv'
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground text-sm">{total} students enrolled</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, roll number, parent..."
            className="pl-9"
            defaultValue={sp.get('search') ?? ''}
            onChange={e => search(e.target.value)}
          />
        </div>
        <Select defaultValue={sp.get('classId') ?? 'all'} onValueChange={filterClass}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Roll #</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Class</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Parent</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map(s => (
                  <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.rollNumber}</td>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{s.class.name}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.parentName ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.parentPhone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.isActive ? 'success' : 'outline'}>
                        {s.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {pages}
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
                Previous
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
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" name="name" required placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rollNumber">Roll Number *</Label>
                  <Input id="rollNumber" name="rollNumber" required placeholder="2024001" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Class *</Label>
                  <Select name="classId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select name="gender">
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parentName">Parent/Guardian Name</Label>
                <Input id="parentName" name="parentName" placeholder="Jane Doe" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="parentPhone">Parent Phone</Label>
                  <Input id="parentPhone" name="parentPhone" placeholder="+1 234 567 8900" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parentEmail">Parent Email</Label>
                  <Input id="parentEmail" name="parentEmail" type="email" placeholder="parent@email.com" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Student'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
