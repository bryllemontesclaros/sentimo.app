const CACHE = 'sentimo-v1'
const ASSETS = ['/', '/index.html', '/manifest.json', '/favicon.svg']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ))
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // Network first for API calls, cache first for assets
  if (e.request.url.includes('firestore') || e.request.url.includes('firebase') || e.request.url.includes('googleapis')) {
    return // Let Firebase handle its own requests
  }
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
