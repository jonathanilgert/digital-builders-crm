import React, { useState } from 'react';

const T = {
  bg: '#fafaf9', card: '#ffffff', ink: '#0f1115', ink2: '#1f2228',
  mid: '#6b7280', mute: '#9ca3af', line: '#ececea', err: '#dc2626',
};

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Login failed');
        setBusy(false);
        return;
      }
      onSuccess();
    } catch (err) {
      setError('Network error');
      setBusy(false);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', background: T.bg,
      display: 'grid', placeItems: 'center', padding: 16,
    }}>
      <form onSubmit={submit} style={{
        width: '100%', maxWidth: 340,
        background: T.card, border: `1px solid ${T.line}`,
        borderRadius: 12, padding: 24,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6, background: T.ink,
            display: 'grid', placeItems: 'center',
            color: '#fff', fontSize: 11, fontWeight: 700,
          }}>D</div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.015em', color: T.ink }}>
            Digital<span style={{ color: T.mid, fontWeight: 500 }}>Builders</span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: T.mid }}>Enter the workspace password to continue.</div>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            width: '100%', padding: '10px 12px',
            border: `1px solid ${T.line}`, borderRadius: 8,
            fontSize: 14, color: T.ink, background: T.bg, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {error && <div style={{ fontSize: 12.5, color: T.err }}>{error}</div>}
        <button type="submit" disabled={busy || !password} style={{
          padding: '10px 12px', borderRadius: 8, border: 'none',
          background: busy || !password ? T.mute : T.ink, color: '#fff',
          fontSize: 13.5, fontWeight: 600, cursor: busy || !password ? 'default' : 'pointer',
        }}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
