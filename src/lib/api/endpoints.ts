/**
 * Member API paths extracted from philia_socialfit/js/api.js.
 *
 * Two bases:
 *   socialfit → {NEXT_PUBLIC_PHILIA_API_BASE}  e.g. /api/socialfit
 *   auth      → {NEXT_PUBLIC_PHILIA_AUTH_BASE} e.g. /api
 *
 * Signal / Trust Graph results stay mocked — do not add a live path here.
 */

export type ApiBase = "socialfit" | "auth";
export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type Endpoint<Args extends unknown[] = []> = {
  method: HttpMethod;
  auth: boolean;
  base: ApiBase;
  /** Existing FE method name on window.api */
  client: string;
  path: (...args: Args) => string;
};

function socialfit<Args extends unknown[]>(
  method: HttpMethod,
  auth: boolean,
  client: string,
  path: (...args: Args) => string,
): Endpoint<Args> {
  return { method, auth, base: "socialfit", client, path };
}

function auth<Args extends unknown[]>(
  method: HttpMethod,
  needsAuth: boolean,
  client: string,
  path: (...args: Args) => string,
): Endpoint<Args> {
  return { method, auth: needsAuth, base: "auth", client, path };
}

/** Shared Philia JWT — not under /socialfit/. */
export const authEndpoints = {
  refreshSession: auth("POST", false, "refreshSession", () => "/auth/refresh/"),
} as const;

/** Public SocialFit routes (no JWT). */
export const publicEndpoints = {
  validateKeyCode: socialfit("POST", false, "validateKeyCode", () => "/keys/validate/"),
  submitKeyMirror: socialfit(
    "POST",
    false,
    "submitKeyMirror",
    (codeOrId: string) => `/keys/${encodeURIComponent(codeOrId)}/mirror/`,
  ),
  founderEmailStart: socialfit(
    "POST",
    false,
    "founderEmailStart",
    () => "/origins/founder/email/start/",
  ),
  founderEmailVerify: socialfit(
    "POST",
    false,
    "founderEmailVerify",
    () => "/origins/founder/email/verify/",
  ),
  founderClaimKey: socialfit(
    "POST",
    false,
    "founderClaimKey",
    () => "/origins/founder/claim-key/",
  ),
  sendOtp: socialfit("POST", false, "sendOtp", () => "/auth/otp/send/"),
  verifyOtp: socialfit("POST", false, "verifyOtp", () => "/auth/otp/verify/"),
  completeSignalDemo: socialfit(
    "POST",
    false,
    "completeSignalDemo",
    () => "/signal-demo/complete/",
  ),
} as const;

/** Member-authed SocialFit routes (Bearer access token). */
export const memberEndpoints = {
  claimKey: socialfit(
    "POST",
    true,
    "claimKey",
    (keyId: string | number) => `/keys/${encodeURIComponent(String(keyId))}/claim/`,
  ),
  getMe: socialfit("GET", true, "getMe", () => "/me/"),
  getMeStatus: socialfit("GET", true, "getMe", () => "/me/status/"),
  patchMe: socialfit("PATCH", true, "patchMe", () => "/me/"),
  postMembershipChoice: socialfit(
    "POST",
    true,
    "postMembershipChoice",
    () => "/me/membership-choice/",
  ),
  patchCeremony: socialfit("PATCH", true, "patchCeremony", () => "/me/ceremony/"),
  getStoryRead: socialfit("GET", true, "getStoryRead", () => "/me/story-read/"),
  saveStoryRead: socialfit("PATCH", true, "saveStoryRead", () => "/me/story-read/"),
  getNeighbourhoods: socialfit(
    "GET",
    true,
    "getNeighbourhoods",
    () => "/me/neighbourhoods/",
  ),
  activateExplorer: socialfit("POST", true, "activateExplorer", () => "/me/activate/"),
  getPassport: socialfit("GET", true, "getPassport", () => "/me/passport/"),
  patchPassport: socialfit("PATCH", true, "patchPassport", () => "/me/passport/"),
  getMirror: socialfit("GET", true, "getMirror", () => "/me/mirror/"),
  getMyKeys: socialfit("GET", true, "getMyKeys", () => "/me/keys/"),
  sendKey: socialfit(
    "POST",
    true,
    "sendKey",
    (keyId: string | number) => `/me/keys/${encodeURIComponent(String(keyId))}/send/`,
  ),
  getKeyRequests: socialfit(
    "GET",
    true,
    "getKeyRequests",
    () => "/me/keys/requests/",
  ),
  createKeyRequest: socialfit(
    "POST",
    true,
    "createKeyRequest",
    () => "/me/keys/requests/",
  ),
  postMePhoto: socialfit("POST", true, "postMePhoto", () => "/me/photo/"),
  deleteMePhoto: socialfit("DELETE", true, "deleteMePhoto", () => "/me/photo/"),
} as const;

export const endpoints = {
  ...authEndpoints,
  ...publicEndpoints,
  ...memberEndpoints,
} as const;
