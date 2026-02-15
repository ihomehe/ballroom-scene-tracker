import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { formatDate, categoryProgress, houseStandings, autoGrandPrize } from '../utils/helpers';
import { HOUSE_NAMES, BUDGET_CATEGORIES } from '../utils/constants';

function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function exportBallCSV(ball) {
  const header = ['Ball','City','Date','Venue','Category','Winner','Winner House','Runner-up','Runner-up House','Prize','OTY Status'];
  const rows = (ball.categories||[]).map(c => [ball.name, ball._city?.name||'', ball.date, ball.venue, c.name, c.winner||'', c.house||'', c.runnerUp||'', c.runnerUpHouse||'', c.prize||0, ball.oty?.status||'not_submitted']);
  const esc = v => { const s = String(v ?? ''); return /[\n\r,"]/.test(s) ? `"${s.replaceAll('"','""')}"` : s; };
  downloadText(`${ball._city?.id||'city'}-${ball.id}-board.csv`, [header,...rows].map(r=>r.map(esc).join(',')).join('\n'), 'text/csv');
}

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 12 };
const inp = { padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12, width: '100%', boxSizing: 'border-box' };
const lbl = { fontSize: 9, color: '#666', letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 3, display: 'block' };

function Btn({ children, tone='dark', onClick, disabled, style:sx }) {
  const map = { dark:{ bg:'#0f0f0f', bd:'var(--border-light)', fg:'#ddd' }, gold:{ bg:'#C8B87810', bd:'#C8B87840', fg:'var(--gold)' }, red:{ bg:'#FF325010', bd:'#FF325040', fg:'var(--red)' }, green:{ bg:'#30D15810', bd:'#30D15840', fg:'var(--green)' }, orange:{ bg:'#FF9F0A10', bd:'#FF9F0A40', fg:'var(--orange)' }, purple:{ bg:'#BF5AF210', bd:'#BF5AF240', fg:'var(--purple)' } };
  const s = map[tone]||map.dark;
  return <button onClick={onClick} disabled={disabled} style={{ padding:'6px 10px', borderRadius:10, border:`1px solid ${s.bd}`, background:s.bg, color:s.fg, fontSize:11, fontWeight:800, cursor:disabled?'not-allowed':'pointer', opacity:disabled?.5:1, fontFamily:'inherit', ...sx }}>{children}</button>;
}

function Stat({ label, value, color }) {
  return <div style={{ padding:10, borderRadius:12, border:'1px solid var(--border-light)', background:'#0f0f0f', flex:'1 1 70px' }}><div style={{ fontSize:10, color:'#777' }}>{label}</div><div style={{ fontSize:18, fontWeight:950, marginTop:2, color:color||'#ddd' }}>{value}</div></div>;
}

function Section({ title, color, children, right }) {
  return <div style={card}><div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}><div style={{ fontSize:12, fontWeight:900, color:color||'#ddd' }}>{title}</div>{right}</div>{children}</div>;
}

// ─── MVP Voting Section ───
function MVPSection({ ball, canEdit }) {
  const { openMVP, voteMVP, closeMVP, updateBall } = useStore();
  const [voted, setVoted] = useState(false);
  const mvp = ball.mvpVoting || { open:false, nominees:[], votes:{} };
  const sorted = Object.entries(mvp.votes||{}).sort((a,b)=>b[1]-a[1]);
  const total = sorted.reduce((s,[,v])=>s+v,0);

  return (
    <Section title="⭐ MVP of the Night" color="var(--yellow)">
      {!mvp.open && sorted.length===0 && ball.status==='completed' && canEdit && (
        <Btn tone="gold" onClick={()=>openMVP(ball.id)}>Open MVP Voting</Btn>
      )}
      {!mvp.open && sorted.length===0 && ball.status!=='completed' && (
        <div style={{ fontSize:11, color:'var(--text-dim)' }}>Opens after the ball completes.</div>
      )}
      {mvp.open && (
        <div style={{ display:'grid', gap:5 }}>
          <div style={{ fontSize:11, color:voted?'var(--green)':'var(--text-dim)' }}>{voted?'✓ Vote recorded!':'Tap a name to vote:'}</div>
          {sorted.map(([name,v])=>{
            const pct=total>0?(v/total*100):0;
            return <div key={name} onClick={()=>{if(!voted){voteMVP(ball.id,name);setVoted(true);}}} style={{ position:'relative', padding:'8px 10px', background:'#0f0f0f', borderRadius:8, cursor:voted?'default':'pointer', overflow:'hidden', border:'1px solid var(--border-light)' }}>
              <div style={{ position:'absolute', top:0, left:0, height:'100%', width:`${pct}%`, background:'#FFD60A08' }}/>
              <div style={{ position:'relative', display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, fontWeight:700 }}>{name}</span>
                <span style={{ fontSize:11, color:'var(--yellow)', fontWeight:800 }}>{v}{voted?` (${pct.toFixed(0)}%)`:''}</span>
              </div>
            </div>;
          })}
          {canEdit && <Btn tone="red" onClick={()=>closeMVP(ball.id)}>Close Voting</Btn>}
        </div>
      )}
      {!mvp.open && sorted.length>0 && (
        <div style={{ textAlign:'center', padding:'8px 0' }}>
          <div style={{ fontSize:28 }}>⭐</div>
          <Link to={`/profile/${encodeURIComponent(sorted[0][0])}`} style={{ fontSize:18, fontWeight:950, color:'var(--yellow)', fontFamily:'var(--font-display)' }}>{sorted[0][0]}</Link>
          <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{sorted[0][1]} votes ({total} total)</div>
        </div>
      )}
    </Section>
  );
}

