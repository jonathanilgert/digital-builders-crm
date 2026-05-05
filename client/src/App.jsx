import React, { useEffect, useState } from 'react';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import WorkingHours from './components/WorkingHours';
import Projects from './components/Projects';
import Chat from './components/Chat';
import Ideas from './components/Ideas';
import Login from './Login';

const T = {
  bg: '#fafaf9', card: '#ffffff', ink: '#0f1115', ink2: '#1f2228',
  mid: '#6b7280', mute: '#9ca3af', faint: '#c7c7c5',
  line: '#ececea', lineSoft: '#f3f3f1', hover: '#f7f7f5', blue: '#3b7ff5',
};

const Icon = ({ d, size = 16, stroke = 'currentColor', sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV = [
  { id: 'tasks',    label: 'Tasks',         short: 'Tasks',    icon: 'M9 11l2 2 4-4M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z' },
  { id: 'calendar', label: 'Calendar',      short: 'Calendar', icon: 'M4 6h16v14H4zM4 10h16M9 4v4M15 4v4' },
  { id: 'projects', label: 'Projects',      short: 'Projects', icon: 'M3 8h18v12H3zM8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M3 13h18' },
  { id: 'hours',    label: 'Working hours', short: 'Hours',    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2' },
  { id: 'chat',     label: 'Chat',          short: 'Chat',     icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { id: 'ideas',    label: 'Ideas',         short: 'Ideas',    icon: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1' },
];

async function logout() {
  try {
    await fetch(`${import.meta.env.BASE_URL}api/auth/logout`, {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch {}
  window.location.reload();
}

/* ── Desktop sidebar ── */
function Sidebar({ page, setPage }) {
  const [hover, setHover] = useState(null);
  return (
    <nav style={{
      width: 210, flexShrink: 0,
      background: T.card, borderRight: `1px solid ${T.line}`,
      padding: '18px 14px', display: 'flex', flexDirection: 'column',
      height: '100dvh',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 20px' }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6, background: T.ink,
          display: 'grid', placeItems: 'center',
          color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>D</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.015em', color: T.ink }}>
          Digital<span style={{ color: T.mid, fontWeight: 500 }}>Builders</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV.map(({ id, label, icon }) => {
          const active  = page === id;
          const hovered = hover === id;
          return (
            <button key={id} onClick={() => setPage(id)}
              onMouseEnter={() => setHover(id)} onMouseLeave={() => setHover(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '7px 10px', borderRadius: 8,
                fontSize: 13.5, fontWeight: active ? 600 : 500,
                color: active ? T.ink : T.ink2,
                background: active ? T.hover : hovered ? T.bg : 'transparent',
                border: 'none', cursor: 'pointer',
                textAlign: 'left', letterSpacing: '-0.01em', transition: 'background .13s',
              }}>
              <Icon d={icon} size={16} stroke={active ? T.ink : T.mid} sw={1.7} />
              {label}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '7px 10px', borderRadius: 8,
          fontSize: 12.5, fontWeight: 500, color: T.mid,
          background: 'transparent', border: 'none', cursor: 'pointer',
          textAlign: 'left', letterSpacing: '-0.01em',
        }}>
          <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={14} stroke={T.mute} sw={1.7} />
          Sign out
        </button>
      </div>
    </nav>
  );
}

/* ── Mobile header: logo row + horizontal page tabs ── */
function MobileHeader({ page, setPage }) {
  return (
    <div style={{
      background: T.card, borderBottom: `1px solid ${T.line}`,
      flexShrink: 0,
    }}>
      {/* Logo row */}
      <div style={{
        height: 46, display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 8,
        borderBottom: `1px solid ${T.lineSoft}`,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6, background: T.ink,
          display: 'grid', placeItems: 'center',
          color: '#fff', fontSize: 11, fontWeight: 700,
        }}>D</div>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.015em', color: T.ink }}>
          Digital<span style={{ color: T.mid, fontWeight: 500 }}>Builders</span>
        </span>
      </div>

      {/* Page tab pills — horizontally scrollable */}
      <div style={{
        display: 'flex', alignItems: 'center',
        overflowX: 'auto', gap: 6, padding: '8px 12px',
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
      }}>
        {NAV.map(({ id, short, icon }) => {
          const active = page === id;
          return (
            <button key={id} onClick={() => setPage(id)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 13px', borderRadius: 99,
              border: active ? 'none' : `1px solid ${T.line}`,
              background: active ? T.ink : T.bg,
              color: active ? '#fff' : T.mid,
              fontSize: 12.5, fontWeight: active ? 600 : 500,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'all .15s',
            }}>
              <Icon d={icon} size={12} stroke={active ? '#fff' : T.mute} sw={1.8} />
              {short}
            </button>
          );
        })}
        <button onClick={logout} style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 11px', borderRadius: 99,
          border: `1px solid ${T.line}`, background: T.bg, color: T.mid,
          fontSize: 12, fontWeight: 500, cursor: 'pointer',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={11} stroke={T.mute} sw={1.8} />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('tasks');
  const [authState, setAuthState] = useState('checking'); // checking | in | out

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}api/auth/me`, { credentials: 'same-origin' })
      .then(res => { if (!cancelled) setAuthState(res.ok ? 'in' : 'out'); })
      .catch(() => { if (!cancelled) setAuthState('out'); });
    return () => { cancelled = true; };
  }, []);

  if (authState === 'checking') {
    return <div style={{ minHeight: '100dvh', background: T.bg }} />;
  }
  if (authState === 'out') {
    return <Login onSuccess={() => setAuthState('in')} />;
  }

  return (
    <>
      {/* Inline media query — not affected by CSS file caching */}
      <style>{`
        .db-sidebar      { display: flex !important; }
        .db-mobile-hdr   { display: none !important; }
        .db-scrollbar-hide::-webkit-scrollbar { display: none; }
        @media (max-width: 899px) {
          .db-sidebar    { display: none !important; }
          .db-mobile-hdr { display: block !important; }
        }
      `}</style>

      <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: T.bg, width: '100%' }}>

        {/* Desktop sidebar */}
        <div className="db-sidebar" style={{ flexDirection: 'column' }}>
          <Sidebar page={page} setPage={setPage} />
        </div>

        {/* Content column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Mobile header (hidden on desktop) */}
          <div className="db-mobile-hdr">
            <MobileHeader page={page} setPage={setPage} />
          </div>

          {/* Page content */}
          <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {page === 'tasks'    && <Tasks />}
            {page === 'calendar' && <Calendar />}
            {page === 'projects' && <Projects />}
            {page === 'hours'    && <WorkingHours />}
            {page === 'chat'     && <Chat />}
            {page === 'ideas'    && <Ideas />}
          </main>
        </div>
      </div>
    </>
  );
}
