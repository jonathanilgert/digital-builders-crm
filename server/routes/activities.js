const express = require('express');
const router = express.Router();
const db = require('../db');
const { findProject } = require('../lib/projects');

router.get('/', (req, res) => {
  const { project, project_id, source, type, limit } = req.query;
  let rows = db.get('activities');

  if (project || project_id) {
    const p = findProject({ project, project_id });
    if (!p) return res.json([]);
    rows = rows.filter(r => r.project_id === p.id);
  }
  if (source) rows = rows.filter(r => r.source === source);
  if (type)   rows = rows.filter(r => r.type === type);

  rows.sort((a, b) => (b.completed_at || b.created_at).localeCompare(a.completed_at || a.created_at));

  const max = Math.min(Number(limit) || 100, 500);
  res.json(rows.slice(0, max));
});

module.exports = router;
