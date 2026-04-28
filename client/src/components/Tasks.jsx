import React, { useState, useEffect } from 'react';

const TEAM = ['Alex', 'Partner'];
const STATUSES = ['todo', 'in-progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
const PRIORITIES = ['low', 'medium', 'high'];
const PROJECTS = ['DirtLink', 'Realtors Platform', 'Peneed', 'Digital Builders', 'Other'];

const DOT_COLOR = {
  todo: '#9ca3af',
  'in-progress': '#3b7ff5',
  done: '#16a34a',
};

const api = (path, opts) => fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState({ assignee: 'all', status: 'all' });

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    const res = await api('/tasks');
    const data = await res.json();
    setTasks(data);
  }

  async function saveTask(data) {
    if (editing) {
      await api(`/tasks/${editing.id}`, { method: 'PUT', body: JSON.stringify(data) });
    } else {
      await api('/tasks', { method: 'POST', body: JSON.stringify(data) });
    }
    setShowModal(false);
    setEditing(null);
    loadTasks();
  }

  async function deleteTask(id) {
    await api(`/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
  }

  async function updateStatus(task, status) {
    await api(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ ...task, status }) });
    loadTasks();
  }

  const filtered = tasks.filter(t =>
    (filter.assignee === 'all' || t.assignee === filter.assignee) &&
    (filter.status === 'all' || t.status === filter.status)
  );

  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = filtered.filter(t => t.status === s);
    return acc;
  }, {});

  const done = tasks.filter(t => t.status === 'done').length;

  return (
    <div style={{ padding: '28px 32px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' }}>Tasks</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {tasks.length} total &middot; {done} completed
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={filter.assignee}
            onChange={e => setFilter(f => ({ ...f, assignee: e.target.value }))}
            style={{ width: 'auto', fontSize: 13, padding: '7px 11px', borderRadius: 8, color: 'var(--text-sub)' }}
          >
            <option value="all">All members</option>
            {TEAM.map(m => <option key={m}>{m}</option>)}
          </select>
          <select
            value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            style={{ width: 'auto', fontSize: 13, padding: '7px 11px', borderRadius: 8, color: 'var(--text-sub)' }}
          >
            <option value="all">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => { setEditing(null); setShowModal(true); }}>
            + New Task
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, flex: 1, minHeight: 0 }}>
        {STATUSES.map(s => (
          <Column
            key={s}
            status={s}
            tasks={byStatus[s]}
            onEdit={t => { setEditing(t); setShowModal(true); }}
            onDelete={deleteTask}
            onStatusChange={updateStatus}
          />
        ))}
      </div>

      {showModal && (
        <TaskModal
          task={editing}
          onSave={saveTask}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function Column({ status, tasks, onEdit, onDelete, onStatusChange }) {
  const nextStatus = { todo: 'in-progress', 'in-progress': 'done', done: 'todo' };
  const nextLabel = { todo: 'Start', 'in-progress': 'Complete', done: 'Reopen' };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Column header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1.5px solid var(--border-light)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: DOT_COLOR[status], flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          {STATUS_LABELS[status]}
        </span>
        <span style={{
          marginLeft: 'auto',
          background: 'var(--surface2)',
          border: '1.5px solid var(--border)',
          borderRadius: 20,
          padding: '1px 8px',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
        }}>{tasks.length}</span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '28px 0', opacity: 0.7 }}>
            No tasks
          </div>
        )}
        {tasks.map(t => (
          <TaskCard
            key={t.id}
            task={t}
            onEdit={onEdit}
            onDelete={onDelete}
            nextStatus={nextStatus[status]}
            nextLabel={nextLabel[status]}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, nextStatus, nextLabel, onStatusChange }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: `1.5px solid ${task.status === 'done' ? '#a8d5b5' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '13px 14px',
        marginBottom: 8,
        cursor: 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hovered ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 500, fontSize: 13.5, lineHeight: 1.45, color: 'var(--text)', flex: 1 }}>{task.title}</div>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)} title="Edit" style={{ color: 'var(--text-muted)' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 10.5L5 11.5L12 4.5L10 2.5L2 10.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(task.id)} title="Delete">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {task.description && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.55 }}>{task.description}</p>
      )}

      {task.project && (
        <div style={{ marginBottom: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: 'var(--accent)',
            background: 'var(--accent-light)', borderRadius: 5,
            padding: '2px 7px',
          }}>{task.project}</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        <span style={{
          fontSize: 11, color: 'var(--text-muted)',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: '1px 7px', fontWeight: 500,
        }}>{task.assignee}</span>
        {task.due_date && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      <button
        className="btn btn-outline btn-sm"
        style={{ width: '100%', justifyContent: 'center', fontSize: 11.5, color: 'var(--accent)', borderColor: 'var(--accent)', background: 'var(--accent-light)' }}
        onClick={() => onStatusChange(task, nextStatus)}
      >
        {nextLabel} →
      </button>
    </div>
  );
}

function TaskModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({
    title:       task?.title || '',
    description: task?.description || '',
    assignee:    task?.assignee || 'Alex',
    status:      task?.status || 'todo',
    priority:    task?.priority || 'medium',
    due_date:    task?.due_date || '',
    project:     task?.project || '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{task ? 'Edit Task' : 'New Task'}</h2>
        <div className="form-group">
          <label>Title</label>
          <input value={form.title} onChange={set('title')} placeholder="What needs to be done?" autoFocus />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={form.description} onChange={set('description')} placeholder="Optional details..." />
        </div>
        <div className="form-group">
          <label>Project</label>
          <select value={form.project} onChange={set('project')}>
            <option value="">— No project —</option>
            {PROJECTS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Assignee</label>
            <select value={form.assignee} onChange={set('assignee')}>
              {TEAM.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={set('status')}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" value={form.due_date} onChange={set('due_date')} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => form.title.trim() && onSave(form)} disabled={!form.title.trim()}>
            {task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
