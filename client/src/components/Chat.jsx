import React, { useState, useRef, useEffect } from 'react';
import useIsMobile from '../hooks/useIsMobile';

const T = {
  bg: '#fafaf9', card: '#ffffff', ink: '#0f1115', ink2: '#1f2228',
  mid: '#6b7280', mute: '#9ca3af', faint: '#c7c7c5',
  line: '#ececea', lineSoft: '#f3f3f1',
  blue: '#3b7ff5',
  shadow: '0 1px 2px rgba(15,17,21,0.04)',
};

const HUMANS = ['Jonathan', 'Alex'];
const AGENTS = ['Hubert', 'Nicholas', 'Constance'];
const ALL_SENDERS = [...HUMANS, ...AGENTS];

const SENDER_COLOR = {
  Jonathan:  '#06b6d4', // cyan
  Alex:      '#ec4899', // pink
  Hubert:    '#7c3aed', // violet
  Nicholas:  '#14b8a6', // teal
  Constance: '#6366f1', // indigo
};

const ME_KEY = 'db_chat_me';
const POLL_MS = 4000;

function readMe() {
  try {
    const stored = localStorage.getItem(ME_KEY);
    if (HUMANS.includes(stored)) return stored;
  } catch {}
  return null;
}

function writeMe(name) {
  try { localStorage.setItem(ME_KEY, name); } catch {}
}

const fmtTime = (date) => {
  let h = date.getHours(), m = date.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
};

const api = (path, opts) => fetch(`${import.meta.env.BASE_URL}api${path}`, {
  headers: { 'Content-Type': 'application/json' },
  credentials: 'same-origin',
  ...opts,
});

function Avatar({ name, size = 30 }) {
  const color = SENDER_COLOR[name] || T.mute;
  const initial = (name || '?').slice(0, 1).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 99,
      background: color + '22', color,
      display: 'grid', placeItems: 'center',
      fontSize: size * 0.42, fontWeight: 700, flexShrink: 0,
    }}>{initial}</div>
  );
}

