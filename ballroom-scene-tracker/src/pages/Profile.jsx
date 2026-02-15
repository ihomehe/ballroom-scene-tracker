import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { buildProfile, formatDate } from '../utils/helpers';

const card = { background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:12 };
const inp = { padding:10, borderRadius:12, border:'1px solid var(--border-light)', background:'#0b0b0b', color:'#ddd', fontSize:12, width:'100%', boxSizing:'border-box' };

function Stat({ label, value, color }) {
  return <div style={{ padding:8, borderRadius:10, border:'1px solid var(--border-light)', background:'#0f0f0f', flex:'1 1 65px' }}><div style={{ fontSize:9, color:'#666' }}>{label}</div><div style={{ fontSize:16, fontWeight:950, marginTop:2, color:color||'#ddd' }}>{value}</div></div>;
}

function Badge({ label, tone='gray' }) {
  const map = { gray:{ fg:'#aaa', bg:'#ffffff08', bd:'#ffffff12' }, gold:{ fg:'var(--gold)', bg:'#C8B87810', bd:'#C8B87840' }, green:{ fg:'var(--green)', bg:'#30D15810', bd:'#30D15840' } };
  const s = map[tone]||map.gray;
  return <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, border:`1px solid ${s.bd}`, background:s.bg, color:s.fg, fontWeight:800 }}>{label}</span>;
}

