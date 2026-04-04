'use client'

import { useState, useTransition, useEffect } from 'react'
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
import { createSale, deleteSale, getInventoryItems } from '@/lib/actions/inventory'
import { getStudents } from '@/lib/actions/students'
import { formatCurrency, formatDate, downloadCSV } from '@/lib/utils'
import type { Sale, InventoryItem, Student, Class } from '@/app/generated/prisma/client'

type SaleWithDetails = Sale & {
  item: InventoryItem
  student: (Student & { class: Class }) | null
}

interface Props {
  sales: SaleWithDetails[]
  total: number
  pages: number
  currentPage: number
}

export function SalesClient({ sales, total, pages, currentPage }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [students, setStudents] = useState<(Student & { class: Class })[]>([])
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    Promise.all([getInventoryItems(), getStudents({ limit: 500 })]).then(([items, { students }]) => {
      setItems(items)
      setStudents(students)
    })
  }, [])

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAdding(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createSale({
        itemId: fd.get('itemId') as string,
        quantity: Number(fd.get('quantity')),
        date: fd.get('date') as string,
        studentId: (fd.get('studentId') as string) || undefined,
        notes: (fd.get('notes') as string) || undefined,
      })
      toast.success('Sale recorded')
      setShowAdd(false)
      setSelectedItem(null)
      setQty(1)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record sale')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this sale? Stock will be restored.')) return
    startTransition(async () => {
      await deleteSale(id)
      toast.success('Sale deleted')
      router.refresh()
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const totalRevenue = sales.reduce((s, sale) => s + sale.amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-muted-foreground text-sm">
            {total} transactions · {formatCurrency(totalRevenue)} total revenue
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() =>
            downloadCSV(sales.map(s => ({
              Date: formatDate(s.date),
              Item: s.item.name,
              Type: s.item.type,
              Qty: s.quantity,
              'Unit Price': s.unitPrice,
              Amount: s.amount,
              Student: s.student?.name ?? 'Walk-in',
            })), 'sales.csv')
          }>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            Record Sale
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Qty</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit Price</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">No sales yet</td>
                </tr>
              ) : (
                sales.map(s => (
                  <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">{formatDate(s.date)}</td>
                    <td className="px-4 py-3 font-medium">{s.item.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize">{s.item.type}</Badge>
                    </td>
                    <td className="px-4 py-3">{s.quantity}</td>
                    <td className="px-4 py-3">{formatCurrency(s.unitPrice)}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(s.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.student?.name ?? 'Walk-in'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(s.id)}
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
                onClick={() => router.push(`/sales?page=${currentPage - 1}`)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={currentPage >= pages}
                onClick={() => router.push(`/sales?page=${currentPage + 1}`)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showAdd} onOpenChange={o => { setShowAdd(o); if (!o) { setSelectedItem(null); setQty(1) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record Sale</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd}>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label>Item *</Label>
                <Select name="itemId" required onValueChange={v => {
                  const item = items.find(i => i.id === v)
                  setSelectedItem(item ?? null)
                }}>
                  <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent>
                    {items.map(i => (
                      <SelectItem key={i.id} value={i.id} disabled={i.stock === 0}>
                        {i.name} — {formatCurrency(i.price)} (stock: {i.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantity *</Label>
                  <Input
                    name="quantity"
                    type="number"
                    min="1"
                    max={selectedItem?.stock ?? 999}
                    required
                    value={qty}
                    onChange={e => setQty(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Total</Label>
                  <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-sm font-semibold">
                    {selectedItem ? formatCurrency(selectedItem.price * qty) : '—'}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input name="date" type="date" required defaultValue={today} />
              </div>
              <div className="space-y-1.5">
                <Label>Student (optional)</Label>
                <Select name="studentId">
                  <SelectTrigger><SelectValue placeholder="Walk-in / no student" /></SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.class.name})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input name="notes" placeholder="Optional" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={adding}>{adding ? 'Saving...' : 'Record Sale'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
