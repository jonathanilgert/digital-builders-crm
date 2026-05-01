const db = require('../db');
const { slugify } = require('./slugify');

function findProject({ project_id, project }) {
  const all = db.get('projects');
  if (project_id != null) {
    const byId = all.find(p => p.id === Number(project_id));
    if (byId) return byId;
  }
  if (project) {
    const exact = all.find(p => p.name === project);
    if (exact) return exact;
    const target = slugify(project);
    const bySlug = all.find(p => slugify(p.name) === target);
    if (bySlug) return bySlug;
  }
  return null;
}

module.exports = { findProject };