export default function Chat() {
  const [me, setMe] = useState(readMe);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef  = useRef(null);
  const lastIdRef = useRef(0);
  const isMobile  = useIsMobile();

  // initial load + polling
  useEffect(() => {
    let cancelled = false;
    let timer = null;

    async function poll() {
      try {
        const path = lastIdRef.current ? `/messages?since=${lastIdRef.current}` : '/messages';
        const res = await api(path);
        if (!res.ok) throw new Error('Failed to load');
        const rows = await res.json();
        if (cancelled) return;
        if (rows.length) {
          setMessages(prev => {
            const seen = new Set(prev.map(m => m.id));
            const merged = [...prev];
            for (const r of rows) if (!seen.has(r.id)) merged.push(r);
            merged.sort((a, b) => a.id - b.id);
            const maxId = merged.length ? merged[merged.length - 1].id : 0;
            if (maxId > lastIdRef.current) lastIdRef.current = maxId;
            return merged;
          });
        }
        setLoadError(null);
      } catch (err) {
        if (!cancelled) setLoadError('Connection lost — retrying.');
      } finally {
        if (!cancelled) timer = setTimeout(poll, POLL_MS);
      }
    }

    poll();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, []);

  // auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  function pickMe(name) {
    if (!HUMANS.includes(name)) return;
    writeMe(name);
    setMe(name);
  }

  async function send() {
    const text = draft.trim();
    if (!text || !me || sending) return;
    setSending(true);
    try {
      const res = await api('/messages', {
        method: 'POST',
        body: JSON.stringify({ sender: me, text }),
      });
      if (!res.ok) throw new Error('Failed to send');
      const row = await res.json();
      setMessages(prev => {
        if (prev.some(m => m.id === row.id)) return prev;
        const next = [...prev, row].sort((a, b) => a.id - b.id);
        if (row.id > lastIdRef.current) lastIdRef.current = row.id;
        return next;
      });
      setDraft('');
      if (inputRef.current) inputRef.current.focus();
    } catch {
      // leave draft so user can retry; surface a soft inline note
      setLoadError('Send failed — try again.');
    } finally {
      setSending(false);
    }
  }

  if (!me) return <IdentityPicker onPick={pickMe} isMobile={isMobile} />;

  const pad = isMobile ? '10px 12px 12px' : '20px 32px 24px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {!isMobile && (
        <div style={{ padding: '24px 32px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: T.ink }}>Chat</h1>
          <MeSwitch me={me} onPick={pickMe} />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: -6 }}>
              {ALL_SENDERS.map((n, i) => (
                <div key={n} style={{ marginLeft: i === 0 ? 0 : -8, border: `2px solid ${T.card}`, borderRadius: 99 }}>
                  <Avatar name={n} size={26} />
                </div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>Team chat</div>
              <div style={{ fontSize: 11, color: T.mute, fontWeight: 500 }}>
                Jonathan · Alex · Hubert · Nicholas · Constance
              </div>
            </div>
            {isMobile && <MeSwitch me={me} onPick={pickMe} compact />}
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{
            flex: 1, minHeight: 0, overflowY: 'auto',
            padding: isMobile ? '14px 12px' : '20px 18px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {messages.length === 0 && !loadError && (
              <div style={{
                color: T.mute, fontSize: 12.5, padding: '24px 8px',
                textAlign: 'center', lineHeight: 1.55,
              }}>
                Nothing here yet. Roadblocks or tweaks of instruction live here —
                anyone can post (humans + Hubert + Nicholas + Constance).
              </div>
            )}
            {messages.map(m => {
              const mine = m.sender === me;
              const isAgent = AGENTS.includes(m.sender);
              const senderColor = SENDER_COLOR[m.sender] || T.mute;
              return (
                <div key={m.id} style={{
                  display: 'flex', gap: 8,
                  flexDirection: mine ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                }}>
                  {!mine && <Avatar name={m.sender} size={26} />}
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: mine ? 'flex-end' : 'flex-start',
                    gap: 3, maxWidth: isMobile ? '78%' : '70%',
                  }}>
                    {!mine && (
                      <div style={{
                        fontSize: 10.5, fontWeight: 600, color: senderColor,
                        padding: '0 6px', letterSpacing: '0.01em',
                      }}>
                        {m.sender}{isAgent ? ' · agent' : ''}
                      </div>
                    )}
                    <div style={{
                      padding: '8px 12px', borderRadius: 14,
                      background: mine ? T.blue : (isAgent ? (senderColor + '15') : T.bg),
                      color: mine ? '#fff' : T.ink,
                      border: mine ? 'none' : `1px solid ${isAgent ? (senderColor + '40') : T.line}`,
                      borderTopRightRadius: mine ? 4 : 14,
                      borderTopLeftRadius:  mine ? 14 : 4,
                      fontSize: isMobile ? 13.5 : 13, lineHeight: 1.45,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>{m.text}</div>
                    <div style={{
                      fontSize: 10, color: T.mute, fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums', padding: '0 4px',
                    }}>{fmtTime(new Date(m.created_at))}</div>
                  </div>
                </div>
              );
            })}
            {loadError && (
              <div style={{ fontSize: 11.5, color: T.mute, textAlign: 'center', padding: '4px 0' }}>
                {loadError}
              </div>
            )}
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
              placeholder={`Write as ${me}…`}
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
            <button onClick={send} disabled={!draft.trim() || sending} aria-label="Send" style={{
              width: isMobile ? 42 : 36, height: isMobile ? 42 : 36,
              borderRadius: 10, flexShrink: 0,
              background: draft.trim() && !sending ? T.blue : T.bg,
              border: `1px solid ${draft.trim() && !sending ? T.blue : T.line}`,
              cursor: draft.trim() && !sending ? 'pointer' : 'not-allowed',
              display: 'grid', placeItems: 'center', transition: 'all .15s',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={draft.trim() && !sending ? '#fff' : T.faint}
                strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MeSwitch({ me, onPick, compact }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 12, color: T.mid,
    }}>
      {!compact && <span>Posting as</span>}
      <select
        value={me}
        onChange={e => onPick(e.target.value)}
        style={{
          width: 'auto', fontSize: 12, padding: '4px 8px',
          borderRadius: 8, border: `1px solid ${T.line}`,
          background: T.bg, color: T.ink, fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {HUMANS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  );
}

function IdentityPicker({ onPick, isMobile }) {
  return (
    <div style={{
      flex: 1, minHeight: 0,
      display: 'grid', placeItems: 'center',
      padding: 24,
    }}>
      <div style={{
        background: T.card, border: `1px solid ${T.line}`,
        borderRadius: 14, padding: isMobile ? 22 : 28,
        boxShadow: T.shadow, maxWidth: 360, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: '-0.015em' }}>
          Who's posting?
        </div>
        <div style={{ fontSize: 12.5, color: T.mid, lineHeight: 1.5 }}>
          This workspace is shared. Pick which human you are — your choice is
          remembered on this browser and used to tag messages you send.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
          {HUMANS.map(n => (
            <button key={n} onClick={() => onPick(n)} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '12px 14px', borderRadius: 10,
              border: `1px solid ${T.line}`, background: T.bg,
              cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
              color: T.ink, textAlign: 'left',
            }}>
              <Avatar name={n} size={28} />
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
