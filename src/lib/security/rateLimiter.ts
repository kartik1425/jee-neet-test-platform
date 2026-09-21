/**
 * Phase 15 Security & Layered Abuse Protection Utilities
 *
 * Architecture Note on Rate Limiting:
 * In a serverless / Vercel deployment, function instances scale dynamically.
 * Therefore, rate limiting operates in multiple defensive layers:
 * 1. Edge / WAF Layer: Vercel Firewall / WAF rules for volumetric network & IP protection.
 * 2. Auth / RBAC Layer: Server-side token validation and role permissions.
 * 3. App Layer: Database-level timestamp / cooldown checks for expensive operations.
 * 4. Process-Local Limiter: An in-memory token bucket used ONLY as a best-effort per-instance
 *    optimization to dampen burst traffic, NOT as a global security boundary.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store (best-effort per function instance)
const instanceStore = new Map<string, RateLimitRecord>();

/**
 * Best-effort process-local rate limiter.
 * Dampens instant request spikes within a single running instance.
 */
export function checkInMemoryRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 30, windowMs: 60000 }
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const record = instanceStore.get(key);

  if (!record || now >= record.resetAt) {
    instanceStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { allowed: true, remaining: config.maxRequests - 1, resetInMs: config.windowMs };
  }

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, record.resetAt - now),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetInMs: Math.max(0, record.resetAt - now),
  };
}

/**
 * Validates bounded string payload sizes to protect AI endpoints and ingestion
 * from memory exhaustion attacks.
 */
export function validateBoundedPayload(
  payload: string,
  maxSizeBytes: number = 2 * 1024 * 1024 // 2MB default limit
): { valid: boolean; sizeBytes: number; error?: string } {
  if (!payload) return { valid: true, sizeBytes: 0 };
  const sizeBytes = Buffer.byteLength(payload, "utf-8");
  if (sizeBytes > maxSizeBytes) {
    return {
      valid: false,
      sizeBytes,
      error: `Payload size (${(sizeBytes / 1024).toFixed(1)} KB) exceeds maximum allowed limit (${(
        maxSizeBytes / 1024
      ).toFixed(1)} KB).`,
    };
  }
  return { valid: true, sizeBytes };
}
