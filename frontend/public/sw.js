
// Basic Service Worker for Plantiva Notifications
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Plantiva Update';
  const options = {
    body: data.body || 'Your plant needs attention!',
    icon: '/logo.png',
    badge: '/logo.png',
    data: {
      url: self.location.origin
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
