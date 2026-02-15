import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../../store';
const items = [
  { path: '/', label: 'Home', icon: '◆' },
  { path: '/balls', label: 'Balls', icon: '◈' },
  { path: '/workshops', label: 'Workshops', icon: '✦' },
  { path: '/rankings', label: 'Rankings', icon: '★' },
  { path: '/archive', label: 'Archive', icon: '⌛' },
  { path: '/policy', label: 'Policy', icon: '☰' },
  { path: '/search', label: 'Search', icon: '🔍' },
];
export default function Nav() {
  const loc = useLocation();
  const { isAdmin, currentCity, currentUser } = useStore();
  const all = [...items];
  if (isAdmin && currentCity !== 'global') all.push({ path: '/create', label: '+New', icon: '' });
  const isCityAdmin = currentUser?.role === 'city_admin' && (currentUser?.cities || []).includes(currentCity);
  if (isCityAdmin && currentCity !== 'global') {
    all.splice(4, 0, { path: '/otyq', label: 'OTYQ', icon: '✔' });
    all.splice(5, 0, { path: '/disputes', label: 'Disputes', icon: '⚑' });
    all.splice(6, 0, { path: '/templates', label: 'Templates', icon: '▦' });
  }
  return (
    <nav style={{ display: 'flex', gap: 2, padding: 2, background: '#141414', borderRadius: 11, border: '1px solid #1e1e1e', marginBottom: 14 }}>
      {all.map(i => { const a = loc.pathname === i.path; return (
        <Link key={i.path} to={i.path} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '8px 2px', borderRadius: 9, fontSize: 10, fontWeight: a ? 700 : 500, color: a ? '#000' : '#777', background: a ? 'linear-gradient(135deg, var(--gold), var(--gold-light))' : 'transparent', textDecoration: 'none', fontFamily: 'inherit' }}>{i.icon && <span style={{ fontSize: 10 }}>{i.icon}</span>}{i.label}</Link>
      ); })}
    </nav>
  );
}
