'use server'

import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const DiscountSchema = z.object({
  studentId: z.string().min(1),
  description: z.string().min(1, 'La description est requise'),
  amount: z.number().positive('Le montant doit être positif'),
  trimester: z.number().int().min(1).max(3).optional(),
})

export async function addDiscount(data: {
  studentId: string
  description: string
  amount: number
  trimester?: number
}) {
  await requireAuth()

  const parsed = DiscountSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  await db.discount.create({ data: parsed.data })
  revalidatePath('/payment-overview')
  return { success: true }
}

export async function deleteDiscount(id: string) {
  await requireAuth()
  await db.discount.delete({ where: { id } })
  revalidatePath('/payment-overview')
  return { success: true }
}
