const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const tasks = db.get('tasks').sort((a, b) => b.id - a.id);
  res.json(tasks);
});

router.post('/', (req, res) => {
  const { title, description, assignee, status, priority, due_date, project } = req.body;
  const task = db.insert('tasks', {
    title,
    description: description || null,
    assignee: assignee || 'Unassigned',
    status: status || 'todo',
    priority: priority || 'medium',
    due_date: due_date || null,
    project: project || null,
  });
  res.json(task);
});

router.put('/:id', (req, res) => {
  const { title, description, assignee, status, priority, due_date, project } = req.body;
  const archived_at = status === 'archived' ? (db.findOne('tasks', r => r.id === Number(req.params.id))?.archived_at || new Date().toISOString()) : null;
  const task = db.update('tasks', req.params.id, { title, description, assignee, status, priority, due_date, project, archived_at });
  if (!task) return res.status(404).json({ error: 'Not found' });
  res.json(task);
});

router.delete('/:id', (req, res) => {
  db.delete('tasks', req.params.id);
  res.json({ success: true });
});

module.exports = router;
