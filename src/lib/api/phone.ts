/** Normalise UAE mobile to +9715XXXXXXXX. Returns null if invalid. */
export function normalizeUaePhone(raw: string) {
  let d = String(raw || "").replace(/\D/g, "");
  if (!d) return null;
  let guard = 0;
  while (guard++ < 4) {
    if (d.startsWith("00971")) {
      d = d.slice(5);
      continue;
    }
    if (d.startsWith("971") && d.length > 9) {
      d = d.slice(3);
      continue;
    }
    break;
  }
  if (d.charAt(0) === "0") d = d.slice(1);
  if (d.length === 9 && d.charAt(0) === "5") return `+971${d}`;
  return null;
}

/** Local-field sanitiser: strip pasted +971 / 00971, cap at 9 (or 10 with leading 0). */
export function sanitizeUaeLocalInput(raw: string) {
  let d = String(raw || "").replace(/\D/g, "");
  let guard = 0;
  while (guard++ < 4) {
    if (d.startsWith("00971")) {
      d = d.slice(5);
      continue;
    }
    if (d.startsWith("971") && d.length > 9) {
      d = d.slice(3);
      continue;
    }
    break;
  }
  if (d.charAt(0) === "0") return d.slice(0, 10);
  return d.slice(0, 9);
}

/** +971501234555 → +97150****555 */
export function maskPhone(raw: string | null | undefined) {
  const d = String(raw || "").replace(/\s/g, "");
  if (d.length < 10) return d;
  return `${d.slice(0, 6)}****${d.slice(-3)}`;
}

/** Ceremony Keys contact field — emails pass through, phones are digit-only. */
export function sanitizeContactField(raw: string) {
  const s = String(raw || "");
  if (s.includes("@")) return { value: s, isEmail: true };
  return { value: sanitizeUaeLocalInput(s), isEmail: false };
}
