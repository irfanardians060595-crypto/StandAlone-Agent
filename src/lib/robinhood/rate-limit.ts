type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Lightweight per-process guard for development/self-hosted single-instance use.
 * Production deployments should also add provider/edge rate limiting because
 * memory-based counters are not shared across serverless instances.
 */
export function checkRobinhoodRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs = 60_000,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown-client";
  const key = `${scope}:${ip.slice(0, 80)}`;

  // Keep memory bounded; prune expired buckets and cap the map under random-key abuse.
  if (buckets.size > 5_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
    if (buckets.size > 5_000) buckets.clear();
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  current.count += 1;
  if (current.count <= limit) return { allowed: true, retryAfterSeconds: 0 };
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}
