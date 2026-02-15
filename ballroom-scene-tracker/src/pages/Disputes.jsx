import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { formatDate } from '../utils/helpers';

const card = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 12,
};

function btn(tone = 'dark') {
  const map = {
    dark: { bg: '#0f0f0f', bd: 'var(--border-light)', fg: '#ddd' },
    green: { bg: '#30D15810', bd: '#30D15840', fg: 'var(--green)' },
    red: { bg: '#FF325010', bd: '#FF325040', fg: 'var(--red)' },
    gold: { bg: '#C8B87810', bd: '#C8B87840', fg: 'var(--gold)' },
  };
  const s = map[tone] || map.dark;
  return {
    padding: '6px 10px',
    borderRadius: 10,
    border: `1px solid ${s.bd}`,
    background: s.bg,
    color: s.fg,
    fontSize: 11,
    fontWeight: 900,
    cursor: 'pointer',
  };
}

export default function Disputes() {
  const navigate = useNavigate();
  const { disputes, currentCity, currentUser, resolveDispute } = useStore();
  const [note, setNote] = useState({});

  const isCityAdmin = currentUser?.role === 'city_admin' && (currentUser?.cities || []).includes(currentCity);

  const items = useMemo(() => {
    return (disputes || [])
      .filter(d => d.cityId === currentCity)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [disputes, currentCity]);

  if (!isCityAdmin) {
    return (
      <div className="animate-in" style={card}>
        <button onClick={() => navigate(-1)} style={{ ...btn('dark'), marginBottom: 10 }}>← Back</button>
        <div style={{ fontWeight: 950, fontSize: 14 }}>Disputes</div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
          You need a City Admin account for this city to access dispute resolution.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 12 }}>
      <div style={card}>
        <button onClick={() => navigate(-1)} style={{ ...btn('dark'), marginBottom: 10 }}>← Back</button>
        <div style={{ fontWeight: 950, fontSize: 16, fontFamily: 'var(--font-display)' }}>Disputes · {currentCity}</div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
          Keep it procedural: resolve what’s verifiable (results, identity claims, OTY eligibility). Everything is logged.
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 12 }}>Queue ({items.length})</div>
        <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
          {items.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>No disputes submitted yet.</div>
          ) : items.map(d => (
            <div key={d.id} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontWeight: 950, fontSize: 12 }}>{(d.kind || 'dispute').toUpperCase()}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{formatDate(d.createdAt)}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                Target: {d.target?.type === 'ball' ? <Link to={`/ball/${d.target.id}`} style={{ color: 'var(--gold)', fontWeight: 900 }}>Ball #{d.target.id}</Link> : d.target?.type === 'walker' ? <Link to={`/profile/${encodeURIComponent(d.target.name)}`} style={{ color: 'var(--gold)', fontWeight: 900 }}>{d.target.name}</Link> : d.target?.type === 'house' ? <Link to={`/house/${encodeURIComponent(d.target.name)}`} style={{ color: 'var(--gold)', fontWeight: 900 }}>{d.target.name}</Link> : '—'}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.45 }}>{d.message}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, border: '1px solid #ffffff12', background: '#ffffff08', color: '#aaa', fontWeight: 800 }}>{d.status}</span>
                {d.status === 'open' && (
                  <>
                    <button onClick={() => resolveDispute(d.id, 'resolved', currentUser?.id || 'admin', note[d.id] || '')} style={btn('green')}>Resolve</button>
                    <button onClick={() => resolveDispute(d.id, 'dismissed', currentUser?.id || 'admin', note[d.id] || '')} style={btn('red')}>Dismiss</button>
                  </>
                )}
              </div>
              <textarea
                value={note[d.id] || ''}
                onChange={(e) => setNote(s => ({ ...s, [d.id]: e.target.value }))}
                placeholder="Resolution note (optional)"
                style={{ marginTop: 8, width: '100%', minHeight: 54, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12, resize: 'vertical' }}
              />
              {d.resolvedAt ? (
                <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-dim)' }}>
                  Resolved: {formatDate(d.resolvedAt)} · Note: {d.resolutionNote || '—'}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
