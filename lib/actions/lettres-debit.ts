'use server'

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const LetterSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020),
  fileUrl: z.string().min(1, 'Le fichier est requis'),
  fileName: z.string().min(1),
  notes: z.string().optional(),
})

export async function listDebitLetters() {
  return db.salaryDebitLetter.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
}

export async function createDebitLetter(formData: FormData) {
  await requireAdmin()

  const parsed = LetterSchema.safeParse({
    month: formData.get('month'),
    year: formData.get('year'),
    fileUrl: formData.get('fileUrl'),
    fileName: formData.get('fileName'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await db.salaryDebitLetter.create({ data: parsed.data })
  revalidatePath('/lettres-debit')
  return { success: true }
}

export async function deleteDebitLetter(id: string) {
  await requireAdmin()
  await db.salaryDebitLetter.delete({ where: { id } })
  revalidatePath('/lettres-debit')
  return { success: true }
}
