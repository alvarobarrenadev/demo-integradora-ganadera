const CACHE_PREFIX = 'valdeon-gestion-'
const CACHE_NAME = `${CACHE_PREFIX}v1`
const APP_ROOT = new URL('./', self.location.href).pathname
const PRECACHE = [
  APP_ROOT,
  `${APP_ROOT}favicon/favicon.svg`,
  `${APP_ROOT}favicon/favicon-96x96.png`,
  `${APP_ROOT}favicon/apple-touch-icon.png`,
  `${APP_ROOT}favicon/site.webmanifest`,
  `${APP_ROOT}favicon/web-app-manifest-192x192.png`,
  `${APP_ROOT}favicon/web-app-manifest-512x512.png`,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(APP_ROOT, copy))
          return response
        })
        .catch(() => caches.match(APP_ROOT)),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
      }
      return response
    })),
  )
})
