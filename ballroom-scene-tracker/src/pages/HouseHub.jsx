import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { computeLeaderboards } from '../utils/helpers';

const card = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 12,
};

function badge(label, tone = 'gray') {
  const map = {
    gray: { fg: '#aaa', bg: '#ffffff08', bd: '#ffffff12' },
    gold: { fg: 'var(--gold)', bg: '#C8B87810', bd: '#C8B87840' },
    green: { fg: 'var(--green)', bg: '#30D15810', bd: '#30D15840' },
  };
  const s = map[tone] || map.gray;
  return <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, border: `1px solid ${s.bd}`, background: s.bg, color: s.fg, fontWeight: 800 }}>{label}</span>;
}

export default function HouseHub() {
  const { name } = useParams();
  const navigate = useNavigate();
  const decoded = decodeURIComponent(name || '');

  const {
    cities,
    currentCity,
    currentUser,
    houseProfiles,
    setHouseProfile,
    claimHouseProfile,
    submitDispute,
    houses,
    addHouseMember,
    removeHouseMember,
    getHouseSupportSummary,
  } = useStore();

  const lb = useMemo(() => computeLeaderboards(cities, currentCity === 'global' ? 'global' : currentCity), [cities, currentCity]);
  const stats = lb.houses.find(h => h.name === decoded) || { name: decoded, wins: 0, otyWins: 0, grandPrizes: 0, prizes: 0, cities: [] };
  const meta = houseProfiles[decoded] || {};

  const isSignedIn = !!currentUser;
  const isHouseAdmin = currentUser?.role === 'house_admin' && currentUser?.house === decoded;
  const isClaimed = !!meta.claimedByUserId;
  const canClaim = isHouseAdmin && !isClaimed;
  const verified = meta.verification?.status === 'verified';

  
  const [newMember, setNewMember] = useState('');
  const supportBallOptions = useMemo(() => {
    const city = cities.find(c => c.id === currentCity);
    const balls = (city?.balls || []).filter(b => b.status !== 'completed').sort((a,b) => (a.date||'').localeCompare(b.date||''));
    return balls.length ? balls : (city?.balls || []).slice(0, 3);
  }, [cities, currentCity]);
  const [supportBallId, setSupportBallId] = useState(() => String((supportBallOptions[0]?.id) || ''));
const [editMode, setEditMode] = useState(false);
  const [crestUrl, setCrestUrl] = useState(meta.crestUrl || '');
  const [statement, setStatement] = useState(meta.statement || '');
  const [history, setHistory] = useState(meta.history || { foundedYear: '', foundedBy: '', originCity: '', summary: '' });
  const [leadership, setLeadership] = useState(Array.isArray(meta.leadership) ? meta.leadership : []);
  const [socials, setSocials] = useState(meta.socialLinks || {});
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState('');

  const save = () => {
    const cleanLinks = Object.fromEntries(Object.entries(socials || {}).map(([k, v]) => [k, (v || '').trim()]).filter(([, v]) => !!v));
    setHouseProfile(decoded, {
      crestUrl: crestUrl.trim() || null,
      statement: statement.trim() || null,
      history: {
        foundedYear: String(history.foundedYear || '').trim() || null,
        foundedBy: String(history.foundedBy || '').trim() || null,
        originCity: String(history.originCity || '').trim() || null,
        summary: String(history.summary || '').trim() || null,
      },
      leadership: leadership.filter(r => r.role || r.member),
      socialLinks: cleanLinks,
    });
    setEditMode(false);
  };

  const submitReport = () => {
    submitDispute({
      cityId: currentCity === 'global' ? 'vancouver' : currentCity,
      kind: 'house',
      target: { type: 'house', name: decoded },
      message: reportMsg.trim(),
      createdByUserId: currentUser?.id || 'anonymous',
    });
    setReportMsg('');
    setReportOpen(false);
  };

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 12 }}>
      <div style={card}>
        <button onClick={() => navigate(-1)} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border-light)', background: '#0f0f0f', color: '#ddd', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginBottom: 10 }}>← Back</button>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, border: '1px solid var(--border-light)', background: '#0f0f0f', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
            {meta.crestUrl ? (
              <img src={meta.crestUrl} alt="crest" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 18, color: '#666' }}>🏠</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 950, fontFamily: 'var(--font-display)' }}>{decoded}</div>
              {verified ? badge('Verified', 'green') : isClaimed ? badge('Claimed', 'gold') : badge('Unclaimed')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
              Cities: {stats.cities?.length ? stats.cities.join(', ') : '—'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.45, color: meta.statement ? '#ddd' : 'var(--text-dim)' }}>
          {meta.statement || 'No statement yet.'}
        </div>

        {(meta.socialLinks && Object.keys(meta.socialLinks).length > 0) && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {meta.socialLinks.instagram ? <a href={meta.socialLinks.instagram} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 900 }}>Instagram</a> : null}
            {meta.socialLinks.facebook ? <a href={meta.socialLinks.facebook} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 900 }}>Facebook</a> : null}
            {meta.socialLinks.youtube ? <a href={meta.socialLinks.youtube} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 900 }}>YouTube</a> : null}
            {meta.socialLinks.website ? <a href={meta.socialLinks.website} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 900 }}>Website</a> : null}
          </div>
        )}

        {(meta.history?.foundedYear || meta.history?.foundedBy || meta.history?.originCity || meta.history?.summary) && (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
            <div style={{ fontWeight: 900, fontSize: 11 }}>House history</div>
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-dim)' }}>
              {meta.history?.foundedYear ? `Founded: ${meta.history.foundedYear}` : ''}
              {meta.history?.originCity ? ` · Origin: ${meta.history.originCity}` : ''}
              {meta.history?.foundedBy ? ` · Founded by: ${meta.history.foundedBy}` : ''}
            </div>
            {meta.history?.summary ? (
              <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.45 }}>{meta.history.summary}</div>
            ) : null}
          </div>
        )}

        {(Array.isArray(meta.leadership) && meta.leadership.length > 0) && (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
            <div style={{ fontWeight: 900, fontSize: 11 }}>Leadership</div>
            <div style={{ marginTop: 6, display: 'grid', gap: 6 }}>
              {meta.leadership.slice(0, 8).map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12 }}>
                  <div style={{ fontWeight: 900 }}>{r.role || 'Role'}</div>
                  <div style={{ color: 'var(--text-dim)' }}>{r.member || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {!isSignedIn && (
            <Link to="/auth" style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #C8B87840', background: '#C8B87810', color: 'var(--gold)', fontSize: 11, fontWeight: 900 }}>Sign in</Link>
          )}
          {canClaim && (
            <button onClick={() => claimHouseProfile(decoded, currentUser.id)} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #C8B87840', background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#000', fontSize: 11, fontWeight: 950, cursor: 'pointer' }}>
              Claim house
            </button>
          )}
          {isHouseAdmin && (
            <button onClick={() => { setCrestUrl(meta.crestUrl || ''); setStatement(meta.statement || ''); setEditMode(v => !v); }} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border-light)', background: '#0f0f0f', color: '#ddd', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
              {editMode ? 'Close edit' : 'Edit'}
            </button>
          )}
          <button onClick={() => setReportOpen(v => !v)} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #FF9F0A40', background: '#FF9F0A10', color: 'var(--orange)', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>
            Report issue
          </button>
        </div>
      </div>

      {editMode && (
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 12 }}>Edit house profile</div>
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            <input value={crestUrl} onChange={e => setCrestUrl(e.target.value)} placeholder="Crest image URL" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
            <textarea value={statement} onChange={e => setStatement(e.target.value)} placeholder="Statement" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12, minHeight: 80, resize: 'vertical' }} />

            <div style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
              <div style={{ fontWeight: 900, fontSize: 11 }}>History</div>
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input value={history.foundedYear || ''} onChange={e => setHistory(h => ({ ...h, foundedYear: e.target.value }))} placeholder="Founded year" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
                <input value={history.originCity || ''} onChange={e => setHistory(h => ({ ...h, originCity: e.target.value }))} placeholder="Origin city" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
                <input value={history.foundedBy || ''} onChange={e => setHistory(h => ({ ...h, foundedBy: e.target.value }))} placeholder="Founded by" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
                <input value={socials.website || ''} onChange={e => setSocials(s => ({ ...s, website: e.target.value }))} placeholder="Website link" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
              </div>
              <textarea value={history.summary || ''} onChange={e => setHistory(h => ({ ...h, summary: e.target.value }))} placeholder="Short history summary" style={{ marginTop: 8, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12, minHeight: 90, resize: 'vertical', width: '100%' }} />
            </div>

            <div style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
              <div style={{ fontWeight: 900, fontSize: 11 }}>Leadership roles</div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>Add titles like Mother/Father, Prince/Princess, Godmother, etc.</div>
              <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                {(leadership.length ? leadership : [{ role: '', member: '' }]).map((r, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input value={r.role || ''} onChange={e => setLeadership(L => L.map((x, idx) => idx === i ? ({ ...x, role: e.target.value }) : x))} placeholder="Role" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
                    <input value={r.member || ''} onChange={e => setLeadership(L => L.map((x, idx) => idx === i ? ({ ...x, member: e.target.value }) : x))} placeholder="Person" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
                  </div>
                ))}
                <button onClick={() => setLeadership(L => [...L, { role: '', member: '' }])} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #C8B87840', background: '#C8B87810', color: 'var(--gold)', fontSize: 11, fontWeight: 950, cursor: 'pointer' }}>+ Add role</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input value={socials.instagram || ''} onChange={e => setSocials(s => ({ ...s, instagram: e.target.value }))} placeholder="Instagram link" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
              <input value={socials.facebook || ''} onChange={e => setSocials(s => ({ ...s, facebook: e.target.value }))} placeholder="Facebook link" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
            </div>
            <input value={socials.youtube || ''} onChange={e => setSocials(s => ({ ...s, youtube: e.target.value }))} placeholder="YouTube link" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={save} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #30D15840', background: '#30D15810', color: 'var(--green)', fontSize: 11, fontWeight: 950, cursor: 'pointer' }}>Save</button>
              <button onClick={() => setEditMode(false)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)', background: '#0f0f0f', color: '#ddd', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {reportOpen && (
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 12 }}>Report an issue</div>
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-dim)' }}>
            Use this for verifiable issues (wrong win attribution, house name collisions, impersonation).
          </div>
          <textarea value={reportMsg} onChange={e => setReportMsg(e.target.value)} placeholder="What’s wrong? Include ball name/date/category if relevant." style={{ marginTop: 10, width: '100%', minHeight: 80, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button disabled={!reportMsg.trim()} onClick={submitReport} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #FF9F0A40', background: '#FF9F0A10', color: 'var(--orange)', fontSize: 11, fontWeight: 950, cursor: reportMsg.trim() ? 'pointer' : 'not-allowed', opacity: reportMsg.trim() ? 1 : 0.5 }}>Submit</button>
            <button onClick={() => setReportOpen(false)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)', background: '#0f0f0f', color: '#ddd', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 12 }}>House stats</div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <div style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
            <div style={{ fontSize: 10, color: '#777' }}>Wins</div>
            <div style={{ fontSize: 18, fontWeight: 950, marginTop: 2 }}>{stats.wins}</div>
          </div>
          <div style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
            <div style={{ fontSize: 10, color: '#777' }}>OTY wins</div>
            <div style={{ fontSize: 18, fontWeight: 950, marginTop: 2, color: stats.otyWins ? 'var(--gold)' : '#ddd' }}>{stats.otyWins}</div>
          </div>
          <div style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
            <div style={{ fontSize: 10, color: '#777' }}>Grand prizes</div>
            <div style={{ fontSize: 18, fontWeight: 950, marginTop: 2 }}>{stats.grandPrizes}</div>
          </div>
          <div style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
            <div style={{ fontSize: 10, color: '#777' }}>Prize money</div>
            <div style={{ fontSize: 18, fontWeight: 950, marginTop: 2 }}>${(stats.prizes || 0).toLocaleString()}</div>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)' }}>
          Tip: later we can add a “House Huddle” tab for verified houses (chat + announcements), without storing media on phones.
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 12 }}>Walkers (from results)</div>
        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          {lb.individuals.filter(i => i.house === decoded).slice(0, 30).map(i => (
            <Link key={i.name} to={`/profile/${encodeURIComponent(i.name)}`} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontWeight: 900 }}>{i.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{i.wins} wins · {i.otyWins} OTY</div>
            </Link>
          ))}
          {!lb.individuals.some(i => i.house === decoded) && (
            <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>No linked results yet.</div>
          )}
        </div>
      </div>

      {/* Member Roster */}
      <MemberSection decoded={decoded} isHouseAdmin={isHouseAdmin} />

      {/* Practice Scheduling */}
      <PracticeSection decoded={decoded} isHouseAdmin={isHouseAdmin} />
    </div>
  );
}

