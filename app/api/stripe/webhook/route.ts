import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerFirestore } from "@/lib/firebase/server";
import type { PlanId, SubscriptionStatus } from "@/lib/firebase/subscription";
import { getPlanIdForPrice, getStripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type UserSubscriptionUpdate = {
  planId: PlanId;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  stripeCancelAtPeriodEnd?: boolean;
  stripeCurrentPeriodEnd?: FirebaseFirestore.Timestamp | null;
  stripeCancelAt?: FirebaseFirestore.Timestamp | null;
};

function getObjectId(value: string | { id?: string } | null | undefined) {
  if (typeof value === "string") {
    return value;
  }

  return typeof value?.id === "string" ? value.id : "";
}

function getSubscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.id ?? "";
}

function timestampFromUnixSeconds(value: number | null | undefined) {
  return typeof value === "number" ? Timestamp.fromMillis(value * 1000) : null;
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  return timestampFromUnixSeconds(subscription.items.data[0]?.current_period_end);
}

function getPlanIdFromSubscription(subscription: Stripe.Subscription): PlanId {
  const priceId = getSubscriptionPriceId(subscription);
  return getPlanIdForPrice(priceId) ?? "standard";
}

function buildSubscriptionPayload(subscription: Stripe.Subscription): UserSubscriptionUpdate {
  return {
    planId: getPlanIdFromSubscription(subscription),
    subscriptionStatus: subscription.status as SubscriptionStatus,
    stripeCustomerId: getObjectId(subscription.customer),
    stripeSubscriptionId: subscription.id,
    stripePriceId: getSubscriptionPriceId(subscription),
    stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
    stripeCurrentPeriodEnd: getSubscriptionPeriodEnd(subscription),
    stripeCancelAt: timestampFromUnixSeconds(subscription.cancel_at),
  };
}

async function resolveUidFromSubscription(subscription: Stripe.Subscription) {
  const uid = subscription.metadata.uid;

  if (uid) {
    return uid;
  }

  const snapshot = await getServerFirestore()
    .collection("users")
    .where("stripeSubscriptionId", "==", subscription.id)
    .limit(1)
    .get();

  return snapshot.docs[0]?.id ?? "";
}

async function buildUpdateFromSubscription(subscription: Stripe.Subscription) {
  const uid = await resolveUidFromSubscription(subscription);

  if (!uid) {
    return null;
  }

  return {
    uid,
    data: buildSubscriptionPayload(subscription),
  };
}

async function buildUpdateFromCheckoutSession(session: Stripe.Checkout.Session) {
  const uid = session.metadata?.uid;
  const subscriptionId = getObjectId(session.subscription);

  if (!uid || !subscriptionId) {
    return null;
  }

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

  return {
    uid,
    data: {
      ...buildSubscriptionPayload(subscription),
      stripeCustomerId: getObjectId(session.customer),
    },
  };
}

async function buildUpdateFromInvoice(invoice: Stripe.Invoice, status: SubscriptionStatus) {
  const subscriptionId = getObjectId(invoice.parent?.subscription_details?.subscription);

  if (!subscriptionId) {
    return null;
  }

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const uid = await resolveUidFromSubscription(subscription);

  if (!uid) {
    return null;
  }

  return {
    uid,
    data: {
      ...buildSubscriptionPayload(subscription),
      subscriptionStatus: status,
    },
  };
}

async function getEventUpdate(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      return buildUpdateFromCheckoutSession(event.data.object as Stripe.Checkout.Session);
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return buildUpdateFromSubscription(event.data.object as Stripe.Subscription);
    case "invoice.payment_failed":
      return buildUpdateFromInvoice(event.data.object as Stripe.Invoice, "past_due");
    case "invoice.paid":
      return buildUpdateFromInvoice(event.data.object as Stripe.Invoice, "active");
    default:
      return null;
  }
}

async function persistWebhookEvent(event: Stripe.Event, update: Awaited<ReturnType<typeof getEventUpdate>>) {
  const firestore = getServerFirestore();
  const eventRef = firestore.collection("stripeWebhookEvents").doc(event.id);

  await firestore.runTransaction(async (transaction) => {
    const eventSnapshot = await transaction.get(eventRef);

    if (eventSnapshot.exists) {
      return;
    }

    if (update) {
      const userRef = firestore.collection("users").doc(update.uid);
      const userPayload: UserSubscriptionUpdate & { updatedAt: FirebaseFirestore.FieldValue } = {
        ...update.data,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (
        event.type === "customer.subscription.deleted" ||
        update.data.subscriptionStatus === "canceled" ||
        update.data.subscriptionStatus === "incomplete_expired" ||
        update.data.subscriptionStatus === "unpaid"
      ) {
        userPayload.planId = "standard";
      }

      transaction.set(userRef, userPayload, { merge: true });
    }

    transaction.set(eventRef, {
      type: event.type,
      processedAt: FieldValue.serverTimestamp(),
      userUid: update?.uid ?? "",
    });
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  try {
    const rawBody = await request.text();
    const event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
    const update = await getEventUpdate(event);

    await persistWebhookEvent(event, update);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe.webhook]", error);
    return NextResponse.json({ error: "Webhook handling failed." }, { status: 400 });
  }
}
