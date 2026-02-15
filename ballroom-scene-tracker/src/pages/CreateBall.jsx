import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { CATEGORIES, BALL_TYPES } from '../utils/constants';

const card = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 12,
};

export default function CreateBall() {
  const navigate = useNavigate();
  const { currentCity, cities, addBall, currentUser } = useStore();

  const city = useMemo(() => cities.find(c => c.id === currentCity), [cities, currentCity]);

  const [name, setName] = useState('');
  const [ballType, setBallType] = useState('kiki');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('8:00 PM');
  const [venue, setVenue] = useState('');
  const [host, setHost] = useState('');
  const [commentator, setCommentator] = useState('');
  const [dj, setDj] = useState('');
  const [prizePot, setPrizePot] = useState(0);
  const [livestreamUrl, setLivestreamUrl] = useState('');
  const [recapVideoUrl, setRecapVideoUrl] = useState('');
  const [resultsSourceUrl, setResultsSourceUrl] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');

  if (currentCity === 'global') {
    return (
      <div className="animate-in" style={card}>
        <div style={{ fontWeight: 900 }}>Create Ball</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
          Pick a city above before creating a ball.
        </div>
      </div>
    );
  }

  const makeCategories = () => CATEGORIES.map(c => ({
    name: c,
    prize: 0,
    status: 'pending',
    winner: null,
    runnerUp: null,
    house: null,
    runnerUpHouse: null,
    trophyCollected: false,
    prizePaid: false,
  }));

  const submit = () => {
    const id = Date.now();
    addBall(currentCity, {
      id,
      name: name.trim() || 'Untitled Ball',
      ballType,
      date,
      time,
      venue: venue.trim() || 'TBA',
      host: host.trim() || null,
      commentator: commentator.trim() || null,
      dj: dj.trim() || null,
      status: 'upcoming',
      prizePot: Number(prizePot) || 0,
      categories: makeCategories(),
      walkers: [],
      spectators: [],
      virgins: [],
      supportPlan: [],
      checklist: [],
      workshops: [],
      moments: [],
      livestreamUrl: livestreamUrl.trim() || null,
      recapVideoUrl: recapVideoUrl.trim() || null,
      resultsSourceUrl: resultsSourceUrl.trim() || null,
      registrationUrl: registrationUrl.trim() || null,
      intentVisibility: 'public_counts',
      oty: { status: 'not_submitted' },
      createdBy: { type: currentUser?.role === 'house_admin' ? 'house' : 'organizer', name: currentUser?.name || 'admin' },
    });
    navigate(`/ball/${id}`);
  };

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 12 }}>
      <div style={card}>
        <div style={{ fontWeight: 950, fontSize: 14 }}>Create Ball · {city?.emoji} {city?.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
          Start with the basics. You can fill winners + OTY workflow from the ball page.
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'grid', gap: 8 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ball name" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
            <input value={time} onChange={e => setTime(e.target.value)} placeholder="Time" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select value={ballType} onChange={e => setBallType(e.target.value)} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }}>
              {Object.entries(BALL_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <input type="number" value={prizePot} onChange={e => setPrizePot(e.target.value)} placeholder="Prize pot" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
          </div>

          <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Venue" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
          <input value={host} onChange={e => setHost(e.target.value)} placeholder="Host / Production" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input value={commentator} onChange={e => setCommentator(e.target.value)} placeholder="Commentator" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
            <input value={dj} onChange={e => setDj(e.target.value)} placeholder="DJ" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <input value={livestreamUrl} onChange={e => setLivestreamUrl(e.target.value)} placeholder="Livestream link (optional)" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
            <input value={recapVideoUrl} onChange={e => setRecapVideoUrl(e.target.value)} placeholder="Recap video link (optional)" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
            <input value={resultsSourceUrl} onChange={e => setResultsSourceUrl(e.target.value)} placeholder="Results/source link (optional)" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
            <input value={registrationUrl} onChange={e => setRegistrationUrl(e.target.value)} placeholder="Registration link (Eventbrite/VVJ site/etc.)" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
          </div>

          <button onClick={submit} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #C8B87840', background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#000', fontWeight: 950, cursor: 'pointer' }}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
