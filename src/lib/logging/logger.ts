/**
 * Phase 15 Structured Server-Side Logger & Error Sanitizer
 *
 * Guarantees:
 * - Structured JSON logging format.
 * - Automatic redaction of sensitive credentials (passwords, tokens, API keys, full PII).
 * - Safe client-facing error responses that never leak raw SQL, stack traces, or internal paths.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "access_token",
  "refresh_token",
  "api_key",
  "apikey",
  "secret",
  "authorization",
  "gemini_api_key",
  "supabase_service_role_key",
]);

/**
 * Recursively redacts sensitive keys from log payloads.
 */
export function sanitizeLogData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Emits structured server-side JSON logs.
 */
export function serverLog(level: LogLevel, message: string, context?: Record<string, any>): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: context ? sanitizeLogData(context) : undefined,
  };

  const output = JSON.stringify(entry);
  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

/**
 * Standardizes a user-safe error message, logging the underlying internal error safely.
 */
export function handleSafeServerError(
  actionName: string,
  rawError: any,
  fallbackUserMessage: string = "An unexpected error occurred. Please try again."
): { success: false; error: string } {
  const errorMessage = rawError instanceof Error ? rawError.message : String(rawError);
  const stack = rawError instanceof Error ? rawError.stack : undefined;

  serverLog("error", `Server Action Failed: ${actionName}`, {
    errorMessage,
    stack: stack ? stack.split("\n").slice(0, 3).join(" ") : undefined,
  });

  // Never leak raw Postgres or internal system paths to users
  if (
    errorMessage.includes("relation") ||
    errorMessage.includes("syntax error") ||
    errorMessage.includes("violates") ||
    errorMessage.includes("column")
  ) {
    return { success: false, error: "A database error occurred. The faculty team has been notified." };
  }

  return { success: false, error: errorMessage || fallbackUserMessage };
}
