import React, { useState, useRef } from 'react';

const T = {
  bg: '#fafaf9', card: '#ffffff', ink: '#0f1115', ink2: '#1f2228',
  mid: '#6b7280', mute: '#9ca3af', faint: '#c7c7c5',
  line: '#ececea', lineSoft: '#f3f3f1',
  blue: '#3b7ff5',
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

const INITIAL_IDEAS = [
  { id: 'ip1', title: 'Friday client digest', description: 'Auto-email every Friday with open tasks + next week\'s events. One per client.', at: new Date(Date.now() - 86400000) },
  { id: 'ip2', title: 'Referral kickback', description: 'Past clients get 10% of first invoice for any referral that converts.', at: new Date(Date.now() - 2 * 86400000) },
  { id: 'ip3', title: 'Onboarding deck → Notion template', description: 'Productize the deck as a paid Notion template. Low lift, recurring revenue.', at: new Date(Date.now() - 3 * 86400000) },
];

function IdeaRow({ idea, onRemove }) {
  const [hover, setHover] = useState(false);
  const fmt = idea.at.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px 16px', borderTop: `1px solid ${T.lineSoft}`,
      }}>
      <Icon d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
        size={13} stroke={T.mute} sw={1.8} style={{ marginTop: 3, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13.5, fontWeight: 600, color: T.ink,
          letterSpacing: '-0.01em', lineHeight: 1.4,
        }}>{idea.title}</div>
        {idea.description && (
          <div style={{ fontSize: 12.5, color: T.mid, lineHeight: 1.5, marginTop: 3 }}>
            {idea.description}
          </div>
        )}
        <div style={{
          fontSize: 10.5, color: T.mute, fontWeight: 500, marginTop: 6,
          fontVariantNumeric: 'tabular-nums',
        }}>{fmt}</div>
      </div>
      <button
        onClick={onRemove}
        style={{
          padding: 4, background: 'transparent', border: 'none',
          color: T.mute, cursor: 'pointer', borderRadius: 4,
          opacity: hover ? 1 : 0, transition: 'opacity .15s', flexShrink: 0,
        }}>
        <Icon d="M6 6l12 12M18 6L6 18" size={12} stroke={T.mute} sw={2} />
      </button>
    </div>
  );
}

export default function Ideas() {
  const [ideas, setIdeas] = useState(INITIAL_IDEAS);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [focused, setFocused] = useState(false);
  const titleRef = useRef(null);

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    setIdeas(prev => [{ id: 'ip' + Date.now(), title: t, description: description.trim(), at: new Date() }, ...prev]);
    setTitle('');
    setDescription('');
    if (titleRef.current) titleRef.current.focus();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ padding: '24px 32px 0' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: T.ink }}>Ideas</h1>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 32px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Composer */}
          <Card padding={0}>
            <div style={{ padding: '14px 16px 10px' }}>
              <SectionLabel>Capture an idea</SectionLabel>
            </div>
            <div style={{ padding: '0 16px 14px' }}>
              <div style={{
                display: 'flex', flexDirection: 'column',
                background: T.bg,
                border: `1px solid ${focused ? T.blue : T.line}`,
                borderRadius: 10, padding: 10,
                transition: 'border-color .15s',
              }}>
                <input
                  ref={titleRef}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
                  placeholder="Idea title…"
                  style={{
                    border: 'none', outline: 'none', background: 'transparent',
                    fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                    color: T.ink, letterSpacing: '-0.01em', padding: '2px 0',
                  }}
                />
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
                  placeholder="Description (optional) — ⌘↵ to save"
                  rows={2}
                  style={{
                    border: 'none', outline: 'none', resize: 'none',
                    background: 'transparent', fontFamily: 'inherit',
                    fontSize: 13, color: T.ink2, lineHeight: 1.5,
                    padding: '4px 0 2px', minHeight: 36,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                  <button
                    onClick={submit}
                    disabled={!title.trim()}
                    style={{
                      padding: '5px 12px', borderRadius: 7,
                      background: title.trim() ? T.blue : 'transparent',
                      border: title.trim() ? 'none' : `1px solid ${T.line}`,
                      color: title.trim() ? '#fff' : T.faint,
                      fontSize: 12, fontWeight: 600,
                      cursor: title.trim() ? 'pointer' : 'not-allowed',
                    }}>Save idea</button>
                </div>
              </div>
            </div>
          </Card>

          {/* List */}
          <Card padding={0}>
            <div style={{
              padding: '14px 16px 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <SectionLabel>All ideas</SectionLabel>
              <span style={{ fontSize: 11, color: T.mute, fontWeight: 500 }}>
                {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {ideas.map(idea => (
                <IdeaRow key={idea.id} idea={idea} onRemove={() => setIdeas(p => p.filter(x => x.id !== idea.id))} />
              ))}
              {ideas.length === 0 && (
                <div style={{
                  padding: '24px 16px', textAlign: 'center',
                  fontSize: 12, color: T.mute, borderTop: `1px solid ${T.lineSoft}`,
                }}>No ideas yet — add one above.</div>
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
