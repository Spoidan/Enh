'use server'

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const SchoolSettingsSchema = z.object({
  schoolName: z.string().min(1, 'Le nom de l\'établissement est requis'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  directorName: z.string().optional(),
  logoUrl: z.string().optional(),
})

export async function getSchoolSettings() {
  const settings = await db.schoolSettings.findFirst()
  return settings
}

export async function upsertSchoolSettings(formData: FormData) {
  await requireAdmin()

  const raw = {
    schoolName: formData.get('schoolName') as string,
    address: formData.get('address') as string || undefined,
    phone: formData.get('phone') as string || undefined,
    email: formData.get('email') as string || undefined,
    directorName: formData.get('directorName') as string || undefined,
    logoUrl: formData.get('logoUrl') as string || undefined,
  }

  const parsed = SchoolSettingsSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const existing = await db.schoolSettings.findFirst()

  if (existing) {
    await db.schoolSettings.update({
      where: { id: existing.id },
      data: parsed.data,
    })
  } else {
    await db.schoolSettings.create({ data: parsed.data })
  }

  revalidatePath('/etablissement')
  return { success: true }
}
