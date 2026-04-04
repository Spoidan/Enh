'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Users, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { getClasses, createClass, deleteClass } from '@/lib/actions/classes'
import type { Class } from '@/app/generated/prisma/client'

type ClassWithCount = Class & { _count: { students: number } }

export default function ClassesPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [classes, setClasses] = useState<ClassWithCount[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const load = () => {
    getClasses().then(setClasses)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createClass({
        name: fd.get('name') as string,
        section: (fd.get('section') as string) || undefined,
        gradeLevel: (fd.get('gradeLevel') as string) || undefined,
        capacity: fd.get('capacity') ? Number(fd.get('capacity')) : undefined,
      })
      toast.success('Class created')
      setShowCreate(false)
      load()
    } catch {
      toast.error('Failed to create class')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete class "${name}"? All students in this class will also be deleted.`)) return
    startTransition(async () => {
      await deleteClass(id)
      toast.success('Class deleted')
      load()
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-muted-foreground text-sm">{classes.length} classes total</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add Class
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {classes.map(cls => (
          <Card key={cls.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base">{cls.name}</h3>
                  {cls.section && (
                    <Badge variant="secondary" className="mt-1 text-xs">{cls.section}</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/classes/${cls.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(cls.id, cls.name)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{cls._count.students} students</span>
                {cls.capacity && (
                  <span>/ {cls.capacity} capacity</span>
                )}
              </div>
              {cls.gradeLevel && (
                <p className="text-xs text-muted-foreground mt-1">Grade {cls.gradeLevel}</p>
              )}
            </CardContent>
          </Card>
        ))}

        {classes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-lg">No classes yet</p>
            <p className="text-sm mt-1">Create your first class to get started</p>
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label>Class Name *</Label>
                <Input name="name" required placeholder="e.g., Grade 1, Class 5A" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Section</Label>
                  <Input name="section" placeholder="A, B, C..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Grade Level</Label>
                  <Input name="gradeLevel" placeholder="1, 2, 3..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Capacity</Label>
                <Input name="capacity" type="number" min="1" placeholder="30" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Class'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
