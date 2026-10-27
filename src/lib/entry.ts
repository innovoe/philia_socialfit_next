/**
 * Shared-link flags (legacy skip/token query).
 * Live consumer mail uses /enter?key=CODE — see continueFromKeyCode.
 */

export type EntryFlags = {
  skip: string[];
  show: string[];
  access: string | null;
  refresh: string | null;
  founderToken: string | null;
  email: string | null;
};

function splitList(raw: string | null) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

export function parseEntrySearch(search: string): EntryFlags {
  const q = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  return {
    skip: splitList(q.get("skip")),
    show: splitList(q.get("show")),
    access: (q.get("access") || q.get("token") || "").trim() || null,
    refresh: (q.get("refresh") || "").trim() || null,
    founderToken: (q.get("founder_token") || q.get("ft") || "").trim() || null,
    email: (q.get("email") || "").trim() || null,
  };
}

export function shouldSkip(skip: string[], name: string) {
  return skip.includes(name) || skip.includes("all");
}
