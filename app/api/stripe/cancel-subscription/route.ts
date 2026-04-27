import { NextResponse } from "next/server";
import { getServerFirestore, verifyBearerToken } from "@/lib/firebase/server";
import { getStripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// アカウント削除専用。通常のプランキャンセルは Customer Portal 経由で行う。
export async function POST(request: Request) {
  try {
    const decodedToken = await verifyBearerToken(request);
    const userSnapshot = await getServerFirestore().collection("users").doc(decodedToken.uid).get();
    const stripeSubscriptionId = userSnapshot.data()?.stripeSubscriptionId;

    if (typeof stripeSubscriptionId !== "string" || !stripeSubscriptionId) {
      return NextResponse.json({ cancelled: false });
    }

    await getStripe().subscriptions.cancel(stripeSubscriptionId);

    return NextResponse.json({ cancelled: true });
  } catch (error) {
    console.error("[stripe.cancel-subscription]", error);
    return NextResponse.json(
      { error: "サブスクリプションを解約できませんでした。" },
      { status: 500 },
    );
  }
}
