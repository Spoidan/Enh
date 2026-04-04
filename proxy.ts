import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const getSecret = () =>
  new TextEncoder().encode(
    process.env.SESSION_SECRET || 'school-mgmt-fallback-secret-32chars'
  )

// Paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/sign-in']

// API paths that don't require authentication (none currently)
const PUBLIC_API_PATHS: string[] = []

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all public paths and their sub-paths
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // Allow static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js'
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session')?.value

  // Protect API routes — return 401 instead of redirecting
  if (pathname.startsWith('/api/')) {
    if (PUBLIC_API_PATHS.some(p => pathname.startsWith(p))) {
      return NextResponse.next()
    }
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    try {
      await jwtVerify(token, getSecret())
      return NextResponse.next()
    } catch {
      const res = NextResponse.json({ error: 'Session invalide' }, { status: 401 })
      res.cookies.delete('session')
      return res
    }
  }

  // Protect all other routes
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  try {
    await jwtVerify(token, getSecret())
    return NextResponse.next()
  } catch {
    const loginUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('session')
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
