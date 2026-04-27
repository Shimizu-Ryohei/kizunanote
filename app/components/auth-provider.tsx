"use client";

import type { User } from "firebase/auth";
import { browserLocalPersistence, onAuthStateChanged, setPersistence } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { firebaseAuth } from "@/lib/firebase/client";
import { syncUserDocument } from "@/lib/firebase/auth";
import {
  getStoredPushNotificationToken,
  markPushNotificationTokenRefreshed,
  requestPushNotificationToken,
  shouldRefreshPushNotificationToken,
  subscribeToForegroundPushNotifications,
} from "@/lib/firebase/push-notifications";
import {
  deletePushNotificationToken,
  getNotificationSettings,
  savePushNotificationToken,
} from "@/lib/firebase/notification-settings";

type AuthContextValue = {
  isLoading: boolean;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue>({
  isLoading: true,
  user: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(firebaseAuth));

  useEffect(() => {
    if (!firebaseAuth) {
      return;
    }

    setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {
      // Fallback to the default persistence if browser storage is unavailable.
    });

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);

      if (nextUser) {
        syncUserDocument(nextUser).catch((error) => {
          console.error("Failed to sync user document", error);
        });
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    getNotificationSettings(user.uid)
      .then(async (settings) => {
        if (cancelled || !settings.pushEnabled) {
          return;
        }

        if (!shouldRefreshPushNotificationToken()) {
          return;
        }

        const previousToken = getStoredPushNotificationToken();
        const nextToken = await requestPushNotificationToken();

        if (cancelled) {
          return;
        }

        await savePushNotificationToken(user.uid, nextToken);

        if (previousToken && previousToken !== nextToken) {
          await deletePushNotificationToken(user.uid, previousToken);
        }

        markPushNotificationTokenRefreshed();
      })
      .catch((error) => {
        console.error("Failed to refresh push notification token", error);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let disposed = false;

    subscribeToForegroundPushNotifications()
      .then((cleanup) => {
        if (disposed) {
          cleanup();
          return;
        }

        unsubscribe = cleanup;
      })
      .catch((error) => {
        console.error("Failed to subscribe to foreground push notifications", error);
      });

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [user]);

  const value = useMemo(
    () => ({
      isLoading,
      user,
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
