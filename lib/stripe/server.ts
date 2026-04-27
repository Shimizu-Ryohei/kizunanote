import Stripe from "stripe";
import type { PlanId } from "@/lib/firebase/subscription";

const stripeApiVersion = "2026-04-22.dahlia";

let stripeClient: Stripe | null = null;

export type PaidPlanId = Exclude<PlanId, "standard">;

export function getStripe() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: stripeApiVersion,
  });

  return stripeClient;
}

export function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function getPriceIdForPlan(planId: PaidPlanId) {
  const priceIdByPlan: Record<PaidPlanId, string | undefined> = {
    plus: process.env.STRIPE_PLUS_PRICE_ID,
    pro: process.env.STRIPE_PRO_PRICE_ID,
  };
  const priceId = priceIdByPlan[planId];

  if (!priceId) {
    throw new Error(`Missing Stripe price ID for ${planId}.`);
  }

  return priceId;
}

export function getPlanIdForPrice(priceId: string): PaidPlanId | null {
  if (priceId === process.env.STRIPE_PLUS_PRICE_ID) {
    return "plus";
  }

  if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return "pro";
  }

  return null;
}

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return value === "plus" || value === "pro";
}
