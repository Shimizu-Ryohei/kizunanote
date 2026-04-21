import { httpsCallable } from "firebase/functions";
import { firebaseAuth, firebaseFunctions, getFirebaseConfigError } from "./client";
import type { IdTokenResult } from "firebase/auth";

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

export type AdminContactInquiry = {
  id: string;
  userUid: string;
  email: string;
  subject: string;
  message: string;
  createdAtLabel: string;
};

function getAdminRoleFromTokenResult(tokenResult: IdTokenResult | null): UserRole {
  return tokenResult?.claims.admin === true ? "admin" : "user";
}

export async function getCurrentUserRole(): Promise<UserRole> {
  if (!firebaseAuth) {
    throw new Error(getFirebaseConfigError());
  }

  const user = firebaseAuth.currentUser;

  if (!user) {
    return "user";
  }

  const tokenResult = await user.getIdTokenResult();
  return getAdminRoleFromTokenResult(tokenResult);
}

export async function ensureCurrentUserAdminRole(): Promise<UserRole> {
  if (!firebaseAuth || !firebaseFunctions) {
    throw new Error(getFirebaseConfigError());
  }

  const user = firebaseAuth.currentUser;

  if (!user) {
    return "user";
  }

  const initialTokenResult = await user.getIdTokenResult();

  if (getAdminRoleFromTokenResult(initialTokenResult) === "admin") {
    return "admin";
  }

  const callable = httpsCallable<undefined, { admin: boolean }>(
    firebaseFunctions,
    "bootstrapAdminClaims",
  );

  try {
    await callable();
  } catch {
    return "user";
  }

  await user.getIdToken(true);
  const refreshedTokenResult = await user.getIdTokenResult(true);
  return getAdminRoleFromTokenResult(refreshedTokenResult);
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

export async function getAdminContactInquiries(): Promise<AdminContactInquiry[]> {
  if (!firebaseFunctions) {
    throw new Error(getFirebaseConfigError());
  }

  const callable = httpsCallable<undefined, AdminContactInquiry[]>(
    firebaseFunctions,
    "getAdminContactInquiries",
  );
  const result = await callable();
  return result.data;
}
