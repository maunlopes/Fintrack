/**
 * Simple in-memory rate limiter.
 * Works per serverless instance (not shared across Vercel workers).
 * Good enough to stop scripted attacks; upgrade to Redis for full protection.
 */
const store = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true if the request is allowed, false if rate limit exceeded.
 * @param key   Unique identifier (IP address or email)
 * @param limit Max requests per window (default: 10)
 * @param windowMs Window duration in ms (default: 60s)
 */
export function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) return false;

  record.count++;
  return true;
}
