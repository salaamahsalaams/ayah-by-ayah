// Ayah by Ayah — Service Worker
// Handles notification scheduling when app is backgrounded

let notifSettings = { enabled: false, times: [], daily_goal: 1 };
let cachedAyah = null;
let scheduledTimers = [];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Receive settings from the page
self.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_NOTIF_SETTINGS') {
    notifSettings = event.data.settings;
    cachedAyah = event.data.ayah || null;
    rescheduleAll();
  }
  if (event.data.type === 'UPDATE_AYAH_CACHE') {
    cachedAyah = event.data.ayah;
  }
});

function rescheduleAll() {
  scheduledTimers.forEach(t => clearTimeout(t));
  scheduledTimers = [];
  if (!notifSettings.enabled || !notifSettings.times.length) return;

  const now = new Date();
  for (const timeStr of notifSettings.times) {
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    const ms = target - now;
    if (ms > 0 && ms < 86400000) {
      scheduledTimers.push(setTimeout(() => showNotification(), ms));
    }
  }
}

function showNotification() {
  const title = cachedAyah ? cachedAyah.title : 'Time to learn your ayah!';
  const body = cachedAyah ? cachedAyah.body : 'Open Ayah by Ayah to continue learning.';
  self.registration.showNotification(title, {
    body: body,
    icon: 'logo.svg',
    badge: 'logo.svg',
    tag: 'ayah-reminder',
    renotify: true,
    data: { url: './' }
  });
}

// Open app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes('ayah') && 'focus' in client) return client.focus();
      }
      return clients.openWindow(event.notification.data?.url || './');
    })
  );
});
