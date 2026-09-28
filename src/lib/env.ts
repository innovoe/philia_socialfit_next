/**
 * Runtime env for the member app.
 * Mirrors philia_socialfit/.env + js/config.js.
 */

function stripSlash(value: string) {
  return value.replace(/\/$/, "");
}

function readPublic(name: string, fallback: string) {
  const raw = process.env[name];
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
  readPublic("NEXT_PUBLIC_PHILIA_API_BASE", DEFAULT_API_BASE),
);

const authBase = stripSlash(
  readPublic("NEXT_PUBLIC_PHILIA_AUTH_BASE", deriveAuthBase(apiBase)),
);

const useMocksRaw = readPublic("NEXT_PUBLIC_PHILIA_USE_MOCKS", "false");

export const env = {
  apiBase,
  authBase,
  useMocks: useMocksRaw === "true" || useMocksRaw === "1",
} as const;
