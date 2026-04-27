import { doc, getDocFromServer, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore, getFirebaseConfigError } from "./client";

export type PlanId = "standard" | "plus" | "pro";
export type SubscriptionStatus =
  | "free"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

export type CurrentSubscription = {
  planId: PlanId;
  subscriptionStatus: SubscriptionStatus;
  effectivePlanId: PlanId;
  stripeCancelAtPeriodEnd: boolean;
  stripeCurrentPeriodEnd: Date | null;
  stripeCancelAt: Date | null;
};

export function getDefaultPlanId(): PlanId {
  return "standard";
}

export function getPlanLabel(planId: PlanId) {
  switch (planId) {
    case "plus":
      return "Plus";
    case "pro":
      return "Pro";
    case "standard":
    default:
      return "Standard";
  }
}

function normalizePlanId(value: unknown): PlanId {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (normalized === "plus" || normalized === "pro" || normalized === "standard") {
    return normalized;
  }

  return getDefaultPlanId();
}

function normalizeSubscriptionStatus(value: unknown): SubscriptionStatus {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (
    normalized === "free" ||
    normalized === "active" ||
    normalized === "trialing" ||
    normalized === "past_due" ||
    normalized === "canceled" ||
    normalized === "unpaid" ||
    normalized === "incomplete" ||
    normalized === "incomplete_expired" ||
    normalized === "paused"
  ) {
    return normalized;
  }

  return "free";
}

function getEffectivePlanId(planId: PlanId, subscriptionStatus: SubscriptionStatus): PlanId {
  if (planId === "standard") {
    return "standard";
  }

  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
    return planId;
  }

  return "standard";
}

function normalizeFirestoreDate(value: unknown) {
  if (value instanceof Date) {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate() as Date;
  }

  return null;
}

export async function getCurrentSubscription(uid: string): Promise<CurrentSubscription> {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }

  const snapshot = await getDocFromServer(doc(firestore, "users", uid));
  const data = snapshot.data() as
    | {
        planId?: string;
        subscriptionStatus?: string;
        stripeCancelAtPeriodEnd?: boolean;
        stripeCurrentPeriodEnd?: unknown;
        stripeCancelAt?: unknown;
      }
    | undefined;
  const planId = normalizePlanId(data?.planId);
  const subscriptionStatus = normalizeSubscriptionStatus(data?.subscriptionStatus);

  return {
    planId,
    subscriptionStatus,
    effectivePlanId: getEffectivePlanId(planId, subscriptionStatus),
    stripeCancelAtPeriodEnd: data?.stripeCancelAtPeriodEnd === true,
    stripeCurrentPeriodEnd: normalizeFirestoreDate(data?.stripeCurrentPeriodEnd),
    stripeCancelAt: normalizeFirestoreDate(data?.stripeCancelAt),
  };
}

export async function getCurrentPlan(uid: string) {
  const subscription = await getCurrentSubscription(uid);
  return subscription.effectivePlanId;
}

export async function ensureDefaultPlan(uid: string) {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }

  await setDoc(
    doc(firestore, "users", uid),
    {
      planId: getDefaultPlanId(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
