import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const vapidKey =
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ??
    process.env.FIREBASE_VAPID_KEY ??
    "";

  if (!vapidKey) {
    console.error("[push-config] VAPID key is not configured.", {
      hasNextPublicKey: Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY),
      hasServerOnlyKey: Boolean(process.env.FIREBASE_VAPID_KEY),
      vercelEnv: process.env.VERCEL_ENV ?? "",
      vercelUrl: process.env.VERCEL_URL ?? "",
    });

    return NextResponse.json(
      { error: "プッシュ通知設定を取得できませんでした。" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }

  return NextResponse.json(
    { vapidKey },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
