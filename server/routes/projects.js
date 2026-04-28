const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  res.json(db.get('projects'));
});

router.get('/:id', (req, res) => {
  const p = db.findOne('projects', r => r.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

router.post('/', (req, res) => {
  const { name, dot, description, client, budget, status, website, drive, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const row = db.insert('projects', {
    name, dot: dot || '#9ca3af',
    description: description || '', client: client || '',
    budget: budget || '', status: status || 'active',
    website: website || '', drive: drive || '', notes: notes || '',
  });
  res.json(row);
});

router.put('/:id', (req, res) => {
  const row = db.update('projects', req.params.id, req.body);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.delete('/:id', (req, res) => {
  db.delete('projects', req.params.id);
  res.json({ success: true });
});

module.exports = router;
