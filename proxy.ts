import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const getSecret = () =>
  new TextEncoder().encode(
    process.env.SESSION_SECRET || 'school-mgmt-fallback-secret-32chars'
  )

// Paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/sign-in']

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all public paths and their sub-paths
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // Allow static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session')?.value

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
