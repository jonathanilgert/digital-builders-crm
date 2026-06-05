import React, { useState, useEffect } from 'react';
import useIsMobile from '../hooks/useIsMobile';

const TEAM     = ['Unassigned', 'Alex', 'Jonathan', 'Hubert', 'Nicholas', 'Constance'];
const STATUSES = ['todo', 'in-progress', 'done'];
const ALL_STATUSES = ['todo', 'in-progress', 'done', 'archived'];
const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done', archived: 'Archived' };
const PRIORITIES = ['low', 'medium', 'high'];

// Project sort + dropdown order: DirtLink and Penned float to the top.
// (Used for the create-task dropdown and as a sort preference for the kanban.)
const PROJECTS = ['DirtLink', 'Penned', 'Realtors Platform', 'Digital Builders', 'Other'];
const PROJECT_ORDER  = Object.fromEntries(PROJECTS.map((p, i) => [p, i]));
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// Project colors come from /api/projects.dot at runtime so new projects
// pick up their own picked color without a code change. See loadProjects().

// Assignee palette — picks hues that don't collide with priority badges
// (low=green, medium=amber, high=red) or with project borders.
const ASSIGNEE_COLOR = {
  Alex:       '#d4789f', // dusty pink
  Jonathan:   '#3aa8be', // muted cyan
  Hubert:     '#8b6bbf', // soft violet
  Nicholas:   '#4a9b8a', // muted teal
  Constance:  '#6b7fc4', // muted indigo
  Unassigned: '#94a3b8', // slate
};

const DOT_COLOR = { todo: '#9ca3af', 'in-progress': '#3b7ff5', done: '#16a34a' };

// Sort: project order (DirtLink first), then priority desc, then id for stability.
function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const pa = a.project in PROJECT_ORDER ? PROJECT_ORDER[a.project] : PROJECTS.length;
    const pb = b.project in PROJECT_ORDER ? PROJECT_ORDER[b.project] : PROJECTS.length;
    if (pa !== pb) return pa - pb;
    const ra = PRIORITY_ORDER[a.priority] ?? 1;
    const rb = PRIORITY_ORDER[b.priority] ?? 1;
    if (ra !== rb) return ra - rb;
    return a.id - b.id;
  });
}

