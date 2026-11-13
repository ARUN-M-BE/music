import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code = "request_failed", details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const unauthorized = (message = "Authentication required") =>
  new HttpError(401, message, "unauthenticated");
export const forbidden = (message = "Insufficient privileges") =>
  new HttpError(403, message, "forbidden");
export const badRequest = (message = "Invalid request", details?: unknown) =>
  new HttpError(400, message, "invalid_request", details);
export const notFound = (message = "Resource not found") =>
  new HttpError(404, message, "not_found");
export const tooManyRequests = (message = "Too many requests, please slow down") =>
  new HttpError(429, message, "rate_limited");

export function jsonOk<T extends Record<string, unknown>>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, ...data }, init);
}

export function jsonFail(status: number, message: string, code = "request_failed", details?: unknown) {
  return NextResponse.json({ success: false, message, code, ...(details ? { details } : {}) }, {
    status,
  });
}

/**
 * Converts any thrown value into a safe JSON response.
 * Internal error messages are logged server-side, never returned to clients.
 */
export function toErrorResponse(error: unknown, scope: string): NextResponse {
  if (error instanceof HttpError) {
    return jsonFail(error.status, error.message, error.code, error.details);
  }

  if (error instanceof ZodError) {
    return jsonFail(400, "Validation failed", "validation_error", {
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  console.error(`[api:${scope}]`, error);
  return jsonFail(500, "An unexpected error occurred", "internal_error");
}

/** Wraps a route handler so no stack trace or driver message can leak. */
export function route<Args extends unknown[]>(
  scope: string,
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return toErrorResponse(error, scope);
    }
  };
}
