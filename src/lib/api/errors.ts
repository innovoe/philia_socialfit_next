export type RefusalNext = "login" | "taken" | "";

export type ApiRefusal = {
  code: string;
  next: RefusalNext;
  message: string;
};

function bodyField(data: unknown, key: string) {
  if (!data || typeof data !== "object" || !(key in data)) return "";
  const value = (data as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

function asNext(value: string): RefusalNext {
  return value === "login" || value === "taken" ? value : "";
}

export class ApiError extends Error {
  status: number;
  code: string;
  next: RefusalNext;
  detail: string;
  data: unknown;

  constructor(status: number, data: unknown, fallback = "request_failed") {
    const code =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error || fallback)
        : fallback;
    super(code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.next = asNext(bodyField(data, "next"));
    this.detail = bodyField(data, "message");
    this.data = data;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function readApiRefusal(err: unknown): ApiRefusal {
  if (isApiError(err)) {
    return { code: err.code, next: err.next, message: err.detail };
  }
  if (err instanceof Error) return { code: err.message, next: "", message: "" };
  return { code: "", next: "", message: "" };
}

export function refusalLine(err: unknown, fallback: (code: string) => string) {
  const r = readApiRefusal(err);
  if (r.message) return r.message;
  if (r.next === "login") {
    if (r.code === "phone_taken") return "This number is already on SocialFit. Log in instead.";
    return "You're already on SocialFit. Log in instead.";
  }
  if (r.code === "phone_taken") return "This number is already taken.";
  if (r.code === "email_taken") return "This email is already taken.";
  if (r.code === "already_member") return "You're already on SocialFit. Log in instead.";
  return fallback(r.code);
}

export function refusalGoesToLogin(err: unknown) {
  const r = readApiRefusal(err);
  return r.next === "login" || (r.next === "" && r.code === "already_member");
}
