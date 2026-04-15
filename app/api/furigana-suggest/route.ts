import path from "node:path";
import kuromoji from "kuromoji";
import { NextResponse } from "next/server";
import { isKanaOnly, normalizeKanaSuggestion, normalizeNameText } from "@/lib/furigana/shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let tokenizerPromise: Promise<kuromoji.KuromojiTokenizer> | null = null;

function getTokenizer() {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji
        .builder({ dicPath: path.join(process.cwd(), "node_modules/kuromoji/dict") })
        .build((error, tokenizer) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(tokenizer);
        });
    });
  }

  return tokenizerPromise;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = normalizeNameText(searchParams.get("text") ?? "");

  if (!text) {
    return NextResponse.json({ suggestion: "" });
  }

  if (isKanaOnly(text)) {
    return NextResponse.json({ suggestion: normalizeKanaSuggestion(text) });
  }

  try {
    const tokenizer = await getTokenizer();
    const tokens = tokenizer.tokenize(text);
    const suggestion = normalizeKanaSuggestion(
      tokens
        .map((token) => {
          if (typeof token.reading === "string" && token.reading !== "*") {
            return token.reading;
          }

          return token.surface_form;
        })
        .join(""),
    );

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ suggestion: "" }, { status: 200 });
  }
}
