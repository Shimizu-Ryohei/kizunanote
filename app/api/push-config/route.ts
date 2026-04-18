import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const vapidKey =
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ??
    process.env.FIREBASE_VAPID_KEY ??
    "";

  if (!vapidKey) {
    return NextResponse.json(
      {
        error: "NEXT_PUBLIC_FIREBASE_VAPID_KEY is not configured.",
        hasNextPublicKey: Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY),
        hasServerOnlyKey: Boolean(process.env.FIREBASE_VAPID_KEY),
        vercelEnv: process.env.VERCEL_ENV ?? "",
        vercelUrl: process.env.VERCEL_URL ?? "",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }

  return NextResponse.json(
    {
      vapidKey,
      vercelEnv: process.env.VERCEL_ENV ?? "",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
