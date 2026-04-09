'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createPayment, deletePayment } from '@/lib/actions/payments'
import { getStudents } from '@/lib/actions/students'
import { formatCurrency, formatDate, downloadCSV } from '@/lib/utils'
import type { Payment, Student, Class } from '@/app/generated/prisma/client'
import { useEffect } from 'react'

type PaymentWithStudent = Payment & { student: Student & { class: Class } }

interface Props {
  payments: PaymentWithStudent[]
  total: number
  pages: number
  currentPage: number
}

const PAYMENT_METHODS = ['cash', 'bank transfer', 'check', 'online', 'card']

export function PaymentsClient({ payments, total, pages, currentPage }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [students, setStudents] = useState<(Student & { class: Class })[]>([])

  useEffect(() => {
    if (showAdd) {
      getStudents({ limit: 500 }).then(r => setStudents(r.students))
    }
  }, [showAdd])

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAdding(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createPayment({
        studentId: fd.get('studentId') as string,
        amount: Number(fd.get('amount')),
        date: fd.get('date') as string,
        method: (fd.get('method') as string) || 'cash',
        reference: (fd.get('reference') as string) || undefined,
        notes: (fd.get('notes') as string) || undefined,
      })
      toast.success('Payment recorded')
      setShowAdd(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = (id: string, studentId: string) => {
    if (!confirm('Delete this payment?')) return
    startTransition(async () => {
      await deletePayment(id, studentId)
      toast.success('Payment deleted')
      router.refresh()
    })
  }

  const handleExport = () => {
    downloadCSV(
      payments.map(p => ({
        Date: formatDate(p.date),
        Student: p.student.name,
        Class: p.student.class.name,
        Amount: p.amount,
        Method: p.method,
        Reference: p.reference ?? '',
        Notes: p.notes ?? '',
      })),
      'payments.csv'
    )
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground text-sm">{total} total payments recorded</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Class</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reference</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No payments recorded yet
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">{formatDate(p.date)}</td>
                    <td className="px-4 py-3 font-medium">{p.student.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{p.student.class.name}</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 capitalize">{p.method}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.reference ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(p.id, p.studentId)}
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

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">Page {currentPage} of {pages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1}
                onClick={() => router.push(`/payments?page=${currentPage - 1}`)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage >= pages}
                onClick={() => router.push(`/payments?page=${currentPage + 1}`)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd}>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label>Student *</Label>
                <Select name="studentId" required>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.class.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount *</Label>
                  <Input name="amount" type="number" min="0" step="0.01" required placeholder="500" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input name="date" type="date" required defaultValue={today} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Method</Label>
                  <Select name="method" defaultValue="cash">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(m => (
                        <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Reference #</Label>
                  <Input name="reference" placeholder="Optional" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input name="notes" placeholder="Optional notes" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={adding}>{adding ? 'Saving...' : 'Record Payment'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
