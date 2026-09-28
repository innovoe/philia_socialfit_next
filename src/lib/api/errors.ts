export class ApiError extends Error {
  status: number;
  code: string;
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
    this.data = data;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
