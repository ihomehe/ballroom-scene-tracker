import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { formatDate, categoryProgress } from '../utils/helpers';

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
    orange: { bg: '#FF9F0A10', bd: '#FF9F0A40', fg: 'var(--orange)' },
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

export default function OTYQueue() {
  const navigate = useNavigate();
  const { cities, currentCity, currentUser, reviewOTY, cityPolicies } = useStore();
  const [note, setNote] = useState({});

  const isCityAdmin = currentUser?.role === 'city_admin' && (currentUser?.cities || []).includes(currentCity);

  const pending = useMemo(() => {
    const city = cities.find(c => c.id === currentCity);
    if (!city) return [];
    return (city.balls || [])
      .filter(b => (b.oty?.status === 'pending'))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [cities, currentCity]);

  if (!isCityAdmin) {
    return (
      <div className="animate-in" style={card}>
        <button onClick={() => navigate(-1)} style={{ ...btn('dark'), marginBottom: 10 }}>← Back</button>
        <div style={{ fontWeight: 950, fontSize: 14 }}>OTY Queue</div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
          You need a City Admin account for this city to access OTY submissions.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 12 }}>
      <div style={card}>
        <button onClick={() => navigate(-1)} style={{ ...btn('dark'), marginBottom: 10 }}>← Back</button>
        <div style={{ fontWeight: 950, fontSize: 16, fontFamily: 'var(--font-display)' }}>OTY Queue · {currentCity}</div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
          Review boards submitted for OTY certification. Approvals make wins count toward OTY rankings.
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
          City rules: <Link to="/policy" style={{ color: 'var(--gold)', fontWeight: 900 }}>Policy</Link> · Templates: <Link to="/templates" style={{ color: 'var(--gold)', fontWeight: 900 }}>Library</Link>
          {cityPolicies?.[currentCity]?.templateId ? <span style={{ color: '#777' }}> · Active template: {cityPolicies[currentCity].templateId}</span> : null}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 12 }}>Pending submissions ({pending.length})</div>
        <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
          {pending.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>No pending submissions right now.</div>
          ) : pending.map(b => {
            const prog = categoryProgress(b);
            return (
              <div key={b.id} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 12 }}>
                      <Link to={`/ball/${b.id}`} style={{ color: 'var(--gold)', fontWeight: 950 }}>{b.name}</Link>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                      {formatDate(b.date)} · {b.venue || '—'} · {prog.done}/{prog.total} categories completed
                    </div>
                    {b.oty?.submittedAt ? (
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                        Submitted: {formatDate(b.oty.submittedAt)}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => reviewOTY(b.id, 'approve', currentUser?.id || 'admin', note[b.id] || '')} style={btn('green')}>Approve</button>
                    <button onClick={() => reviewOTY(b.id, 'needs_changes', currentUser?.id || 'admin', note[b.id] || '')} style={btn('orange')}>Needs changes</button>
                    <button onClick={() => reviewOTY(b.id, 'reject', currentUser?.id || 'admin', note[b.id] || '')} style={btn('red')}>Reject</button>
                  </div>
                </div>
                <textarea
                  value={note[b.id] || ''}
                  onChange={(e) => setNote(s => ({ ...s, [b.id]: e.target.value }))}
                  placeholder="Optional note"
                  style={{ marginTop: 8, width: '100%', minHeight: 54, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12, resize: 'vertical' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
