export type ErrorCode =
  | "bad_request"
  | "unauthorized"
  | "not_found"
  | "conflict"
  | "version_conflict"
  | "slug_taken"
  | "validation_failed"
  | "rate_limited"
  | "unavailable"
  | "internal";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (what = "Resource") => new AppError(404, "not_found", `${what} not found`);
export const unauthorized = (msg = "Authentication required") => new AppError(401, "unauthorized", msg);
export const badRequest = (msg: string, details?: unknown) => new AppError(400, "bad_request", msg, details);
export const invalid = (msg: string, details?: unknown) => new AppError(422, "validation_failed", msg, details);
