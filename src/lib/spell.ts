"use client";

/** One English word, long enough to spellcheck. */
export function isSingleSpellWord(raw: string) {
  return /^[A-Za-z][A-Za-z'-]{2,39}$/.test(raw.trim());
}

export async function suggestTypo(raw: string, signal?: AbortSignal) {
  const word = raw.trim();
  if (!isSingleSpellWord(word)) return null;
  const r = await fetch(`/api/spell?q=${encodeURIComponent(word)}`, { signal });
  if (!r.ok) return null;
  const data = (await r.json()) as { suggestion?: string | null };
  const next = String(data.suggestion || "").trim();
  if (!next || next.toLowerCase() === word.toLowerCase()) return null;
  return next;
}
