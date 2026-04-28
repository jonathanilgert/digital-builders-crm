const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { user, month, year } = req.query;
  let rows = db.get('work_hours');
  if (user) rows = rows.filter(r => r.user_name === user);
  if (month && year) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    rows = rows.filter(r => r.date && r.date.startsWith(prefix));
  }
  rows.sort((a, b) => (b.date + (b.clock_in || '')).localeCompare(a.date + (a.clock_in || '')));
  res.json(rows);
});

router.post('/clock-in', (req, res) => {
  const { user_name } = req.body;
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().substring(0, 5);

  const existing = db.findOne('work_hours', r => r.user_name === user_name && r.date === date && !r.clock_out);
  if (existing) return res.status(400).json({ error: 'Already clocked in today' });

  const row = db.insert('work_hours', { user_name, date, clock_in: time, clock_out: null, notes: null });
  res.json(row);
});

router.post('/clock-out', (req, res) => {
  const { user_name } = req.body;
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().substring(0, 5);

  const entry = db.findOne('work_hours', r => r.user_name === user_name && r.date === date && !r.clock_out);
  if (!entry) return res.status(400).json({ error: 'Not clocked in' });

  const row = db.update('work_hours', entry.id, { clock_out: time });
  res.json(row);
});

router.post('/manual', (req, res) => {
  const { user_name, date, clock_in, clock_out, notes } = req.body;
  if (!date || !clock_in || !clock_out) return res.status(400).json({ error: 'Date, start and end time are required' });
  const row = db.insert('work_hours', { user_name: user_name || 'Alex', date, clock_in, clock_out, notes: notes || null });
  res.json(row);
});

router.delete('/:id', (req, res) => {
  db.delete('work_hours', req.params.id);
  res.json({ success: true });
});

module.exports = router;
