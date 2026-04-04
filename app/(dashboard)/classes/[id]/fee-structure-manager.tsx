'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createFeeStructure, deleteFeeStructure } from '@/lib/actions/finance'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { FeeStructure } from '@/app/generated/prisma/client'

interface Props {
  classId: string
  feeStructures: FeeStructure[]
}

export function FeeStructureManager({ classId, feeStructures: initial }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAdding(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createFeeStructure({
        classId,
        name: fd.get('name') as string,
        amount: Number(fd.get('amount')),
        period: fd.get('period') as string,
        description: (fd.get('description') as string) || undefined,
      })
      toast.success('Fee structure added')
      setShowAdd(false)
      router.refresh()
    } catch {
      toast.error('Failed to add fee structure')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete fee "${name}"?`)) return
    startTransition(async () => {
      await deleteFeeStructure(id)
      toast.success('Fee structure deleted')
      router.refresh()
    })
  }

  const totalMonthly = initial
    .filter(f => f.isActive && f.period === 'monthly')
    .reduce((s, f) => s + f.amount, 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Fee Structures
        </CardTitle>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Fee
        </Button>
      </CardHeader>
      <CardContent>
        {totalMonthly > 0 && (
          <div className="mb-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">Monthly total</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(totalMonthly)}</p>
          </div>
        )}
        {initial.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fee structures defined</p>
        ) : (
          <div className="space-y-2">
            {initial.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{f.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs capitalize">{f.period}</Badge>
                    {!f.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatCurrency(f.amount)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(f.id, f.name)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Fee Structure</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd}>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label>Fee Name *</Label>
                <Input name="name" required placeholder="e.g., Tuition Fee, Transport Fee" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount *</Label>
                  <Input name="amount" type="number" min="0" step="0.01" required placeholder="500" />
                </div>
                <div className="space-y-1.5">
                  <Label>Period</Label>
                  <Select name="period" defaultValue="monthly">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input name="description" placeholder="Optional description" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={adding}>{adding ? 'Adding...' : 'Add Fee'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
