const express = require('express');
const router = express.Router();
const db = require('../db');
const { findProject } = require('../lib/projects');

function decorate(a, projectsById) {
  const p = a.project_id != null ? projectsById.get(Number(a.project_id)) : null;
  return { ...a, project_color: a.color || (p && p.dot) || null };
}

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
  const projectsById = new Map(db.get('projects').map(p => [p.id, p]));
  res.json(rows.slice(0, max).map(a => decorate(a, projectsById)));
});

module.exports = router;
