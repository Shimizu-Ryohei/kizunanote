import { NextResponse } from "next/server";
import { getServerFirestore, verifyBearerToken } from "@/lib/firebase/server";
import { getAppUrl, getStripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const decodedToken = await verifyBearerToken(request);
    const userSnapshot = await getServerFirestore().collection("users").doc(decodedToken.uid).get();
    const stripeCustomerId = userSnapshot.data()?.stripeCustomerId;

    if (typeof stripeCustomerId !== "string" || !stripeCustomerId) {
      return NextResponse.json(
        { error: "請求管理ページを開けませんでした。" },
        { status: 400 },
      );
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${getAppUrl()}/settings/upgrade`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe.portal]", error);
    return NextResponse.json(
      { error: "請求管理ページを作成できませんでした。" },
      { status: 500 },
    );
  }
}
