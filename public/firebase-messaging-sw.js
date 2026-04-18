importScripts("https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js");

let messaging = null;
let isFirebaseInitialized = false;

function initializeFirebase(config) {
  if (isFirebaseInitialized || !config) {
    return;
  }

  firebase.initializeApp(config);
  messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || "キズナノート";
    const notificationOptions = {
      body: payload.notification?.body || "",
      data: payload.data || {},
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
  isFirebaseInitialized = true;
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "INIT_FIREBASE") {
    initializeFirebase(event.data.payload);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const path = event.notification?.data?.path || "/home";
  const targetUrl = new URL(path, self.location.origin).toString();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