function MemberSection({ decoded, isHouseAdmin }) {
  const { houses, addHouseMember } = useStore();
  const members = houses[decoded]?.members || [];
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  const add = () => { if(!name.trim())return; addHouseMember(decoded, { name:name.trim(), role, joinedAt:new Date().toISOString() }); setName(''); };

  return (
    <div style={card}>
      <div style={{ fontWeight:900, fontSize:12 }}>👥 Member Roster ({members.length})</div>
      <div style={{ marginTop:10, display:'grid', gap:4 }}>
        {members.map((m,i)=>(
          <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 8px', background:'#0f0f0f', borderRadius:8, fontSize:11 }}>
            <Link to={`/profile/${encodeURIComponent(m.name)}`} style={{ fontWeight:700 }}>{m.name}</Link>
            <span style={{ color:'var(--text-dim)' }}>{m.role}</span>
          </div>
        ))}
        {members.length===0 && <div style={{ fontSize:11, color:'var(--text-dim)' }}>No members added yet.</div>}
      </div>
      {isHouseAdmin && (
        <div style={{ marginTop:8, display:'flex', gap:5, flexWrap:'wrap' }}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Member name" style={{ flex:'1 1 120px', padding:10, borderRadius:12, border:'1px solid var(--border-light)', background:'#0b0b0b', color:'#ddd', fontSize:12 }}/>
          <select value={role} onChange={e=>setRole(e.target.value)} style={{ flex:'0 1 100px', padding:10, borderRadius:12, border:'1px solid var(--border-light)', background:'#0b0b0b', color:'#ddd', fontSize:12 }}>
            <option value="member">Member</option><option value="mother">Mother</option><option value="father">Father</option><option value="prince">Prince</option><option value="princess">Princess</option><option value="godmother">Godmother</option><option value="007">007</option>
          </select>
          <button onClick={add} disabled={!name.trim()} style={{ padding:'8px 10px', borderRadius:10, border:'1px solid #C8B87840', background:'#C8B87810', color:'var(--gold)', fontSize:11, fontWeight:950, cursor:name.trim()?'pointer':'not-allowed', opacity:name.trim()?1:.5, fontFamily:'inherit' }}>Add</button>
        </div>
      )}
    </div>
  );
}

