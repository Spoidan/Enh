'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { logout } from '@/lib/actions/auth'

const TIMEOUT_MS = 15 * 60 * 1000      // 15 minutes
const WARNING_MS = 13 * 60 * 1000      // warn at 13 minutes
const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const

export function SessionTimeout() {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current)
    if (logoutTimer.current) clearTimeout(logoutTimer.current)
  }, [])

  const startTimers = useCallback(() => {
    clearTimers()
    setShowWarning(false)

    warningTimer.current = setTimeout(() => {
      setShowWarning(true)
    }, WARNING_MS)

    logoutTimer.current = setTimeout(async () => {
      await logout()
      router.push('/login?expired=1')
    }, TIMEOUT_MS)
  }, [clearTimers, router])

  const resetTimer = useCallback(() => {
    startTimers()
  }, [startTimers])

  useEffect(() => {
    startTimers()

    const handler = () => resetTimer()
    EVENTS.forEach(e => window.addEventListener(e, handler, { passive: true }))

    return () => {
      clearTimers()
      EVENTS.forEach(e => window.removeEventListener(e, handler))
    }
  }, [startTimers, resetTimer, clearTimers])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="text-center space-y-2">
          <div className="text-4xl">⏱️</div>
          <h2 className="text-lg font-bold">Session bientôt expirée</h2>
          <p className="text-sm text-muted-foreground">
            Votre session expirera dans 2 minutes en raison d&apos;inactivité.
          </p>
        </div>
        <button
          onClick={resetTimer}
          className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Rester connecté
        </button>
      </div>
    </div>
  )
}
