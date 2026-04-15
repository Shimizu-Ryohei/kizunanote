export function normalizeNameText(value: string) {
  return value.replace(/\s+/g, "").trim();
}

export function katakanaToHiragana(value: string) {
  return value.replace(/[\u30a1-\u30f6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  );
}

export function normalizeKanaSuggestion(value: string) {
  return katakanaToHiragana(normalizeNameText(value)).replace(/[^\u3041-\u3096\u30fc]/g, "");
}

export function isKanaOnly(value: string) {
  return /^[\u3041-\u3096\u30a1-\u30f6\u30fc]+$/.test(value);
}