const api = (path, opts) => fetch(`${import.meta.env.BASE_URL}api${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });

export default function Tasks({ onOpenAgents }) {
  const [tasks, setTasks]           = useState([]);
  const [projects, setProjects]     = useState([]);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [filter, setFilter]         = useState({ assignee: 'all', status: 'all' });
  const [mobileTab, setMobileTab]   = useState('todo');
  const isMobile = useIsMobile();

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, []);

  async function loadTasks() {
    const res = await api('/tasks');
    setTasks(await res.json());
  }

  async function loadProjects() {
    try {
      const res = await api('/projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch { setProjects([]); }
  }

  const projectColorByName = Object.fromEntries(projects.map(p => [p.name, p.dot]));

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

  async function archiveTask(task) {
    await api(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ ...task, status: 'archived' }) });
    loadTasks();
  }

  const filtered = tasks.filter(t =>
    t.status !== 'archived' &&
    (filter.assignee === 'all' || t.assignee === filter.assignee) &&
    (filter.status   === 'all' || t.status   === filter.status)
  );

  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = sortTasks(filtered.filter(t => t.status === s));
    return acc;
  }, {});

  const done = tasks.filter(t => t.status === 'done').length;

  // Filter dropdown options: every assignee that actually appears on a task,
  // merged with the known TEAM, so people like Constance/Nicholas show up too.
  // Unassigned always sorts last; everyone else alphabetical.
  const assignees = Array.from(new Set([...TEAM, ...tasks.map(t => t.assignee).filter(Boolean)]))
    .sort((a, b) =>
      a === 'Unassigned' ? 1 : b === 'Unassigned' ? -1 : a.localeCompare(b)
    );

  const openEdit = (t) => { setEditing(t); setShowModal(true); };

  return (
    <div style={{
      padding: isMobile ? '14px 12px 0' : '28px 32px',
      flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'flex-end',
        justifyContent: 'space-between',
        marginBottom: isMobile ? 12 : 24,
        gap: isMobile ? 10 : 0,
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 19 : 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' }}>Tasks</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {tasks.length} total · {done} completed
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={filter.assignee} onChange={e => setFilter(f => ({ ...f, assignee: e.target.value }))}
            style={{ width: 'auto', fontSize: 12, padding: '6px 10px', borderRadius: 8, color: 'var(--text-sub)' }}>
            <option value="all">All members</option>
            {assignees.map(m => <option key={m}>{m}</option>)}
          </select>
          {!isMobile && (
            <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
              style={{ width: 'auto', fontSize: 12, padding: '6px 10px', borderRadius: 8, color: 'var(--text-sub)' }}>
              <option value="all">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          )}
          {onOpenAgents && (
            <button onClick={onOpenAgents}
              title="Open agent activity log"
              style={{
                fontSize: 12, padding: '6px 11px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text-sub)', cursor: 'pointer', fontWeight: 500,
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7e57c2', flexShrink: 0 }} />
              Agents
              <span aria-hidden="true" style={{ opacity: 0.6 }}>→</span>
            </button>
          )}
          <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}
            onClick={() => { setEditing(null); setShowModal(true); }}>
            + New Task
          </button>
        </div>
      </div>

      {/* ── Kanban ── */}
      {isMobile ? (
        /* Mobile: tab switcher + single scrollable column */
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, paddingBottom: 14 }}>

          {/* Tab bar — 3 status tabs */}
          <div style={{
            display: 'flex', gap: 0, marginBottom: 10,
            background: 'var(--surface2)', borderRadius: 10, padding: 3, flexShrink: 0,
          }}>
            {STATUSES.map(s => {
              const active = mobileTab === s;
              return (
                <button key={s} onClick={() => setMobileTab(s)} style={{
                  flex: 1, padding: '8px 2px', borderRadius: 8, border: 'none',
                  background: active ? 'var(--surface)' : 'transparent',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 11.5, cursor: 'pointer',
                  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all .15s',
                }}>
                  {STATUS_LABELS[s]}
                  <span style={{
                    display: 'inline-block', marginLeft: 4,
                    fontSize: 10, fontWeight: 700,
                    color: active ? DOT_COLOR[s] : 'var(--text-muted)',
                  }}>{byStatus[s].length}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable list */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {byStatus[mobileTab].length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '36px 0', opacity: 0.7 }}>
                No tasks
              </div>
            )}
            {byStatus[mobileTab].map(t => (
              <TaskCard key={t.id} task={t} isMobile
                onEdit={openEdit} onDelete={deleteTask}
                projectColorByName={projectColorByName}
                nextStatus={{ todo: 'in-progress', 'in-progress': 'done', done: 'todo' }[mobileTab]}
                nextLabel={{ todo: 'Start', 'in-progress': 'Complete', done: 'Reopen' }[mobileTab]}
                onStatusChange={updateStatus}
                onArchive={mobileTab === 'done' ? archiveTask : null}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Desktop: 3 status columns */
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${STATUSES.length}, 1fr)`,
          gap: 16, flex: 1, minHeight: 0,
        }}>
          {STATUSES.map(s => (
            <Column key={s} status={s} tasks={byStatus[s]} projectColorByName={projectColorByName}
              onEdit={openEdit} onDelete={deleteTask} onStatusChange={updateStatus}
              onArchive={s === 'done' ? archiveTask : null} />
          ))}
        </div>
      )}

      {showModal && (
        <TaskModal task={editing} projects={projects} onSave={saveTask}
          onClose={() => { setShowModal(false); setEditing(null); }} />
      )}
    </div>
  );
}

