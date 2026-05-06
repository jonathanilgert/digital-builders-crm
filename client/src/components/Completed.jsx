import React, { useState, useEffect } from 'react';
import useIsMobile from '../hooks/useIsMobile';

const ASSIGNEE_COLOR = {
  Alex:       '#ec4899',
  Jonathan:   '#06b6d4',
  Hubert:     '#7c3aed',
  Unassigned: '#94a3b8',
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const api = (path, opts) => fetch(`${import.meta.env.BASE_URL}api${path}`, {
  headers: { 'Content-Type': 'application/json' }, ...opts,
});

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Completed() {
  const [tasks, setTasks]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter]     = useState('all');
  const isMobile = useIsMobile();

  useEffect(() => { loadTasks(); loadProjects(); }, []);

  async function loadTasks() {
    const res = await api('/tasks');
    const all = await res.json();
    setTasks(all.filter(t => t.status === 'archived'));
  }

  async function loadProjects() {
    try {
      const res = await api('/projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch { setProjects([]); }
  }

  async function restoreTask(task) {
    await api(`/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...task, status: 'done' }),
    });
    loadTasks();
  }

  async function deleteTask(id) {
    await api(`/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
  }

  const projectColorByName = Object.fromEntries(projects.map(p => [p.name, p.dot]));

  const projectNames = [...new Set(tasks.map(t => t.project).filter(Boolean))].sort();

  const filtered = (filter === 'all' ? tasks : tasks.filter(t => t.project === filter))
    .slice()
    .sort((a, b) => {
      const da = new Date(a.archived_at || a.created_at);
      const db2 = new Date(b.archived_at || b.created_at);
      return db2 - da;
    });

  return (
    <div style={{
      padding: isMobile ? '14px 12px' : '28px 32px',
      flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <h1 style={{ fontSize: isMobile ? 19 : 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 2 }}>
          Completed
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {tasks.length} archived task{tasks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Project filter chips */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18, flexShrink: 0,
      }}>
        {['all', ...projectNames].map(p => {
          const active = filter === p;
          const color = p !== 'all' ? (projectColorByName[p] || '#94a3b8') : null;
          return (
            <button key={p} onClick={() => setFilter(p)} style={{
              padding: '5px 13px', borderRadius: 99, fontSize: 12, fontWeight: active ? 600 : 500,
              border: active ? 'none' : '1px solid var(--border)',
              background: active ? (color || 'var(--text)') : 'var(--surface)',
              color: active ? '#fff' : 'var(--text-sub)',
              cursor: 'pointer', transition: 'all .13s',
            }}>
              {p === 'all' ? 'All projects' : p}
              <span style={{ marginLeft: 5, opacity: 0.75, fontSize: 10.5, fontWeight: 700 }}>
                {p === 'all' ? tasks.length : tasks.filter(t => t.project === p).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', color: 'var(--text-muted)', fontSize: 13.5,
            padding: '60px 0', opacity: 0.6,
          }}>
            No completed tasks yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {filtered.map(task => (
              <CompletedRow
                key={task.id}
                task={task}
                projectColorByName={projectColorByName}
                onRestore={restoreTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CompletedRow({ task, projectColorByName, onRestore, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const projectColor  = (projectColorByName && projectColorByName[task.project]) || '#94a3b8';
  const assigneeColor = ASSIGNEE_COLOR[task.assignee] || ASSIGNEE_COLOR.Unassigned;
  const hasProject    = !!task.project && projectColorByName && projectColorByName[task.project];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${hasProject ? projectColor : 'var(--border)'}`,
        borderRadius: 8,
        padding: '10px 14px',
        transition: 'background 0.12s',
      }}
    >
      {/* Check icon */}
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        background: '#16a34a', flexShrink: 0,
        display: 'grid', placeItems: 'center',
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Title */}
      <div style={{
        flex: 1, minWidth: 0,
        fontSize: 13, fontWeight: 500, color: 'var(--text-muted)',
        textDecoration: 'line-through', wordBreak: 'break-word',
        lineHeight: 1.35,
      }}>
        {task.title}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {hasProject && (
          <span style={{
            fontWeight: 600, color: projectColor,
            background: projectColor + '1a',
            borderRadius: 4, padding: '1px 7px', fontSize: 10.5,
          }}>{task.project}</span>
        )}
        <span style={{
          fontWeight: 600, color: assigneeColor,
          background: assigneeColor + '1a',
          borderRadius: 4, padding: '1px 7px', fontSize: 10.5,
        }}>{task.assignee}</span>
        <span style={{
          fontSize: 10.5, color: 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
        }}>
          {formatDate(task.archived_at || task.created_at)}
        </span>
      </div>

      {/* Actions — visible on hover */}
      <div style={{
        display: 'flex', gap: 4, flexShrink: 0,
        opacity: hovered ? 1 : 0, transition: 'opacity 0.12s',
      }}>
        <button
          onClick={() => onRestore(task)}
          title="Restore to Done"
          style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 5,
            border: '1px solid var(--border)', background: 'var(--surface2)',
            color: 'var(--text-sub)', cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Restore
        </button>
        <button
          onClick={() => onDelete(task.id)}
          title="Delete permanently"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 4, lineHeight: 0, color: '#e5484d',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
