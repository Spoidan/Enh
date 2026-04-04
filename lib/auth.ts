import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function getCurrentUserRole(): Promise<'admin' | 'assistant' | null> {
  const session = await getSession()
  if (!session) return null
  return session.role
}

export async function getCurrentUser() {
  return getSession()
}

/** Require any authenticated user — redirects to /login if not logged in */
export async function requireAuth() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

/** Require admin role — redirects to / if not admin */
export async function requireAdmin() {
  const role = await getCurrentUserRole()
  if (role !== 'admin') redirect('/')
}