function PracticeSection({ decoded, isHouseAdmin }) {
  const { houses, addPractice } = useStore();
  const practices = houses[decoded]?.practices || [];
  const [day, setDay] = useState('Monday');
  const [time, setTime] = useState('7:00 PM');
  const [loc, setLoc] = useState('');
  const [focus, setFocus] = useState('');
  const add = () => { addPractice(decoded, { day, time, location:loc.trim()||'TBD', focus:focus.trim()||null, createdAt:new Date().toISOString() }); setLoc(''); setFocus(''); };

  return (
    <div style={card}>
      <div style={{ fontWeight:900, fontSize:12 }}>🗓 Practice Schedule ({practices.length})</div>
      <div style={{ marginTop:10, display:'grid', gap:4 }}>
        {practices.map(p=>(
          <div key={p.id} style={{ padding:'8px 10px', background:'#0f0f0f', borderRadius:8, border:'1px solid var(--border-light)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
              <span style={{ fontWeight:800 }}>{p.day} · {p.time}</span>
              <span style={{ fontSize:10, color:'var(--text-dim)' }}>{p.location}</span>
            </div>
            {p.focus && <div style={{ fontSize:11, color:'var(--gold)', marginTop:2 }}>Focus: {p.focus}</div>}
          </div>
        ))}
        {practices.length===0 && <div style={{ fontSize:11, color:'var(--text-dim)' }}>No practices scheduled.</div>}
      </div>
      {isHouseAdmin && (
        <div style={{ marginTop:8, display:'grid', gap:5 }}>
          <div style={{ display:'flex', gap:5 }}>
            <select value={day} onChange={e=>setDay(e.target.value)} style={{ flex:1, padding:10, borderRadius:12, border:'1px solid var(--border-light)', background:'#0b0b0b', color:'#ddd', fontSize:12 }}>
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d=><option key={d}>{d}</option>)}
            </select>
            <input value={time} onChange={e=>setTime(e.target.value)} placeholder="Time" style={{ flex:1, padding:10, borderRadius:12, border:'1px solid var(--border-light)', background:'#0b0b0b', color:'#ddd', fontSize:12 }}/>
          </div>
          <div style={{ display:'flex', gap:5 }}>
            <input value={loc} onChange={e=>setLoc(e.target.value)} placeholder="Location" style={{ flex:1, padding:10, borderRadius:12, border:'1px solid var(--border-light)', background:'#0b0b0b', color:'#ddd', fontSize:12 }}/>
            <input value={focus} onChange={e=>setFocus(e.target.value)} placeholder="Focus (optional)" style={{ flex:1, padding:10, borderRadius:12, border:'1px solid var(--border-light)', background:'#0b0b0b', color:'#ddd', fontSize:12 }}/>
          </div>
          <button onClick={add} style={{ padding:'8px 10px', borderRadius:10, border:'1px solid #C8B87840', background:'#C8B87810', color:'var(--gold)', fontSize:11, fontWeight:950, cursor:'pointer', fontFamily:'inherit' }}>Add Practice</button>
        </div>
      )}
    
      {isHouseAdmin && (
        <div style={card}>
          <div style={{ fontWeight: 950, fontSize: 12 }}>House members</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
            Add aliases so the house dashboard can aggregate support needs and who is helping who.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input value={newMember} onChange={e => setNewMember(e.target.value)} placeholder="Add member alias (e.g., Nostalgia)" style={{ flex: 1, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
            <button
              onClick={() => {
                const nm = newMember.trim();
                if (!nm) return;
                addHouseMember(decoded, { name: nm, addedAt: new Date().toISOString() });
                setNewMember('');
              }}
              style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #C8B87840', background: '#C8B87810', color: 'var(--gold)', fontSize: 11, fontWeight: 950, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Add
            </button>
          </div>

          <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
            {((houses?.[decoded]?.members) || []).length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>No members added yet.</div>
            ) : (
              ((houses?.[decoded]?.members) || []).map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 10px', borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
                  <div style={{ fontWeight: 900, fontSize: 12 }}>{m.name}</div>
                  <button onClick={() => removeHouseMember(decoded, m.name)} style={{ fontSize: 11, fontWeight: 900, color: 'var(--orange)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isHouseAdmin && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
            <div style={{ fontWeight: 950, fontSize: 12 }}>House support dashboard</div>
            <select value={supportBallId} onChange={e => setSupportBallId(e.target.value)} style={{ fontSize: 11, padding: '6px 8px', borderRadius: 10, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }}>
              {supportBallOptions.map(b => (
                <option key={b.id} value={String(b.id)}>{b.name} · {b.date}</option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
            Overview of what your members need, what they’re offering, and what’s still unassigned.
          </div>

          {(() => {
            const sid = supportBallId ? Number(supportBallId) : (supportBallOptions[0]?.id);
            const summary = sid ? getHouseSupportSummary(decoded, sid) : { needsRows: [], offersRows: [], assignments: [], unmet: [] };
            return (
              <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                <div style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
                  <div style={{ fontWeight: 900, fontSize: 11 }}>Unmet needs</div>
                  {(summary.unmet || []).length === 0 ? (
                    <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>No unmet needs tracked yet.</div>
                  ) : (
                    <div style={{ marginTop: 6, display: 'grid', gap: 6 }}>
                      {summary.unmet.slice(0, 12).map((u, i) => (
                        <div key={i} style={{ fontSize: 12 }}>
                          <span style={{ fontWeight: 900 }}>{u.member}</span> <span style={{ color: 'var(--text-dim)' }}>needs</span> <span style={{ fontWeight: 900 }}>{u.need}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
                  <div style={{ fontWeight: 900, fontSize: 11 }}>Support map</div>
                  {(summary.assignments || []).length === 0 ? (
                    <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>No support assignments logged yet.</div>
                  ) : (
                    <div style={{ marginTop: 6, display: 'grid', gap: 6 }}>
                      {summary.assignments.slice(0, 12).map(a => (
                        <div key={a.id} style={{ fontSize: 12 }}>
                          <span style={{ fontWeight: 900 }}>{a.fromName || '—'}</span> <span style={{ color: 'var(--text-dim)' }}>→</span> <span style={{ fontWeight: 900 }}>{a.toName || '—'}</span> <span style={{ color: 'var(--text-dim)' }}>·</span> <span style={{ fontWeight: 900 }}>{a.type}</span>
                          {a.note ? <span style={{ color: 'var(--text-dim)' }}> — {a.note}</span> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

</div>
  );
}
