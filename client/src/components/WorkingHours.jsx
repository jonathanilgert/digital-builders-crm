import React, { useState, useMemo, useEffect } from 'react';

const api = (path, opts) => fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });

const T = {
  bg: '#fafaf9', card: '#ffffff', ink: '#0f1115', ink2: '#1f2228',
  mid: '#6b7280', mute: '#9ca3af', faint: '#c7c7c5',
  line: '#ececea', lineSoft: '#f3f3f1',
  blue: '#3b7ff5', blueBar: '#cdd9ed',
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

function FieldLabel({ children }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 600, color: T.mute,
      letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4,
    }}>{children}</div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: `1px solid ${T.line}`, background: T.bg,
  fontFamily: 'inherit', fontSize: 13, color: T.ink,
  outline: 'none', boxSizing: 'border-box',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const startOfWeek = (date) => {
  const x = new Date(date);
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const dateKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const iconBtnStyle = {
  width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: T.card, border: `1px solid ${T.line}`, borderRadius: 8, cursor: 'pointer', padding: 0,
};

export default function WorkingHours() {
  const today = useMemo(() => new Date(), []);
  const [hoursMap, setHoursMap] = useState({});
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [draftDate, setDraftDate] = useState(toDateStr(today));
  const [draftHours, setDraftHours] = useState('');

  const parseHoursFromEntry = (e) => {
    if (!e.clock_in || !e.clock_out) return 0;
    const [inH, inM] = e.clock_in.split(':').map(Number);
    const [outH, outM] = e.clock_out.split(':').map(Number);
    return Math.max(0, (outH * 60 + outM - (inH * 60 + inM)) / 60);
  };

  useEffect(() => {
    api('/hours').then(r => r.json()).then(entries => {
      const map = {};
      entries.forEach(e => {
        if (!e.date || !e.clock_in || !e.clock_out) return;
        const [y, mo, d] = e.date.split('-').map(Number);
        const k = dateKey(new Date(y, mo - 1, d));
        map[k] = (map[k] || 0) + parseHoursFromEntry(e);
      });
      setHoursMap(map);
    }).catch(() => {});
  }, []);

  const log = async () => {
    const v = parseFloat(draftHours);
    if (!isFinite(v) || v <= 0) return;
    const [y, m, d] = draftDate.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const k = dateKey(target);
    setHoursMap(prev => ({ ...prev, [k]: (prev[k] || 0) + v }));

    const startH = 9, startM = 0;
    const totalMins = startH * 60 + startM + Math.round(v * 60);
    const endH = Math.floor(totalMins / 60), endM = totalMins % 60;
    const fmt = (h, min) => `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    await api('/hours/manual', {
      method: 'POST',
      body: JSON.stringify({ date: draftDate, clock_in: fmt(startH, startM), clock_out: fmt(endH, endM) }),
    }).catch(() => {});
    setDraftHours('');
  };

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);

  const weekValues = weekDays.map(d => hoursMap[dateKey(d)] || 0);
  const weekTotal = weekValues.reduce((a, b) => a + b, 0);
  const todayHours = hoursMap[dateKey(today)] || 0;
  const maxBar = Math.max(8, ...weekValues);

  const weekLabel = (() => {
    const end = new Date(weekStart); end.setDate(end.getDate() + 6);
    const sameMonth = weekStart.getMonth() === end.getMonth();
    const s = weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const e = end.toLocaleDateString(undefined, sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' });
    return `${s} – ${e}`;
  })();

  const goPrev = () => setWeekStart(w => { const x = new Date(w); x.setDate(x.getDate() - 7); return x; });
  const goNext = () => setWeekStart(w => { const x = new Date(w); x.setDate(x.getDate() + 7); return x; });
  const goThis = () => setWeekStart(startOfWeek(today));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ padding: '24px 32px 0' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: T.ink }}>Working Hours</h1>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 32px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Card padding={0}>
              <div style={{ padding: '14px 16px' }}>
                <SectionLabel>Today</SectionLabel>
                <div style={{
                  fontSize: 26, fontWeight: 600, color: T.ink,
                  letterSpacing: '-0.02em', marginTop: 6, fontVariantNumeric: 'tabular-nums',
                }}>
                  {todayHours.toFixed(1)}<span style={{ fontSize: 14, color: T.mute, fontWeight: 500, marginLeft: 4 }}>hrs</span>
                </div>
              </div>
            </Card>
            <Card padding={0}>
              <div style={{ padding: '14px 16px' }}>
                <SectionLabel>This week</SectionLabel>
                <div style={{
                  fontSize: 26, fontWeight: 600, color: T.ink,
                  letterSpacing: '-0.02em', marginTop: 6, fontVariantNumeric: 'tabular-nums',
                }}>
                  {weekTotal.toFixed(1)}<span style={{ fontSize: 14, color: T.mute, fontWeight: 500, marginLeft: 4 }}>hrs</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Log hours */}
          <Card padding={0}>
            <div style={{ padding: '14px 16px 10px' }}>
              <SectionLabel>Log hours</SectionLabel>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <FieldLabel>Date</FieldLabel>
                <input type="date" value={draftDate} onChange={e => setDraftDate(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel>Hours</FieldLabel>
                <input
                  id="hours-input"
                  type="number" min="0" step="0.25"
                  value={draftHours}
                  onChange={e => setDraftHours(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') log(); }}
                  placeholder="e.g. 4.5"
                  style={inputStyle}
                />
              </div>
              <button
                onClick={log}
                disabled={!draftHours || parseFloat(draftHours) <= 0}
                style={{
                  padding: '8px 14px', borderRadius: 8, height: 36, whiteSpace: 'nowrap',
                  background: (draftHours && parseFloat(draftHours) > 0) ? T.blue : T.bg,
                  border: `1px solid ${(draftHours && parseFloat(draftHours) > 0) ? T.blue : T.line}`,
                  color: (draftHours && parseFloat(draftHours) > 0) ? '#fff' : T.faint,
                  fontSize: 12.5, fontWeight: 600,
                  cursor: (draftHours && parseFloat(draftHours) > 0) ? 'pointer' : 'not-allowed',
                }}>Log hours</button>
            </div>
          </Card>

          {/* Week chart */}
          <Card padding={0}>
            <div style={{
              padding: '14px 16px 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <SectionLabel>Hours this week</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={goPrev} style={iconBtnStyle}>
                  <Icon d="M15 6l-6 6 6 6" size={12} stroke={T.mid} sw={2} />
                </button>
                <button onClick={goThis} style={{
                  padding: '5px 10px', borderRadius: 8,
                  background: T.card, border: `1px solid ${T.line}`,
                  fontSize: 11.5, fontWeight: 500, color: T.mid, cursor: 'pointer',
                }}>This week</button>
                <button onClick={goNext} style={iconBtnStyle}>
                  <Icon d="M9 6l6 6-6 6" size={12} stroke={T.mid} sw={2} />
                </button>
                <span style={{
                  fontSize: 11.5, color: T.mid, fontWeight: 500, marginLeft: 6,
                  fontVariantNumeric: 'tabular-nums', minWidth: 110, textAlign: 'right',
                }}>{weekLabel}</span>
              </div>
            </div>

            <div style={{ padding: '8px 20px 20px' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 12, alignItems: 'end', height: 180,
              }}>
                {weekDays.map((d, i) => {
                  const v = weekValues[i];
                  const isToday = isSameDay(d, today);
                  const pct = (v / maxBar) * 100;
                  return (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'flex-end',
                      height: '100%', gap: 6,
                    }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                        color: v > 0 ? T.ink2 : T.faint,
                        opacity: v > 0 ? 1 : 0,
                      }}>{v.toFixed(1)}</span>
                      <div style={{
                        width: '100%', maxWidth: 36,
                        height: `${Math.max(pct, v > 0 ? 4 : 0)}%`,
                        minHeight: v > 0 ? 4 : 0,
                        background: isToday ? T.blue : T.blueBar,
                        borderRadius: 4,
                        transition: 'height .25s ease',
                      }} />
                    </div>
                  );
                })}
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 12, marginTop: 8,
                borderTop: `1px solid ${T.lineSoft}`, paddingTop: 8,
              }}>
                {weekDays.map((d, i) => {
                  const isToday = isSameDay(d, today);
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{
                        fontSize: 11, fontWeight: isToday ? 600 : 500,
                        color: isToday ? T.blue : T.mid,
                      }}>{DAY_NAMES[i]}</span>
                      <span style={{
                        fontSize: 10, color: T.mute, fontVariantNumeric: 'tabular-nums',
                      }}>{d.getDate()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
