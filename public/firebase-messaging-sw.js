importScripts("https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js");

let isFirebaseInitialized = false;
let messagingInstance = null;

function getFirebaseConfigFromSearch() {
  const searchParams = new URL(self.location.href).searchParams;
  const apiKey = searchParams.get("apiKey") || "";
  const authDomain = searchParams.get("authDomain") || "";
  const projectId = searchParams.get("projectId") || "";
  const storageBucket = searchParams.get("storageBucket") || "";
  const messagingSenderId = searchParams.get("messagingSenderId") || "";
  const appId = searchParams.get("appId") || "";
  const measurementId = searchParams.get("measurementId") || "";

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId,
  };
}

function initializeFirebase(config) {
  if (isFirebaseInitialized || !config) {
    return messagingInstance;
  }

  firebase.initializeApp(config);
  messagingInstance = firebase.messaging();
  isFirebaseInitialized = true;

  messagingInstance.onBackgroundMessage((payload) => {
    const title = payload.data?.title || payload.notification?.title || "キズナノート";
    const body = payload.data?.body || payload.notification?.body || "";
    const path = payload.data?.path || "/home";

    self.registration.showNotification(title, {
      body,
      data: {
        path,
      },
    });
  });

  return messagingInstance;
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "INIT_FIREBASE") {
    initializeFirebase(event.data.payload);
  }
});

initializeFirebase(getFirebaseConfigFromSearch());

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
