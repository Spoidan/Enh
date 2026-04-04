'use client'

import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    // Register service worker lazily and non-blocking
    // Deliberately deferred so it never interferes with initial page load
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Silently ignore — app works fine without SW
      })
    }

    // Wait until page is fully idle before registering
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(register, { timeout: 5000 })
    } else {
      setTimeout(register, 3000)
    }
  }, [])

  return null
}
