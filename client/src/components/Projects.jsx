import React, { useState, useEffect, useRef } from 'react';

const api = (path, opts) => fetch(`${import.meta.env.BASE_URL}api${path}`, {
  headers: { 'Content-Type': 'application/json' }, ...opts,
});

const T = {
  bg: '#fafaf9', card: '#ffffff', ink: '#0f1115', ink2: '#1f2228',
  mid: '#6b7280', mute: '#9ca3af', faint: '#c7c7c5',
  line: '#ececea', lineSoft: '#f3f3f1', hover: '#f7f7f5',
  blue: '#3b7ff5', success: '#2f9e6e', red: '#e5484d',
  shadow: '0 1px 2px rgba(15,17,21,0.04)',
  shadowLg: '0 8px 40px rgba(0,0,0,0.12)',
};

const DOT_PALETTE = ['#7e57c2', '#3b7ff5', '#2f9e6e', '#d68a23', '#e25c79', '#5fb3c9', '#94928c'];

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Active',     color: '#2f9e6e', bg: '#e3f4ec' },
  { value: 'on-hold',   label: 'On Hold',    color: '#d68a23', bg: '#fbf0dc' },
  { value: 'completed', label: 'Completed',  color: '#6b7280', bg: '#f3f4f6' },
];

function statusMeta(v) {
  return STATUS_OPTIONS.find(s => s.value === v) || STATUS_OPTIONS[0];
}

function Card({ children, style, padding = 20, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: T.card, border: `1px solid ${T.line}`,
      borderRadius: 12, boxShadow: T.shadow, padding, ...style,
    }}>{children}</div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 10.5, fontWeight: 600, color: T.mute,
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
      }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 11px', borderRadius: 8,
  border: `1px solid ${T.line}`, background: T.bg,
  fontFamily: 'inherit', fontSize: 13.5, color: T.ink,
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color .15s',
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical', minHeight: 90, lineHeight: 1.55,
};

/* ── New project modal ── */
function NewProjectModal({ existingCount, onSave, onClose }) {
  const [name, setName] = useState('');

  const submit = () => {
    const v = name.trim();
    if (!v) return;
    const dot = DOT_PALETTE[existingCount % DOT_PALETTE.length];
    onSave({ name: v, dot });
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(15,17,21,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div style={{
        background: T.card, borderRadius: 14, width: 400,
        border: `1px solid ${T.line}`, boxShadow: T.shadowLg, padding: 24,
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.ink, marginBottom: 18 }}>New project</div>
        <Field label="Project name">
          <input
            autoFocus value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose(); }}
            placeholder="e.g. Client Website Redesign"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = T.blue}
            onBlur={e => e.target.style.borderColor = T.line}
          />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button onClick={onClose} style={{
            padding: '7px 14px', borderRadius: 8,
            background: T.card, border: `1px solid ${T.line}`,
            fontSize: 13, fontWeight: 500, color: T.mid, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={submit} disabled={!name.trim()} style={{
            padding: '7px 14px', borderRadius: 8,
            background: name.trim() ? T.blue : T.bg,
            border: `1px solid ${name.trim() ? T.blue : T.line}`,
            color: name.trim() ? '#fff' : T.faint,
            fontSize: 13, fontWeight: 600,
            cursor: name.trim() ? 'pointer' : 'not-allowed',
          }}>Create project</button>
        </div>
      </div>
    </div>
  );
}

