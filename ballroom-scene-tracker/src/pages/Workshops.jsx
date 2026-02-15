import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { formatDate } from '../utils/helpers';

const card = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 12,
};

const tabBtn = (active) => ({
  padding: '6px 10px',
  borderRadius: 999,
  border: `1px solid ${active ? '#C8B87840' : 'var(--border-light)'}`,
  background: active ? 'linear-gradient(135deg, var(--gold), var(--gold-light))' : '#0b0b0b',
  color: active ? '#000' : '#ddd',
  fontWeight: 900,
  fontSize: 11,
  cursor: 'pointer',
});

function WorkshopCard({ w }) {
  const title = w.title || w.name || 'Workshop';
  const link = w.registrationUrl || w.url || null;
  return (
    <div style={{ ...card, display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontWeight: 950, fontSize: 13 }}>{title}</div>
        {w.linkedBallName ? <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Linked: {w.linkedBallName}</div> : null}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
        {w.cityName ? `${w.cityName} · ` : ''}{w.date ? `${formatDate(w.date)} · ` : ''}{w.time || ''}{w.venue ? ` · ${w.venue}` : ''}
      </div>
      <div style={{ fontSize: 12 }}>
        <span style={{ color: 'var(--text-dim)' }}>Instructor:</span> {w.instructor || '—'}
      </div>
      {(w.tags || []).length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {w.tags.map(t => (
            <span key={t} style={{ fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 999, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }}>{t}</span>
          ))}
        </div>
      ) : null}
      {w.registrationNotes ? <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{w.registrationNotes}</div> : null}
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" style={{ marginTop: 4, textDecoration: 'none' }}>
          <div style={{ padding: '9px 10px', borderRadius: 12, border: '1px solid #C8B87840', background: '#C8B87810', color: 'var(--gold)', fontWeight: 950, fontSize: 12, textAlign: 'center' }}>
            Register externally
          </div>
        </a>
      ) : null}
    </div>
  );
}

export default function Workshops() {
  const { currentCity, cities, cityWorkshops, addCityWorkshop, deleteCityWorkshop, currentUser } = useStore();
  const city = useMemo(() => cities.find(c => c.id === currentCity), [cities, currentCity]);
  const isCityAdmin = currentUser?.role === 'city_admin' && (currentUser?.cities || []).includes(currentCity);

  const [tab, setTab] = useState('upcoming'); // upcoming | week | past
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [tags, setTags] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [registrationNotes, setRegistrationNotes] = useState('');

  const allWorkshops = useMemo(() => {
    if (!city) return [];
    const fromBalls = (city.balls || []).flatMap(b => (b.workshops || []).map(w => ({
      ...w,
      date: w.date || b.date,
      cityId: city.id,
      cityName: city.name,
      linkedBallId: b.id,
      linkedBallName: b.name,
    })));
    const standalone = (cityWorkshops?.[city.id] || []).map(w => ({
      ...w,
      cityId: city.id,
      cityName: city.name,
    }));
    const merged = [...standalone, ...fromBalls].filter(w => w.date);
    merged.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return merged;
  }, [city, cityWorkshops]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inDays = (d) => {
    const x = new Date(d);
    const diff = (new Date(x.getFullYear(), x.getMonth(), x.getDate()) - startOfToday) / (1000 * 60 * 60 * 24);
    return Math.round(diff);
  };

  const filtered = useMemo(() => {
    if (!allWorkshops.length) return [];
    if (tab === 'past') return allWorkshops.filter(w => inDays(w.date) < 0).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (tab === 'week') return allWorkshops.filter(w => {
      const d = inDays(w.date);
      return d >= 0 && d <= 7;
    });
    return allWorkshops.filter(w => inDays(w.date) >= 0);
  }, [allWorkshops, tab]);

  const addStandalone = () => {
    if (!title.trim()) return;
    addCityWorkshop(currentCity, {
      title: title.trim(),
      instructor: instructor.trim() || null,
      date,
      time: time.trim() || null,
      venue: venue.trim() || null,
      tags: tags.split(',').map(x => x.trim()).filter(Boolean),
      registrationUrl: registrationUrl.trim() || null,
      registrationNotes: registrationNotes.trim() || null,
    });
    setTitle(''); setInstructor(''); setTime(''); setVenue(''); setTags(''); setRegistrationUrl(''); setRegistrationNotes('');
  };

  if (currentCity === 'global') {
    return (
      <div className="animate-in" style={card}>
        <div style={{ fontWeight: 950, fontSize: 14 }}>Workshops</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>Pick a city above to view workshops.</div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 12 }}>
      <div style={card}>
        <div style={{ fontWeight: 950, fontSize: 14 }}>Workshops · {city?.emoji} {city?.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
          Directory + external registration links (Eventbrite, VVJ website, Google Forms, etc.).
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setTab('upcoming')} style={tabBtn(tab === 'upcoming')}>Upcoming</button>
          <button onClick={() => setTab('week')} style={tabBtn(tab === 'week')}>This week</button>
          <button onClick={() => setTab('past')} style={tabBtn(tab === 'past')}>Past</button>
        </div>
      </div>

      {isCityAdmin ? (
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 12 }}>Add Standalone Workshop (VVJ)</div>
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Workshop title" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
            <input value={instructor} onChange={e => setInstructor(e.target.value)} placeholder="Instructor" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
              <input value={time} onChange={e => setTime(e.target.value)} placeholder="Time" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
            </div>
            <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Venue" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma-separated)" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
            <input value={registrationUrl} onChange={e => setRegistrationUrl(e.target.value)} placeholder="Registration link (Eventbrite/VVJ site/etc.)" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
            <input value={registrationNotes} onChange={e => setRegistrationNotes(e.target.value)} placeholder="How to register (optional note)" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
            <button onClick={addStandalone} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #C8B87840', background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#000', fontWeight: 950, cursor: 'pointer' }}>Add workshop</button>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.length ? filtered.map(w => (
          <div key={w.id} style={{ position: 'relative' }}>
            <WorkshopCard w={w} />
            {isCityAdmin && !w.linkedBallId ? (
              <button onClick={() => deleteCityWorkshop(currentCity, w.id)} style={{ position: 'absolute', top: 10, right: 10, padding: '6px 10px', borderRadius: 10, border: '1px solid #FF325040', background: '#FF325010', color: 'var(--red)', fontWeight: 900, fontSize: 11, cursor: 'pointer' }}>Delete</button>
            ) : null}
          </div>
        )) : (
          <div style={card}>
            <div style={{ fontWeight: 900, fontSize: 12 }}>No workshops found</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>This view pulls workshops from balls + standalone city programming.</div>
          </div>
        )}
      </div>
    </div>
  );
}
