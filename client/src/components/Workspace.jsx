import React, { useState, useEffect, useRef } from 'react';

const api = (path, opts) => fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });

const T = {
  bg: '#fafaf9', card: '#ffffff', ink: '#0f1115', ink2: '#1f2228',
  mid: '#6b7280', mute: '#9ca3af', faint: '#c7c7c5',
  line: '#ececea', lineSoft: '#f3f3f1', hover: '#f7f7f5',
  blue: '#3b7ff5', blueSoft: '#eaf1fe',
  red: '#e5484d', amber: '#d68a23', green: '#2f9e6e',
  shadow: '0 1px 2px rgba(15,17,21,0.04)',
};

const Icon = ({ d, size = 16, stroke = 'currentColor', sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

function Card({ children, style, padding = 20 }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.line}`,
      borderRadius: 12, boxShadow: T.shadow, padding, ...style,
    }}>{children}</div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: T.mute,
    }}>{children}</div>
  );
}

/* ── Stats Row ── */
function StatsRow({ tasks, events }) {
  const open = tasks.filter(t => t.status !== 'done').length;
  const now = new Date();
  const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
  const thisWeek = events.filter(e => {
    const d = new Date(e.date);
    return d >= now && d <= weekEnd;
  }).length;

  return (
    <div style={{ display: 'flex', gap: 14 }}>
      {[
        { label: 'Open tasks', value: open },
        { label: 'Events this week', value: thisWeek },
        { label: 'Hours today', value: '—' },
      ].map(s => (
        <Card key={s.label} style={{ flex: 1 }} padding={16}>
          <SectionLabel>{s.label}</SectionLabel>
          <div style={{
            fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em',
            color: T.ink, marginTop: 10, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          }}>{s.value}</div>
        </Card>
      ))}
    </div>
  );
}

/* ── Tasks Widget ── */
function TasksWidget({ tasks }) {
  const [showAll, setShowAll] = useState(false);
  const [localTasks, setLocalTasks] = useState(tasks);

  useEffect(() => { setLocalTasks(tasks); }, [tasks]);

  const sorted = [...localTasks].sort((a, b) =>
    (a.status === 'done' ? 1 : 0) - (b.status === 'done' ? 1 : 0)
  );
  const visible = showAll ? sorted : sorted.slice(0, 6);

  const toggle = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    setLocalTasks(ts => ts.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    await api(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ ...task, status: newStatus }) });
  };

  return (
    <Card padding={0}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 10px' }}>
        <SectionLabel>Tasks</SectionLabel>
        <button onClick={() => setShowAll(s => !s)} style={{
          background: 'transparent', border: 'none',
          color: T.blue, fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: 0,
        }}>{showAll ? 'Show less' : 'View all'}</button>
      </div>
      <div style={{ padding: '0 20px 14px' }}>
        {visible.map(t => <TaskRow key={t.id} task={t} onToggle={() => toggle(t)} />)}
        {localTasks.length === 0 && (
          <div style={{ textAlign: 'center', color: T.mute, fontSize: 13, padding: '18px 0' }}>No tasks yet</div>
        )}
      </div>
    </Card>
  );
}

function TaskRow({ task, onToggle }) {
  const [hover, setHover] = useState(false);
  const done = task.status === 'done';
  const overdue = task.due_date && new Date(task.due_date + 'T00:00:00') < new Date() && !done;

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid', gridTemplateColumns: '18px 1fr auto',
        alignItems: 'center', gap: 12,
        padding: '9px 4px', borderBottom: `1px solid ${T.lineSoft}`,
        background: hover ? T.hover : 'transparent',
        marginLeft: -4, marginRight: -4, paddingLeft: 4, paddingRight: 4,
        borderRadius: 6, transition: 'background .12s', cursor: 'pointer',
      }}
      onClick={onToggle}>
      <div style={{
        width: 16, height: 16, borderRadius: 5, flexShrink: 0,
        border: `1.5px solid ${done ? T.blue : T.faint}`,
        background: done ? T.blue : 'transparent',
        display: 'grid', placeItems: 'center',
        transition: 'all .15s',
      }}>
        {done && <Icon d="M5 12l5 5 9-11" size={10} stroke="#fff" sw={2.6} />}
      </div>
      <div style={{
        fontSize: 13.5, fontWeight: 500, color: done ? T.mute : T.ink,
        letterSpacing: '-0.005em',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        textDecoration: done ? 'line-through' : 'none',
        textDecorationColor: T.mute,
      }}>{task.title}</div>
      <div style={{
        fontSize: 11.5, color: overdue ? T.red : T.mid, fontWeight: 500,
        whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
      }}>
        {task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
      </div>
    </div>
  );
}

/* ── Ideas Widget ── */
const INITIAL_IDEAS = [
  { id: 'i1', text: 'Add a "client digest" auto-email every Friday — pulls open tasks + next week events' },
  { id: 'i2', text: 'Test a referral kickback for past clients (10% of first invoice)' },
  { id: 'i3', text: 'Productize the onboarding deck as a Notion template?' },
];

function IdeasWidget() {
  const [ideas, setIdeas] = useState(INITIAL_IDEAS);
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);

  const submit = () => {
    const v = draft.trim();
    if (!v) return;
    setIdeas(prev => [{ id: 'i' + Date.now(), text: v }, ...prev]);
    setDraft('');
  };

  return (
    <Card padding={0}>
      <div style={{ padding: '16px 20px 10px' }}>
        <SectionLabel>Ideas</SectionLabel>
      </div>
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: 10, background: T.bg,
          border: `1px solid ${focused ? T.blue : T.line}`,
          borderRadius: 10, transition: 'border-color .15s',
        }}>
          <Icon d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
            size={14} stroke={focused ? T.blue : T.mute} sw={1.8} />
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
            placeholder="Capture an idea…  (⌘↵ to save)"
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none', resize: 'none',
              background: 'transparent', fontFamily: 'inherit',
              fontSize: 13, color: T.ink, lineHeight: 1.5, minHeight: 22, padding: '2px 0',
            }} />
          {draft.trim() && (
            <button onClick={submit} style={{
              padding: '4px 10px', background: T.blue, border: 'none', borderRadius: 6,
              color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
            }}>Save</button>
          )}
        </div>
      </div>
      <div style={{ padding: '0 20px 14px' }}>
        {ideas.map((it, i) => (
          <div key={it.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '9px 0',
            borderBottom: i < ideas.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
          }}>
            <span style={{ width: 4, height: 4, borderRadius: 99, background: T.faint, marginTop: 7, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: T.ink2, lineHeight: 1.5, flex: 1 }}>{it.text}</div>
            <button onClick={() => setIdeas(p => p.filter(x => x.id !== it.id))} style={{
              padding: '2px 6px', background: 'transparent', border: 'none',
              color: T.mute, fontSize: 11, cursor: 'pointer', borderRadius: 4,
            }}>×</button>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Chat Widget ── */
const INITIAL_MSGS = [
  { id: 'c1', mine: false, text: 'Pushed the staging branch — auth callback still flaky on Safari, can you take a look?' },
  { id: 'c2', mine: true,  text: 'On it. Also: invoice 2026-041 is queued for tonight.' },
  { id: 'c3', mine: false, text: 'Peneed wants to push the QBR to Thursday — moved it on the calendar 👍' },
];

function ChatWidget() {
  const [msgs, setMsgs] = useState(INITIAL_MSGS);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const send = () => {
    const v = draft.trim();
    if (!v) return;
    setMsgs(prev => [...prev, { id: 'c' + Date.now(), mine: true, text: v }]);
    setDraft('');
  };

  return (
    <Card padding={0} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${T.lineSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 99,
            background: '#dde8fb', color: '#1f4ea1',
            display: 'grid', placeItems: 'center',
            fontSize: 10, fontWeight: 700,
          }}>P</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, lineHeight: 1.2 }}>Partner</div>
            <div style={{ fontSize: 10.5, color: T.mute }}>Chat</div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {msgs.map(m => (
          <div key={m.id} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: m.mine ? 'flex-end' : 'flex-start',
            alignSelf: m.mine ? 'flex-end' : 'flex-start',
            maxWidth: '82%',
            gap: 2,
          }}>
            <div style={{
              padding: '8px 12px', borderRadius: 12,
              background: m.mine ? T.blue : T.bg,
              color: m.mine ? '#fff' : T.ink,
              border: m.mine ? 'none' : `1px solid ${T.line}`,
              borderTopRightRadius: m.mine ? 4 : 12,
              borderTopLeftRadius: m.mine ? 12 : 4,
              fontSize: 13, lineHeight: 1.45,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>{m.text}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 14px 12px', borderTop: `1px solid ${T.lineSoft}`, display: 'flex', gap: 8 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Message…"
          style={{
            flex: 1, padding: '8px 12px',
            background: T.bg, border: `1px solid ${T.line}`, borderRadius: 8,
            fontFamily: 'inherit', fontSize: 13, color: T.ink, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = T.blue}
          onBlur={e => e.target.style.borderColor = T.line}
        />
        <button
          onClick={send}
          disabled={!draft.trim()}
          style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: draft.trim() ? T.blue : T.bg,
            border: `1px solid ${draft.trim() ? T.blue : T.line}`,
            display: 'grid', placeItems: 'center',
            cursor: draft.trim() ? 'pointer' : 'not-allowed',
            transition: 'all .15s',
          }}>
          <Icon d="M5 12h14M13 6l6 6-6 6" size={13} stroke={draft.trim() ? '#fff' : T.faint} sw={2.2} />
        </button>
      </div>
    </Card>
  );
}

/* ── Main ── */
export default function Workspace() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api('/tasks').then(r => r.json()).then(setTasks).catch(() => {});
    const now = new Date();
    api(`/events?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      .then(r => r.json()).then(setEvents).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* Page title */}
      <div style={{ padding: '24px 32px 0' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: T.ink }}>
          Workspace
        </h1>
      </div>

      {/* Stats */}
      <div style={{ padding: '20px 32px 0' }}>
        <StatsRow tasks={tasks} events={events} />
      </div>

      {/* Content grid: left (tasks + ideas) + right (chat) */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 340px',
        gap: 16, padding: '16px 32px 32px',
        flex: 1, minHeight: 0,
        alignItems: 'start',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TasksWidget tasks={tasks} />
          <IdeasWidget />
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 480 }}>
          <ChatWidget />
        </div>
      </div>
    </div>
  );
}
