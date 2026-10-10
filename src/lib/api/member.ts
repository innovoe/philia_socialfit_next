import { apiFormRequest, apiRequest } from "@/lib/api/client";
import { memberEndpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import type { MembershipChoice } from "@/lib/session";
import { normalizeWorlds, type WorldId } from "@/lib/worlds";

export type ClaimKeyResult = {
  key_id?: number;
  state?: string;
  bond_created?: boolean;
  needs_onboarding?: boolean;
  claim_deadline?: string | null;
  finish_deadline?: string | null;
};

export const PROFILE_GENDERS = [
  "woman",
  "man",
  "non-binary person",
  "prefer not to say",
] as const;

export type ProfileGender = (typeof PROFILE_GENDERS)[number];
export type NameSource = "user" | "invite" | "";
export type GenderSource = "profile" | "story" | "";
export type NameVisibility = "full" | "first" | "initials";
export type LocationPrecision = "city" | "area" | "neighbourhood";
export type ShareAudience = "none" | "matched";

export type PatchMeBody = {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  gender?: ProfileGender | "";
  date_of_birth?: string | null;
  address?: string;
  address_lat?: number | null;
  address_lng?: number | null;
  address_place_id?: string;
  name_visibility?: NameVisibility;
  location_precision?: LocationPrecision;
  story_visible_to?: ShareAudience;
  availability_visible_to?: ShareAudience;
  photo_visible_to?: ShareAudience;
  pod_visible?: boolean;
  pod_open_to?: string;
  worlds?: Record<WorldId, string[]>;
};

export type Me = {
  has_claimed_key?: boolean | null;
  claim_deadline?: string | null;
  finish_deadline?: string | null;
  needs_onboarding?: boolean;
  state?: string | null;
  tier?: string | null;
  passport_display?: string | null;
  onboarding_step?: string | null;
  ceremony_step?: string | null;
  story_complete?: boolean;
  read_complete?: boolean;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name_source?: NameSource | string | null;
  gender?: string | null;
  gender_source?: GenderSource | string | null;
  date_of_birth?: string | null;
  age?: number | null;
  address?: string | null;
  address_lat?: number | null;
  address_lng?: number | null;
  address_place_id?: string | null;
  name_visibility?: NameVisibility;
  location_precision?: LocationPrecision;
  story_visible_to?: ShareAudience;
  availability_visible_to?: ShareAudience;
  photo_visible_to?: ShareAudience;
  pod_visible?: boolean;
  pod_open_to?: string | null;
  worlds?: Record<WorldId, string[]>;
  photo_url?: string | null;
  keys_quota?: number | null;
  keys_used?: number | null;
  keys_allocated?: number | null;
  request_pending?: boolean;
  can_request?: boolean;
  email?: string | null;
  user_id?: number | null;
  waitlisted?: boolean;
  entry_path?: string | null;
  keys_to_the_city?: boolean;
  verified_email?: string | null;
  verified_mobile?: string | null;
  membership_choice?: MembershipChoice | null;
};

export type Mirror = {
  status?: string;
  archetypes?: unknown;
  archetype?: unknown;
  social_archetype?: unknown;
  leading_archetype?: unknown;
  responses_count?: number;
};

export type Passport = {
  passport_display?: string | null;
  tier?: string | null;
  colors?: { theme?: string; variant?: string } | string | null;
  theme?: string | null;
  member_since?: string | null;
  activated_at?: string | null;
  ceremony_step?: string | null;
};

export type ActivateResult = Passport & {
  state?: string;
  needs_onboarding?: boolean;
  onboarding_step?: string | null;
  ceremony_step?: string | null;
  error?: string;
};

type MeRaw = Me & {
  profile?: Record<string, unknown>;
};

function asStr(v: unknown) {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === "" || s === "null" || s === "none") return null;
  return s;
}

function asNum(v: unknown) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function asFlag(v: unknown) {
  return v === true || v === 1 || v === "true" || v === "1";
}

function pick(raw: Record<string, unknown>, profile: Record<string, unknown>, key: string) {
  return raw[key] != null && raw[key] !== "" ? raw[key] : profile[key];
}

export function normalizeNameVisibility(raw: unknown): NameVisibility {
  const s = String(raw || "").toLowerCase();
  if (s === "first" || s === "initials") return s;
  return "full";
}

export function normalizeLocationPrecision(raw: unknown): LocationPrecision {
  const s = String(raw || "").toLowerCase();
  if (s === "area" || s === "neighbourhood") return s;
  return "city";
}