export default function Profile() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { cities, currentUser, walkerProfiles, setWalkerProfile, claimWalkerProfile, addAlias, submitDispute } = useStore();

  const decoded = decodeURIComponent(name||'');
  const stats = useMemo(() => buildProfile(cities, decoded), [cities, decoded]);
  const meta = walkerProfiles[decoded]||{};
  const isOwner = currentUser?.name === decoded;
  const isClaimed = !!meta.claimedByUserId;
  const verified = meta.verification?.status === 'verified';

  const [editMode, setEditMode] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(meta.photoUrl||'');
  const [statement, setStatement] = useState(meta.statement||'');
  const [socials, setSocials] = useState(meta.socialLinks||{});
  const [aliasInput, setAliasInput] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState('');
  const [tab, setTab] = useState('results');

  const save = () => {
    setWalkerProfile(decoded, { photoUrl:photoUrl.trim()||null, statement:statement.trim()||null, socialLinks:Object.fromEntries(Object.entries(socials).map(([k,v])=>[k,(v||'').trim()]).filter(([,v])=>!!v)) });
    setEditMode(false);
  };

  const submitReport = () => {
    submitDispute({ cityId:(stats.cities?.[0]||'vancouver'), kind:'identity', target:{type:'walker',name:decoded}, message:reportMsg.trim(), createdByUserId:currentUser?.id||'anonymous' });
    setReportMsg(''); setReportOpen(false);
  };

  const catEntries = Object.entries(stats.categoriesWalked||{}).sort((a,b)=>b[1]-a[1]);

  return (
    <div className="animate-in" style={{ display:'grid', gap:12 }}>
      {/* Header */}
      <div style={card}>
        <button onClick={()=>navigate(-1)} style={{ padding:'6px 10px', borderRadius:10, border:'1px solid var(--border-light)', background:'#0f0f0f', color:'#ddd', fontSize:11, fontWeight:800, cursor:'pointer', marginBottom:10, fontFamily:'inherit' }}>← Back</button>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ width:56, height:56, borderRadius:16, border:'1px solid var(--border-light)', background:'#0f0f0f', overflow:'hidden', display:'grid', placeItems:'center' }}>
            {meta.photoUrl?<img src={meta.photoUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:<span style={{ fontSize:18, color:'#666' }}>👤</span>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:18, fontWeight:950, fontFamily:'var(--font-display)' }}>{decoded}</span>
              {verified?<Badge label="Verified" tone="green"/>:isClaimed?<Badge label="Claimed" tone="gold"/>:<Badge label="Unclaimed"/>}
            </div>
            <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:3 }}>
              {stats.houses?.length?stats.houses.map(h=><Link key={h} to={`/house/${encodeURIComponent(h)}`} style={{ color:'var(--gold)', fontWeight:700, marginRight:6 }}>{h}</Link>):'No house'} · {stats.cities.length?stats.cities.join(', '):'—'}
            </div>
          </div>
        </div>
        {meta.statement && <div style={{ marginTop:8, fontSize:12, lineHeight:1.45, color:'#ccc' }}>{meta.statement}</div>}
        {meta.aliasHistory?.length>0 && <div style={{ marginTop:6, fontSize:10, color:'#555' }}>Previously: {meta.aliasHistory.join(', ')}</div>}
        {(meta.socialLinks && Object.values(meta.socialLinks).some(Boolean)) && (
          <div style={{ marginTop:6, display:'flex', gap:8 }}>{['instagram','youtube','tiktok','website'].map(k=>meta.socialLinks?.[k]?<a key={k} href={meta.socialLinks[k]} target="_blank" rel="noreferrer" style={{ fontSize:10, color:'var(--gold)', fontWeight:800, textTransform:'capitalize' }}>{k}</a>:null)}</div>
        )}
        <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
          {isOwner && !isClaimed && <button onClick={()=>claimWalkerProfile(decoded,currentUser.id)} style={{ padding:'6px 10px', borderRadius:10, border:'1px solid #C8B87840', background:'linear-gradient(135deg,var(--gold),var(--gold-light))', color:'#000', fontSize:11, fontWeight:950, cursor:'pointer', fontFamily:'inherit' }}>Claim profile</button>}
          {isOwner && <button onClick={()=>{setPhotoUrl(meta.photoUrl||'');setStatement(meta.statement||'');setEditMode(!editMode);}} style={{ padding:'6px 10px', borderRadius:10, border:'1px solid var(--border-light)', background:'#0f0f0f', color:'#ddd', fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>{editMode?'Close':'Edit'}</button>}
          <button onClick={()=>setReportOpen(!reportOpen)} style={{ padding:'6px 10px', borderRadius:10, border:'1px solid #FF9F0A40', background:'#FF9F0A10', color:'var(--orange)', fontSize:11, fontWeight:900, cursor:'pointer', fontFamily:'inherit' }}>Report</button>
        </div>
      </div>

      {/* Edit mode */}
      {editMode && (
        <div style={card}>
          <div style={{ fontWeight:900, fontSize:12, marginBottom:8 }}>Edit profile</div>
          <div style={{ display:'grid', gap:8 }}>
            <input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} placeholder="Photo URL" style={inp}/>
            <textarea value={statement} onChange={e=>setStatement(e.target.value)} placeholder="Statement" style={{ ...inp, minHeight:70, resize:'vertical' }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {['instagram','youtube','tiktok','website'].map(k=><input key={k} value={socials[k]||''} onChange={e=>setSocials(s=>({...s,[k]:e.target.value}))} placeholder={k} style={inp}/>)}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <input value={aliasInput} onChange={e=>setAliasInput(e.target.value)} placeholder="Add alias" style={{ ...inp, flex:1 }}/>
              <button onClick={()=>{if(aliasInput.trim()){addAlias(decoded,aliasInput.trim());setAliasInput('');}}} style={{ padding:'8px 10px', borderRadius:10, border:'1px solid #C8B87840', background:'#C8B87810', color:'var(--gold)', fontSize:11, fontWeight:950, cursor:'pointer', fontFamily:'inherit' }}>+</button>
            </div>
            <div style={{ display:'flex', gap:6 }}><button onClick={save} style={{ padding:'8px 10px', borderRadius:10, border:'1px solid #30D15840', background:'#30D15810', color:'var(--green)', fontSize:11, fontWeight:950, cursor:'pointer', fontFamily:'inherit' }}>Save</button><button onClick={()=>setEditMode(false)} style={{ padding:'8px 10px', borderRadius:10, border:'1px solid var(--border-light)', background:'#0f0f0f', color:'#ddd', fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button></div>
          </div>
        </div>
      )}

      {/* Report */}
      {reportOpen && (
        <div style={card}>
          <div style={{ fontWeight:900, fontSize:12 }}>Report an issue</div>
          <textarea value={reportMsg} onChange={e=>setReportMsg(e.target.value)} placeholder="Describe the issue…" style={{ ...inp, minHeight:70, resize:'vertical', marginTop:8 }}/>
          <div style={{ display:'flex', gap:6, marginTop:8 }}><button disabled={!reportMsg.trim()} onClick={submitReport} style={{ padding:'8px 10px', borderRadius:10, border:'1px solid #FF9F0A40', background:'#FF9F0A10', color:'var(--orange)', fontSize:11, fontWeight:950, cursor:reportMsg.trim()?'pointer':'not-allowed', opacity:reportMsg.trim()?1:.5, fontFamily:'inherit' }}>Submit</button><button onClick={()=>setReportOpen(false)} style={{ padding:'8px 10px', borderRadius:10, border:'1px solid var(--border-light)', background:'#0f0f0f', color:'#ddd', fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button></div>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        <Stat label="Wins" value={stats.wins}/>
        <Stat label="OTY Wins" value={stats.otyWins} color={stats.otyWins?'var(--gold)':undefined}/>
        <Stat label="Runner-ups" value={stats.runnerUps}/>
        <Stat label="MVPs" value={stats.mvps} color={stats.mvps?'var(--yellow)':undefined}/>
        <Stat label="Prizes" value={`$${(stats.prizes||0).toLocaleString()}`} color="var(--green)"/>
        <Stat label="Balls Walked" value={stats.ballsWalked}/>
        <Stat label="Spectated" value={stats.ballsSpectated}/>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4 }}>
        {[{k:'results',l:'Results'},{k:'categories',l:'Categories'},{k:'history',l:'Ball History'},{k:'support',l:'Support'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{ flex:1, padding:'7px 4px', borderRadius:8, border:`1px solid ${tab===t.k?'#C8B87830':'#1e1e1e'}`, background:tab===t.k?'#C8B87808':'transparent', color:tab===t.k?'var(--gold)':'#555', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{t.l}</button>
        ))}
      </div>

      {/* Results tab */}
      {tab==='results' && (
        <div style={card}>
          <div style={{ fontWeight:900, fontSize:12, marginBottom:8 }}>Results ({stats.results.length})</div>
          {stats.results.length?stats.results.sort((a,b)=>a.date<b.date?1:-1).slice(0,40).map((r,i)=>(
            <div key={i} style={{ padding:8, borderRadius:8, border:'1px solid var(--border-light)', background:'#0f0f0f', marginBottom:4 }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontWeight:900, fontSize:12 }}>{r.place} {r.category}</span><span style={{ fontSize:10, color:'var(--text-dim)' }}>{formatDate(r.date)}</span></div>
              <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{r.city} · {r.ball}{r.house?<> · <Link to={`/house/${encodeURIComponent(r.house)}`} style={{ color:'var(--gold)', fontWeight:700 }}>{r.house}</Link></>:''}{r.prize?` · $${r.prize}`:''}</div>
            </div>
          )):<div style={{ fontSize:11, color:'var(--text-dim)' }}>No results yet.</div>}
        </div>
      )}

      {/* Categories tab */}
      {tab==='categories' && (
        <div style={card}>
          <div style={{ fontWeight:900, fontSize:12, marginBottom:8 }}>Categories Walked ({catEntries.length})</div>
          {catEntries.length?catEntries.map(([cat,count])=>{
            const maxCount = catEntries[0]?.[1]||1;
            return <div key={cat} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <div style={{ flex:1, fontSize:11, fontWeight:700 }}>{cat}</div>
              <div style={{ width:80, height:8, borderRadius:100, background:'#1a1a1a', overflow:'hidden' }}><div style={{ height:'100%', width:`${(count/maxCount*100)}%`, background:'var(--gold)', borderRadius:100 }}/></div>
              <div style={{ width:20, textAlign:'right', fontSize:11, fontWeight:900 }}>{count}</div>
            </div>;
          }):<div style={{ fontSize:11, color:'var(--text-dim)' }}>No categories walked yet.</div>}
        </div>
      )}

      {/* Ball History tab */}
      {tab==='history' && (
        <div style={card}>
          <div style={{ fontWeight:900, fontSize:12, marginBottom:8 }}>Ball History ({stats.ballHistory.length})</div>
          {stats.ballHistory.length?stats.ballHistory.sort((a,b)=>a.date<b.date?1:-1).map((h,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 8px', background:'#0f0f0f', borderRadius:6, marginBottom:2, fontSize:11 }}>
              <span><span style={{ fontWeight:700 }}>{h.ball}</span> <span style={{ color:'var(--text-dim)' }}>· {h.city}</span></span>
              <span style={{ color:h.role==='walker'?'var(--gold)':'var(--blue)', fontWeight:700 }}>{h.role==='walker'?'👟':'👁'} {h.type}</span>
            </div>
          )):<div style={{ fontSize:11, color:'var(--text-dim)' }}>No ball history.</div>}
          {stats.virginBalls.length>0 && (
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'var(--green)', marginBottom:4 }}>🌟 Virgin Balls</div>
              {stats.virginBalls.map((v,i)=><div key={i} style={{ fontSize:11, color:'var(--text-dim)', padding:'2px 0' }}>🌟 {v.ball} · {v.city}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Support tab */}
      {tab==='support' && (
        <div style={card}>
          <div style={{ fontWeight:900, fontSize:12, marginBottom:8 }}>Support Roles ({stats.supportRoles.length})</div>
          {stats.supportRoles.length?stats.supportRoles.map((s,i)=>(
            <div key={i} style={{ padding:6, background:'#0f0f0f', borderRadius:6, marginBottom:3, fontSize:11 }}>
              Supported <span style={{ fontWeight:700 }}>{s.walker}</span> in <span style={{ color:'var(--gold)' }}>{s.category}</span> · {s.ball} · {s.city}
            </div>
          )):<div style={{ fontSize:11, color:'var(--text-dim)' }}>No support roles recorded.</div>}
        </div>
      )}
    </div>
  );
}
