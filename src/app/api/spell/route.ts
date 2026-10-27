import nspell from "nspell";
import dictionary from "dictionary-en";

export const runtime = "nodejs";

const spell = nspell({
  aff: Buffer.from(dictionary.aff),
  dic: Buffer.from(dictionary.dic),
});

function prettySuggestion(word: string) {
  if (/[A-Z]/.test(word.slice(1))) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export async function GET(req: Request) {
  const word = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (!/^[A-Za-z][A-Za-z'-]{2,39}$/.test(word) || spell.correct(word)) {
    return Response.json({ suggestion: null });
  }
  const hit = spell.suggest(word).find((item) => /^[A-Za-z][A-Za-z-]*$/.test(item));
  if (!hit || hit.toLowerCase() === word.toLowerCase()) {
    return Response.json({ suggestion: null });
  }
  return Response.json({ suggestion: prettySuggestion(hit) });
}
