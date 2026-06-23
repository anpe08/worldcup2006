// In-memory rate limiter. Resets on server restart, sufficient for a small LAN app.
const store = new Map();

/**
 * Returns true if the request is within limits, false if it should be blocked.
 * key        — unique string (e.g. "login:127.0.0.1")
 * max        — max attempts allowed in the window
 * windowMs   — sliding window in milliseconds
 */
export function checkRateLimit(key, max = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
  }
  entry.count += 1;
  store.set(key, entry);
  return entry.count <= max;
}

export function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
