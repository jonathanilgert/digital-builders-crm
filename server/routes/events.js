const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { month, year } = req.query;
  let events = db.get('events');
  if (month && year) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    events = events.filter(e => e.date && e.date.startsWith(prefix));
  }
  events.sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  res.json(events);
});

router.post('/', (req, res) => {
  const { title, date, time, description } = req.body;
  const event = db.insert('events', { title, date, time: time || null, description: description || null });
  res.json(event);
});

router.delete('/:id', (req, res) => {
  db.delete('events', req.params.id);
  res.json({ success: true });
});

module.exports = router;
