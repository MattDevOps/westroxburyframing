/**
 * Simple in-memory rate limiter for API routes.
 * Tracks requests by IP address with a sliding window.
 *
 * Note: In a multi-instance deployment, each serverless function
 * has its own memory, so this is per-instance. For most use cases
 * (preventing spam/abuse) this is sufficient.
 */

const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key);
  }
}, 60_000);

export function rateLimit(opts: {
  /** Max requests allowed in the window */
  limit?: number;
  /** Window size in seconds */
  windowSeconds?: number;
} = {}) {
  const limit = opts.limit ?? 10;
  const windowMs = (opts.windowSeconds ?? 60) * 1000;

  return {
    /**
     * Check if the request should be allowed.
     * @param identifier - typically the IP address
     * @returns { allowed: boolean; remaining: number }
     */
    check(identifier: string): { allowed: boolean; remaining: number } {
      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry || entry.resetAt < now) {
        store.set(identifier, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1 };
      }

      if (entry.count >= limit) {
        return { allowed: false, remaining: 0 };
      }

      entry.count++;
      return { allowed: true, remaining: limit - entry.count };
    },
  };
}

/**
 * Extract a client identifier from a request.
 * Uses Vercel's forwarded IP, then standard headers, then falls back.
 */
export function getClientIp(req: Request): string {
  const headers = new Headers(req.headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
