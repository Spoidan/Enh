'use server'

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Staff ───────────────────────────────────────────────────────────────────

const StaffSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  role: z.string().optional(),
  monthlySalary: z.coerce.number().positive('Le salaire doit être positif'),
})

export async function listStaff() {
  return db.staffMember.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      payments: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 1,
      },
    },
  })
}

export async function createStaff(formData: FormData) {
  await requireAdmin()

  const parsed = StaffSchema.safeParse({
    name: formData.get('name'),
    role: formData.get('role') || undefined,
    monthlySalary: formData.get('monthlySalary'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await db.staffMember.create({ data: parsed.data })
  revalidatePath('/salaires')
  return { success: true }
}

export async function deleteStaff(id: string) {
  await requireAdmin()
  await db.staffMember.update({ where: { id }, data: { isActive: false } })
  revalidatePath('/salaires')
  return { success: true }
}

// ─── Salary Payments ─────────────────────────────────────────────────────────

const PaymentSchema = z.object({
  staffId: z.string().min(1),
  amount: z.coerce.number().positive(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020),
  date: z.string().min(1, 'La date est requise'),
  notes: z.string().optional(),
})

export async function listSalaryPayments(staffId?: string) {
  return db.salaryPayment.findMany({
    where: staffId ? { staffId } : undefined,
    include: { staff: true },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
}

export async function createSalaryPayment(formData: FormData) {
  await requireAdmin()

  const parsed = PaymentSchema.safeParse({
    staffId: formData.get('staffId'),
    amount: formData.get('amount'),
    month: formData.get('month'),
    year: formData.get('year'),
    date: formData.get('date'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { date, ...rest } = parsed.data
  await db.salaryPayment.create({
    data: { ...rest, date: new Date(date) },
  })
  revalidatePath('/salaires')
  return { success: true }
}
