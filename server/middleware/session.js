const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'db_session';
const COOKIE_PATH = '/app';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) return null;
  return s;
}

function getPassword() {
  const p = process.env.APP_PASSWORD;
  if (!p) return null;
  return p;
}

function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function passwordMatches(provided) {
  const expected = getPassword();
  if (!expected || !provided) return false;
  return timingSafeEqualStr(provided, expected);
}

function issueSessionCookie(res, req) {
  const secret = getSecret();
  if (!secret) throw new Error('JWT_SECRET not configured');
  const token = jwt.sign({ sub: 'app' }, secret, { expiresIn: SESSION_TTL_SECONDS });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !!req.secure,
    path: COOKIE_PATH,
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
}

function clearSessionCookie(res, req) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !!req.secure,
    path: COOKIE_PATH,
  });
}

function readSession(req) {
  const secret = getSecret();
  if (!secret) return null;
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

function requireSession(req, res, next) {
  const secret = getSecret();
  if (!secret) {
    return res.status(503).json({
      error: 'Auth disabled',
      detail: 'Server is missing JWT_SECRET in its environment.',
    });
  }
  if (!getPassword()) {
    return res.status(503).json({
      error: 'Auth disabled',
      detail: 'Server is missing APP_PASSWORD in its environment.',
    });
  }
  if (!readSession(req)) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

module.exports = {
  COOKIE_NAME,
  passwordMatches,
  issueSessionCookie,
  clearSessionCookie,
  readSession,
  requireSession,
  isConfigured: () => !!(getSecret() && getPassword()),
};