/* ── Activity feed (read-only, populated by integrations) ── */
function ActivityFeed({ projectId }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api(`/activities?project_id=${projectId}&limit=20`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setItems(data); })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, [projectId]);

  if (items === null) return null;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 10.5, fontWeight: 600, color: T.mute,
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10,
      }}>Activity ({items.length})</div>
      {items.length === 0 ? (
        <div style={{
          fontSize: 12.5, color: T.mute, padding: '12px 14px',
          background: T.bg, border: `1px dashed ${T.line}`, borderRadius: 8,
          lineHeight: 1.5,
        }}>
          No activity yet. Automated work logged via the integrations API will appear here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map(a => (
            <div key={a.id} style={{
              padding: '10px 12px', borderRadius: 8,
              background: T.bg, border: `1px solid ${T.lineSoft}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  background: a.status === 'failed' ? '#fce8ea' : a.status === 'done' ? '#e3f4ec' : T.bg,
                  color:      a.status === 'failed' ? T.red    : a.status === 'done' ? T.success : T.mid,
                }}>{a.status || a.type}</span>
                <span style={{ fontSize: 13, color: T.ink, fontWeight: 500, flex: 1, minWidth: 0 }}>{a.title}</span>
                <span style={{ fontSize: 11, color: T.mute, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {new Date(a.completed_at || a.created_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                </span>
              </div>
              {a.description && (
                <div style={{ fontSize: 12, color: T.mid, marginTop: 4, lineHeight: 1.5 }}>{a.description}</div>
              )}
              {(a.source && a.source !== 'integration') && (
                <div style={{ fontSize: 10.5, color: T.mute, marginTop: 4 }}>via {a.source}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Project detail drawer ── */
function ProjectDrawer({ project, tasks, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    name:        project.name        || '',
    description: project.description || '',
    client:      project.client      || '',
    budget:      project.budget      || '',
    status:      project.status      || 'active',
    website:     project.website     || '',
    drive:       project.drive       || '',
    notes:       project.notes       || '',
  });
  const [dirty, setDirty] = useState(false);
  const drawerRef = useRef(null);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true);
  };

  const save = () => {
    onSave(project.id, form);
    setDirty(false);
  };

  const relatedTasks = tasks.filter(t => t.project === project.name);
  const doneTasks = relatedTasks.filter(t => t.status === 'done').length;
  const sm = statusMeta(form.status);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 150,
      display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(15,17,21,0.2)',
      }} />

      {/* Drawer */}
      <div ref={drawerRef} style={{
        position: 'relative', width: 480, background: T.card,
        borderLeft: `1px solid ${T.line}`,
        boxShadow: '-8px 0 40px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        animation: 'slideInRight .2s ease',
      }}>
        {/* Drawer header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${T.lineSoft}`,
          display: 'flex', alignItems: 'center', gap: 12,
          position: 'sticky', top: 0, background: T.card, zIndex: 1,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: project.dot + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: project.dot,
          }}>{project.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.ink, letterSpacing: '-0.01em' }}>
              {project.name}
            </div>
            <div style={{ fontSize: 11.5, color: T.mute, marginTop: 1 }}>
              {relatedTasks.length} task{relatedTasks.length !== 1 ? 's' : ''} · {doneTasks} done
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {dirty && (
              <button onClick={save} style={{
                padding: '6px 12px', borderRadius: 8,
                background: T.blue, border: 'none',
                color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              }}>Save</button>
            )}
            <button onClick={onClose} style={{
              width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.line}`,
              background: T.bg, cursor: 'pointer', fontSize: 16, color: T.mid,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px', flex: 1 }}>

          {/* Status */}
          <Field label="Status">
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUS_OPTIONS.map(s => (
                <button key={s.value} onClick={() => { setForm(f => ({ ...f, status: s.value })); setDirty(true); }} style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${form.status === s.value ? s.color : T.line}`,
                  background: form.status === s.value ? s.bg : 'transparent',
                  color: form.status === s.value ? s.color : T.mute,
                  cursor: 'pointer', transition: 'all .15s',
                }}>{s.label}</button>
              ))}
            </div>
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={form.description} onChange={set('description')}
              placeholder="What is this project about?"
              style={textareaStyle}
              onFocus={e => e.target.style.borderColor = T.blue}
              onBlur={e => e.target.style.borderColor = T.line}
            />
          </Field>

          {/* Client + Budget row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <Field label="Client">
              <input value={form.client} onChange={set('client')}
                placeholder="Client name"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.blue}
                onBlur={e => e.target.style.borderColor = T.line}
              />
            </Field>
            <Field label="Budget">
              <input value={form.budget} onChange={set('budget')}
                placeholder="e.g. $5,000"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.blue}
                onBlur={e => e.target.style.borderColor = T.line}
              />
            </Field>
          </div>

          {/* Website */}
          <Field label="Website / URL">
            <input value={form.website} onChange={set('website')}
              placeholder="https://..."
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = T.blue}
              onBlur={e => e.target.style.borderColor = T.line}
            />
          </Field>

          {/* Drive */}
          <Field label="Google Drive / Dropbox URL">
            <input value={form.drive} onChange={set('drive')}
              placeholder="https://drive.google.com/... or dropbox.com/..."
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = T.blue}
              onBlur={e => e.target.style.borderColor = T.line}
            />
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={form.notes} onChange={set('notes')}
              placeholder="Any additional notes, links, context…"
              style={{ ...textareaStyle, minHeight: 120 }}
              onFocus={e => e.target.style.borderColor = T.blue}
              onBlur={e => e.target.style.borderColor = T.line}
            />
          </Field>

          {/* Activity feed */}
          <ActivityFeed projectId={project.id} />

          {/* Tasks summary */}
          {relatedTasks.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{
                fontSize: 10.5, fontWeight: 600, color: T.mute,
                letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10,
              }}>Tasks ({relatedTasks.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {relatedTasks.map(t => (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8,
                    background: T.bg, border: `1px solid ${T.lineSoft}`,
                  }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: 99, flexShrink: 0,
                      background: t.status === 'done' ? T.success : t.status === 'in-progress' ? T.blue : T.faint,
                    }} />
                    <span style={{
                      fontSize: 13, color: t.status === 'done' ? T.mute : T.ink,
                      textDecoration: t.status === 'done' ? 'line-through' : 'none',
                      flex: 1, minWidth: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{t.title}</span>
                    <span style={{ fontSize: 11, color: T.mute, flexShrink: 0 }}>
                      {t.assignee}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save button */}
          {dirty && (
            <button onClick={save} style={{
              width: '100%', padding: '10px', borderRadius: 8,
              background: T.blue, border: 'none',
              color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
              marginBottom: 12,
            }}>Save changes</button>
          )}

          {/* Delete */}
          <button onClick={() => { if (window.confirm(`Delete "${project.name}"?`)) onDelete(project.id); }} style={{
            width: '100%', padding: '8px', borderRadius: 8,
            background: 'transparent', border: `1px solid ${T.line}`,
            color: T.red, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
            marginTop: dirty ? 0 : 8,
          }}>Delete project</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = () => api('/projects').then(r => r.json()).then(setProjects).catch(() => {});

  useEffect(() => {
    load();
    api('/tasks').then(r => r.json()).then(setTasks).catch(() => {});
  }, []);

  const createProject = async (data) => {
    await api('/projects', { method: 'POST', body: JSON.stringify(data) });
    setShowNew(false);
    load();
  };

  const saveProject = async (id, data) => {
    const updated = await api(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(r => r.json());
    setProjects(ps => ps.map(p => p.id === id ? updated : p));
    setSelected(updated);
  };

  const deleteProject = async (id) => {
    await api(`/projects/${id}`, { method: 'DELETE' });
    setSelected(null);
    load();
  };

  const projectData = projects.map(p => {
    const pts = tasks.filter(t => t.project === p.name);
    const done = pts.filter(t => t.status === 'done').length;
    return { ...p, total: pts.length, open: pts.length - done, done };
  });

  const activeCount = projectData.filter(p => p.status === 'active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      {/* Header */}
      <div style={{
        padding: '24px 32px 0',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: T.ink }}>Projects</h1>
          <p style={{ fontSize: 13, color: T.mute, marginTop: 4, marginBottom: 0 }}>
            {activeCount} active · {projects.length} total
          </p>
        </div>
        <button onClick={() => setShowNew(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 8,
          background: T.blue, border: `1px solid ${T.blue}`,
          color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>+ New Project</button>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 32px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 14,
        }}>
          {projectData.map(p => {
            const sm = statusMeta(p.status);
            return (
              <Card key={p.id} padding={0}
                onClick={() => setSelected(p)}
                style={{ cursor: 'pointer', transition: 'box-shadow .15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow}>
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: p.dot + '22',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: p.dot, flexShrink: 0,
                    }}>{p.name[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: T.ink, letterSpacing: '-0.01em' }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: T.mute, marginTop: 1 }}>
                        {p.total} task{p.total !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10.5, fontWeight: 600, padding: '3px 8px',
                      borderRadius: 20, background: sm.bg, color: sm.color,
                      letterSpacing: '0.02em', flexShrink: 0,
                    }}>{sm.label}</span>
                  </div>

                  {p.description && (
                    <p style={{
                      fontSize: 12.5, color: T.mid, lineHeight: 1.5, marginBottom: 12,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>{p.description}</p>
                  )}

                  <div style={{ height: 4, borderRadius: 99, background: T.bg, overflow: 'hidden', marginBottom: 10 }}>
                    {p.total > 0 && (
                      <div style={{
                        width: `${(p.done / p.total) * 100}%`,
                        height: '100%', background: T.success,
                        borderRadius: 99, transition: 'width .3s',
                      }} />
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: T.mid }}>{p.open} open</span>
                    {p.budget && <span style={{ fontSize: 12, color: T.blue, fontWeight: 500 }}>{p.budget}</span>}
                    <span style={{ fontSize: 12, color: T.success, fontWeight: 500 }}>{p.done} done</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {showNew && (
        <NewProjectModal
          existingCount={projects.length}
          onSave={createProject}
          onClose={() => setShowNew(false)}
        />
      )}

      {selected && (
        <ProjectDrawer
          project={selected}
          tasks={tasks}
          onSave={saveProject}
          onDelete={deleteProject}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