function Column({ status, tasks, onEdit, onDelete, onStatusChange, onArchive, projectColorByName }) {
  const nextStatus = { todo: 'in-progress', 'in-progress': 'done', done: 'todo' };
  const nextLabel  = { todo: 'Start', 'in-progress': 'Complete', done: 'Reopen' };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '12px 14px 10px', borderBottom: '1.5px solid var(--border-light)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: DOT_COLOR[status], flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          {STATUS_LABELS[status]}
        </span>
        <span style={{
          marginLeft: 'auto', background: 'var(--surface2)',
          border: '1.5px solid var(--border)', borderRadius: 20,
          padding: '1px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
        }}>{tasks.length}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5, padding: '24px 0', opacity: 0.7 }}>
            No tasks
          </div>
        )}
        {tasks.map(t => (
          <TaskCard key={t.id} task={t}
            onEdit={onEdit} onDelete={onDelete}
            projectColorByName={projectColorByName}
            nextStatus={nextStatus[status]} nextLabel={nextLabel[status]}
            onStatusChange={onStatusChange} onArchive={onArchive} />
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

function TaskCard({ task, onEdit, onDelete, nextStatus, nextLabel, onStatusChange, onArchive, isMobile, projectColorByName }) {
  const [hovered, setHovered] = useState(false);
  const isDone        = task.status === 'done';
  const projectColor  = (projectColorByName && projectColorByName[task.project]) || 'var(--border)';
  const assigneeColor = ASSIGNEE_COLOR[task.assignee] || ASSIGNEE_COLOR.Unassigned;
  const hasProject    = !!task.project && projectColorByName && projectColorByName[task.project];

  return (
    <div
      onClick={() => onEdit(task)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${hasProject ? projectColor + 'bb' : 'var(--border-light, var(--border))'}`,
        borderRadius: 8,
        padding: isMobile ? '10px 12px' : '8px 10px',
        marginBottom: isMobile ? 7 : 5,
        cursor: 'pointer',
        transition: 'background 0.12s, border-color 0.12s, box-shadow 0.12s',
        boxShadow: hovered ? 'var(--shadow-sm)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + actions */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
            <div style={{
              flex: 1, minWidth: 0,
              fontWeight: 500, fontSize: isMobile ? 13.5 : 13, lineHeight: 1.35,
              color: isDone ? 'var(--text-muted)' : 'var(--text)',
              textDecoration: isDone ? 'line-through' : 'none',
              wordBreak: 'break-word',
            }}>{task.title}</div>
            {onArchive && (
              <button
                onClick={e => { e.stopPropagation(); onArchive(task); }}
                title="Archive — move to Completed"
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: 2, lineHeight: 0, flexShrink: 0,
                  color: '#16a34a', opacity: hovered ? 0.7 : 0,
                  transition: 'opacity 0.12s',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 5v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 8.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); onDelete(task.id); }}
              title="Delete"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: 2, lineHeight: 0, flexShrink: 0,
                color: '#e5484d', opacity: hovered ? 0.7 : 0,
                transition: 'opacity 0.12s',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Meta row: left = project + date, right = assignee + priority */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {hasProject && (
                <span style={{
                  fontSize: 10.5, fontWeight: 600, color: projectColor,
                  opacity: 0.75,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{task.project}</span>
              )}
              {task.due_date && (
                <span style={{ fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <span style={{
                fontWeight: 500, color: 'var(--text-muted)', fontSize: 10,
              }}>{task.priority}</span>
              <span style={{
                fontWeight: 600, color: assigneeColor,
                background: assigneeColor + '1a',
                borderRadius: 4, padding: '1px 6px', fontSize: 10.5,
              }}>{task.assignee}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskModal({ task, projects, onSave, onClose }) {
  const [form, setForm] = useState({
    title:       task?.title       || '',
    description: task?.description || '',
    assignee:    task?.assignee    || 'Unassigned',
    status:      task?.status      || 'todo',
    priority:    task?.priority    || 'medium',
    due_date:    task?.due_date    || '',
    project:     task?.project     || '',
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
            {projects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
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
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
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
