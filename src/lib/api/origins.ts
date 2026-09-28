import { apiRequest } from "@/lib/api/client";
import { publicEndpoints } from "@/lib/api/endpoints";

export type FounderEmailStart = { ok?: boolean; sent?: boolean };

export type FounderEmailVerify = {
  ok?: boolean;
  email?: string;
  founder_token: string;
};

export type FounderClaimKey = {
  ok?: boolean;
  email?: string | null;
  key_id: number;
  already?: boolean;
  claim_deadline?: string | null;
  code?: string | null;
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

export function founderClaimKey(founderToken: string) {
  return apiRequest<FounderClaimKey, []>(
    publicEndpoints.founderClaimKey,
    [],
    { founder_token: founderToken },
  );
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
  if (code === "already_member") return "You’re already on SocialFit — log in instead.";
  if (code === "key_expired") return "That Key window closed. Claim a Key again.";
  return "Could not continue — try again.";
}

export function isValidEmail(value: string) {
  const v = value.trim();
  return v.includes("@") && v.includes(".");
}
