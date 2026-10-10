import { env } from "@/lib/env";
import { ApiError } from "@/lib/api/errors";
import type { ApiBase, Endpoint } from "@/lib/api/endpoints";
import { expireDeadSession, isDeadAccessError } from "@/lib/expire";
import { readSession } from "@/lib/session";

function baseUrl(base: ApiBase) {
  return base === "auth" ? env.authBase : env.apiBase;
}

function endpointUrl<Args extends unknown[]>(
  endpoint: Endpoint<Args>,
  ...args: Args
) {
  return `${baseUrl(endpoint.base)}${endpoint.path(...args)}`;
}

type RequestOpts = {
  auth?: boolean;
  token?: string | null;
};

async function parseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: "invalid_json", raw: text };
  }
}

export async function apiRequest<T, Args extends unknown[] = []>(
  endpoint: Endpoint<Args>,
  args: Args,
  body?: unknown,
  opts: RequestOpts = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const needAuth = opts.auth ?? endpoint.auth;
  if (needAuth) {
    const token = opts.token ?? readSession().access;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(endpointUrl(endpoint, ...args), {
    method: endpoint.method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  });

  const data = await parseBody(res);
  if (!res.ok) {
    const err = new ApiError(res.status, data, `http_${res.status}`);
    if (needAuth && isDeadAccessError(err)) expireDeadSession();
    throw err;
  }
  return data as T;
}

/** Multipart — do not set Content-Type; the browser adds the boundary. */
export async function apiFormRequest<T, Args extends unknown[] = []>(
  endpoint: Endpoint<Args>,
  args: Args,
  form: FormData,
  opts: RequestOpts = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const needAuth = opts.auth ?? endpoint.auth;
  if (needAuth) {
    const token = opts.token ?? readSession().access;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(endpointUrl(endpoint, ...args), {
    method: endpoint.method,
    headers,
    body: form,
  });

  const data = await parseBody(res);
  if (!res.ok) {
    const err = new ApiError(res.status, data, `http_${res.status}`);
    if (needAuth && isDeadAccessError(err)) expireDeadSession();
    throw err;
  }
  return data as T;
}

export function apiBase() {
  return env.apiBase;
}
