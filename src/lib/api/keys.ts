import { apiRequest } from "@/lib/api/client";
import { memberEndpoints } from "@/lib/api/endpoints";

export type OutboundKey = {
  key_id?: number | null;
  id?: number | null;
  slot?: number;
  state?: string;
  status?: string;
  nominee_name?: string | null;
  claimer_name?: string | null;
  nominee?: string | null;
  name?: string | null;
  nominee_contact?: string | null;
  claimer_mobile?: string | null;
  claimer_email?: string | null;
  invite_code?: string | null;
  invite_url?: string | null;
  send_deadline?: string | null;
  claim_deadline?: string | null;
  finish_deadline?: string | null;
  mirror_answered?: boolean;
  mirror_status?: string | null;
  mirror_archetype?: string | null;
};

export type SendKeyResult = OutboundKey & {
  error?: string;
};

function coerceKeyList(raw: unknown): OutboundKey[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as OutboundKey[];
  if (typeof raw === "object") {
    const o = raw as { results?: unknown; keys?: unknown; outbound_keys?: unknown };
    if (Array.isArray(o.results)) return o.results as OutboundKey[];
    if (Array.isArray(o.keys)) return o.keys as OutboundKey[];
    if (Array.isArray(o.outbound_keys)) return o.outbound_keys as OutboundKey[];
  }
  return [];
}

export function normalizeOutboundKeys(raw: unknown): OutboundKey[] {
  const list = coerceKeyList(raw).filter((k) => k && typeof k === "object");
  const nums = list.map((k) => Number(k.slot)).filter((n) => !Number.isNaN(n));
  const hasZero = nums.includes(0);
  const maxSlot = nums.length ? Math.max(...nums) : 0;
  const zeroIndexed = hasZero && maxSlot <= 2;
  return list.map((k, i) => {
    let slot = Number(k.slot);
    if (zeroIndexed && !Number.isNaN(slot)) slot = slot + 1;
    if (!slot || slot < 1) slot = i + 1;
    let state = String(k.state || k.status || "allocated").toLowerCase();
    if (state === "available" || state === "ready" || state === "open") state = "allocated";
    if (state === "issued" || state === "nominated" || state === "pending" || state === "opened") {
      state = "sent";
    }
    const keyId = k.key_id != null ? k.key_id : k.id;
    return {
      ...k,
      key_id: keyId,
      slot,
      state,
      nominee_name: k.nominee_name || k.nominee || k.name || null,
    };
  });
}

export function parseDeadline(v: string | number | null | undefined) {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

export function outboundClockMs(k: OutboundKey | null | undefined) {
  if (!k) return null;
  const state = String(k.state || k.status || "").toLowerCase();
  if (state === "activated" || state === "closed" || state === "returned" || state === "expired") {
    return null;
  }
  const unsent = !state || state === "allocated" || state === "available";
  if (unsent) return parseDeadline(k.send_deadline || k.claim_deadline);
  return parseDeadline(k.claim_deadline || k.finish_deadline);
}

export async function getMyKeys() {
  const raw = await apiRequest<unknown, []>(memberEndpoints.getMyKeys, []);
  return normalizeOutboundKeys(raw);
}

export function sendKey(keyId: number, body: { nominee_name: string; nominee_contact: string }) {
  return apiRequest<SendKeyResult, [number]>(memberEndpoints.sendKey, [keyId], {
    nominee_name: body.nominee_name.trim(),
    nominee_contact: body.nominee_contact.trim(),
  });
}

export type KeyRequest = {
  id?: number | string | null;
  status?: string | null;
  note?: string | null;
  granted_key_id?: number | string | null;
  decline_reason?: string | null;
};

function coerceRequestList(raw: unknown): KeyRequest[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as KeyRequest[];
  if (typeof raw === "object") {
    const o = raw as { results?: unknown; requests?: unknown };
    if (Array.isArray(o.results)) return o.results as KeyRequest[];
    if (Array.isArray(o.requests)) return o.requests as KeyRequest[];
  }
  return [];
}

export async function getKeyRequests() {
  const raw = await apiRequest<unknown, []>(memberEndpoints.getKeyRequests, []);
  return coerceRequestList(raw);
}

export function createKeyRequest(note = "") {
  return apiRequest<KeyRequest, []>(memberEndpoints.createKeyRequest, [], {
    note: String(note || "").trim().slice(0, 500),
  });
}
