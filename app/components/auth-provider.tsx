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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {
      // Fallback to the default persistence if browser storage is unavailable.
    });

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

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
