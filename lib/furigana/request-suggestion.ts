import { normalizeKanaSuggestion, normalizeNameText } from "./shared";

export async function requestFuriganaSuggestion(text: string, signal?: AbortSignal) {
  const normalizedText = normalizeNameText(text);

  if (!normalizedText) {
    return "";
  }

  const response = await fetch(
    `/api/furigana-suggest?text=${encodeURIComponent(normalizedText)}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch furigana suggestion.");
  }

  const data = (await response.json()) as { suggestion?: string };
  return normalizeKanaSuggestion(data.suggestion ?? "");
}
