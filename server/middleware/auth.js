const crypto = require('crypto');

function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function extractToken(req) {
  const auth = req.headers['authorization'];
  if (auth && auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  if (req.headers['x-api-key']) return String(req.headers['x-api-key']).trim();
  return null;
}

function requireApiKey(req, res, next) {
  const expected = process.env.OPENCLAW_API_KEY;
  if (!expected) {
    return res.status(503).json({
      error: 'Integration disabled',
      detail: 'Server is missing OPENCLAW_API_KEY in its environment.',
    });
  }
  const provided = extractToken(req);
  if (!provided || !timingSafeEqualStr(provided, expected)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = { requireApiKey };
