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

// Multi-agent: each agent has its own API key, but they get the same access surface.
// Env-var name => display name surfaced as req.agent (used to tag activity rows etc.)
const AGENT_KEYS = [
  { env: 'OPENCLAW_API_KEY',  name: 'Hubert'    },
  { env: 'NICHOLAS_API_KEY',  name: 'Nicholas'  },
  { env: 'CONSTANCE_API_KEY', name: 'Constance' },
];

function configuredAgents() {
  return AGENT_KEYS.filter(a => !!process.env[a.env]);
}

function requireApiKey(req, res, next) {
  const agents = configuredAgents();
  if (agents.length === 0) {
    return res.status(503).json({
      error: 'Integration disabled',
      detail: 'Server has no agent API keys configured (set OPENCLAW_API_KEY, NICHOLAS_API_KEY, and/or CONSTANCE_API_KEY).',
    });
  }
  const provided = extractToken(req);
  if (!provided) return res.status(401).json({ error: 'Unauthorized' });

  for (const { env, name } of agents) {
    if (timingSafeEqualStr(provided, process.env[env])) {
      req.agent = name;
      return next();
    }
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { requireApiKey, AGENT_KEYS, configuredAgents };
