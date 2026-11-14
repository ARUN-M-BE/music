/**
 * Thrown values are `unknown`, not `any`: the platform throws `DOMException`,
 * Firebase throws plain objects carrying a `code`, and a rejected promise can
 * reject with a string. These helpers read a field safely, so call sites never
 * have to assert a type to get at an error message.
 */
export function errorField(error: unknown, field: "name" | "code" | "message"): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const value = (error as Record<string, unknown>)[field];
  return typeof value === "string" ? value : undefined;
}

/** The error's own message when it has one, otherwise the caller's fallback. */
export function errorMessage(error: unknown, fallback: string): string {
  return errorField(error, "message") || fallback;
}
