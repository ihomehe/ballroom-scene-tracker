import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { computeLeaderboards, getAllBalls, formatDate } from '../utils/helpers';

function diffTo(dateStr, timeStr) {
  const now = new Date();
  const t = (timeStr || '00:00').slice(0, 5);
  const d = new Date(`${dateStr}T${t}:00`);
  const ms = d.getTime() - now.getTime();
  const days = Math.floor(ms / (24 * 3600 * 1000));
  const hours = Math.floor((ms % (24 * 3600 * 1000)) / (3600 * 1000));
  return { ms, days, hours };
}

const card = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 12,
};

function Chip({ text, tone = 'gray' }) {
  const map = {
    gold: { bg: '#C8B87810', bd: '#C8B87840', fg: 'var(--gold)' },
    blue: { bg: '#64C8FF10', bd: '#64C8FF40', fg: 'var(--blue)' },
    red: { bg: '#FF325010', bd: '#FF325040', fg: 'var(--red)' },
    green: { bg: '#30D15810', bd: '#30D15840', fg: 'var(--green)' },
    gray: { bg: '#ffffff08', bd: '#ffffff12', fg: '#aaa' },
  };
  const t = map[tone] || map.gray;
  return (
    <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, border: `1px solid ${t.bd}`, background: t.bg, color: t.fg, fontWeight: 800 }}>
      {text}
    </span>
  );
}

function Button({ children, onClick, tone = 'neutral', disabled }) {
  const map = {
    neutral: { bd: 'var(--border-light)', bg: '#0f0f0f', fg: '#ddd' },
    gold: { bd: '#C8B87840', bg: '#C8B87810', fg: 'var(--gold)' },
    red: { bd: '#FF325040', bg: '#FF325010', fg: 'var(--red)' },
  };
  const t = map[tone] || map.neutral;
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '7px 10px',
        borderRadius: 10,
        border: `1px solid ${t.bd}`,
        background: t.bg,
        color: t.fg,
        fontSize: 11,
        fontWeight: 900,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.65 : 1,
      }}
    >
      {children}
    </button>
  );
}

function sortByDateAsc(a, b) {
  if (a.date === b.date) return (a.time || '').localeCompare(b.time || '');
  return a.date > b.date ? 1 : -1;
}

function inDays(dateStr, timeStr, maxDays) {
  const d = diffTo(dateStr, timeStr);
  return d.ms > 0 && d.ms <= maxDays * 24 * 3600 * 1000;
}

