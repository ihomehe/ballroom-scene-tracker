import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from './store';
import Header from './components/layout/Header';
import Nav from './components/layout/Nav';
import Dashboard from './pages/Dashboard';
import Balls from './pages/Balls';
import BallDetail from './pages/BallDetail';
import Rankings from './pages/Rankings';
import Search from './pages/Search';
import Profile from './pages/Profile';
import HouseHub from './pages/HouseHub';
import CreateBall from './pages/CreateBall';
import Auth from './pages/Auth';
import OTYQueue from './pages/OTYQueue';
import Archive from './pages/Archive';
import Disputes from './pages/Disputes';
import Policy from './pages/Policy';
import Templates from './pages/Templates';
import Workshops from './pages/Workshops';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '14px 12px 60px' }}>
        <Header />
        <Routes>
          <Route path="/" element={<><Nav /><Dashboard /></>} />
          <Route path="/balls" element={<><Nav /><Balls /></>} />
          <Route path="/ball/:id" element={<BallDetail />} />
          <Route path="/rankings" element={<><Nav /><Rankings /></>} />
          <Route path="/workshops" element={<><Nav /><Workshops /></>} />
          <Route path="/search" element={<><Nav /><Search /></>} />
          <Route path="/profile/:name" element={<Profile />} />
          <Route path="/house/:name" element={<HouseHub />} />
          <Route path="/create" element={<CreateBall />} />
          <Route path="/otyq" element={<><Nav /><OTYQueue /></>} />
          <Route path="/archive" element={<><Nav /><Archive /></>} />
          <Route path="/disputes" element={<><Nav /><Disputes /></>} />
          <Route path="/policy" element={<><Nav /><Policy /></>} />
          <Route path="/templates" element={<><Nav /><Templates /></>} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </div>
  );
}
