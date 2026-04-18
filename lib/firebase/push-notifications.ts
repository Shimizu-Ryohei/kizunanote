"use client";

import { firebaseApp, getFirebaseConfigError } from "./client";

export const PUSH_NOTIFICATION_TOKEN_KEY = "kizunanote_push_notification_token";

type PushConfigResponse = {
  vapidKey?: string;
  error?: string;
  hasNextPublicKey?: boolean;
  hasServerOnlyKey?: boolean;
  vercelEnv?: string;
  vercelUrl?: string;
};

let pushConfigPromise: Promise<string> | null = null;

async function getMessagingModules() {
  const [{ getMessaging, getToken, deleteToken, isSupported, onMessage }] = await Promise.all([
    import("firebase/messaging"),
  ]);

  return { getMessaging, getToken, deleteToken, isSupported, onMessage };
}

async function getPushNotificationVapidKey() {
  if (!pushConfigPromise) {
    pushConfigPromise = fetch(`/api/push-config?ts=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store",
      },
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as PushConfigResponse;

        if (!response.ok || !payload.vapidKey) {
          throw new Error(
            payload.error
              ? `プッシュ通知設定を取得できませんでした。env=${payload.vercelEnv || "unknown"} nextPublic=${String(payload.hasNextPublicKey)} serverOnly=${String(payload.hasServerOnlyKey)}`
              : "プッシュ通知設定の取得に失敗しました。",
          );
        }

        return payload.vapidKey;
      })
      .catch((error) => {
        pushConfigPromise = null;
        throw error;
      });
  }

  return pushConfigPromise;
}

export async function isPushNotificationSupported() {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    typeof Notification === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return false;
  }

  const { isSupported } = await getMessagingModules();
  return isSupported();
}

async function getMessagingInstance() {
  if (!firebaseApp) {
    throw new Error(getFirebaseConfigError());
  }

  const supported = await isPushNotificationSupported();

  if (!supported) {
    throw new Error("このブラウザではプッシュ通知を利用できません。");
  }

  const { getMessaging } = await getMessagingModules();
  return getMessaging(firebaseApp);
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("このブラウザでは Service Worker を利用できません。");
  }

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const readyRegistration = await navigator.serviceWorker.ready;
  const activeWorker =
    readyRegistration.active ?? registration.active ?? registration.waiting ?? registration.installing ?? null;

  activeWorker?.postMessage({
    type: "INIT_FIREBASE",
    payload: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    },
  });

  return registration;
}

export async function requestPushNotificationToken() {
  if (typeof window === "undefined") {
    throw new Error("ブラウザ環境でのみ通知設定を変更できます。");
  }

  const vapidKey = await getPushNotificationVapidKey();

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("プッシュ通知が許可されていません。");
  }

  const messaging = await getMessagingInstance();
  const registration = await getServiceWorkerRegistration();
  const { getToken } = await getMessagingModules();
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("プッシュ通知トークンを取得できませんでした。");
  }

  window.localStorage.setItem(PUSH_NOTIFICATION_TOKEN_KEY, token);
  return token;
}

export async function removeCurrentPushNotificationToken() {
  if (typeof window === "undefined") {
    return "";
  }

  const existingToken = window.localStorage.getItem(PUSH_NOTIFICATION_TOKEN_KEY) ?? "";

  if (!existingToken) {
    return "";
  }

  try {
    const messaging = await getMessagingInstance();
    const { deleteToken: deleteFirebaseToken } = await getMessagingModules();
    await deleteFirebaseToken(messaging);
  } catch (error) {
    console.error("Failed to delete Firebase messaging token", error);
  }

  window.localStorage.removeItem(PUSH_NOTIFICATION_TOKEN_KEY);
  return existingToken;
}

export async function subscribeToForegroundPushNotifications() {
  if (typeof window === "undefined" || Notification.permission !== "granted") {
    return () => undefined;
  }

  const messaging = await getMessagingInstance();
  const { onMessage } = await getMessagingModules();

  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title || "キズナノート";
    const body = payload.notification?.body || "";
    const path = payload.data?.path || "/home";
    const notification = new Notification(title, { body });

    notification.onclick = () => {
      window.focus();
      window.location.href = path;
    };
  });
}