export default function Dashboard() {
  const {
    cities,
    currentCity,
    currentUser,
    users,
    cityWorkshops,
    setBallIntent,
    getBallIntentSummary,
    setPrepStatus,
    getPrepStatus,
  } = useStore();

  const scope = currentCity;
  const lb = useMemo(() => computeLeaderboards(cities, scope === 'global' ? 'global' : scope), [cities, scope]);
  const balls = useMemo(() => {
    const all = getAllBalls(cities, scope === 'global' ? 'global' : scope);
    return all.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [cities, scope]);

  const upcomingBalls = useMemo(() => (
    balls.filter(b => b.status === 'upcoming').sort(sortByDateAsc)
  ), [balls]);

  const nextBall = upcomingBalls[0] || null;
  const nextBallCountdown = nextBall ? diffTo(nextBall.date, nextBall.time) : null;

  const weekBalls = useMemo(() => (
    upcomingBalls
      .map(b => ({ b, d: diffTo(b.date, b.time) }))
      .filter(x => x.d.ms > 0 && x.d.ms <= 10 * 24 * 3600 * 1000)
      .sort((a, b) => a.d.ms - b.d.ms)
      .slice(0, 6)
  ), [upcomingBalls]);

  // Workshops: standalone + ball-linked (display only)
  const cityId = scope === 'global' ? 'vancouver' : scope;
  const standalone = (cityWorkshops?.[cityId] || []).slice();
  const linked = upcomingBalls.flatMap(b => (b.workshops || []).map(w => ({ ...w, linkedBallId: b.id })));
  const allWorkshops = [...standalone, ...linked]
    .filter(w => w?.date)
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  const upcomingWorkshops = allWorkshops.filter(w => inDays(w.date, w.time, 14)).slice(0, 6);

  // Reminders (in-app; derived, not pushed)
  const reminders = useMemo(() => {
    if (!currentUser) return [];
    const out = [];
    const uid = currentUser.id;

    upcomingBalls.forEach(b => {
      const d = diffTo(b.date, b.time);
      if (d.ms <= 0) return;

      const intent = getBallIntentSummary(b.id)?.intents?.[uid]?.status || null;
      if (intent === 'planning' || intent === 'registered') {
        if (d.ms <= 24 * 3600 * 1000) out.push({ kind: 'ball', text: `${b.name} starts within 24 hours`, to: `/ball/${b.id}` });
        else if (d.ms <= 3 * 24 * 3600 * 1000) out.push({ kind: 'ball', text: `${b.name} is coming up in ${Math.max(1, d.days)} days`, to: `/ball/${b.id}` });
      }
    });

    upcomingWorkshops.forEach(w => {
      const d = diffTo(w.date, w.time);
      if (d.ms > 0 && d.ms <= 3 * 24 * 3600 * 1000) {
        out.push({ kind: 'workshop', text: `Workshop coming up: ${w.title}`, to: '/workshops' });
      }
    });

    return out.slice(0, 6);
  }, [currentUser, upcomingBalls, upcomingWorkshops, getBallIntentSummary]);

  // House admin: members list (registered accounts only)
  const houseMembers = useMemo(() => {
    if (!currentUser?.house) return [];
    return (users || []).filter(u => u.role !== 'house_admin' && u.house === currentUser.house);
  }, [users, currentUser]);

  const nextBallHouseIntentCounts = useMemo(() => {
    if (!nextBall || !currentUser?.house) return null;
    const summary = getBallIntentSummary(nextBall.id);
    const counts = { interested: 0, planning: 0, registered: 0, not_attending: 0 };
    const memberIds = new Set(houseMembers.map(m => m.id));
    Object.entries(summary.intents || {}).forEach(([uid, v]) => {
      if (!memberIds.has(uid)) return;
      if (v.status === 'interested') counts.interested++;
      else if (v.status === 'planning') counts.planning++;
      else if (v.status === 'registered') counts.registered++;
      else if (v.status === 'not_attending') counts.not_attending++;
    });
    return counts;
  }, [nextBall, currentUser, houseMembers, getBallIntentSummary]);

  const isHouseAdmin = currentUser?.role === 'house_admin';
  const isCityAdmin = currentUser?.role === 'city_admin';
  const isOrganizer = currentUser?.role === 'organizer';
  const uid = currentUser?.id;

  // Personal signals
  const myIntent = nextBall && uid ? (getBallIntentSummary(nextBall.id)?.intents?.[uid]?.status || null) : null;
  const myPrep = nextBall && uid ? (getPrepStatus(nextBall.id, uid)?.status || null) : null;

  const communityPulse = useMemo(() => {
    const live = balls.filter(b => b.status === 'live').length;
    const upcoming = balls.filter(b => b.status === 'upcoming').length;
    const completed = balls.filter(b => b.status === 'completed').length;
    // additional warm stats (without “dashboard sterility”)
    const preparing = nextBall ? (getBallIntentSummary(nextBall.id)?.counts?.planning || 0) : 0;
    const workshopsThisWeek = allWorkshops.filter(w => inDays(w.date, w.time, 7)).length;
    return { live, upcoming, completed, preparing, workshopsThisWeek };
  }, [balls, nextBall, getBallIntentSummary, allWorkshops]);

  // ──────────────────────────────────────────────────────────────────────────

  if (!currentUser) {
    return (
      <div className="animate-in" style={{ display: 'grid', gap: 12 }}>
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 900 }}>Home</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            Log in to see your ball countdown, preparation status, and reminders.
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to="/auth" style={{ textDecoration: 'none' }}><Button tone="gold">Log in / Register</Button></Link>
            <Link to="/balls" style={{ textDecoration: 'none' }}><Button>Browse Balls</Button></Link>
            <Link to="/workshops" style={{ textDecoration: 'none' }}><Button>Browse Workshops</Button></Link>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.2 }}>This week in {scope === 'global' ? 'the scene' : (scope || 'the scene')}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>A quick pulse — governance + coordination, not a feed.</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Chip text={`${communityPulse.live} live`} tone={communityPulse.live ? 'red' : 'gray'} />
              <Chip text={`${communityPulse.upcoming} upcoming`} tone={communityPulse.upcoming ? 'blue' : 'gray'} />
              <Chip text={`${communityPulse.workshopsThisWeek} workshops`} tone={communityPulse.workshopsThisWeek ? 'gold' : 'gray'} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 12 }}>
      {/* Header */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 950 }}>Home</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              {currentUser.name} · {isHouseAdmin ? `House admin${currentUser.house ? ` · ${currentUser.house}` : ''}` : isCityAdmin ? 'City admin' : 'Organizer'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Chip text={`${communityPulse.upcoming} upcoming`} tone={communityPulse.upcoming ? 'blue' : 'gray'} />
            <Chip text={`${communityPulse.workshopsThisWeek} workshops`} tone={communityPulse.workshopsThisWeek ? 'gold' : 'gray'} />
            {nextBall ? <Chip text={`${communityPulse.preparing} preparing`} tone={communityPulse.preparing ? 'green' : 'gray'} /> : <Chip text="no next ball" />}
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)' }}>
          This is a coordination dashboard: upcoming balls, workshops, and governance signals.
        </div>
      </div>

      {/* Next Ball card */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 900 }}>Next upcoming ball</div>
          <Link to="/balls" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 800 }}>All balls →</Link>
        </div>

        {!nextBall ? (
          <div style={{ marginTop: 10, color: 'var(--text-dim)', fontSize: 11 }}>No upcoming balls in this view.</div>
        ) : (
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            <Link to={`/ball/${nextBall.id}`} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontWeight: 950, fontSize: 12 }}>{nextBall.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                  {nextBallCountdown?.days <= 1 ? `${Math.max(0, nextBallCountdown.days * 24 + nextBallCountdown.hours)}h` : `${Math.max(0, nextBallCountdown.days)}d`} to go
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                {formatDate(nextBall.date)}{nextBall.time ? ` · ${nextBall.time}` : ''} · {nextBall.venue}
              </div>
            </Link>

            {/* Personal intent + prep status */}
            <div style={{ display: 'grid', gap: 10, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 12 }}>Your plan</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{myIntent ? `Status: ${myIntent.replace('_', ' ')}` : 'No status set'}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Button tone={myIntent === 'interested' ? 'gold' : 'neutral'} onClick={() => setBallIntent(nextBall.id, uid, 'interested')}>Interested</Button>
                <Button tone={myIntent === 'planning' ? 'gold' : 'neutral'} onClick={() => setBallIntent(nextBall.id, uid, 'planning')}>Planning to walk</Button>
                <Button tone={myIntent === 'registered' ? 'gold' : 'neutral'} onClick={() => setBallIntent(nextBall.id, uid, 'registered')}>Registered</Button>
                <Button tone={myIntent === 'not_attending' ? 'red' : 'neutral'} onClick={() => setBallIntent(nextBall.id, uid, 'not_attending')}>Not attending</Button>
                <Button onClick={() => setBallIntent(nextBall.id, uid, null)} disabled={!myIntent}>Clear</Button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 2 }}>
                <div style={{ fontWeight: 900, fontSize: 12 }}>Preparation status</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{myPrep ? myPrep.replace('_', ' ') : 'Not set'}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Button tone={myPrep === 'ready' ? 'gold' : 'neutral'} onClick={() => setPrepStatus(nextBall.id, uid, 'ready')}>Ready</Button>
                <Button tone={myPrep === 'on_track' ? 'gold' : 'neutral'} onClick={() => setPrepStatus(nextBall.id, uid, 'on_track')}>On track</Button>
                <Button tone={myPrep === 'preparing' ? 'gold' : 'neutral'} onClick={() => setPrepStatus(nextBall.id, uid, 'preparing')}>Preparing</Button>
                <Button tone={myPrep === 'need_support' ? 'red' : 'neutral'} onClick={() => setPrepStatus(nextBall.id, uid, 'need_support')}>Need support</Button>
                <Button onClick={() => setPrepStatus(nextBall.id, uid, null)} disabled={!myPrep}>Clear</Button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Text-only pulse. Not a mood feed.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Workshops */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 900 }}>Upcoming workshops</div>
          <Link to="/workshops" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 800 }}>All workshops →</Link>
        </div>

        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          {upcomingWorkshops.length ? upcomingWorkshops.map(w => (
            <div key={w.id} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontWeight: 950, fontSize: 12 }}>{w.title}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{formatDate(w.date)}{w.time ? ` · ${w.time}` : ''}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                {(w.instructor ? `${w.instructor} · ` : '')}{w.venue || 'TBA'}{w.linkedBallId ? ' · linked to a ball' : ''}
              </div>
              {w.registrationUrl ? (
                <a href={w.registrationUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 11, color: 'var(--gold)', fontWeight: 850 }}>
                  Register externally →
                </a>
              ) : (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>Registration link not set.</div>
              )}
            </div>
          )) : (
            <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>No workshops scheduled in the next two weeks.</div>
          )}
        </div>
      </div>

      {/* Reminders */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 900 }}>Reminders</div>
          <Chip text="in-app" tone="gray" />
        </div>
        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          {reminders.length ? reminders.map((r, idx) => (
            <Link key={`${r.kind}-${idx}`} to={r.to} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
              <div style={{ fontWeight: 900, fontSize: 12 }}>{r.text}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Open →</div>
            </Link>
          )) : (
            <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>Nothing urgent right now.</div>
          )}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
          Push notifications can be added later with a real backend. This pilot keeps reminders inside the app.
        </div>
      </div>

      {/* House admin snapshot */}
      {isHouseAdmin && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 900 }}>House snapshot</div>
            {currentUser.house ? <Link to={`/house/${encodeURIComponent(currentUser.house)}`} style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 800 }}>Open house →</Link> : null}
          </div>
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            <div style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
              <div style={{ fontSize: 10, color: '#777' }}>Registered members (prototype accounts)</div>
              <div style={{ fontSize: 20, fontWeight: 950, marginTop: 2 }}>{houseMembers.length}</div>
            </div>
            {nextBall && nextBallHouseIntentCounts && (
              <div style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
                <div style={{ fontSize: 10, color: '#777' }}>For next ball</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Chip text={`${nextBallHouseIntentCounts.planning} planning`} tone={nextBallHouseIntentCounts.planning ? 'green' : 'gray'} />
                  <Chip text={`${nextBallHouseIntentCounts.registered} registered`} tone={nextBallHouseIntentCounts.registered ? 'gold' : 'gray'} />
                  <Chip text={`${nextBallHouseIntentCounts.interested} interested`} tone={nextBallHouseIntentCounts.interested ? 'blue' : 'gray'} />
                  <Chip text={`${nextBallHouseIntentCounts.not_attending} not attending`} tone={nextBallHouseIntentCounts.not_attending ? 'red' : 'gray'} />
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
                  House-level support dashboards come next (needs/offers + coordination map).
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Organizer / City admin shortcuts */}
      {(isOrganizer || isCityAdmin) && (
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 900 }}>Admin shortcuts</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to="/create" style={{ textDecoration: 'none' }}><Button tone="gold">Create ball</Button></Link>
            <Link to="/otyq" style={{ textDecoration: 'none' }}><Button>OTY queue</Button></Link>
            <Link to="/disputes" style={{ textDecoration: 'none' }}><Button>Disputes</Button></Link>
            <Link to="/policy" style={{ textDecoration: 'none' }}><Button>City policy</Button></Link>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
            Scheduling (publish-at) + notification opt-ins are designed for the backend phase.
          </div>
        </div>
      )}

      {/* Ball week mode quick list (still valuable even on personalized home) */}
      {!!weekBalls.length && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 900 }}>Ball week mode</div>
            <Chip text="next 10 days" tone="gold" />
          </div>
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            {weekBalls.map(({ b, d }) => (
              <Link key={b.id} to={`/ball/${b.id}`} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ fontWeight: 950, fontSize: 12 }}>{b.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    {d.days <= 1 ? `${Math.max(0, d.days * 24 + d.hours)}h` : `${d.days}d`} to go
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{formatDate(b.date)} · {b.venue}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Scene pulse (kept, but toned down) */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.2 }}>This week in {scope === 'global' ? 'the scene' : scope}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>A compact overview for momentum, not performance.</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Chip text={`${lb.totalBalls} balls tracked`} tone={lb.totalBalls ? 'blue' : 'gray'} />
            <Chip text={`${(lb.totalAttendance || 0).toLocaleString()} attendance logged`} tone={(lb.totalAttendance || 0) ? 'green' : 'gray'} />
          </div>
        </div>
      </div>
    </div>
  );
}
