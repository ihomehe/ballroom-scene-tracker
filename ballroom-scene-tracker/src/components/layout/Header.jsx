import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';

export default function Header() {
  const { cities, currentCity, setCurrentCity, isAdmin, setIsAdmin, currentUser } = useStore();
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', marginBottom: 14 }}>
      <div style={{ fontSize: 9, letterSpacing: 5, color: 'var(--gold)', fontWeight: 700 }}>{currentCity === 'global' ? 'WORLDWIDE' : ''}</div>
      <h1 style={{ margin: '2px 0', fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 900, background: 'linear-gradient(135deg, var(--gold), var(--gold-light), var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 2 }}>BALLROOM</h1>
      <div style={{ fontSize: 8, letterSpacing: 4, color: '#444', fontWeight: 600 }}>SCENE TRACKER</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 3, marginTop: 8 }}>
        <button onClick={() => { setCurrentCity('global'); navigate('/'); }} style={{ padding: '4px 11px', borderRadius: 100, border: currentCity === 'global' ? '1px solid #C8B87840' : '1px solid #222', background: currentCity === 'global' ? '#C8B87810' : '#131313', color: currentCity === 'global' ? 'var(--gold)' : '#666', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🌍 Global</button>
        {cities.map(c => (
          <button key={c.id} onClick={() => { setCurrentCity(c.id); navigate('/'); }} style={{ padding: '4px 11px', borderRadius: 100, border: currentCity === c.id ? '1px solid #C8B87840' : '1px solid #222', background: currentCity === c.id ? '#C8B87810' : '#131313', color: currentCity === c.id ? 'var(--gold)' : '#666', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{c.emoji} {c.name}</button>
        ))}
      </div>
      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 6 }}>
        <button onClick={() => setIsAdmin(!isAdmin)} style={{ padding: '3px 10px', borderRadius: 100, border: `1px solid ${isAdmin ? '#FF325020' : '#222'}`, background: isAdmin ? '#FF325008' : '#131313', color: isAdmin ? 'var(--red)' : '#555', fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{isAdmin ? '🔐 ADMIN' : '👁 PUBLIC'}</button>
        <Link to={currentUser ? `/profile/${currentUser.name}` : '/auth'} style={{ padding: '3px 10px', borderRadius: 100, border: '1px solid #222', background: '#131313', color: currentUser ? 'var(--green)' : '#555', fontSize: 9, fontWeight: 600, fontFamily: 'inherit' }}>{currentUser ? `👤 ${currentUser.name}` : '👤 Sign In'}</Link>
      </div>
    </div>
  );
}
