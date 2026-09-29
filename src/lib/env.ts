/**
 * Runtime env for the member app.
 *
 * NEXT_PUBLIC_* must be read as literal `process.env.NEXT_PUBLIC_…` keys.
 * Next inlines those at build time; `process.env[name]` is empty in the browser
 * and falls back to localhost.
 */

function stripSlash(value: string) {
  return value.replace(/\/$/, "");
}

function readPublic(raw: string | undefined, fallback: string) {
  if (raw == null || raw.trim() === "") return fallback;
  return raw.trim();
}

const DEFAULT_API_BASE = "http://localhost:8123/api/socialfit";
const DEFAULT_AUTH_BASE = "http://localhost:8123/api";

function deriveAuthBase(apiBase: string) {
  const base = stripSlash(apiBase);
  if (/\/socialfit$/i.test(base)) return base.replace(/\/socialfit$/i, "");
  const i = base.lastIndexOf("/");
  return i > 0 ? base.slice(0, i) : DEFAULT_AUTH_BASE;
}

const apiBase = stripSlash(
  readPublic(process.env.NEXT_PUBLIC_PHILIA_API_BASE, DEFAULT_API_BASE),
);

const authBase = stripSlash(
  readPublic(process.env.NEXT_PUBLIC_PHILIA_AUTH_BASE, deriveAuthBase(apiBase)),
);

const useMocksRaw = readPublic(process.env.NEXT_PUBLIC_PHILIA_USE_MOCKS, "false");

export const env = {
  apiBase,
  authBase,
  useMocks: useMocksRaw === "true" || useMocksRaw === "1",
} as const;
