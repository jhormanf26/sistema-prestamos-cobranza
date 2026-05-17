const CACHE_NAME = 'prestamos-pro-v1.2';
const urlsToCache = [
  '/',
  '/css/style.css'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
  // Limpiar caches antiguos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// ==========================================
// PUSH NOTIFICATIONS
// ==========================================
self.addEventListener('push', event => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || '/img/logo.png',
        badge: '/img/logo.png',
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        data: {
          url: data.url || '/'
        }
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (e) {
      console.error('Push Event parsing error:', e);
      // Fallback if not JSON
      event.waitUntil(
        self.registration.showNotification('Notificación del Sistema', {
          body: event.data.text(),
          icon: '/img/logo.png'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          let client = windowClients[i];
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});
