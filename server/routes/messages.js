const express = require('express');
const db = require('../db');

const HUMAN_SENDERS = ['Jonathan', 'Alex'];
const AGENT_SENDERS = ['Hubert', 'Nicholas', 'Constance'];
const ALL_SENDERS   = [...HUMAN_SENDERS, ...AGENT_SENDERS];

const MAX_TEXT = 4000;
const MAX_LIST = 500;

function shape(m) {
  return {
    id:         m.id,
    sender:     m.sender,
    text:       m.text,
    created_at: m.created_at,
  };
}

function listMessages(req, res) {
  const since = req.query.since ? Number(req.query.since) : null;
  const limit = Math.min(Number(req.query.limit) || 200, MAX_LIST);
  let rows = db.get('messages').slice();
  if (since && Number.isFinite(since)) rows = rows.filter(m => m.id > since);
  rows.sort((a, b) => a.id - b.id);
  if (rows.length > limit) rows = rows.slice(-limit);
  res.json(rows.map(shape));
}

function postMessage(allowedSenders) {
  return (req, res) => {
    const body = req.body || {};
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const sender = typeof body.sender === 'string' ? body.sender.trim() : '';

    if (!text) return res.status(400).json({ error: 'text is required' });
    if (text.length > MAX_TEXT) return res.status(400).json({ error: `text exceeds ${MAX_TEXT} chars` });
    if (!allowedSenders.includes(sender)) {
      return res.status(400).json({ error: `sender must be one of ${allowedSenders.join(', ')}` });
    }

    const row = db.insert('messages', { sender, text });
    res.status(201).json(shape(row));
  };
}

// Human router — sender must be Jonathan or Alex
const humanRouter = express.Router();
humanRouter.get('/', listMessages);
humanRouter.post('/', postMessage(HUMAN_SENDERS));

// Agent router — sender is forced to req.agent so an agent can't impersonate
// the other agent or a human even if it asks. Body sender is ignored.
const agentRouter = express.Router();
agentRouter.get('/', listMessages);
agentRouter.post('/', (req, res) => {
  const body = req.body || {};
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) return res.status(400).json({ error: 'text is required' });
  if (text.length > MAX_TEXT) return res.status(400).json({ error: `text exceeds ${MAX_TEXT} chars` });
  if (!AGENT_SENDERS.includes(req.agent)) {
    return res.status(403).json({ error: 'Unknown agent identity' });
  }
  const row = db.insert('messages', { sender: req.agent, text });
  res.status(201).json(shape(row));
});

module.exports = { humanRouter, agentRouter, HUMAN_SENDERS, AGENT_SENDERS, ALL_SENDERS };
