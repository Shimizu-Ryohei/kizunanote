import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

  if (!vapidKey) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_FIREBASE_VAPID_KEY is not configured." },
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
