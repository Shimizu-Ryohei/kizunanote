import { doc, getDocFromServer, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore, getFirebaseConfigError } from "./client";

export type PlanId = "standard" | "plus" | "pro";

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

export async function getCurrentPlan(uid: string) {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }

  const snapshot = await getDocFromServer(doc(firestore, "users", uid));
  const data = snapshot.data() as { planId?: string } | undefined;

  return normalizePlanId(data?.planId);
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
