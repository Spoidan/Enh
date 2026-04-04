import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'spoidanid4454@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase())

export async function getCurrentUserRole(): Promise<'admin' | 'assistant' | null> {
  const { userId } = await auth()
  if (!userId) return null

  // Look up by Clerk ID first
  let user = await db.user.findUnique({ where: { clerkId: userId } })

  if (!user) {
    const clerkUser = await currentUser()
    const email =
      clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? ''

    // Check if this email was pre-seeded (admin)
    const byEmail = await db.user.findUnique({ where: { email } })

    if (byEmail) {
      // Attach Clerk ID to the pre-seeded user
      user = await db.user.update({
        where: { email },
        data: { clerkId: userId, name: clerkUser?.fullName ?? undefined },
      })
    } else {
      // New user — auto-assign role based on email
      const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'assistant'
      user = await db.user.create({
        data: {
          clerkId: userId,
          email,
          name: clerkUser?.fullName ?? null,
          role,
        },
      })
    }
  }

  return user.role as 'admin' | 'assistant'
}

/** Require admin role — redirects to / if not admin */
export async function requireAdmin() {
  const role = await getCurrentUserRole()
  if (role !== 'admin') {
    redirect('/')
  }
}
