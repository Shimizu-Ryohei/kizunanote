import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore, getFirebaseConfigError } from "./client";

export type NotificationSettings = {
  pushEnabled: boolean;
  emailEnabled: boolean;
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  emailEnabled: false,
};

export function getDefaultNotificationSettings() {
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export async function getNotificationSettings(uid: string) {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }

  const snapshot = await getDoc(doc(firestore, "users", uid));
  const data = snapshot.data() as
    | {
        notificationPreferences?: Partial<NotificationSettings>;
      }
    | undefined;

  return {
    pushEnabled:
      typeof data?.notificationPreferences?.pushEnabled === "boolean"
        ? data.notificationPreferences.pushEnabled
        : DEFAULT_NOTIFICATION_SETTINGS.pushEnabled,
    emailEnabled:
      typeof data?.notificationPreferences?.emailEnabled === "boolean"
        ? data.notificationPreferences.emailEnabled
        : DEFAULT_NOTIFICATION_SETTINGS.emailEnabled,
  } satisfies NotificationSettings;
}

export async function updateNotificationSettings(uid: string, input: NotificationSettings) {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }

  await setDoc(
    doc(firestore, "users", uid),
    {
      notificationPreferences: {
        pushEnabled: input.pushEnabled,
        emailEnabled: input.emailEnabled,
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
