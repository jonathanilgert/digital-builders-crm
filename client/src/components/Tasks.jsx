import React, { useState, useEffect } from 'react';

const TEAM = ['Alex', 'Jonathan', 'Hubert'];
const STATUSES = ['todo', 'in-progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
const PRIORITIES = ['low', 'medium', 'high'];
const PROJECTS = ['DirtLink', 'Realtors Platform', 'Penned', 'Digital Builders', 'Other'];

const DOT_COLOR = {
  todo: '#9ca3af',
  'in-progress': '#3b7ff5',
  done: '#16a34a',
};

const HUBERT_DOT = '#7e57c2';

const api = (path, opts) => fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState({ assignee: 'all', status: 'all' });

  useEffect(() => { loadTasks(); loadActivities(); }, []);

  async function loadTasks() {
    const res = await api('/tasks');
    const data = await res.json();
    setTasks(data);
  }

  async function loadActivities() {
    try {
      const res = await api('/activities?limit=100');
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch { setActivities([]); }
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, flex: 1, minHeight: 0 }}>
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
        <HubertColumn activities={activities} />
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

function HubertColumn({ activities }) {
  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1.5px solid var(--border-light)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: HUBERT_DOT, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          Hubert
        </span>
        <span style={{
          fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)',
          letterSpacing: '0.02em',
        }}>
          automated
        </span>
        <span style={{
          marginLeft: 'auto',
          background: 'var(--surface2)',
          border: '1.5px solid var(--border)',
          borderRadius: 20, padding: '1px 8px',
          fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
        }}>{activities.length}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {activities.length === 0 ? (
          <div style={{
            textAlign: 'center', color: 'var(--text-muted)',
            fontSize: 12, padding: '28px 14px', lineHeight: 1.55, opacity: 0.85,
          }}>
            No automated work logged yet. Hubert will post completed runs here as they happen.
          </div>
        ) : (
          activities.map(a => <ActivityCard key={a.id} activity={a} />)
        )}
      </div>
    </div>
  );
}

function ActivityCard({ activity: a }) {
  const [hovered, setHovered] = useState(false);
  const ts = new Date(a.completed_at || a.created_at);
  const isFailed = a.status === 'failed';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={a.description || ''}
      style={{
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${isFailed ? '#f5cdd1' : 'var(--border)'}`,
        borderLeft: `3px solid ${isFailed ? '#e5484d' : HUBERT_DOT}`,
        borderRadius: 8,
        padding: '8px 10px',
        marginBottom: 5,
        transition: 'background 0.12s, border-color 0.12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        {a.project_name && (
          <span style={{
            fontSize: 10.5, fontWeight: 600, color: HUBERT_DOT,
            background: '#f1ecf8', borderRadius: 4, padding: '1px 6px',
          }}>{a.project_name}</span>
        )}
        {isFailed && (
          <span style={{
            fontSize: 9.5, fontWeight: 700, color: '#e5484d',
            background: '#fce8ea', borderRadius: 4, padding: '1px 5px',
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>failed</span>
        )}
        <span style={{
          marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
        }}>
          {ts.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </span>
      </div>
      <div style={{
        fontSize: 12.5, fontWeight: 500, color: 'var(--text)',
        lineHeight: 1.4, wordBreak: 'break-word',
      }}>{a.title}</div>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
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
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}

function StatusCircle({ status, onClick }) {
  const ringColor = status === 'done' ? 'var(--success)' : status === 'in-progress' ? 'var(--accent)' : 'var(--text-muted)';
  const title = status === 'todo' ? 'Start' : status === 'in-progress' ? 'Complete' : 'Reopen';
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 14, height: 14, borderRadius: '50%',
        border: `1.5px solid ${ringColor}`,
        background: status === 'done' ? 'var(--success)' : 'transparent',
        marginTop: 3, flexShrink: 0,
        padding: 0, display: 'grid', placeItems: 'center',
      }}
    >
      {status === 'in-progress' && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
      )}
      {status === 'done' && (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1.5 4L3 5.5L6.5 2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

function TaskCard({ task, onEdit, onDelete, nextStatus, onStatusChange }) {
  const [hovered, setHovered] = useState(false);
  const isDone = task.status === 'done';

  return (
    <div
      onClick={() => onEdit(task)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${isDone ? '#cfe7d6' : 'var(--border)'}`,
        borderRadius: 8,
        padding: '8px 10px',
        marginBottom: 5,
        cursor: 'pointer',
        transition: 'background 0.12s, border-color 0.12s, box-shadow 0.12s',
        boxShadow: hovered ? 'var(--shadow-sm)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        <StatusCircle
          status={task.status}
          onClick={e => { e.stopPropagation(); onStatusChange(task, nextStatus); }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <div style={{
              flex: 1, minWidth: 0,
              fontWeight: 500, fontSize: 13, lineHeight: 1.35,
              color: isDone ? 'var(--text-muted)' : 'var(--text)',
              textDecoration: isDone ? 'line-through' : 'none',
              wordBreak: 'break-word',
            }}>{task.title}</div>
            <button
              className="btn btn-danger btn-sm"
              onClick={e => { e.stopPropagation(); onDelete(task.id); }}
              title="Delete"
              style={{ padding: '2px 5px', opacity: hovered ? 1 : 0, transition: 'opacity 0.12s', flexShrink: 0 }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            {task.project && (
              <span style={{
                fontWeight: 600, color: 'var(--accent)',
                background: 'var(--accent-light)', borderRadius: 4,
                padding: '1px 6px', fontSize: 10.5,
              }}>{task.project}</span>
            )}
            <span className={`badge badge-${task.priority}`} style={{ padding: '0px 6px', fontSize: 10 }}>{task.priority}</span>
            <span style={{ fontWeight: 500 }}>{task.assignee}</span>
            {task.due_date && (
              <span style={{ marginLeft: 'auto' }}>
                {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
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
