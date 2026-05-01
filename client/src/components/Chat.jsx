import React, { useState, useRef, useEffect } from 'react';
import useIsMobile from '../hooks/useIsMobile';

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

const fmtTime = (date) => {
  let h = date.getHours(), m = date.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
};

const INITIAL_MESSAGES = [
  { id: 'm1', mine: false, text: 'Hey! Quick question about the DirtLink sprint review — are we still on for 2pm?', at: new Date(Date.now() - 3 * 60000) },
  { id: 'm2', mine: true,  text: "Yep, calendar invite still stands. I'll bring the demo build.", at: new Date(Date.now() - 2 * 60000) },
  { id: 'm3', mine: false, text: "Perfect. I'll loop in Sam after.", at: new Date(Date.now() - 60000) },
];

export default function Chat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);
  const inputRef  = useRef(null);
  const isMobile  = useIsMobile();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: 'm' + Date.now(), mine: true, text, at: new Date() }]);
    setDraft('');
    if (inputRef.current) inputRef.current.focus();
  };

  const pad = isMobile ? '10px 12px 12px' : '20px 32px 24px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {!isMobile && (
        <div style={{ padding: '24px 32px 0' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: T.ink }}>Chat</h1>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, padding: pad, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          background: T.card, border: `1px solid ${T.line}`, borderRadius: isMobile ? 14 : 12,
          boxShadow: T.shadow,
          flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, width: '100%',
        }}>
          {/* Header */}
          <div style={{
            padding: isMobile ? '12px 14px' : '14px 18px',
            borderBottom: `1px solid ${T.lineSoft}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 99,
              background: '#dde8fb', color: '#1f4ea1',
              display: 'grid', placeItems: 'center',
              fontSize: 12, fontWeight: 700,
            }}>J</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>Jonathan</div>
              <div style={{ fontSize: 11, color: T.mute, fontWeight: 500 }}>Online</div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{
            flex: 1, minHeight: 0, overflowY: 'auto',
            padding: isMobile ? '14px 12px' : '20px 18px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {messages.map(m => (
              <div key={m.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: m.mine ? 'flex-end' : 'flex-start',
                alignSelf: m.mine ? 'flex-end' : 'flex-start',
                gap: 3, maxWidth: isMobile ? '86%' : '78%',
              }}>
                <div style={{
                  padding: '8px 12px', borderRadius: 14,
                  background: m.mine ? T.blue : T.bg,
                  color: m.mine ? '#fff' : T.ink,
                  border: m.mine ? 'none' : `1px solid ${T.line}`,
                  borderTopRightRadius: m.mine ? 4 : 14,
                  borderTopLeftRadius:  m.mine ? 14 : 4,
                  fontSize: isMobile ? 13.5 : 13, lineHeight: 1.45,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>{m.text}</div>
                <div style={{
                  fontSize: 10, color: T.mute, fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums', padding: '0 4px',
                }}>{fmtTime(m.at)}</div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div style={{
            padding: isMobile ? '8px 10px' : 12,
            borderTop: `1px solid ${T.lineSoft}`,
            display: 'flex', gap: 8, alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Write a message…"
              rows={1}
              style={{
                flex: 1, resize: 'none', padding: '9px 12px',
                borderRadius: 10, border: `1px solid ${T.line}`,
                background: T.bg, fontFamily: 'inherit',
                fontSize: isMobile ? 15 : 13, color: T.ink, outline: 'none', lineHeight: 1.45,
                maxHeight: 120, minHeight: isMobile ? 42 : 36,
              }}
              onFocus={e => e.target.style.borderColor = T.blue}
              onBlur={e => e.target.style.borderColor = T.line}
            />
            <button onClick={send} disabled={!draft.trim()} aria-label="Send" style={{
              width: isMobile ? 42 : 36, height: isMobile ? 42 : 36,
              borderRadius: 10, flexShrink: 0,
              background: draft.trim() ? T.blue : T.bg,
              border: `1px solid ${draft.trim() ? T.blue : T.line}`,
              cursor: draft.trim() ? 'pointer' : 'not-allowed',
              display: 'grid', placeItems: 'center', transition: 'all .15s',
            }}>
              <Icon d="M5 12h14M13 6l6 6-6 6" size={14} stroke={draft.trim() ? '#fff' : T.faint} sw={2.2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
