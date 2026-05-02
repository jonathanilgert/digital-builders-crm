const express = require('express');
const router = express.Router();

const {
  passwordMatches,
  issueSessionCookie,
  clearSessionCookie,
  readSession,
  isConfigured,
} = require('../middleware/session');

const loginAttempts = new Map();
const ATTEMPT_WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 10;

function tooManyAttempts(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.start > ATTEMPT_WINDOW_MS) {
    loginAttempts.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, e] of loginAttempts) {
    if (now - e.start > ATTEMPT_WINDOW_MS) loginAttempts.delete(ip);
  }
}, ATTEMPT_WINDOW_MS).unref?.();

router.get('/me', (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Auth disabled', detail: 'Server is missing JWT_SECRET or APP_PASSWORD.' });
  }
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ ok: true });
});

router.post('/login', (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Auth disabled', detail: 'Server is missing JWT_SECRET or APP_PASSWORD.' });
  }
  const ip = req.ip || 'unknown';
  if (tooManyAttempts(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in a minute.' });
  }
  const { password } = req.body || {};
  if (typeof password !== 'string' || !passwordMatches(password)) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  issueSessionCookie(res, req);
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  clearSessionCookie(res, req);
  res.json({ ok: true });
});

module.exports = router;
