// Gestion Scolaire - Service Worker
// Minimal, safe implementation to avoid breaking page loads on mobile

const CACHE_NAME = 'gestion-scolaire-v2'

// Only cache the static SVG icon (guaranteed to exist)
const PRECACHE = ['/icons/icon.svg', '/manifest.json']

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(PRECACHE.map(url => cache.add(url)))
    )
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Never intercept API calls, Next.js internal routes, or page navigations
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/login') ||
    request.mode === 'navigate'
  ) {
    return // Let browser handle normally
  }

  // Cache-first for known static assets only
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    )
  }
  // All other requests: pass through to network, no interception
})
