import { doc, getDocFromServer } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  firebaseFunctions,
  firestore,
  getFirebaseConfigError,
} from "./client";

const ADMIN_EMAILS = new Set(["space.odyssey.g@gmail.com"]);

export type UserRole = "admin" | "user";

export type AdminDashboardStats = {
  totalUsers: number;
  planCounts: {
    standard: number;
    plus: number;
    pro: number;
  };
  currentMonthNewUsers: number;
  currentMonthCanceledUsers: number;
};

export function isAdminEmail(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.has(email.toLowerCase()));
}

export async function getCurrentUserRole(uid: string, email?: string | null): Promise<UserRole> {
  if (isAdminEmail(email)) {
    return "admin";
  }

  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }

  const snapshot = await getDocFromServer(doc(firestore, "users", uid));
  const data = snapshot.data() as { role?: string } | undefined;
  return data?.role === "admin" ? "admin" : "user";
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  if (!firebaseFunctions) {
    throw new Error(getFirebaseConfigError());
  }

  const callable = httpsCallable<undefined, AdminDashboardStats>(
    firebaseFunctions,
    "getAdminDashboardStats",
  );
  const result = await callable();
  return result.data;
}
