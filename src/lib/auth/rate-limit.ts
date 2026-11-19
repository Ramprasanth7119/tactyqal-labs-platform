// Tiny fixed-window in-memory limiter. Per-instance only: fine for a login form,
// swap for Redis/Upstash if you run many instances.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  b.count++;
  return { allowed: b.count <= limit, retryAfterSeconds: Math.ceil((b.resetAt - now) / 1000) };
}

export function resetRateLimits() {
  buckets.clear();
}
