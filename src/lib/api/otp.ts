import { apiRequest } from "@/lib/api/client";
import { publicEndpoints } from "@/lib/api/endpoints";
import { normalizeUaePhone } from "@/lib/api/phone";

export type SendOtpPayload = {
  phone?: string;
  key_id?: number | null;
  founder_token?: string | null;
  email?: string;
};

export type SendOtpResult = {
  sent?: boolean;
  email_required?: boolean;
  phone_mask?: string;
};

export type OtpSendMode = {
  emailRequired: boolean;
  phoneMask: string;
};

export type VerifyOtpPayload = {
  phone?: string;
  phone_code?: string;
  key_id?: number | null;
  founder_token?: string | null;
  email?: string;
  email_code?: string;
};

export type VerifyOtpResult = {
  access: string;
  refresh?: string;
  user_id?: number;
};

function withNormalizedPhone<
  T extends {
    phone?: string;
    founder_token?: string | null;
    key_id?: number | null;
    email_code?: string;
    phone_code?: string;
  },
>(payload: T): T {
  const body = { ...payload };
  if (body.founder_token) {
    delete (body as { email?: string }).email;
    delete (body as { email_code?: string }).email_code;
  }
  if (body.phone) {
    const n = normalizeUaePhone(body.phone);
    if (!n) {
      const err = new Error("invalid_phone") as Error & { status: number; data: { error: string } };
      err.status = 400;
      err.data = { error: "invalid_phone" };
      throw err;
    }
    body.phone = n;
  } else {
    delete body.phone;
  }
  if (!body.email_code) delete (body as { email_code?: string }).email_code;
  if (!body.phone_code) delete (body as { phone_code?: string }).phone_code;
  if (body.key_id == null) delete body.key_id;
  return body;
}

export function readOtpSend(result: SendOtpResult | null | undefined): OtpSendMode {
  return {
    emailRequired: result?.email_required !== false,
    phoneMask: typeof result?.phone_mask === "string" ? result.phone_mask : "",
  };
}

export function sendOtp(payload: SendOtpPayload) {
  return apiRequest<SendOtpResult, []>(
    publicEndpoints.sendOtp,
    [],
    withNormalizedPhone(payload),
  );
}

export function verifyOtp(payload: VerifyOtpPayload) {
  return apiRequest<VerifyOtpResult, []>(
    publicEndpoints.verifyOtp,
    [],
    withNormalizedPhone(payload),
  );
}

export function mapOtpError(code: string) {
  if (code === "invalid_phone") return "Use a UAE mobile (+9715…).";
  if (code === "invalid_email") return "Enter a valid email.";
  if (code === "otp_invalid" || code === "invalid_code") return "That code looks wrong — try again.";
  if (code === "otp_expired") return "Code expired — resend and try again.";
  if (code === "rate_limited" || code === "throttled" || code === "http_429") {
    return "Too many attempts — wait a moment.";
  }
  if (code === "not_key_owner") return "This Key isn’t available to claim.";
  if (code === "code_required") return "Re-enter your Key code, then try again.";
  if (code === "code_mismatch") return "This Key doesn’t match the code you entered.";
  if (code === "already_claimed" || code === "key_already_claimed" || code === "claimed") {
    return "This Key was already claimed. Ask for a fresh opened code.";
  }
  if (code === "phone_taken") return "This number is already taken.";
  if (code === "email_taken") return "This email is already taken.";
  if (code === "already_member") return "You're already on SocialFit. Log in instead.";
  if (code === "key_expired" || code === "expired") return "This Key’s claim window has closed.";
  if (
    code === "founder_token_invalid" ||
    code === "founder_token_expired" ||
    code === "founder_token_required"
  ) {
    return "Email verification expired — start again.";
  }
  if (code === "finish_expired") return "This Key’s finish window has closed.";
  if (code === "invalid_key" || code === "not_found") {
    return "This Key can’t be claimed — it may be used or unopened.";
  }
  if (code === "own_key") {
    return "You’re signed in as the person who sent this Key. Log out, then open the invite as the friend.";
  }
  if (code === "invalid_state") {
    return "This Key isn’t waiting to be claimed. It may already be claimed, still unsent, or activated. The countdown can still look open.";
  }
  if (code === "claim_failed") {
    return "This Key can’t be claimed from this account. Log out and open the invite as the friend — or the Key is no longer waiting to be claimed.";
  }
  return "Could not continue — try again.";
}
