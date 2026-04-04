'use server'

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const MutuelleSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020),
  amount: z.coerce.number().positive('Le montant doit être positif'),
  date: z.string().min(1, 'La date est requise'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
})

export async function listMutuellePayments() {
  return db.mutuellePayment.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
}

export async function createMutuellePayment(formData: FormData) {
  await requireAdmin()

  const parsed = MutuelleSchema.safeParse({
    month: formData.get('month'),
    year: formData.get('year'),
    amount: formData.get('amount'),
    date: formData.get('date'),
    reference: formData.get('reference') || undefined,
    notes: formData.get('notes') || undefined,
    fileUrl: formData.get('fileUrl') || undefined,
    fileName: formData.get('fileName') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { date, ...rest } = parsed.data
  await db.mutuellePayment.create({
    data: { ...rest, date: new Date(date), status: 'payé' },
  })
  revalidatePath('/mutuelle')
  return { success: true }
}

export async function deleteMutuellePayment(id: string) {
  await requireAdmin()
  await db.mutuellePayment.delete({ where: { id } })
  revalidatePath('/mutuelle')
  return { success: true }
}
