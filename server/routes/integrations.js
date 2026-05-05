const express = require('express');
const router = express.Router();
const db = require('../db');
const { findProject } = require('../lib/projects');
const { slugify } = require('../lib/slugify');

const ALLOWED_STATUSES = ['done', 'failed', 'in_progress', 'scheduled'];
const MAX_TITLE = 500;
const MAX_DESC = 5000;
const MAX_REF = 200;
const MAX_TYPE = 50;
const MAX_SOURCE = 50;
const MAX_COLOR = 32;

function projectById(id) {
  if (id == null) return null;
  return db.findOne('projects', p => p.id === Number(id));
}

function projectByName(name) {
  if (!name) return null;
  return findProject({ project: name });
}

function decorateActivity(a) {
  const p = projectById(a.project_id);
  return { ...a, project_color: a.color || (p && p.dot) || null };
}

function shapeTask(t) {
  const p = projectByName(t.project);
  return {
    id:           t.id,
    title:        t.title,
    description:  t.description || null,
    assignee:     t.assignee || null,
    status:       t.status,
    priority:     t.priority || null,
    due_date:     t.due_date || null,
    project_id:   p ? p.id : null,
    project_name: p ? p.name : (t.project || null),
    project_color: p ? p.dot : null,
    claimed_by:   t.claimed_by || null,
    claimed_at:   t.claimed_at || null,
    completed_at: t.completed_at || null,
    completion:   t.completion || null,
    created_at:   t.created_at,
  };
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function validIso(s) {
  if (typeof s !== 'string') return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

function validateActivity(body) {
  const errs = [];
  if (body.project == null && body.project_id == null) errs.push('project or project_id is required');
  if (typeof body.title !== 'string' || !body.title.trim()) errs.push('title is required');
  else if (body.title.length > MAX_TITLE) errs.push(`title exceeds ${MAX_TITLE} chars`);
  if (body.description != null && (typeof body.description !== 'string' || body.description.length > MAX_DESC)) {
    errs.push(`description must be a string up to ${MAX_DESC} chars`);
  }
  if (body.type != null && (typeof body.type !== 'string' || body.type.length > MAX_TYPE)) errs.push(`type must be a string up to ${MAX_TYPE} chars`);
  if (body.source != null && (typeof body.source !== 'string' || body.source.length > MAX_SOURCE)) errs.push(`source must be a string up to ${MAX_SOURCE} chars`);
  if (body.external_ref != null && (typeof body.external_ref !== 'string' || body.external_ref.length > MAX_REF)) errs.push(`external_ref must be a string up to ${MAX_REF} chars`);
  if (body.status != null && !ALLOWED_STATUSES.includes(body.status)) errs.push(`status must be one of ${ALLOWED_STATUSES.join(', ')}`);
  if (body.completed_at != null && !validIso(body.completed_at)) errs.push('completed_at must be an ISO 8601 timestamp');
  if (body.metadata != null && !isPlainObject(body.metadata)) errs.push('metadata must be a JSON object');
  if (body.color != null && (typeof body.color !== 'string' || body.color.length > MAX_COLOR)) errs.push(`color must be a string up to ${MAX_COLOR} chars`);
  return errs;
}

router.post('/activities', (req, res) => {
  const errs = validateActivity(req.body || {});
  if (errs.length) return res.status(400).json({ error: 'Validation failed', details: errs });

  const project = findProject(req.body);
  if (!project) return res.status(404).json({ error: 'Project not found', detail: 'Provide a known project name, slug, or project_id.' });

  const externalRef = req.body.external_ref || null;
  if (externalRef) {
    const dup = db.findOne('activities', a => a.project_id === project.id && a.external_ref === externalRef);
    if (dup) return res.status(200).json({ created: false, activity: decorateActivity(dup) });
  }

  const activity = db.insert('activities', {
    project_id:   project.id,
    project_name: project.name,
    type:         req.body.type || 'completed_task',
    title:        req.body.title.trim(),
    description:  req.body.description || null,
    status:       req.body.status || 'done',
    source:       req.body.source || 'integration',
    color:        req.body.color || null,
    external_ref: externalRef,
    completed_at: req.body.completed_at || new Date().toISOString(),
    metadata:     req.body.metadata || {},
  });

  res.status(201).json({ created: true, activity: decorateActivity(activity) });
});

router.get('/activities', (req, res) => {
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
  res.json(rows.slice(0, max).map(decorateActivity));
});

router.delete('/activities/:id', (req, res) => {
  const ok = db.delete('activities', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

router.get('/tasks', (req, res) => {
  const { assignee, status, project, project_id } = req.query;
  let rows = db.get('tasks');
  if (assignee) rows = rows.filter(t => t.assignee === assignee);
  if (status)   rows = rows.filter(t => t.status === status);
  if (project || project_id) {
    const p = findProject({ project, project_id });
    if (!p) return res.json([]);
    rows = rows.filter(t => t.project === p.name);
  }
  rows.sort((a, b) => b.id - a.id);
  res.json(rows.map(shapeTask));
});

router.get('/tasks/:id', (req, res) => {
  const t = db.findOne('tasks', r => r.id === Number(req.params.id));
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(shapeTask(t));
});

router.post('/tasks/:id/claim', (req, res) => {
  const t = db.findOne('tasks', r => r.id === Number(req.params.id));
  if (!t) return res.status(404).json({ error: 'Not found' });
  if (t.status === 'done') return res.status(409).json({ error: 'Task already complete' });

  const claimedBy = (req.body && req.body.claimed_by) || 'Hubert';
  if (t.claimed_by && t.claimed_by !== claimedBy) {
    return res.status(409).json({ error: 'Task already claimed', claimed_by: t.claimed_by, claimed_at: t.claimed_at });
  }
  const updated = db.update('tasks', t.id, {
    status: 'in-progress',
    claimed_by: claimedBy,
    claimed_at: t.claimed_at || new Date().toISOString(),
  });
  res.json(shapeTask(updated));
});

router.post('/tasks/:id/complete', (req, res) => {
  const t = db.findOne('tasks', r => r.id === Number(req.params.id));
  if (!t) return res.status(404).json({ error: 'Not found' });

  const body    = req.body || {};
  const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
  const details = typeof body.details === 'string' ? body.details : null;
  const result  = body.result === 'failed' ? 'failed' : 'success';
  const status  = result === 'failed' ? 'failed' : 'done';

  if (summary && summary.length > MAX_TITLE) return res.status(400).json({ error: `summary exceeds ${MAX_TITLE} chars` });
  if (details && details.length > MAX_DESC)  return res.status(400).json({ error: `details exceeds ${MAX_DESC} chars` });

  const completedAt = new Date().toISOString();
  const updated = db.update('tasks', t.id, {
    status: status === 'failed' ? (t.status || 'in-progress') : 'done',
    completed_at: completedAt,
    completion: { summary: summary || null, details, result, at: completedAt },
  });

  let activity = null;
  const externalRef = `task-${t.id}`;
  const project = projectByName(t.project);
  const projectId = project ? project.id : null;

  const existing = db.findOne('activities', a => a.external_ref === externalRef && a.project_id === projectId);
  if (existing) {
    activity = existing;
  } else {
    activity = db.insert('activities', {
      project_id:   projectId,
      project_name: project ? project.name : (t.project || null),
      type:         'completed_task',
      title:        summary || `Completed task: ${t.title}`,
      description:  details,
      status:       status,
      source:       'hubert',
      color:        project ? project.dot : null,
      external_ref: externalRef,
      completed_at: completedAt,
      metadata:     { task_id: t.id, result },
    });
  }

  res.json({ task: shapeTask(updated), activity: decorateActivity(activity) });
});

router.get('/projects', (req, res) => {
  const rows = db.get('projects').map(p => ({
    id:    p.id,
    name:  p.name,
    slug:  slugify(p.name),
    color: p.dot,
  }));
  res.json(rows);
});

router.post('/tasks', (req, res) => {
  const { title, description, assignee, status, priority, due_date, project, project_id } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'title is required' });

  let projectName = null;
  if (project || project_id) {
    const p = findProject({ project, project_id });
    if (!p) return res.status(404).json({ error: 'Project not found' });
    projectName = p.name;
  }

  const task = db.insert('tasks', {
    title: title.trim(),
    description: description || null,
    assignee: assignee || 'Unassigned',
    status: status || 'todo',
    priority: priority || 'medium',
    due_date: due_date || null,
    project: projectName,
  });
  res.status(201).json(task);
});

module.exports = router;
