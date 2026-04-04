'use server'

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
  await requireAdmin()
  return db.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isSetup: true,
      isActive: true,
      createdAt: true,
    },
  })
}

export async function createAuthorizedUser(email: string, role: string) {
  await requireAdmin()
  const normalized = email.trim().toLowerCase()

  const existing = await db.user.findUnique({ where: { email: normalized } })
  if (existing) throw new Error('Cette adresse e-mail est déjà enregistrée.')

  const user = await db.user.create({
    data: { email: normalized, role },
  })

  revalidatePath('/admin/accounts')
  return user
}

export async function updateUserRole(id: string, role: string) {
  await requireAdmin()
  const user = await db.user.update({ where: { id }, data: { role } })
  revalidatePath('/admin/accounts')
  return user
}

export async function toggleUserActive(id: string, isActive: boolean) {
  await requireAdmin()
  const user = await db.user.update({ where: { id }, data: { isActive } })
  revalidatePath('/admin/accounts')
  return user
}

export async function resetUserAccount(id: string) {
  await requireAdmin()
  const user = await db.user.update({
    where: { id },
    data: { passwordHash: null, isSetup: false },
  })
  revalidatePath('/admin/accounts')
  return user
}

export async function deleteUser(id: string) {
  await requireAdmin()
  await db.user.delete({ where: { id } })
  revalidatePath('/admin/accounts')
}
