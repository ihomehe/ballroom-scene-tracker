import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

const card = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 12,
};

export default function Auth() {
  const navigate = useNavigate();
  const { register, login, logout, currentUser, setCurrentCity } = useStore();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('organizer');
  const [house, setHouse] = useState('');
  const [cities, setCities] = useState('vancouver');

  const submit = () => {
    const payload = {
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
      role,
      house: role === 'house_admin' ? (house.trim() || null) : null,
      cities: cities.split(',').map(s => s.trim()).filter(Boolean),
    };
    if (mode === 'register') {
      register(payload);
      if (payload.cities?.[0]) setCurrentCity(payload.cities[0]);
      navigate('/');
    } else {
      login(email.trim().toLowerCase(), password);
      navigate('/');
    }
  };

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 12 }}>
      <div style={card}>
        <div style={{ fontWeight: 950, fontSize: 14 }}>Account</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
          Prototype auth for the GitHub build. Roles are used for OTY review + house claims.
        </div>
      </div>

      {currentUser ? (
        <div style={card}>
          <div style={{ fontWeight: 950 }}>{currentUser.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            {currentUser.email} · {currentUser.role}{currentUser.house ? ` · ${currentUser.house}` : ''}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            Cities: {(currentUser.cities || []).join(', ') || '—'}
          </div>
          <button onClick={() => { logout(); navigate('/'); }} style={{ marginTop: 10, padding: '8px 10px', borderRadius: 10, border: '1px solid #FF325040', background: '#FF325010', color: 'var(--red)', fontSize: 11, fontWeight: 950, cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      ) : (
        <div style={card}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <button onClick={() => setMode('login')} style={{ padding: '6px 10px', borderRadius: 10, border: `1px solid ${mode === 'login' ? '#C8B87840' : 'var(--border-light)'}`, background: mode === 'login' ? '#C8B87810' : '#0f0f0f', color: mode === 'login' ? 'var(--gold)' : '#bbb', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Log in</button>
            <button onClick={() => setMode('register')} style={{ padding: '6px 10px', borderRadius: 10, border: `1px solid ${mode === 'register' ? '#C8B87840' : 'var(--border-light)'}`, background: mode === 'register' ? '#C8B87810' : '#0f0f0f', color: mode === 'register' ? 'var(--gold)' : '#bbb', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Register</button>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {mode === 'register' && (
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Scene name (alias)" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
            )}
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />

            {mode === 'register' && (
              <>
                <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }}>
                  <option value="organizer">Board organizer</option>
                  <option value="house_admin">House admin</option>
                  <option value="city_admin">City admin</option>
                </select>
                {role === 'house_admin' && (
                  <input value={house} onChange={e => setHouse(e.target.value)} placeholder="House name" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
                )}
                <input value={cities} onChange={e => setCities(e.target.value)} placeholder="Cities (comma-separated), e.g. vancouver" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12 }} />
              </>
            )}

            <button onClick={submit} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #C8B87840', background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#000', fontWeight: 950, cursor: 'pointer' }}>
              {mode === 'register' ? 'Create account' : 'Log in'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
