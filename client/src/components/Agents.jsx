import React, { useState, useEffect } from 'react';
import useIsMobile from '../hooks/useIsMobile';

// Per-agent automated-work column config. `source` is the activity row tag the
// integrations API attaches (lowercased agent name). Activities without a
// recognized source fall back to Hubert (legacy compatibility).
const AGENTS = [
  { id: 'hubert',    name: 'Hubert',    source: 'hubert',    dot: '#7e57c2' }, // violet
  { id: 'nicholas',  name: 'Nicholas',  source: 'nicholas',  dot: '#4a9b8a' }, // muted teal
  { id: 'constance', name: 'Constance', source: 'constance', dot: '#6b7fc4' }, // muted indigo
];

const api = (path, opts) => fetch(`${import.meta.env.BASE_URL}api${path}`, {
  headers: { 'Content-Type': 'application/json' }, ...opts,
});

export default function Agents() {
  const [activities, setActivities] = useState([]);
  const [mobileTab, setMobileTab]   = useState(AGENTS[0].id);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadActivities();
    const interval = setInterval(loadActivities, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadActivities() {
    try {
      const res = await api('/activities?limit=100');
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch { setActivities([]); }
  }

  async function deleteActivity(id) {
    await api(`/activities/${id}`, { method: 'DELETE' });
    loadActivities();
  }

  // Split the automated-work feed per agent. Activities whose source matches a
  // known agent flow into that agent's column; legacy rows without a recognized
  // source fall back to Hubert (where they used to land).
  const knownAgentSources = new Set(AGENTS.map(a => a.source));
  const activitiesByAgent = AGENTS.reduce((acc, a) => {
    acc[a.id] = activities.filter(act => {
      const src = (act.source || '').toLowerCase();
      if (src === a.source) return true;
      if (a.id === 'hubert' && !knownAgentSources.has(src)) return true;
      return false;
    });
    return acc;
  }, {});

  const totalCount = activities.length;

  return (
    <div style={{
      padding: isMobile ? '14px 12px 0' : '28px 32px',
      flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
    }}>

      {/* Header */}
      <div style={{ marginBottom: isMobile ? 12 : 20, flexShrink: 0 }}>
        <h1 style={{ fontSize: isMobile ? 19 : 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' }}>
          Agents
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          Automated work logged by {AGENTS.map(a => a.name).join(', ')} · {totalCount} total
        </p>
      </div>

      {isMobile ? (
        /* Mobile: tab switcher + single scrollable column */
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, paddingBottom: 14 }}>
          <div style={{
            display: 'flex', gap: 0, marginBottom: 10,
            background: 'var(--surface2)', borderRadius: 10, padding: 3, flexShrink: 0,
            overflowX: 'auto', scrollbarWidth: 'none',
          }}>
            {AGENTS.map(a => {
              const active = mobileTab === a.id;
              const count  = activitiesByAgent[a.id].length;
              return (
                <button key={a.id} onClick={() => setMobileTab(a.id)} style={{
                  flex: 1, minWidth: 96, padding: '8px 2px', borderRadius: 8, border: 'none',
                  background: active ? 'var(--surface)' : 'transparent',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 11.5, cursor: 'pointer',
                  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all .15s',
                }}>
                  {a.name}
                  <span style={{
                    display: 'inline-block', marginLeft: 4,
                    fontSize: 10, fontWeight: 700,
                    color: active ? a.dot : 'var(--text-muted)',
                  }}>{count}</span>
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <AgentColumn
              agent={AGENTS.find(a => a.id === mobileTab)}
              activities={activitiesByAgent[mobileTab]}
              onDelete={deleteActivity}
              flat
            />
          </div>
        </div>
      ) : (
        /* Desktop: one column per agent */
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${AGENTS.length}, 1fr)`,
          gap: 16, flex: 1, minHeight: 0,
        }}>
          {AGENTS.map(a => (
            <AgentColumn key={a.id} agent={a} activities={activitiesByAgent[a.id]} onDelete={deleteActivity} />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentColumn({ agent, activities, onDelete, flat }) {
  const content = (
    <>
      {activities.length === 0 ? (
        <div style={{
          textAlign: 'center', color: 'var(--text-muted)',
          fontSize: 12, padding: '28px 14px', lineHeight: 1.55, opacity: 0.85,
        }}>
          No automated work logged yet. {agent.name} will post completed runs here as they happen.
        </div>
      ) : (
        activities.map(a => <ActivityCard key={a.id} activity={a} fallbackColor={agent.dot} onDelete={onDelete} />)
      )}
    </>
  );

  if (flat) return <div style={{ padding: '8px' }}>{content}</div>;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1.5px solid var(--border-light)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: agent.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          {agent.name}
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
          automated
        </span>
        <span style={{
          marginLeft: 'auto',
          background: 'var(--surface2)', border: '1.5px solid var(--border)',
          borderRadius: 20, padding: '1px 8px',
          fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
        }}>{activities.length}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {content}
      </div>
    </div>
  );
}

function ActivityCard({ activity: a, fallbackColor, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const ts = new Date(a.completed_at || a.created_at);
  const isFailed = a.status === 'failed';
  const projectColor = a.project_color || fallbackColor || '#7e57c2';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={a.description || ''}
      style={{
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${isFailed ? '#f5cdd1' : 'var(--border)'}`,
        borderLeft: `3px solid ${isFailed ? '#e5484d' : projectColor}`,
        borderRadius: 8, padding: '8px 10px', marginBottom: 5,
        transition: 'background 0.12s, border-color 0.12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        {a.project_name && (
          <span style={{
            fontSize: 10.5, fontWeight: 600, color: projectColor,
            background: 'var(--surface2)', borderRadius: 4, padding: '1px 6px',
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
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(a.id); }}
            title="Delete"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 2, lineHeight: 0, flexShrink: 0,
              color: hovered ? '#e5484d' : 'var(--text-muted)',
              opacity: hovered ? 1 : 0.45,
              transition: 'opacity 0.12s, color 0.12s',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, wordBreak: 'break-word' }}>
        {a.title}
      </div>
    </div>
  );
}
