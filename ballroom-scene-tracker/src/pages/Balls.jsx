import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { getAllBalls, formatDate, categoryProgress } from '../utils/helpers';

const card = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 12,
};

function statusBadge(status) {
  const map = {
    upcoming: { fg: 'var(--blue)', bg: '#64C8FF10', bd: '#64C8FF40', label: 'UPCOMING' },
    live: { fg: 'var(--red)', bg: '#FF325010', bd: '#FF325040', label: 'LIVE' },
    completed: { fg: 'var(--green)', bg: '#30D15810', bd: '#30D15840', label: 'COMPLETED' },
  };
  const s = map[status] || { fg: '#aaa', bg: '#ffffff08', bd: '#ffffff12', label: status || '—' };
  return <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, border: `1px solid ${s.bd}`, background: s.bg, color: s.fg, fontWeight: 800 }}>{s.label}</span>;
}

function otyBadge(oty) {
  const st = oty?.status || 'not_submitted';
  const map = {
    approved: { fg: 'var(--gold)', bg: '#C8B87810', bd: '#C8B87840', label: 'OTY APPROVED' },
    pending: { fg: 'var(--orange)', bg: '#FF9F0A10', bd: '#FF9F0A40', label: 'OTY PENDING' },
    rejected: { fg: 'var(--red)', bg: '#FF325010', bd: '#FF325040', label: 'OTY REJECTED' },
    not_eligible: { fg: '#777', bg: '#ffffff06', bd: '#ffffff10', label: 'OTY N/A' },
    not_submitted: { fg: '#777', bg: '#ffffff06', bd: '#ffffff10', label: 'OTY NOT SENT' },
  };
  const s = map[st] || map.not_submitted;
  return <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, border: `1px solid ${s.bd}`, background: s.bg, color: s.fg, fontWeight: 800 }}>{s.label}</span>;
}

export default function Balls() {
  const { cities, currentCity, getBallIntentSummary } = useStore();
  const [filter, setFilter] = useState('all');

  const balls = useMemo(() => {
    const all = getAllBalls(cities, currentCity === 'global' ? 'global' : currentCity);
    const sorted = all.sort((a, b) => (a.date < b.date ? 1 : -1));
    if (filter === 'all') return sorted;
    return sorted.filter(b => b.status === filter);
  }, [cities, currentCity, filter]);

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 12 }}>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900 }}>Balls</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              Click a ball to enter winners, submit for OTY, and view categories.
            </div>
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border-light)', background: '#0f0f0f', color: '#ddd', fontSize: 11 }}>
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {balls.map(b => {
          const prog = categoryProgress(b);
          const intent = getBallIntentSummary ? getBallIntentSummary(b.id) : null;
          const counts = intent?.counts || { interested: 0, planning: 0, registered: 0 };
          const daysTo = (() => {
            try {
              const d = new Date(b.date);
              const now = new Date();
              const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const startBall = new Date(d.getFullYear(), d.getMonth(), d.getDate());
              return Math.round((startBall - startToday) / (1000 * 60 * 60 * 24));
            } catch {
              return null;
            }
          })();
          return (
            <Link key={b.id} to={`/ball/${b.id}`} style={{ ...card, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 950, fontSize: 13, letterSpacing: 0.2 }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                    {(b._city?.name || '')}{b._city ? ' · ' : ''}{formatDate(b.date)} · {b.venue}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                    Host: {b.host || '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {statusBadge(b.status)}
                  {otyBadge(b.oty)}
                </div>
              </div>

              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                  {typeof daysTo === 'number' && daysTo >= 0 ? (daysTo > 10 ? `${daysTo} days away` : daysTo > 1 ? `${daysTo} days · Ball Week` : daysTo === 1 ? `1 day · Ball Week` : 'Today') : null}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                  {counts ? `Intents: ${counts.interested} interested · ${counts.planning} planning · ${counts.registered} registered` : ''}
                  {b.registrationUrl ? <span style={{ marginLeft: 8, color: 'var(--gold)', fontWeight: 800 }}>Register ↗</span> : null}
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ height: 7, borderRadius: 100, background: '#1a1a1a', border: '1px solid #222', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${prog.pct}%`, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                  <span>{prog.done}/{prog.total} categories completed</span>
                  <span>${(b.prizePot || 0).toLocaleString()} prize pot</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