// ─── RSVP Section ───
function RSVPSection({ ball }) {
  const { addWalker, addSpectator } = useStore();
  const [mode, setMode] = useState(null);
  const [name, setName] = useState('');
  const [house, setHouse] = useState(HOUSE_NAMES[0]);
  const [cats, setCats] = useState([]);
  const submit = () => {
    if (!name.trim()) return;
    if (mode==='walk') addWalker(ball.id, { name:name.trim(), house, categories:cats });
    else addSpectator(ball.id, { name:name.trim() });
    setName(''); setCats([]); setMode(null);
  };
  return (
    <Section title="Attending" color="var(--blue)">
      <div style={{ display:'flex', gap:10, marginBottom:8, fontSize:11 }}>
        <span style={{ color:'var(--gold)' }}>👟 {ball.walkers?.length||0} walking</span>
        <span style={{ color:'var(--blue)' }}>👁 {ball.spectators?.length||0} spectating</span>
      </div>
      {ball.walkers?.length>0 && <div style={{ marginBottom:8 }}>{ball.walkers.map((w,i)=><div key={i} style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 0', fontSize:11 }}><span style={{ fontWeight:700 }}>{w.name}</span><span style={{ color:'var(--text-dim)' }}>· {w.house}</span>{w.categories?.length>0&&<span style={{ color:'#555' }}>· {w.categories.join(', ')}</span>}</div>)}</div>}
      {ball.status==='upcoming' && !mode && (
        <div style={{ display:'flex', gap:6 }}>
          <Btn tone="gold" onClick={()=>setMode('walk')} style={{ flex:1 }}>👟 I'm Walking</Btn>
          <Btn tone="dark" onClick={()=>setMode('spec')} style={{ flex:1 }}>👁 I'm Spectating</Btn>
        </div>
      )}
      {mode && (
        <div style={{ marginTop:8, padding:10, background:'#0a0a0a', borderRadius:10, display:'grid', gap:7 }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 120px' }}><label style={lbl}>Name</label><input value={name} onChange={e=>setName(e.target.value)} style={inp}/></div>
            {mode==='walk' && <div style={{ flex:'0 1 130px' }}><label style={lbl}>House</label><select value={house} onChange={e=>setHouse(e.target.value)} style={inp}>{HOUSE_NAMES.map(h=><option key={h}>{h}</option>)}</select></div>}
          </div>
          {mode==='walk' && <div><label style={lbl}>Categories</label><div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>{ball.categories.map(c=><button key={c.name} onClick={()=>setCats(p=>p.includes(c.name)?p.filter(x=>x!==c.name):[...p,c.name])} style={{ padding:'3px 8px', borderRadius:100, border:`1px solid ${cats.includes(c.name)?'#C8B87830':'#222'}`, background:cats.includes(c.name)?'#C8B87810':'transparent', color:cats.includes(c.name)?'var(--gold)':'#555', fontSize:9, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{c.name}</button>)}</div></div>}
          <div style={{ display:'flex', gap:6 }}><Btn tone="gold" onClick={submit} disabled={!name.trim()}>Confirm</Btn><Btn onClick={()=>setMode(null)}>Cancel</Btn></div>
        </div>
      )}
    </Section>
  );
}

// ─── Community Moments ───
function MomentsSection({ ball, canEdit }) {
  const { addMoment, updateBall } = useStore();
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const submit = () => {
    if (!text.trim()||!author.trim()) return;
    addMoment(ball.id, { author:author.trim(), text:text.trim(), videoUrl:videoUrl.trim()||null });
    setText(''); setAuthor(''); setVideoUrl('');
  };
  const del = (id) => updateBall({ ...ball, moments:(ball.moments||[]).filter(m=>m.id!==id) });
  return (
    <Section title="💫 Community Moments" color="var(--purple)">
      {(ball.moments||[]).length>0 ? (ball.moments||[]).map(m=>(
        <div key={m.id} style={{ padding:10, borderRadius:10, border:'1px solid var(--border-light)', background:'#0f0f0f', marginBottom:6 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:800 }}>{m.author}</span>
            <span style={{ fontSize:10, color:'var(--text-dim)' }}>{m.createdAt?.slice(0,10)}</span>
          </div>
          <div style={{ fontSize:12, marginTop:4, lineHeight:1.45 }}>{m.text}</div>
          {m.videoUrl && <a href={m.videoUrl} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'var(--gold)', fontWeight:800, marginTop:4, display:'inline-block' }}>▶ Watch clip</a>}
          {canEdit && <button onClick={()=>del(m.id)} style={{ marginTop:4, fontSize:10, color:'var(--red)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Remove</button>}
        </div>
      )) : <div style={{ fontSize:11, color:'var(--text-dim)' }}>No moments shared yet.</div>}
      <div style={{ marginTop:8, padding:10, background:'#0a0a0a', borderRadius:10, display:'grid', gap:6 }}>
        <div style={{ fontSize:10, color:'var(--text-dim)', fontWeight:700 }}>Share a moment</div>
        <div style={{ display:'flex', gap:6 }}><div style={{ flex:1 }}><input value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Your name" style={inp}/></div></div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="What moment stood out?" style={{ ...inp, minHeight:60, resize:'vertical' }}/>
        <input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="Video link (optional - IG reel, YouTube, TikTok)" style={inp}/>
        <Btn tone="purple" onClick={submit} disabled={!text.trim()||!author.trim()}>Share Moment</Btn>
      </div>
    </Section>
  );
}

// ─── Budget & Organizer Tools ───
function OrganizerSection({ ball }) {
  const { updateBall } = useStore();
  const bg = ball.budget || { revenue:{}, expenses:{} };
  const tR = Object.values(bg.revenue||{}).reduce((s,v)=>s+(v||0),0);
  const tE = Object.values(bg.expenses||{}).reduce((s,v)=>s+(v||0),0);
  const [nt, setNt] = useState('');
  const [glName, setGlName] = useState('');
  const [glType, setGlType] = useState('comp');
  const [glDrink, setGlDrink] = useState(2);

  const upB = (sec,k,v) => updateBall({ ...ball, budget:{ ...bg, [sec]:{ ...bg[sec], [k]:parseFloat(v)||0 } } });
  const addCheck = () => { if(!nt.trim())return; updateBall({ ...ball, checklist:[...(ball.checklist||[]),{ task:nt.trim(), done:false }] }); setNt(''); };
  const togCheck = i => { const cl=[...(ball.checklist||[])]; cl[i]={...cl[i],done:!cl[i].done}; updateBall({...ball,checklist:cl}); };
  const addGuest = () => { if(!glName.trim())return; updateBall({ ...ball, guestlist:[...(ball.guestlist||[]),{ name:glName.trim(), type:glType, drinkTix:parseInt(glDrink)||0 }] }); setGlName(''); };

  return (
    <div style={{ display:'grid', gap:10 }}>
      <Section title="📊 Budget Overview" color="var(--orange)">
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
          <Stat label="Revenue" value={`$${tR.toLocaleString()}`} color="var(--green)"/>
          <Stat label="Expenses" value={`$${tE.toLocaleString()}`} color="var(--red)"/>
          <Stat label="Profit" value={`$${(tR-tE).toLocaleString()}`} color={tR>=tE?'var(--green)':'var(--red)'}/>
        </div>
        <div style={{ marginBottom:8 }}><div style={{ fontSize:10, fontWeight:800, color:'var(--green)', marginBottom:6 }}>REVENUE</div><div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>{Object.entries(BUDGET_CATEGORIES.revenue).map(([k,label])=><div key={k}><label style={lbl}>{label}</label><input type="number" value={bg.revenue?.[k]||''} onChange={e=>upB('revenue',k,e.target.value)} style={inp}/></div>)}</div></div>
        <div><div style={{ fontSize:10, fontWeight:800, color:'var(--red)', marginBottom:6 }}>EXPENSES</div><div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>{Object.entries(BUDGET_CATEGORIES.expenses).map(([k,label])=><div key={k}><label style={lbl}>{label}</label><input type="number" value={bg.expenses?.[k]||''} onChange={e=>upB('expenses',k,e.target.value)} style={inp}/></div>)}</div></div>
      </Section>

      <Section title={`✅ Checklist (${(ball.checklist||[]).filter(t=>t.done).length}/${(ball.checklist||[]).length})`} color="var(--blue)">
        {(ball.checklist||[]).map((t,i)=><div key={i} onClick={()=>togCheck(i)} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 8px', background:'#0f0f0f', borderRadius:8, cursor:'pointer', marginBottom:3 }}><span style={{ width:16, height:16, borderRadius:4, border:`1px solid ${t.done?'#30D15830':'#333'}`, background:t.done?'#30D15810':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:t.done?'var(--green)':'transparent', flexShrink:0 }}>✓</span><span style={{ fontSize:11, color:t.done?'#555':'#ccc', textDecoration:t.done?'line-through':'none' }}>{t.task}</span></div>)}
        <div style={{ display:'flex', gap:5, marginTop:6 }}><input value={nt} onChange={e=>setNt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCheck()} placeholder="Add task..." style={{ ...inp, flex:1 }}/><Btn tone="gold" onClick={addCheck} disabled={!nt.trim()}>+</Btn></div>
      </Section>

      {ball.schedule?.length>0 && (
        <Section title="📅 Day-of Schedule" color="var(--gold)">
          {ball.schedule.map((s,i)=><div key={i} style={{ display:'flex', gap:10, padding:'6px 8px', background:'#0f0f0f', borderRadius:8, marginBottom:3 }}><span style={{ fontSize:11, fontWeight:800, color:'var(--gold)', minWidth:70 }}>{s.time}</span><span style={{ fontSize:11, flex:1 }}>{s.task}</span>{s.who&&<span style={{ fontSize:10, color:'var(--text-dim)' }}>{s.who}</span>}</div>)}
        </Section>
      )}

      <Section title="📋 Guestlist" color="var(--green)" right={<span style={{ fontSize:10, color:'var(--text-dim)' }}>{(ball.guestlist||[]).length} guests</span>}>
        {(ball.guestlist||[]).map((g,i)=><div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'4px 8px', background:'#0f0f0f', borderRadius:6, marginBottom:2, fontSize:11 }}><span style={{ fontWeight:700 }}>{g.name}</span><span style={{ color:'var(--text-dim)' }}>{g.type} · {g.drinkTix} drinks</span></div>)}
        <div style={{ display:'flex', gap:4, marginTop:6, flexWrap:'wrap' }}>
          <input value={glName} onChange={e=>setGlName(e.target.value)} placeholder="Name" style={{ ...inp, flex:'1 1 100px' }}/>
          <select value={glType} onChange={e=>setGlType(e.target.value)} style={{ ...inp, flex:'0 1 80px' }}><option value="comp">Comp</option><option value="vip">VIP</option><option value="staff">Staff</option><option value="talent">Talent</option></select>
          <input type="number" value={glDrink} onChange={e=>setGlDrink(e.target.value)} style={{ ...inp, flex:'0 1 50px' }}/>
          <Btn tone="green" onClick={addGuest} disabled={!glName.trim()}>+</Btn>
        </div>
      </Section>

      <Section title="📈 Attendance" color="var(--gold)">
        <div style={{ display:'flex', gap:6 }}>
          <div style={{ flex:1 }}><label style={lbl}>Head count</label><input type="number" value={ball.attendance||''} onChange={e=>updateBall({...ball,attendance:parseInt(e.target.value)||0})} style={inp}/></div>
          <div style={{ flex:1 }}><label style={lbl}>Door revenue</label><input type="number" value={ball.doorRevenue||''} onChange={e=>updateBall({...ball,doorRevenue:parseInt(e.target.value)||0})} style={inp}/></div>
        </div>
      </Section>
    </div>
  );
}

// ─── Main BallDetail ───
export default function BallDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cities, updateBall, setCategoryLive, setWinner, submitOTY, reviewOTY, setBallIntent, getBallIntentSummary, currentUser, currentCity, addWorkshop, setUserSupportPlan, addPrepUpdate, setUserSupportOffers, addSupportAssignment, deleteSupportAssignment, userSupportPlans, userSupportOffers, supportAssignments, users, houses } = useStore();

  const ball = useMemo(() => {
    const all = cities.flatMap(c => c.balls.map(b => ({ ...b, _city: c })));
    return all.find(b => String(b.id) === String(id));
  }, [cities, id]);

  const [editing, setEditing] = useState(null);
  const [winner, setWinnerName] = useState('');
  const [winnerHouse, setWinnerHouse] = useState('');
  const [runnerUp, setRunnerUp] = useState('');
  const [runnerUpHouse, setRunnerUpHouse] = useState('');
  const [reviewNote, setReviewNote] = useState('');

  // Workshop editor (ball-linked; registration handled externally)
  const [wsName, setWsName] = useState('');
  const [wsInstructor, setWsInstructor] = useState('');
  const [wsDate, setWsDate] = useState(new Date().toISOString().slice(0,10));
  const [wsTime, setWsTime] = useState('6:00 PM');
  const [wsVenue, setWsVenue] = useState('');
  const [wsPrice, setWsPrice] = useState(0);
  const [wsRegistrationUrl, setWsRegistrationUrl] = useState('');
  const [wsRegistrationNotes, setWsRegistrationNotes] = useState('');

  // Support plans (per ball)
  const [spCategories, setSpCategories] = useState('');
  const [spNeeds, setSpNeeds] = useState('');
  const [spNotes, setSpNotes] = useState('');
  const [spRefs, setSpRefs] = useState('');
  const [spUpdateText, setSpUpdateText] = useState('');
  const [offersText, setOffersText] = useState('');

  // Support assignments
  const [assignTo, setAssignTo] = useState('');
  const [assignType, setAssignType] = useState('');
  const [assignNote, setAssignNote] = useState('');


  if (!ball) return <div className="animate-in" style={card}><div style={{ fontWeight:900 }}>Ball not found</div><Btn onClick={()=>navigate(-1)}>← Back</Btn></div>;

  const isCityAdmin = currentUser?.role === 'city_admin' && (currentUser?.cities || []).includes(ball._city?.id);
  const isOrganizer = currentUser?.role === 'organizer' || currentUser?.role === 'house_admin' || isCityAdmin;
  const canEdit = isOrganizer;
  const prog = categoryProgress(ball);
  const otyStatus = ball.oty?.status || 'not_submitted';
  const canSubmitOTY = ball.status === 'completed' && ball.ballType !== 'mini' && (otyStatus === 'not_submitted' || !ball.oty);
  const standings = houseStandings(ball);
  const intentSummary = getBallIntentSummary?.(ball.id) || { counts:{interested:0,planning:0,registered:0,not_attending:0}, intents:{} };
  const myIntent = intentSummary?.intents?.[currentUser?.id]?.status || null;

  const plan = (currentUser && userSupportPlans?.[ball.id]?.[currentUser.id]) ? userSupportPlans[ball.id][currentUser.id] : {};
  const offers = currentUser ? (userSupportOffers?.[currentUser.id] || []) : [];
  const myAssignments = currentUser ? ((supportAssignments?.[ball.id] || []).filter(a => a.fromUserId === currentUser.id)) : [];
  const mySupportReceived = currentUser ? ((supportAssignments?.[ball.id] || []).filter(a => a.toUserId === currentUser.id)) : [];


  const startEdit = (i) => { const c=ball.categories[i]; setEditing(i); setWinnerName(c.winner||''); setWinnerHouse(c.house||''); setRunnerUp(c.runnerUp||''); setRunnerUpHouse(c.runnerUpHouse||''); };
  const saveWinner = () => { if(editing===null)return; setWinner(ball.id, editing, winner.trim()||null, winnerHouse.trim()||null, runnerUp.trim()||null, runnerUpHouse.trim()||null); setEditing(null); };

  return (
    <div className="animate-in" style={{ display:'grid', gap:12 }}>
      {/* Header */}
      <div style={card}>
        <Btn onClick={()=>navigate(-1)} style={{ marginBottom:10 }}>← Back</Btn>
        <div style={{ fontSize:18, fontWeight:950, fontFamily:'var(--font-display)' }}>{ball.name}</div>
        <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:6 }}>{ball._city?.emoji} {ball._city?.name} · {formatDate(ball.date)} · {ball.time} · {ball.venue}</div>
        <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>Host: {ball.host||'—'} · MC: {ball.commentator||'—'} · DJ: {ball.dj||'—'}</div>
        <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>Type: {ball.ballType==='mini'?'Mini (no OTY)':ball.ballType==='kiki'?'Kiki (OTY)':'Mainstream (OTY)'} · Status: {ball.status}</div>

        {/* Intent buttons */}
        
        {/* Intent + registration */}
        {currentUser && ball.status==='upcoming' && (
          <div style={{ marginTop: 8, display:'grid', gap: 8 }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {[
                {k:'interested',label:'Interested',tone:'gold'},
                {k:'planning',label:'Planning',tone:'orange'},
                {k:'registered',label:'Registered',tone:'green'},
                {k:'not_attending',label:'Not going',tone:'red'},
              ].map(x=>(
                <Btn key={x.k} tone={myIntent===x.k?x.tone:'dark'} onClick={()=>setBallIntent(ball.id,currentUser.id,myIntent===x.k?null:x.k)}>{x.label}</Btn>
              ))}
              {ball.registrationUrl && <a href={ball.registrationUrl} target="_blank" rel="noreferrer"><Btn tone="gold">Register ↗</Btn></a>}
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', gap: 10, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ fontSize:10, color:'var(--text-dim)' }}>
                Intents: {intentSummary.counts.interested} interested · {intentSummary.counts.planning} planning · {intentSummary.counts.registered} registered · {intentSummary.counts.not_attending} not going
              </div>

              {canEdit && (
                <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
                  <span style={{ fontSize:10, color:'var(--text-dim)' }}>Visibility</span>
                  <select
                    value={ball.intentVisibility || 'public_counts'}
                    onChange={e => updateBall({ ...ball, intentVisibility: e.target.value })}
                    style={{ fontSize: 11, padding: '6px 8px', borderRadius: 10, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }}
                  >
                    <option value="public_counts">Public: counts only</option>
                    <option value="public_names">Public: names + counts</option>
                    <option value="private_organizers">Private: organizers only</option>
                    <option value="private_house">Private: house only</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Media links */}
        {(ball.livestreamUrl||ball.recapVideoUrl) && (
          <div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }}>
            {ball.livestreamUrl && <a href={ball.livestreamUrl} target="_blank" rel="noreferrer" style={{ padding:'6px 12px', borderRadius:10, background:'#FF325010', border:'1px solid #FF325030', color:'var(--red)', fontSize:11, fontWeight:800, textDecoration:'none' }}>● Watch Live</a>}
            {ball.recapVideoUrl && <a href={ball.recapVideoUrl} target="_blank" rel="noreferrer" style={{ padding:'6px 12px', borderRadius:10, background:'#BF5AF210', border:'1px solid #BF5AF230', color:'var(--purple)', fontSize:11, fontWeight:800, textDecoration:'none' }}>🎬 Recap Video</a>}
          </div>
        )}

        {/* Progress */}
        <div style={{ marginTop:10 }}>
          <div style={{ height:7, borderRadius:100, background:'#1a1a1a', overflow:'hidden' }}><div style={{ height:'100%', width:`${prog.pct}%`, background:'linear-gradient(135deg, var(--gold), var(--gold-light))' }}/></div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-dim)', marginTop:4 }}><span>{prog.done}/{prog.total} categories</span><span>${(ball.prizePot||0).toLocaleString()} prize pot</span></div>
        </div>

        {/* Admin controls */}
        <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:6 }}>
          {canEdit && <><Btn onClick={()=>updateBall({...ball,status:'upcoming'})}>Set Upcoming</Btn><Btn tone="red" onClick={()=>updateBall({...ball,status:'live'})}>Set Live</Btn><Btn tone="green" onClick={()=>updateBall({...ball,status:'completed'})}>Set Completed</Btn></>}
          <Btn onClick={()=>exportBallCSV(ball)}>Export CSV</Btn>
          {canEdit && canSubmitOTY && <Btn tone="orange" onClick={()=>submitOTY(ball.id,currentUser?.id||'anon')}>Send for OTY</Btn>}
        </div>
      </div>

      {/* OTY Review (city admin) */}
      {isCityAdmin && otyStatus==='pending' && (
        <Section title="City Admin Review" color="var(--orange)">
          <textarea value={reviewNote} onChange={e=>setReviewNote(e.target.value)} placeholder="Optional note" style={{ ...inp, minHeight:60, resize:'vertical', marginBottom:8 }}/>
          <div style={{ display:'flex', gap:6 }}><Btn tone="green" onClick={()=>reviewOTY(ball.id,'approve',currentUser?.id,'admin',reviewNote)}>Approve</Btn><Btn tone="red" onClick={()=>reviewOTY(ball.id,'reject',currentUser?.id,'admin',reviewNote)}>Reject</Btn></div>
        </Section>
      )}

      {/* RSVP */}
      <RSVPSection ball={ball} />

      {/* Judges */}
      {ball.judges && (
        <Section title={`Judges (${ball.judges.names.filter(Boolean).length}/${ball.judges.count})`} color="var(--purple)">
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>{ball.judges.names.map((n,i)=><div key={i} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', background:'#0f0f0f', borderRadius:8, border:'1px solid var(--border-light)' }}>{n?<><span style={{ width:22, height:22, borderRadius:'50%', background:'#BF5AF215', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'var(--purple)' }}>{n.split(' ').pop()[0]}</span><span style={{ fontSize:11, fontWeight:700 }}>{n}</span></>:<><span style={{ width:22, height:22, borderRadius:'50%', background:'#1e1e1e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#444' }}>?</span><span style={{ fontSize:11, color:'#444' }}>TBD</span></>}</div>)}</div>
        </Section>
      )}

      {/* Virgins */}
      {ball.virgins?.length>0 && (
        <Section title={`🌟 Virgin Walkers (${ball.virgins.length})`} color="var(--green)">
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>{ball.virgins.map((v,i)=><span key={i} style={{ padding:'4px 10px', borderRadius:100, background:'#30D15808', border:'1px solid #30D15815', fontSize:10, color:'var(--green)', fontWeight:700 }}>🌟 {v.name} · {v.category}</span>)}</div>
        </Section>
      )}

      {/* House Standings */}
      {standings.length>0 && (
        <Section title="🏛 House Standings" color="var(--orange)">
          {standings.map(([h,n],i)=><div key={h} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 6px', marginBottom:2 }}><span style={{ width:16, fontSize:11, fontWeight:800, color:i===0?'var(--gold)':'#555' }}>{i+1}</span><span style={{ flex:1, fontSize:12, fontWeight:700 }}>{h}</span><span style={{ fontSize:14, fontWeight:900 }}>{n}</span></div>)}
          {ball.grandPrize?.house && <div style={{ marginTop:6, fontSize:11, color:'var(--text-dim)', textAlign:'center' }}>Grand Prize: {ball.grandPrize.house} · ${ball.grandPrize.amount||0}</div>}
          {canEdit && !ball.grandPrize?.house && ball.status==='completed' && (()=>{ const suggested=autoGrandPrize(ball); return suggested?<Btn tone="gold" onClick={()=>updateBall({...ball,grandPrize:{...ball.grandPrize,house:suggested}})} style={{ marginTop:6 }}>Award GP to {suggested}</Btn>:null; })()}
        </Section>
      )}

      {/* Categories */}
      <Section title="Categories">
        <div style={{ display:'grid', gap:8 }}>
          {(ball.categories || []).map((cat,i) => (
            <div key={`${cat.name}-${i}`} style={{ padding:10, borderRadius:12, border:'1px solid var(--border-light)', background:cat.status==='in_progress'?'#160a0d':'#0f0f0f' }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'baseline' }}>
                <div>
                  <div style={{ fontWeight:900, fontSize:12 }}>{cat.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>
                    Prize: ${cat.prize||0} · {cat.status==='completed'?'✓ Completed':cat.status==='in_progress'?'● Live':'Pending'}
                  </div>
                </div>
                {canEdit && (
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <Btn tone={cat.status==='in_progress'?'red':'dark'} onClick={()=>setCategoryLive(ball.id,i)}>
                      {cat.status==='in_progress'?'Live':'Go Live'}
                    </Btn>
                    <Btn tone="gold" onClick={()=>startEdit(i)}>Set / edit winner</Btn>
                  </div>
                )}
              </div>

              <div style={{ marginTop:6 }}>
                <div style={{ fontSize:12 }}>
                  Winner: {cat.winner ? (
                    <Link to={`/profile/${encodeURIComponent(cat.winner)}`} style={{ fontWeight:900 }}>{cat.winner}</Link>
                  ) : (
                    <span style={{ color:'var(--text-dim)' }}>—</span>
                  )}
                  {cat.house ? <span style={{ color:'var(--text-dim)' }}> · {cat.house}</span> : null}
                </div>
                {cat.runnerUp ? (
                  <div style={{ fontSize:12 }}>
                    Runner-up: <Link to={`/profile/${encodeURIComponent(cat.runnerUp)}`} style={{ fontWeight:700 }}>{cat.runnerUp}</Link>
                    {cat.runnerUpHouse ? <span style={{ color:'var(--text-dim)' }}> · {cat.runnerUpHouse}</span> : null}
                  </div>
                ) : null}
              </div>

              {canEdit && editing === i && (
                <div style={{ marginTop:10, display:'grid', gap:6, padding:10, borderRadius:12, border:'1px solid var(--border-light)', background:'#0b0b0b' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    <input value={winner} onChange={e=>setWinnerName(e.target.value)} placeholder="Winner" style={inp}/>
                    <input value={winnerHouse} onChange={e=>setWinnerHouse(e.target.value)} placeholder="House" style={inp}/>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    <input value={runnerUp} onChange={e=>setRunnerUp(e.target.value)} placeholder="Runner-up" style={inp}/>
                    <input value={runnerUpHouse} onChange={e=>setRunnerUpHouse(e.target.value)} placeholder="Runner-up house" style={inp}/>
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <Btn tone="gold" onClick={() => saveWinner(ball.id, i)}>Save</Btn>
                    <Btn onClick={() => { setEditing(null); setWinnerName(''); setWinnerHouse(''); setRunnerUp(''); setRunnerUpHouse(''); }}>Cancel</Btn>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Workshops */}
      {(canEdit || (ball.workshops?.length>0)) && (
        <Section title="🎓 Workshops" color="var(--blue)">
          {canEdit && (
            <div style={{ padding:10, borderRadius:12, border:'1px solid var(--border-light)', background:'#0f0f0f', marginBottom:10 }}>
              <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 6 }}>Add a workshop (optional)</div>
              <div style={{ display:'grid', gap: 8 }}>
                <input value={wsName} onChange={e=>setWsName(e.target.value)} placeholder="Workshop title" style={inp}/>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
                  <input value={wsInstructor} onChange={e=>setWsInstructor(e.target.value)} placeholder="Instructor" style={inp}/>
                  <input value={wsPrice} onChange={e=>setWsPrice(e.target.value)} placeholder="Price (0 if free)" style={inp}/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
                  <input type="date" value={wsDate} onChange={e=>setWsDate(e.target.value)} style={inp}/>
                  <input value={wsTime} onChange={e=>setWsTime(e.target.value)} placeholder="Time" style={inp}/>
                </div>
                <input value={wsVenue} onChange={e=>setWsVenue(e.target.value)} placeholder="Venue (optional)" style={inp}/>
                <input value={wsRegistrationUrl} onChange={e=>setWsRegistrationUrl(e.target.value)} placeholder="Registration link (Eventbrite / VVJ / form)" style={inp}/>
                <input value={wsRegistrationNotes} onChange={e=>setWsRegistrationNotes(e.target.value)} placeholder="Registration notes (optional)" style={inp}/>
                <div style={{ display:'flex', gap: 8 }}>
                  <Btn tone="gold" onClick={() => {
                    if (!wsName.trim()) return;
                    addWorkshop(ball.id, {
                      name: wsName.trim(),
                      instructor: wsInstructor.trim() || 'TBA',
                      date: wsDate,
                      time: wsTime,
                      venue: wsVenue.trim() || ball.venue || 'TBA',
                      price: Number(wsPrice) || 0,
                      registrationUrl: wsRegistrationUrl.trim() || null,
                      registrationNotes: wsRegistrationNotes.trim() || null,
                      linkedBallId: ball.id,
                      cityId: ball._city?.id,
                    });
                    setWsName(''); setWsInstructor(''); setWsVenue(''); setWsPrice(0); setWsRegistrationUrl(''); setWsRegistrationNotes('');
                  }}>Add workshop</Btn>
                  <Btn onClick={() => { setWsName(''); setWsInstructor(''); setWsVenue(''); setWsPrice(0); setWsRegistrationUrl(''); setWsRegistrationNotes(''); }}>Clear</Btn>
                </div>
              </div>
            </div>
          )}

          {(ball.workshops?.length||0) === 0 ? (
            <div style={{ fontSize: 11, color:'var(--text-dim)' }}>No workshops listed for this ball yet.</div>
          ) : (
            ball.workshops.map(w=>(
              <div key={w.id} style={{ padding:10, borderRadius:10, border:'1px solid var(--border-light)', background:'#0f0f0f', marginBottom:6 }}>
                <div style={{ fontWeight:900, fontSize:12 }}>{w.name}</div>
                <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>Instructor: {w.instructor} · {(w.date||ball.date)} · {w.time} · {w.venue} · ${w.price||0}</div>
                {w.registrationUrl ? (
                  <div style={{ marginTop: 4 }}>
                    <a href={w.registrationUrl} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'var(--gold)', fontWeight:900 }}>Register ↗</a>
                    {w.registrationNotes ? <span style={{ fontSize: 11, color:'var(--text-dim)' }}> · {w.registrationNotes}</span> : null}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </Section>
      )}


      
      {/* Supports */}
      {currentUser && ball.status !== 'completed' && (
        <Section title="🤝 Supports" color="var(--green)">
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Track your prep + what you need, and log who you’re supporting (and who’s supporting you). This stays lightweight — no file uploads required.
          </div>

          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
            <div style={{ fontWeight: 950, fontSize: 12 }}>My support plan</div>

            <div style={{ display:'grid', gap: 8, marginTop: 8 }}>
              <input value={spCategories} onChange={e=>setSpCategories(e.target.value)} placeholder="Categories I’m walking (comma-separated)" style={inp}/>
              <input value={spNeeds} onChange={e=>setSpNeeds(e.target.value)} placeholder="What I need (comma-separated: hair, nails, stitching, ride, etc.)" style={inp}/>
              <input value={spRefs} onChange={e=>setSpRefs(e.target.value)} placeholder="Reference links (comma-separated URLs)" style={inp}/>
              <textarea value={spNotes} onChange={e=>setSpNotes(e.target.value)} placeholder="Notes (optional)" style={{ ...inp, minHeight: 80 }}/>
              <div style={{ display:'flex', gap: 8 }}>
                <Btn tone="gold" onClick={() => {
                  setUserSupportPlan(ball.id, currentUser.id, {
                    categories: spCategories.split(',').map(s=>s.trim()).filter(Boolean),
                    needs: spNeeds.split(',').map(s=>s.trim()).filter(Boolean),
                    referenceUrls: spRefs.split(',').map(s=>s.trim()).filter(Boolean),
                    notes: spNotes.trim(),
                  });
                }}>Save</Btn>
                <Btn onClick={() => { setSpCategories(''); setSpNeeds(''); setSpRefs(''); setSpNotes(''); }}>Clear</Btn>
              </div>
            </div>

            <div style={{ marginTop: 10, display:'grid', gap: 8 }}>
              <div style={{ fontWeight: 900, fontSize: 11 }}>Prep updates</div>
              <div style={{ display:'flex', gap: 8 }}>
                <input value={spUpdateText} onChange={e=>setSpUpdateText(e.target.value)} placeholder="Add a quick update (e.g., wig styled, fitting booked)" style={{ ...inp, flex: 1 }} />
                <Btn tone="gold" onClick={() => { if(!spUpdateText.trim()) return; addPrepUpdate(ball.id, currentUser.id, spUpdateText.trim()); setSpUpdateText(''); }}>Add</Btn>
              </div>
              {(plan?.prepUpdates || []).length === 0 ? (
                <div style={{ fontSize: 11, color:'var(--text-dim)' }}>No updates yet.</div>
              ) : (
                <div style={{ display:'grid', gap: 6 }}>
                  {(plan.prepUpdates || []).slice(0,6).map((u,i)=>(
                    <div key={i} style={{ fontSize: 12 }}>
                      <span style={{ color:'var(--text-dim)' }}>{new Date(u.at).toLocaleString()}</span> · {u.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
            <div style={{ fontWeight: 950, fontSize: 12 }}>What I can support with</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
              List what you can help others with. House admins can see this in the house dashboard.
            </div>
            <div style={{ display:'grid', gap: 8, marginTop: 8 }}>
              <input value={offersText} onChange={e=>setOffersText(e.target.value)} placeholder="Offers (comma-separated: nails, sewing, rides, photography, etc.)" style={inp}/>
              <div style={{ display:'flex', gap: 8 }}>
                <Btn tone="gold" onClick={() => setUserSupportOffers(currentUser.id, offersText.split(',').map(s=>s.trim()).filter(Boolean))}>Save offers</Btn>
                <Btn onClick={() => setOffersText('')}>Clear</Btn>
              </div>
              {offers.length ? <div style={{ fontSize: 11, color:'var(--text-dim)' }}>Saved: {offers.join(', ')}</div> : null}
            </div>
          </div>

          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
            <div style={{ fontWeight: 950, fontSize: 12 }}>Support assignments</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
              Log who you’re helping (and what). This is how the support map gets built.
            </div>

            <div style={{ display:'grid', gap: 8, marginTop: 8 }}>
              <input value={assignTo} onChange={e=>setAssignTo(e.target.value)} placeholder="Who am I supporting? (alias)" style={inp}/>
              <input value={assignType} onChange={e=>setAssignType(e.target.value)} placeholder="Support type (e.g., hair, nails, stitching, ride)" style={inp}/>
              <input value={assignNote} onChange={e=>setAssignNote(e.target.value)} placeholder="Note (optional)" style={inp}/>
              <Btn tone="gold" onClick={() => {
                if(!assignTo.trim() || !assignType.trim()) return;
                addSupportAssignment(ball.id, { fromUserId: currentUser.id, fromName: currentUser.name, toName: assignTo.trim(), type: assignType.trim(), note: assignNote.trim() || null });
                setAssignTo(''); setAssignType(''); setAssignNote('');
              }}>Add assignment</Btn>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 11 }}>I’m supporting</div>
              {myAssignments.length === 0 ? (
                <div style={{ fontSize: 11, color:'var(--text-dim)', marginTop: 6 }}>No assignments yet.</div>
              ) : (
                <div style={{ marginTop: 6, display:'grid', gap: 6 }}>
                  {myAssignments.slice(0,10).map(a => (
                    <div key={a.id} style={{ display:'flex', justifyContent:'space-between', gap: 10, fontSize: 12 }}>
                      <div><span style={{ fontWeight: 900 }}>{a.toName || '—'}</span> <span style={{ color:'var(--text-dim)' }}>·</span> <span style={{ fontWeight: 900 }}>{a.type}</span>{a.note ? <span style={{ color:'var(--text-dim)' }}> — {a.note}</span> : null}</div>
                      <button onClick={() => deleteSupportAssignment(ball.id, a.id)} style={{ background:'transparent', border:'none', color:'var(--orange)', fontWeight: 900, cursor:'pointer' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 11 }}>Supporting me</div>
              {mySupportReceived.length === 0 ? (
                <div style={{ fontSize: 11, color:'var(--text-dim)', marginTop: 6 }}>No one logged yet.</div>
              ) : (
                <div style={{ marginTop: 6, display:'grid', gap: 6 }}>
                  {mySupportReceived.slice(0,10).map(a => (
                    <div key={a.id} style={{ fontSize: 12 }}>
                      <span style={{ fontWeight: 900 }}>{a.fromName || '—'}</span> <span style={{ color:'var(--text-dim)' }}>·</span> <span style={{ fontWeight: 900 }}>{a.type}</span>{a.note ? <span style={{ color:'var(--text-dim)' }}> — {a.note}</span> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

{/* MVP */}
      <MVPSection ball={ball} canEdit={canEdit} />

      {/* Community Moments */}
      <MomentsSection ball={ball} canEdit={canEdit} />

      {/* Organizer Tools (admin only) */}
      {canEdit && <OrganizerSection ball={ball} />}
    </div>
  );
}