export function normalizeShareAudience(raw: unknown): ShareAudience {
  return String(raw || "").toLowerCase() === "matched" ? "matched" : "none";
}

function normalizeCeremonyStep(raw: unknown) {
  const s = String(raw || "").toLowerCase();
  if (s === "summary" || s === "id" || s === "keys" || s === "hub") return s;
  return null;
}

export function normalizeMe(raw: MeRaw | null | undefined): Me | null {
  if (!raw || typeof raw !== "object") return null;
  const profile = (
    raw.profile && typeof raw.profile === "object" ? raw.profile : {}
  ) as Record<string, unknown>;
  const rec = raw as Record<string, unknown>;
  const ceremony_step = normalizeCeremonyStep(
    raw.ceremony_step != null ? raw.ceremony_step : profile.ceremony_step,
  );
  const first_name = asStr(pick(rec, profile, "first_name"));
  const last_name = asStr(pick(rec, profile, "last_name"));
  const display_name =
    asStr(pick(rec, profile, "display_name")) ||
    [first_name, last_name].filter(Boolean).join(" ").trim() ||
    null;
  const out: Me = {
    state: raw.state || asStr(profile.state) || null,
    tier: raw.tier != null ? raw.tier : asStr(profile.tier) || null,
    passport_display: raw.passport_display || asStr(profile.passport_display) || null,
    needs_onboarding: raw.needs_onboarding,
    has_claimed_key: raw.has_claimed_key == null ? null : !!raw.has_claimed_key,
    onboarding_step: raw.onboarding_step || null,
    ceremony_step,
    claim_deadline: asStr(raw.claim_deadline != null ? raw.claim_deadline : profile.claim_deadline),
    finish_deadline: asStr(
      raw.finish_deadline != null ? raw.finish_deadline : profile.finish_deadline,
    ),
    entry_path: raw.entry_path || asStr(profile.entry_path) || null,
    keys_to_the_city: asFlag(raw.keys_to_the_city ?? profile.keys_to_the_city),
    verified_email: asStr(raw.verified_email ?? profile.verified_email),
    verified_mobile: asStr(raw.verified_mobile ?? profile.verified_mobile),
    story_complete: !!raw.story_complete,
    read_complete: !!raw.read_complete,
    display_name,
    first_name,
    last_name,
    name_source: asStr(pick(rec, profile, "name_source")) || "",
    gender: asStr(pick(rec, profile, "gender")),
    gender_source: asStr(pick(rec, profile, "gender_source")) || "",
    date_of_birth: asStr(pick(rec, profile, "date_of_birth")),
    age: asNum(pick(rec, profile, "age")),
    address: asStr(pick(rec, profile, "address")) || "",
    address_lat: asNum(pick(rec, profile, "address_lat")),
    address_lng: asNum(pick(rec, profile, "address_lng")),
    address_place_id: asStr(pick(rec, profile, "address_place_id")) || "",
    name_visibility: normalizeNameVisibility(pick(rec, profile, "name_visibility")),
    location_precision: normalizeLocationPrecision(pick(rec, profile, "location_precision")),
    story_visible_to: normalizeShareAudience(pick(rec, profile, "story_visible_to")),
    availability_visible_to: normalizeShareAudience(pick(rec, profile, "availability_visible_to")),
    photo_visible_to: normalizeShareAudience(pick(rec, profile, "photo_visible_to")),
    pod_visible: pick(rec, profile, "pod_visible") === true,
    pod_open_to: asStr(pick(rec, profile, "pod_open_to")) || "",
    worlds: normalizeWorlds(pick(rec, profile, "worlds") ?? profile.worlds ?? rec.worlds),
    photo_url: asStr(pick(rec, profile, "photo_url")),
    keys_quota: asNum(raw.keys_quota != null ? raw.keys_quota : profile.keys_quota),
    keys_used: asNum(raw.keys_used != null ? raw.keys_used : profile.keys_used),
    keys_allocated: asNum(raw.keys_allocated != null ? raw.keys_allocated : profile.keys_allocated),
    request_pending: pick(rec, profile, "request_pending") === true,
    can_request: pick(rec, profile, "can_request") === true,
    email: raw.email || null,
    user_id: raw.user_id != null ? raw.user_id : null,
    waitlisted: !!(raw.waitlisted || profile.waitlisted),
    membership_choice:
      normalizeMembershipChoice(raw) || normalizeMembershipChoice(profile) || null,
  };
  if (out.ceremony_step === "hub" || out.onboarding_step === "done") out.needs_onboarding = false;
  return out;
}

