import React, { useState, useEffect } from 'react';

const api = (path, opts) => fetch(`${import.meta.env.BASE_URL}api${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Calendar() {
  const today = new Date();
  const [current, setCurrent] = useState({ month: today.getMonth(), year: today.getFullYear() });
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newEventDate, setNewEventDate] = useState('');

  useEffect(() => { loadEvents(); }, [current]);

  async function loadEvents() {
    const res = await api(`/events?month=${current.month + 1}&year=${current.year}`);
    setEvents(await res.json());
  }

  async function addEvent(data) {
    await api('/events', { method: 'POST', body: JSON.stringify(data) });
    setShowModal(false);
    loadEvents();
  }

  async function deleteEvent(id) {
    await api(`/events/${id}`, { method: 'DELETE' });
    loadEvents();
    setSelected(null);
  }

  const prevMonth = () => setCurrent(c => c.month === 0 ? { month: 11, year: c.year - 1 } : { ...c, month: c.month - 1 });
  const nextMonth = () => setCurrent(c => c.month === 11 ? { month: 0, year: c.year + 1 } : { ...c, month: c.month + 1 });

  const firstDay = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const dateStr = day => `${current.year}-${String(current.month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const eventsOnDay = day => events.filter(e => e.date === dateStr(day));

  const selectedEvents = selected ? eventsOnDay(selected) : [];

  return (
    <div style={{ padding: '28px 32px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' }}>Calendar</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {events.length} event{events.length !== 1 ? 's' : ''} this month
          </p>
        </div>
        <button className="btn btn-primary" style={{ fontSize: 13 }}
          onClick={() => { setNewEventDate(todayStr); setShowModal(true); }}>
          + Add Event
        </button>
      </div>

      {/* Calendar grid — full width */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Month nav */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '14px 18px', borderBottom: '1.5px solid var(--border-light)',
        }}>
          <button className="btn btn-ghost btn-sm" onClick={prevMonth}
            style={{ padding: '4px 8px', fontSize: 16, color: 'var(--text-muted)' }}>‹</button>
          <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>
            {MONTHS[current.month]} {current.year}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={nextMonth}
            style={{ padding: '4px 8px', fontSize: 16, color: 'var(--text-muted)' }}>›</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1.5px solid var(--border-light)' }}>
            {DAYS.map(d => (
              <div key={d} className="section-label" style={{
                textAlign: 'center', padding: '10px 0', fontSize: 10,
              }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, i) => {
              if (!day) return (
                <div key={i} style={{ borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', minHeight: 100, background: 'var(--surface2)' }} />
              );
              const ds = dateStr(day);
              const isToday = ds === todayStr;
              const isSelected = selected === day;
              const dayEvents = eventsOnDay(day);

              return (
                <div
                  key={i}
                  onClick={() => setSelected(isSelected ? null : day)}
                  style={{
                    borderRight: '1px solid var(--border-light)',
                    borderBottom: '1px solid var(--border-light)',
                    minHeight: 100,
                    padding: '8px 10px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--accent-light)' : 'transparent',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface2)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 24, height: 24, borderRadius: '50%',
                    fontSize: 12.5, fontWeight: isToday ? 700 : 400,
                    background: isToday ? 'var(--accent)' : 'transparent',
                    color: isToday ? '#fff' : isSelected ? 'var(--accent)' : 'var(--text)',
                    marginBottom: 5,
                  }}>{day}</div>
                  {dayEvents.slice(0, 3).map(ev => (
                    <div key={ev.id} style={{
                      fontSize: 10.5, background: 'var(--accent-light)',
                      color: 'var(--accent)', borderRadius: 4,
                      padding: '2px 6px', marginBottom: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontWeight: 500,
                    }}>{ev.title}</div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>+{dayEvents.length - 3}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day detail popover */}
      {selected && (
        <DayPopover
          day={selected}
          month={current.month}
          year={current.year}
          events={selectedEvents}
          onDelete={deleteEvent}
          onAdd={() => { setNewEventDate(dateStr(selected)); setShowModal(true); }}
          onClose={() => setSelected(null)}
        />
      )}

      {showModal && (
        <EventModal date={newEventDate} onSave={addEvent} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

function DayPopover({ day, month, year, events, onDelete, onAdd, onClose }) {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,17,21,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40,
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 14, width: 360,
          border: '1.5px solid var(--border)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: '1.5px solid var(--border-light)',
        }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
            {MONTHS[month]} {day}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm"
              style={{ fontSize: 11, color: 'var(--accent)', borderColor: 'var(--accent)', background: 'var(--accent-light)' }}
              onClick={onAdd}>+ Add</button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}
              style={{ fontSize: 16, color: 'var(--text-muted)', padding: '2px 6px' }}>×</button>
          </div>
        </div>
        {/* Events */}
        <div style={{ padding: 14, maxHeight: 320, overflowY: 'auto' }}>
          {events.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
              No events on this day
            </div>
          )}
          {events.map(ev => (
            <div key={ev.id} style={{
              background: 'var(--surface2)', border: '1.5px solid var(--border)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, flex: 1, color: 'var(--text)' }}>{ev.title}</div>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(ev.id)}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
              {ev.time && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--accent)', marginTop: 6, fontWeight: 500 }}>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 4.5V8l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {ev.time}
                </div>
              )}
              {ev.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>{ev.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EventModal({ date, onSave, onClose }) {
  const [form, setForm] = useState({ title: '', date, time: '', description: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Add Event</h2>
        <div className="form-group">
          <label>Title</label>
          <input value={form.title} onChange={set('title')} placeholder="Event title..." autoFocus />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={form.date} onChange={set('date')} />
          </div>
          <div className="form-group">
            <label>Time (optional)</label>
            <input type="time" value={form.time} onChange={set('time')} />
          </div>
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea value={form.description} onChange={set('description')} placeholder="Optional notes..." />
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => form.title.trim() && onSave(form)} disabled={!form.title.trim()}>
            Add Event
          </button>
        </div>
      </div>
    </div>
  );
}
