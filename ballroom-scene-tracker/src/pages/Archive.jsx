import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { formatDate } from '../utils/helpers';

const card = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 12,
};

function YearBar({ year, count, max }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '58px 1fr 30px', gap: 10, alignItems: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 900 }}>{year}</div>
      <div style={{ height: 10, borderRadius: 100, background: '#141414', border: '1px solid #222', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))' }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 900, textAlign: 'right' }}>{count}</div>
    </div>
  );
}

export default function Archive() {
  const { cities, currentCity } = useStore();

  const city = cities.find(c => c.id === currentCity);

  const { byYear, years, maxCount, otyApprovedCount } = useMemo(() => {
    const balls = (city?.balls || []).filter(b => b.status === 'completed');
    const map = {};
    let approved = 0;
    for (const b of balls) {
      const y = String(b.date || '').slice(0, 4) || 'Unknown';
      map[y] = map[y] || { total: 0, balls: [] };
      map[y].total += 1;
      map[y].balls.push(b);
      if (b.ballType !== 'mini' && b.oty?.status === 'approved') approved += 1;
    }
    const ys = Object.keys(map).sort((a, b) => (a < b ? 1 : -1));
    const max = ys.reduce((m, y) => Math.max(m, map[y].total), 0);
    return { byYear: map, years: ys, maxCount: max, otyApprovedCount: approved };
  }, [city]);

  if (!city) {
    return (
      <div className="animate-in" style={card}>
        <div style={{ fontWeight: 950, fontSize: 14 }}>Archive</div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>Select a city first.</div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 12 }}>
      <div style={card}>
        <div style={{ fontWeight: 950, fontSize: 16, fontFamily: 'var(--font-display)' }}>Archive Timeline · {city.name}</div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
          Completed balls by year (pilot: {city.name}). OTY-approved boards in this city: <b style={{ color: 'var(--gold)' }}>{otyApprovedCount}</b>.
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 12 }}>By year</div>
        <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
          {years.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>No completed balls yet.</div>
          ) : years.map(y => (
            <YearBar key={y} year={y} count={byYear[y].total} max={maxCount} />
          ))}
        </div>
      </div>

      {years.slice(0, 3).map(y => (
        <div key={y} style={card}>
          <div style={{ fontWeight: 900, fontSize: 12 }}>{y} ({byYear[y].total})</div>
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            {byYear[y].balls
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .slice(0, 12)
              .map(b => (
                <div key={b.id} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontWeight: 950, fontSize: 12 }}><Link to={`/ball/${b.id}`} style={{ color: 'var(--gold)' }}>{b.name}</Link></div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{formatDate(b.date)}</div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                    {b.venue || '—'} · {b.ballType === 'mini' ? 'Mini' : 'Kiki/Mainstream'} · {b.oty?.status === 'approved' ? 'OTY Approved' : (b.oty?.status || 'OTY not submitted')}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
