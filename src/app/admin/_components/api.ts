"use client";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

/** Thin fetch wrapper for the admin UI. It talks to the public REST API using the session cookie. */
export async function api<T = unknown>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<{ data: T; meta: Record<string, unknown> }> {
  const { body, headers, ...rest } = init;
  const res = await fetch(`/api/v1${path}`, {
    credentials: "same-origin",
    ...rest,
    headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/auth/login")) {
      window.location.href = "/admin/login";
    }
    const e = json?.error;
    throw new ApiError(res.status, e?.code ?? "error", e?.message ?? `Request failed (${res.status})`, e?.details);
  }
  return { data: json.data as T, meta: json.meta ?? {} };
}

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
