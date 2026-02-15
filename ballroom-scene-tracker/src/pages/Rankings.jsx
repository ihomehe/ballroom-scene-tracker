import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { computeLeaderboards } from '../utils/helpers';

const card = { background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:12 };

function TabBtn({ active, children, onClick }) {
  return <button onClick={onClick} style={{ padding:'6px 10px', borderRadius:10, border:`1px solid ${active?'#C8B87840':'var(--border-light)'}`, background:active?'#C8B87810':'#0f0f0f', color:active?'var(--gold)':'#bbb', fontSize:11, fontWeight:900, cursor:'pointer', fontFamily:'inherit' }}>{children}</button>;
}

export default function Rankings() {
  const { cities, currentCity } = useStore();
  const [tab, setTab] = useState('houses');
  const [expanded, setExpanded] = useState(null);

  const lb = useMemo(() => computeLeaderboards(cities, currentCity === 'global' ? 'global' : currentCity), [cities, currentCity]);
  const data = tab === 'houses' ? lb.houses : lb.individuals;

  return (
    <div className="animate-in" style={{ display:'grid', gap:12 }}>
      <div style={card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
          <div>
            <div style={{ fontWeight:950, fontSize:16, fontFamily:'var(--font-display)' }}>Rankings</div>
            <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>OTY wins only count after city certification.</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <TabBtn active={tab==='houses'} onClick={()=>{setTab('houses');setExpanded(null)}}>Houses</TabBtn>
            <TabBtn active={tab==='people'} onClick={()=>{setTab('people');setExpanded(null)}}>Walkers</TabBtn>
          </div>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
          <div style={{ padding:8, borderRadius:10, border:'1px solid var(--border-light)', background:'#0f0f0f', flex:'1 1 80px' }}>
            <div style={{ fontSize:10, color:'#777' }}>Tracked</div>
            <div style={{ fontSize:16, fontWeight:900 }}>{lb.totalBalls} balls</div>
          </div>
          <div style={{ padding:8, borderRadius:10, border:'1px solid var(--border-light)', background:'#0f0f0f', flex:'1 1 80px' }}>
            <div style={{ fontSize:10, color:'#777' }}>Prizes</div>
            <div style={{ fontSize:16, fontWeight:900 }}>${(lb.totalPrize||0).toLocaleString()}</div>
          </div>
          <div style={{ padding:8, borderRadius:10, border:'1px solid var(--border-light)', background:'#0f0f0f', flex:'1 1 80px' }}>
            <div style={{ fontSize:10, color:'#777' }}>Attendance</div>
            <div style={{ fontSize:16, fontWeight:900 }}>{(lb.totalAttendance||0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ display:'grid', gridTemplateColumns:'28px 1fr 50px 50px 60px', gap:6, padding:'0 8px', fontSize:9, color:'#555', fontWeight:800, textTransform:'uppercase', letterSpacing:1 }}>
          <div>#</div><div>Name</div><div style={{ textAlign:'right' }}>Wins</div><div style={{ textAlign:'right' }}>OTY</div><div style={{ textAlign:'right' }}>Prizes</div>
        </div>
        <div style={{ marginTop:6, display:'grid', gap:4 }}>
          {data.length ? data.slice(0,50).map((d,idx) => {
            const rank = idx+1;
            const link = tab==='houses'?`/house/${encodeURIComponent(d.name)}`:`/profile/${encodeURIComponent(d.name)}`;
            const isExp = expanded===d.name;
            return (
              <div key={d.name}>
                <div onClick={()=>setExpanded(isExp?null:d.name)} style={{ display:'grid', gridTemplateColumns:'28px 1fr 50px 50px 60px', gap:6, alignItems:'center', padding:'8px 8px', borderRadius:10, border:'1px solid var(--border-light)', background:rank===1?'#C8B87808':'#0f0f0f', cursor:'pointer' }}>
                  <div style={{ fontWeight:950, color:rank<=3?['var(--gold)','#C0C0C0','#CD7F32'][rank-1]:'#555' }}>{rank}</div>
                  <div>
                    <Link to={link} style={{ fontWeight:900, fontSize:12 }} onClick={e=>e.stopPropagation()}>{d.name}</Link>
                    {tab==='people' && d.house && <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:1 }}>{d.house}</div>}
                  </div>
                  <div style={{ textAlign:'right', fontWeight:900, fontSize:13 }}>{d.wins}</div>
                  <div style={{ textAlign:'right', fontWeight:900, color:d.otyWins?'var(--gold)':'#444' }}>{d.otyWins}</div>
                  <div style={{ textAlign:'right', fontSize:11, color:'var(--green)' }}>${(d.prizes||0).toLocaleString()}</div>
                </div>
                {isExp && (
                  <div style={{ padding:'6px 8px 10px 36px', fontSize:11, color:'var(--text-dim)', display:'grid', gap:3 }}>
                    {tab==='houses' && <>
                      <div>Grand prizes: {d.grandPrizes||0}</div>
                      <div>Active cities: {(d.cities||[]).join(', ')||'—'}</div>
                      <div>Balls competed: {(d.balls||[]).length}</div>
                      {d.categories && Object.keys(d.categories).length>0 && <div>Top categories: {Object.entries(d.categories).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([c,n])=>`${c} (${n})`).join(', ')}</div>}
                    </>}
                    {tab==='people' && <>
                      <div>Runner-ups: {d.runnerUps||0} · MVPs: {d.mvps||0}</div>
                      <div>Cities: {(d.cities||[]).join(', ')||'—'}</div>
                    </>}
                  </div>
                )}
              </div>
            );
          }) : <div style={{ color:'var(--text-dim)', fontSize:11 }}>No results yet.</div>}
        </div>
      </div>
    </div>
  );
}
