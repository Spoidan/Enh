'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '@/lib/actions/inventory'
import { formatCurrency } from '@/lib/utils'
import type { InventoryItem } from '@/app/generated/prisma/client'

type ItemWithCount = InventoryItem & { _count: { sales: number } }

export default function InventoryPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [items, setItems] = useState<ItemWithCount[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [editItem, setEditItem] = useState<ItemWithCount | null>(null)
  const [creating, setCreating] = useState(false)

  const load = () => {
    getInventoryItems().then(setItems)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createInventoryItem({
        name: fd.get('name') as string,
        type: fd.get('type') as string,
        price: Number(fd.get('price')),
        stock: Number(fd.get('stock')),
        description: (fd.get('description') as string) || undefined,
        sku: (fd.get('sku') as string) || undefined,
      })
      toast.success('Item added')
      setShowCreate(false)
      load()
    } catch {
      toast.error('Failed to add item')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editItem) return
    setCreating(true)
    const fd = new FormData(e.currentTarget)
    try {
      await updateInventoryItem(editItem.id, {
        name: fd.get('name') as string,
        price: Number(fd.get('price')),
        stock: Number(fd.get('stock')),
        description: (fd.get('description') as string) || undefined,
      })
      toast.success('Item updated')
      setEditItem(null)
      load()
    } catch {
      toast.error('Failed to update')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    startTransition(async () => {
      await deleteInventoryItem(id)
      toast.success('Item deleted')
      load()
    })
  }

  const uniforms = items.filter(i => i.type === 'uniform')
  const books = items.filter(i => i.type === 'book')
  const others = items.filter(i => i.type !== 'uniform' && i.type !== 'book')

  const ItemForm = ({ item, onSubmit, submitting }: {
    item?: ItemWithCount | null
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    submitting: boolean
  }) => (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label>Item Name *</Label>
            <Input name="name" required defaultValue={item?.name ?? ''} placeholder="e.g., School Shirt" />
          </div>
        </div>
        {!item && (
          <div className="space-y-1.5">
            <Label>Type *</Label>
            <Select name="type" required defaultValue="uniform">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="uniform">Uniform</SelectItem>
                <SelectItem value="book">Book</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Price *</Label>
            <Input name="price" type="number" min="0" step="0.01" required defaultValue={item?.price ?? ''} placeholder="25.00" />
          </div>
          <div className="space-y-1.5">
            <Label>Stock *</Label>
            <Input name="stock" type="number" min="0" required defaultValue={item?.stock ?? ''} placeholder="100" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>SKU</Label>
            <Input name="sku" defaultValue={item?.sku ?? ''} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input name="description" defaultValue={item?.description ?? ''} placeholder="Optional" />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setEditItem(null) }}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : item ? 'Update' : 'Add Item'}</Button>
      </DialogFooter>
    </form>
  )

  const ItemGrid = ({ items }: { items: ItemWithCount[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(item => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.name}</p>
                {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                {item.description && <p className="text-xs text-muted-foreground mt-1 truncate">{item.description}</p>}
              </div>
              <div className="flex gap-1 ml-2">
                <Button variant="ghost" size="icon" onClick={() => setEditItem(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(item.id, item.name)}
                  disabled={isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-lg font-bold">{formatCurrency(item.price)}</span>
              <div className="text-right">
                <Badge variant={item.stock > 10 ? 'success' : item.stock > 0 ? 'warning' : 'destructive'}>
                  {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{item._count.sales} sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {items.length === 0 && (
        <div className="col-span-full text-center py-10 text-muted-foreground">
          No items yet
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground text-sm">{items.length} items in inventory</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="uniforms">Uniforms ({uniforms.length})</TabsTrigger>
          <TabsTrigger value="books">Books ({books.length})</TabsTrigger>
          <TabsTrigger value="other">Other ({others.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4"><ItemGrid items={items} /></TabsContent>
        <TabsContent value="uniforms" className="mt-4"><ItemGrid items={uniforms} /></TabsContent>
        <TabsContent value="books" className="mt-4"><ItemGrid items={books} /></TabsContent>
        <TabsContent value="other" className="mt-4"><ItemGrid items={others} /></TabsContent>
      </Tabs>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
          <ItemForm onSubmit={handleCreate} submitting={creating} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editItem?.name}</DialogTitle></DialogHeader>
          <ItemForm item={editItem} onSubmit={handleEdit} submitting={creating} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