export function contactsAlreadyVerified(me?: Me | null) {
  return !!(me?.verified_email && me?.verified_mobile);
}

export function claimKey(
  keyId: number,
  body: { founder_token?: string | null; code?: string | null },
  token?: string | null,
) {
  const payload: Record<string, string> = {};
  if (body.founder_token) payload.founder_token = body.founder_token;
  if (body.code) payload.code = body.code;
  return apiRequest<ClaimKeyResult, [number]>(
    memberEndpoints.claimKey,
    [keyId],
    payload,
    token ? { token } : {},
  );
}

export async function getMe(token?: string | null) {
  const raw = await apiRequest<MeRaw, []>(
    memberEndpoints.getMe,
    [],
    undefined,
    token ? { token } : {},
  );
  return normalizeMe(raw) || raw;
}

export async function patchMe(body: PatchMeBody) {
  const raw = await apiRequest<MeRaw, []>(memberEndpoints.patchMe, [], body);
  return normalizeMe(raw) || raw;
}

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function postMePhoto(file: File) {
  if (file.size > PHOTO_MAX_BYTES) {
    throw new ApiError(400, { error: "photo_too_large" });
  }
  if (file.type && !PHOTO_TYPES.has(file.type)) {
    throw new ApiError(400, { error: "invalid_photo" });
  }
  const form = new FormData();
  form.append("photo", file);
  const raw = await apiFormRequest<MeRaw, []>(memberEndpoints.postMePhoto, [], form);
  return normalizeMe(raw) || raw;
}

export async function deleteMePhoto() {
  const raw = await apiRequest<MeRaw, []>(memberEndpoints.deleteMePhoto, []);
  return normalizeMe(raw) || raw;
}

export function activateExplorer() {
  return apiRequest<ActivateResult, []>(memberEndpoints.activateExplorer, [], {});
}

export function getPassport() {
  return apiRequest<Passport, []>(memberEndpoints.getPassport, []);
}

export function patchPassport(theme: string) {
  return apiRequest<Passport, []>(memberEndpoints.patchPassport, [], {
    colors: { theme },
  });
}

export function patchCeremony(step: "summary" | "id" | "keys" | "hub") {
  return apiRequest<{ ceremony_step?: string }, []>(memberEndpoints.patchCeremony, [], {
    ceremony_step: step,
  });
}

export function getMirror() {
  return apiRequest<Mirror, []>(memberEndpoints.getMirror, []);
}

export function normalizeMembershipChoice(raw: unknown): MembershipChoice | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const nested = o.membership_choice;
  let tier: unknown;
  let period: unknown;
  let at: unknown;
  if (nested && typeof nested === "object") {
    const n = nested as Record<string, unknown>;
    tier = n.tier;
    period = n.billing_period;
    at = n.chosen_at;
  } else if (o.chosen_tier) {
    tier = o.chosen_tier;
    period = o.chosen_billing_period;
    at = o.chosen_at;
  } else {
    return null;
  }
  const t = String(tier || "").toLowerCase();
  let p = String(period || "").toLowerCase();
  if (t !== "explorer" && t !== "insider" && t !== "catalyst") return null;
  if (t === "explorer") {
    if (p && p !== "none") return null;
    p = "none";
  } else if (p !== "annual" && p !== "monthly") {
    return null;
  }
  return {
    tier: t,
    billing_period: p as MembershipChoice["billing_period"],
    chosen_at: at ? String(at) : null,
  };
}

export function isValidMembershipPackage(tier: string, billingPeriod: string) {
  const t = String(tier || "").toLowerCase();
  const b = String(billingPeriod || "").toLowerCase();
  if (t === "explorer" && b === "none") return true;
  if ((t === "insider" || t === "catalyst") && (b === "annual" || b === "monthly")) return true;
  return false;
}

export async function postMembershipChoice(tier: string, billingPeriod: string) {
  const t = String(tier || "").toLowerCase();
  const b = String(billingPeriod || "").toLowerCase();
  const raw = await apiRequest<Record<string, unknown>, []>(
    memberEndpoints.postMembershipChoice,
    [],
    { tier: t, billing_period: b },
  );
  if (!raw || raw.received !== true) {
    throw new ApiError(400, { error: "not_received" });
  }
  const choice = normalizeMembershipChoice(raw);
  if (!choice) {
    throw new ApiError(400, { error: "invalid_package" });
  }
  return {
    received: true as const,
    membership_choice: choice,
    tier: raw.tier != null ? String(raw.tier) : undefined,
    state: raw.state != null ? String(raw.state) : undefined,
  };
}
