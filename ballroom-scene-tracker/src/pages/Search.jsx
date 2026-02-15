import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { globalSearch, formatDate } from '../utils/helpers';
import { HOUSES } from '../utils/constants';

const card = { background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:12 };

export default function Search() {
  const { cities } = useStore();
  const [q, setQ] = useState('');
  const res = useMemo(() => globalSearch(cities, q.trim()), [cities, q]);

  // Also search houses
  const houseResults = useMemo(() => {
    if (!q || q.length < 2) return [];
    const lower = q.toLowerCase();
    return HOUSES.filter(h => h.name.toLowerCase().includes(lower));
  }, [q]);

  const hasResults = res.people.length > 0 || res.balls.length > 0 || houseResults.length > 0;

  return (
    <div className="animate-in" style={{ display:'grid', gap:12 }}>
      <div style={card}>
        <div style={{ fontWeight:950, fontSize:16, fontFamily:'var(--font-display)' }}>Search</div>
        <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>Search walkers, balls, and houses across all cities.</div>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" autoFocus style={{ marginTop:10, width:'100%', padding:'10px 12px', borderRadius:12, border:'1px solid var(--border-light)', background:'#0b0b0b', color:'#ddd', fontSize:13, boxSizing:'border-box' }}/>
      </div>

      {q.length >= 2 && !hasResults && (
        <div style={{ ...card, textAlign:'center', color:'var(--text-dim)', fontSize:12 }}>No results for "{q}"</div>
      )}

      {res.people.length > 0 && (
        <div style={card}>
          <div style={{ fontWeight:900, fontSize:12, marginBottom:8 }}>People ({res.people.length})</div>
          <div style={{ display:'grid', gap:6 }}>
            {res.people.slice(0,20).map(p => (
              <Link key={p.name} to={`/profile/${encodeURIComponent(p.name)}`} style={{ padding:10, borderRadius:10, border:'1px solid var(--border-light)', background:'#0f0f0f', display:'block' }}>
                <div style={{ fontWeight:900, fontSize:12 }}>{p.name}</div>
                <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>
                  {p.house||'Free Agent'}
                  {p.disambiguation && <span style={{ color:'var(--gold)', marginLeft:6 }}>Active in: {p.disambiguation}</span>}
                  {!p.disambiguation && p.cities?.length>0 && <span> · {p.cities[0]}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {houseResults.length > 0 && (
        <div style={card}>
          <div style={{ fontWeight:900, fontSize:12, marginBottom:8 }}>Houses ({houseResults.length})</div>
          <div style={{ display:'grid', gap:6 }}>
            {houseResults.map(h => (
              <Link key={h.name} to={`/house/${encodeURIComponent(h.name)}`} style={{ padding:10, borderRadius:10, border:'1px solid var(--border-light)', background:'#0f0f0f', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:18 }}>{h.emoji}</span>
                <div><div style={{ fontWeight:900, fontSize:12 }}>{h.name}</div></div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {res.balls.length > 0 && (
        <div style={card}>
          <div style={{ fontWeight:900, fontSize:12, marginBottom:8 }}>Balls ({res.balls.length})</div>
          <div style={{ display:'grid', gap:6 }}>
            {res.balls.slice(0,20).map(b => (
              <Link key={`${b._city?.id}-${b.id}`} to={`/ball/${b.id}`} style={{ padding:10, borderRadius:10, border:'1px solid var(--border-light)', background:'#0f0f0f', display:'block' }}>
                <div style={{ fontWeight:900, fontSize:12 }}>{b.name}</div>
                <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{b._city?.name} · {formatDate(b.date)} · {b.venue}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {q.length < 2 && (
        <div style={{ ...card, textAlign:'center', color:'#444', fontSize:11 }}>Type at least 2 characters to search.</div>
      )}
    </div>
  );
}
