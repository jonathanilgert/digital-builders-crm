import React, { useState } from 'react';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import WorkingHours from './components/WorkingHours';
import Projects from './components/Projects';
import Chat from './components/Chat';
import Ideas from './components/Ideas';

const T = {
  bg: '#fafaf9', card: '#ffffff', ink: '#0f1115', ink2: '#1f2228',
  mid: '#6b7280', mute: '#9ca3af', faint: '#c7c7c5',
  line: '#ececea', hover: '#f7f7f5', blue: '#3b7ff5',
};

const Icon = ({ d, size = 16, stroke = 'currentColor', sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV = [
  { id: 'tasks',     label: 'Tasks',         icon: 'M9 11l2 2 4-4M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z' },
  { id: 'calendar',  label: 'Calendar',      icon: 'M4 6h16v14H4zM4 10h16M9 4v4M15 4v4' },
  { id: 'projects',  label: 'Projects',      icon: 'M3 8h18v12H3zM8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M3 13h18' },
  { id: 'hours',     label: 'Working hours', icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2' },
  { id: 'chat',      label: 'Chat',          icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { id: 'ideas',     label: 'Ideas',         icon: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1' },
];

function Sidebar({ page, setPage }) {
  const [hover, setHover] = useState(null);

  return (
    <nav style={{
      width: 210, flexShrink: 0,
      background: T.card,
      borderRight: `1px solid ${T.line}`,
      padding: '18px 14px',
      display: 'flex', flexDirection: 'column',
      height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 20px' }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: T.ink, display: 'grid', placeItems: 'center',
          color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '-0.02em',
          flexShrink: 0,
        }}>D</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.015em', color: T.ink }}>
          Digital<span style={{ color: T.mid, fontWeight: 500 }}>Builders</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV.map(({ id, label, icon }) => {
          const active = page === id;
          const hovered = hover === id;
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              onMouseEnter={() => setHover(id)}
              onMouseLeave={() => setHover(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '7px 10px', borderRadius: 8,
                fontSize: 13.5, fontWeight: active ? 600 : 500,
                color: active ? T.ink : T.ink2,
                background: active ? T.hover : hovered ? T.bg : 'transparent',
                border: 'none', cursor: 'pointer',
                textAlign: 'left', letterSpacing: '-0.01em',
                transition: 'background .13s',
              }}>
              <Icon d={icon} size={16} stroke={active ? T.ink : T.mid} sw={1.7} />
              {label}
            </button>
          );
        })}
      </div>

    </nav>
  );
}

export default function App() {
  const [page, setPage] = useState('tasks');

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: T.bg, width: '100%' }}>
      <Sidebar page={page} setPage={setPage} />
      <main style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {page === 'tasks'     && <Tasks />}
        {page === 'calendar'  && <Calendar />}
        {page === 'projects'  && <Projects />}
        {page === 'hours'     && <WorkingHours />}
        {page === 'chat'      && <Chat />}
        {page === 'ideas'     && <Ideas />}
      </main>
    </div>
  );
}
