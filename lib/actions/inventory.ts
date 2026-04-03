'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getInventoryItems(type?: string) {
  return db.inventoryItem.findMany({
    where: type ? { type } : undefined,
    include: { _count: { select: { sales: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function createInventoryItem(data: {
  name: string
  type: string
  price: number
  stock: number
  description?: string
  sku?: string
}) {
  const item = await db.inventoryItem.create({
    data: { ...data, price: Number(data.price), stock: Number(data.stock) },
  })
  revalidatePath('/inventory')
  return item
}

export async function updateInventoryItem(id: string, data: {
  name?: string
  type?: string
  price?: number
  stock?: number
  description?: string
}) {
  const item = await db.inventoryItem.update({
    where: { id },
    data: {
      ...data,
      price: data.price !== undefined ? Number(data.price) : undefined,
      stock: data.stock !== undefined ? Number(data.stock) : undefined,
    },
  })
  revalidatePath('/inventory')
  return item
}

export async function deleteInventoryItem(id: string) {
  await db.inventoryItem.delete({ where: { id } })
  revalidatePath('/inventory')
}

export async function getSales(params?: { page?: number; limit?: number }) {
  const { page = 1, limit = 20 } = params ?? {}
  const [sales, total] = await Promise.all([
    db.sale.findMany({
      include: {
        item: true,
        student: { include: { class: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.sale.count(),
  ])
  return { sales, total, pages: Math.ceil(total / limit) }
}

export async function createSale(data: {
  itemId: string
  quantity: number
  date: string
  studentId?: string
  notes?: string
}) {
  const item = await db.inventoryItem.findUniqueOrThrow({ where: { id: data.itemId } })
  const qty = Number(data.quantity)
  const amount = item.price * qty

  const [sale] = await db.$transaction([
    db.sale.create({
      data: {
        itemId: data.itemId,
        quantity: qty,
        unitPrice: item.price,
        amount,
        date: new Date(data.date),
        studentId: data.studentId || undefined,
        notes: data.notes,
      },
    }),
    db.inventoryItem.update({
      where: { id: data.itemId },
      data: { stock: { decrement: qty } },
    }),
  ])

  revalidatePath('/inventory')
  revalidatePath('/sales')
  return sale
}

export async function deleteSale(id: string) {
  const sale = await db.sale.findUniqueOrThrow({ where: { id } })
  await db.$transaction([
    db.sale.delete({ where: { id } }),
    db.inventoryItem.update({
      where: { id: sale.itemId },
      data: { stock: { increment: sale.quantity } },
    }),
  ])
  revalidatePath('/inventory')
  revalidatePath('/sales')
}
