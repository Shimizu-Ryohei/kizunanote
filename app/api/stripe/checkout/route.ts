import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getServerFirestore, verifyBearerToken } from "@/lib/firebase/server";
import { getAppUrl, getPriceIdForPlan, getStripe, isPaidPlanId } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const openSubscriptionStatuses = new Set([
  "active",
  "trialing",
  "past_due",
  "incomplete",
  "paused",
]);

function isOpenSubscription(subscription: { status: string; ended_at?: number | null }) {
  return !subscription.ended_at && openSubscriptionStatuses.has(subscription.status);
}

export async function POST(request: Request) {
  try {
    const decodedToken = await verifyBearerToken(request);
    const { planId } = (await request.json()) as { planId?: unknown };

    if (!isPaidPlanId(planId)) {
      return NextResponse.json({ error: "プランを選択してください。" }, { status: 400 });
    }

    const uid = decodedToken.uid;
    const stripe = getStripe();
    const firestore = getServerFirestore();
    const userRef = firestore.collection("users").doc(uid);
    const userSnapshot = await userRef.get();
    const userData = userSnapshot.data();
    let stripeCustomerId =
      typeof userData?.stripeCustomerId === "string" ? userData.stripeCustomerId : "";
    const stripeSubscriptionId =
      typeof userData?.stripeSubscriptionId === "string" ? userData.stripeSubscriptionId : "";

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: decodedToken.email,
        metadata: { uid },
      });

      stripeCustomerId = customer.id;

      await userRef.set(
        {
          stripeCustomerId,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    const appUrl = getAppUrl();

    if (stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

        if (isOpenSubscription(subscription)) {
          const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${appUrl}/settings/upgrade`,
          });

          return NextResponse.json({ url: portalSession.url });
        }
      } catch (error) {
        console.error("[stripe.checkout] Failed to inspect existing subscription", error);
      }
    }

    if (stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "all",
        limit: 10,
      });
      const existingSubscription = subscriptions.data.find(isOpenSubscription);

      if (existingSubscription) {
        await userRef.set(
          {
            stripeSubscriptionId: existingSubscription.id,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: stripeCustomerId,
          return_url: `${appUrl}/settings/upgrade`,
        });

        return NextResponse.json({ url: portalSession.url });
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: getPriceIdForPlan(planId),
          quantity: 1,
        },
      ],
      metadata: {
        uid,
        planId,
      },
      subscription_data: {
        metadata: {
          uid,
          planId,
        },
      },
      success_url: `${appUrl}/settings/upgrade?checkout=success`,
      cancel_url: `${appUrl}/settings/upgrade?checkout=cancelled`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe.checkout]", error);
    return NextResponse.json(
      { error: "決済ページを作成できませんでした。" },
      { status: 500 },
    );
  }
}
