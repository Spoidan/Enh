import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const getSecret = () =>
  new TextEncoder().encode(
    process.env.SESSION_SECRET || 'school-mgmt-fallback-secret-32chars'
  )

export interface SessionPayload {
  userId: string
  email: string
  role: 'admin' | 'assistant'
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

// Short-lived token for the "complete account" setup flow
export async function createSetupToken(email: string) {
  const token = await new SignJWT({ email, purpose: 'account-setup' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set('setup_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/',
  })
}

export async function verifySetupToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('setup_token')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())
    if ((payload as { purpose?: string }).purpose !== 'account-setup') return null
    return (payload as { email?: string }).email ?? null
  } catch {
    return null
  }
}

export async function deleteSetupToken() {
  const cookieStore = await cookies()
  cookieStore.delete('setup_token')
}
