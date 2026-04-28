const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const tasks = db.get('tasks').sort((a, b) => b.id - a.id);
  res.json(tasks);
});

router.post('/', (req, res) => {
  const { title, description, assignee, status, priority, due_date } = req.body;
  const task = db.insert('tasks', {
    title,
    description: description || null,
    assignee: assignee || 'Unassigned',
    status: status || 'todo',
    priority: priority || 'medium',
    due_date: due_date || null,
  });
  res.json(task);
});

router.put('/:id', (req, res) => {
  const { title, description, assignee, status, priority, due_date } = req.body;
  const task = db.update('tasks', req.params.id, { title, description, assignee, status, priority, due_date });
  if (!task) return res.status(404).json({ error: 'Not found' });
  res.json(task);
});

router.delete('/:id', (req, res) => {
  db.delete('tasks', req.params.id);
  res.json({ success: true });
});

module.exports = router;
