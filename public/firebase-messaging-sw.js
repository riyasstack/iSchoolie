/*
 * Firebase Cloud Messaging service worker for iSchoolie.
 *
 * Served from the site root because a service worker can only control pages
 * under its own path. This is a plain static file in `public/`, so the project
 * config is not baked in: it arrives in the registration URL written by
 * `src/lib/firebase/push.ts`. Re-registering with a different query string
 * installs a new worker, which is what makes switching Firebase projects safe.
 *
 * Push messages only arrive here while the site is in the background; the page
 * shows foreground messages itself.
 */

/* eslint-env serviceworker */
/* global firebase, importScripts, clients */

importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js');

const params = new URL(self.location.href).searchParams;

let config = null;
try {
  config = JSON.parse(params.get('config') ?? '');
} catch {
  config = null;
}

if (config && config.projectId && config.apiKey) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification ?? {};
    const data = payload.data ?? {};
    self.registration.showNotification(notification.title ?? 'iSchoolie', {
      body: notification.body ?? '',
      // `data.link` is set by whatever sends the push; it is untrusted input
      // and only ever used as a navigation target below.
      data: { link: typeof data.link === 'string' ? data.link : '/' },
      tag: typeof data.tag === 'string' ? data.tag : undefined,
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link;
  const target = typeof link === 'string' && link.startsWith('/') ? link : '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windows) => {
        for (const client of windows) {
          if ('focus' in client) {
            client.navigate?.(target);
            return client.focus();
          }
        }
        return clients.openWindow(target);
      }),
  );
});
