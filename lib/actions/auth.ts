'use server'

import { db } from '@/lib/db'
import { createSession, createSetupToken, deleteSession, deleteSetupToken, verifySetupToken } from '@/lib/session'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

export type EmailCheckResult =
  | { status: 'not_found' }
  | { status: 'inactive' }
  | { status: 'needs_setup' }
  | { status: 'ready' }

export async function checkEmail(email: string): Promise<EmailCheckResult> {
  const normalized = email.trim().toLowerCase()
  const user = await db.user.findUnique({ where: { email: normalized } })

  if (!user) return { status: 'not_found' }
  if (!user.isActive) return { status: 'inactive' }
  if (!user.isSetup) {
    await createSetupToken(normalized)
    return { status: 'needs_setup' }
  }
  return { status: 'ready' }
}

export async function loginWithPassword(
  email: string,
  password: string
): Promise<{ error: string } | void> {
  const normalized = email.trim().toLowerCase()
  const user = await db.user.findUnique({ where: { email: normalized } })

  if (!user || !user.isActive || !user.isSetup || !user.passwordHash) {
    return { error: 'Identifiants invalides.' }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return { error: 'Mot de passe incorrect.' }

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role as 'admin' | 'assistant',
  })

  redirect('/')
}

export async function completeAccountSetup(data: {
  name: string
  password: string
}): Promise<{ error: string } | void> {
  const email = await verifySetupToken()
  if (!email) return { error: 'Lien expiré ou invalide. Veuillez recommencer.' }

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !user.isActive || user.isSetup) {
    return { error: 'Accès refusé.' }
  }

  const passwordHash = await bcrypt.hash(data.password, 12)

  const updated = await db.user.update({
    where: { email },
    data: {
      name: data.name.trim(),
      passwordHash,
      isSetup: true,
    },
  })

  await deleteSetupToken()

  await createSession({
    userId: updated.id,
    email: updated.email,
    role: updated.role as 'admin' | 'assistant',
  })

  redirect('/')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
