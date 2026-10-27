import { apiRequest } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { publicEndpoints } from "@/lib/api/endpoints";
import { hasAccess, readSession, writeSession, type EntryPath } from "@/lib/session";
import { routes } from "@/lib/routes";

export type CampaignUserType = "founder" | "member";
export type ReferredBy = "system" | "person";

type CampaignFields = {
  user_type?: CampaignUserType | string | null;
  referred_by?: ReferredBy | string | null;
};

export type FounderEmailStart = CampaignFields & { ok?: boolean; sent?: boolean };

export type FounderEmailVerify = CampaignFields & {
  ok?: boolean;
  email?: string;
  founder_token: string;
};

export type FounderClaimKey = CampaignFields & {
  ok?: boolean;
  email?: string | null;
  key_id: number;
  already?: boolean;
  claim_deadline?: string | null;
  code?: string | null;
  phone_verified?: boolean;
  phone_mask?: string;
};

/** Only apply when BE names the type. Do not guess founder. */
export function campaignSessionPatch(payload: CampaignFields | null | undefined): {
  entryPath: EntryPath;
  keysToTheCity: boolean;
} | null {
  const type = String(payload?.user_type || "").toLowerCase();
  if (type === "member") return { entryPath: "consumer", keysToTheCity: false };
  if (type === "founder") return { entryPath: "founder", keysToTheCity: true };
  return null;
}

export function applyCampaignToSession(payload: CampaignFields | null | undefined) {
  const next = campaignSessionPatch(payload);
  if (!next) return readSession();
  return writeSession(next);
}

export function emailGateHref() {
  return readSession().emailGate === "enter" ? routes.enter : routes.origins;
}

export type FounderKeyExpired = {
  canRequest: boolean;
  requested: boolean;
  issuesAt: string | null;
};

export type FounderKeyRequest = {
  ok?: boolean;
  requested?: boolean;
  already?: boolean;
  issues_at?: string | null;
};

export function founderEmailStart(email: string) {
  return apiRequest<FounderEmailStart, []>(
    publicEndpoints.founderEmailStart,
    [],
    { email },
  );
}

export function founderEmailVerify(email: string, code: string) {
  return apiRequest<FounderEmailVerify, []>(
    publicEndpoints.founderEmailVerify,
    [],
    { email, code },
  );
}

function founderTokenBody(founderToken?: string | null) {
  const body: Record<string, string> = {};
  if (founderToken) body.founder_token = founderToken;
  return body;
}

function founderAuth() {
  return hasAccess() ? { auth: true } : {};
}

export function founderClaimKey(founderToken?: string | null) {
  return apiRequest<FounderClaimKey, []>(
    publicEndpoints.founderClaimKey,
    [],
    founderTokenBody(founderToken),
    founderAuth(),
  );
}

export function founderRequestKey(founderToken?: string | null) {
  return apiRequest<FounderKeyRequest, []>(
    publicEndpoints.founderRequestKey,
    [],
    founderTokenBody(founderToken),
    founderAuth(),
  );
}

export function readFounderKeyExpired(err: unknown): FounderKeyExpired | null {
  if (!isApiError(err) || err.code !== "founder_key_expired") return null;
  const data = err.data && typeof err.data === "object" ? (err.data as Record<string, unknown>) : {};
  return {
    canRequest: data.can_request === true,
    requested: data.requested === true,
    issuesAt: typeof data.issues_at === "string" && data.issues_at.trim() ? data.issues_at : null,
  };
}

export function formatFounderKeyIssueAt(iso: string | null | undefined) {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function readClaimPhone(result: FounderClaimKey | null | undefined) {
  const raw = result?.phone_verified as unknown;
  return {
    phoneVerified: raw === true || raw === 1 || raw === "true" || raw === "1",
    phoneMask: typeof result?.phone_mask === "string" ? result.phone_mask : "",
  };
}

export function mapOriginsError(code: string) {
  if (code === "invalid_email") return "Enter a valid email.";
  if (code === "unknown_email") return "This email isn’t on the First Wave list.";
  if (code === "throttled" || code === "rate_limited" || code === "http_429") {
    return "Too many attempts — wait a moment.";
  }
  if (code === "email_send_failed" || code === "http_503") {
    return "Could not send the code — try again.";
  }
  if (code === "invalid_code") return "That code looks wrong — try again.";
  if (code === "founder_token_required") return "Verify your email first.";
  if (
    code === "founder_token_invalid" ||
    code === "expired" ||
    code === "founder_token_expired"
  ) {
    return "Email verification expired — start again.";
  }
  if (code === "phone_taken") return "This number is already taken.";
  if (code === "email_taken") return "This email is already taken.";
  if (code === "already_member") return "You're already on SocialFit. Log in instead.";
  if (code === "key_expired") return "That Key window closed. Claim a Key again.";
  if (code === "founder_key_expired") {
    return "Your Founder Key window closed after 24 hours.";
  }
  if (code === "key_not_expired") return "Your Founder Key is still open — claim it instead.";
  return "Could not continue — try again.";
}

export function isValidEmail(value: string) {
  const v = value.trim();
  return v.includes("@") && v.includes(".");
}
