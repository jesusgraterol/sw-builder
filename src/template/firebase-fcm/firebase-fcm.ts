export const BASE_TEMPLATE: string = `/* ************************************************************************************************
 *                                          FIREBASE FCM                                          *
 ************************************************************************************************ */

/**------------------------------------------------------------------------------------------------
 * Constants
 -------------------------------------------------------------------------------------------------*/

// the version of the Firebase JS SDK to use in the Service Worker
const FIREBASE_SDK_VERSION = '';

// the fallback URL used when a notification does not provide a safe same-origin URL
const APP_ROOT_URL = new URL('/', self.location.origin).href;

/**------------------------------------------------------------------------------------------------
 * Event handlers
 -------------------------------------------------------------------------------------------------*/

/**
 * Returns a valid URL based on the value provided. If the value is not a valid URL, it will return
 * the application root URL.
 * @param {*} value
 * @returns The valid URL or the application root URL.
 */
const getUrl = (value) => {
  try {
    const url = new URL(value || '/', self.location.origin);

    if (url.origin !== self.location.origin) {
      return APP_ROOT_URL;
    }

    return url.href;
  } catch {
    return APP_ROOT_URL;
  }
};

/**
 * Returns the safe navigation URL stored in a notification payload.
 * @param {*} notification The clicked notification.
 * @returns The notification URL or the application root URL.
 */
const getNotificationUrl = (notification) => {
  if (notification.data === null || typeof notification.data !== 'object') {
    return APP_ROOT_URL;
  }

  return getUrl(notification.data.url);
};

/**
 * The list of clients for the current application. It filters the clients to only include those that
 * have the same origin as the Service Worker.
 * @returns A promise that resolves to the list of clients for the current application.
 */
const getAppClients = async () => {
  const windowClients = await clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  return windowClients.filter((client) => {
    try {
      return new URL(client.url).origin === self.location.origin;
    } catch {
      return false;
    }
  });
};

/**
 * Finds an existing app client that is already displaying the provided URL.
 * @param {*} appClients The same-origin app clients currently known to the Service Worker.
 * @param {*} url The URL that should be focused.
 * @returns The matching client or undefined.
 */
const findClientByUrl = (appClients, url) =>
  appClients.find((client) => {
    try {
      return new URL(client.url).href === url;
    } catch {
      return false;
    }
  });

/**
 * Focuses an existing client or opens a new window with the provided URL.
 * @param {*} url The URL to focus or open.
 * @returns A promise that resolves when the operation is complete.
 */
const focusOrOpen = async (url) => {
  const appClients = await getAppClients();
  const client = findClientByUrl(appClients, url);

  if (client) {
    if ('focus' in client) {
      await client.focus();
    }

    return;
  }

  await clients.openWindow(url);
};

/**
 * Service Worker event listener for notification click events. It closes the notification and focuses
 * or opens a new window with the provided URL.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = getNotificationUrl(event.notification);

  if (typeof event.stopImmediatePropagation === 'function') {
    event.stopImmediatePropagation();
  }

  event.waitUntil(focusOrOpen(url));
});

/**------------------------------------------------------------------------------------------------
 * Event subscription and message handling
 -------------------------------------------------------------------------------------------------*/

/**
 * Import the Firebase scripts and initialize the Firebase app with the provided configuration. It also
 * sets up a background message handler to display notifications or send messages to clients.
 */
importScripts('firebase-app-compat.js');
importScripts('firebase-messaging-compat.js');

// initialize the Firebase app with the provided configuration
firebase.initializeApp({});
const messaging = firebase.messaging();

/**
 * Service Worker event listener for background messages. It checks if there are any clients for the
 * current application. If there are clients, it sends a message to each client with the received data.
 * If there are no clients, it displays a notification with the received data.
 */
messaging.onBackgroundMessage(async ({ data }) => {
  const appClients = await getAppClients();

  if (appClients.length > 0) {
    for (const client of appClients) {
      client.postMessage({
        type: 'PUSH_MESSAGE',
        data,
      });
    }

    return;
  }

  await self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: {
      ...data,
      url: getUrl(data.url),
    },
  });
});
`;
