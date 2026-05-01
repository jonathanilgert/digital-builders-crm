const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

const SCHEMA = { tasks: [], events: [], work_hours: [], projects: [], activities: [] };

const SEED_PROJECTS = [
  { id: 1, created_at: new Date().toISOString(), name: 'DirtLink',          dot: '#f97316', description: '', client: '', budget: '', status: 'active', website: '', notes: '' },
  { id: 2, created_at: new Date().toISOString(), name: 'Realtors Platform',  dot: '#3b82f6', description: '', client: '', budget: '', status: 'active', website: '', notes: '' },
  { id: 3, created_at: new Date().toISOString(), name: 'Penned',             dot: '#22c55e', description: '', client: '', budget: '', status: 'active', website: '', notes: '' },
  { id: 4, created_at: new Date().toISOString(), name: 'Digital Builders',   dot: '#a855f7', description: '', client: '', budget: '', status: 'active', website: '', notes: '' },
  { id: 5, created_at: new Date().toISOString(), name: 'Other',              dot: '#64748b', description: '', client: '', budget: '', status: 'active', website: '', notes: '' },
];

function load() {
  if (!fs.existsSync(DB_FILE)) {
    const seed = { ...SCHEMA, projects: SEED_PROJECTS };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return { ...seed, _counters: { tasks: 0, events: 0, work_hours: 0, projects: SEED_PROJECTS.length, activities: 0 } };
  }
  const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  if (!raw.projects)   raw.projects   = SEED_PROJECTS;
  if (!raw.activities) raw.activities = [];

  let dirty = false;
  (raw.projects   || []).forEach(p => { if (p.name === 'Peneed')      { p.name = 'Penned';        dirty = true; } });
  (raw.tasks      || []).forEach(t => { if (t.project === 'Peneed')   { t.project = 'Penned';     dirty = true; } });
  (raw.tasks      || []).forEach(t => { if (t.assignee === 'Partner') { t.assignee = 'Jonathan';  dirty = true; } });
  (raw.work_hours || []).forEach(w => { if (w.user_name === 'Partner'){ w.user_name = 'Jonathan'; dirty = true; } });
  if (dirty) fs.writeFileSync(DB_FILE, JSON.stringify(raw, null, 2));

  return {
    ...raw,
    _counters: {
      tasks:      raw.tasks.length      ? Math.max(...raw.tasks.map(r => r.id))      : 0,
      events:     raw.events.length     ? Math.max(...raw.events.map(r => r.id))     : 0,
      work_hours: raw.work_hours.length ? Math.max(...raw.work_hours.map(r => r.id)) : 0,
      projects:   raw.projects.length   ? Math.max(...raw.projects.map(r => r.id))   : 0,
      activities: raw.activities.length ? Math.max(...raw.activities.map(r => r.id)) : 0,
    },
  };
}

function save(state) {
  const { _counters, ...data } = state;
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let state = load();

const db = {
  nextId(table) {
    state._counters[table] = (state._counters[table] || 0) + 1;
    return state._counters[table];
  },

  get(table) { return state[table] || []; },

  insert(table, record) {
    const row = { id: this.nextId(table), created_at: new Date().toISOString(), ...record };
    state[table].push(row);
    save(state);
    return row;
  },

  update(table, id, fields) {
    const idx = state[table].findIndex(r => r.id === Number(id));
    if (idx === -1) return null;
    state[table][idx] = { ...state[table][idx], ...fields };
    save(state);
    return state[table][idx];
  },

  delete(table, id) {
    const before = state[table].length;
    state[table] = state[table].filter(r => r.id !== Number(id));
    const removed = state[table].length !== before;
    if (removed) save(state);
    return removed;
  },

  find(table, predicate) {
    return state[table].filter(predicate);
  },

  findOne(table, predicate) {
    return state[table].find(predicate) || null;
  },
};

module.exports = db;
