const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 60;

const buckets = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = buckets.get(ip);

  if (!entry || now - entry.start > WINDOW_MS) {
    buckets.set(ip, { start: now, count: 1 });
    return next();
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.start + WINDOW_MS - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Too many requests', retry_after_seconds: retryAfter });
  }
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, e] of buckets) if (now - e.start > WINDOW_MS) buckets.delete(ip);
}, WINDOW_MS).unref?.();

module.exports = { rateLimit };
