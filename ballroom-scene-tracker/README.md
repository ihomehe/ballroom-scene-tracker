# 💮 Ballroom Scene Tracker

A global platform for the ballroom community to organize balls, track winners, manage houses, and connect scenes worldwide.

## 🚀 Quick Start

```bash
git clone https://github.com/YOUR-USERNAME/ballroom-scene-tracker.git
cd ballroom-scene-tracker
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## 🌍 Architecture

### Four User Tiers (per city)

| Tier | Role | Can Do |
|------|------|--------|
| 👁 | **Spectator / Community** | Browse balls, vote MVP, view leaderboards, track attendance history |
| 👟 | **Walker** | RSVP to balls, track personal stats, year-end review, see OTY standings |
| 🏠 | **House Member** | Manage members, plan practices, coordinate ball support plans |
| 🔐 | **Organizer / Admin** | Full ball management, budgets, checklists, revenue, workshops |

### Three Ball Types

| Type | OTY | Description |
|------|-----|-------------|
| **Mini Ball** | ❌ | Casual — does not count toward Of The Year Awards |
| **Kiki Ball** | ✅ | Counts toward OTY Awards |
| **Mainstream Ball** | ✅ | Major event — counts toward OTY Awards |

### Three Levels of Aggregation

- **City** — Local scene (Vancouver, New York, London, Tokyo...)
- **Country / Region** — National rankings
- **Global** — Worldwide leaderboard

## ✨ Features

### Core Platform
- 🎪 Create and manage balls (mini/kiki/mainstream)
- 🏆 Live category tracking — mark categories as walking, enter winners + runner-ups
- 💰 Trophy collected / prize paid toggles
- 👟👁 Walker & Spectator RSVP (choose categories you're walking)
- ⭐ MVP voting after each ball (all participants auto-nominated)
- 📊 House & Individual leaderboards (city / country / global)
- 🔍 Global search with cross-city disambiguation
- 👤 Walker profiles with year-end stats and OTY tracking

### House Management (inspired by House of Mulan's support plan)
- 👥 Member roster management
- 📋 Ball support planning per category (who supports which walker, reference photos, banners, contingency notes)
- 🗓️ Weekly practice scheduling
- 🏛️ House leaderboard across all cities

### Organizer Tools (inspired by Savannah's production spreadsheet)
- 💰 Budget tracker:
  - Revenue: tickets, tables, grants, sponsorships, workshops, donations
  - Expenses: talent, travel, per diem, staff, marketing, venue, food, prizes, workshops
  - Profit calculation
- ✅ Production checklist with completion tracking
- 👥 Guestlist with drink/food ticket allocation
- 📅 Day-of schedule
- 🏷️ Trophy label generator (category names + quantities)
- 🎓 Workshop management (sessions, instructors, RSVPs, revenue)

### Media & Community
- 📡 Livestream links during live balls (YouTube, Instagram)
- 🎬 Recap video links after balls
- 💫 Community Moments — curated highlights (text + embedded video links)
- 📱 Social export (Instagram-ready results graphics)

### Authentication & Profiles
- 🔐 Profile system (name, house, role, city)
- 🌟 Identity verification to prevent impersonation
- 👁️ Guest browsing without account
- 🎟️ Eventbrite integration ready (for ticket tracking)

## 📁 Project Structure

```
src/
├── App.jsx                 # Router + main layout
├── main.jsx                # Entry point
├── styles.css              # Global styles + CSS variables
├── components/
│   ├── layout/
│   │   ├── Header.jsx      # City selector, auth, admin toggle
│   │   └── Nav.jsx         # Bottom navigation
│   ├── ui/                 # Reusable atoms (Badge, Card, etc.)
│   ├── ball/               # Ball-specific components
│   └── house/              # House management components
├── pages/
│   ├── Dashboard.jsx       # Home — stats, live balls, rankings preview
│   ├── Balls.jsx           # All balls list
│   ├── BallDetail.jsx      # Single ball — categories, RSVP, MVP, media, organizer
│   ├── Rankings.jsx        # House + Individual leaderboards
│   ├── Search.jsx          # Global search with disambiguation
│   ├── Profile.jsx         # Walker/spectator profile + year-end stats
│   ├── HouseHub.jsx        # House management — members, practices, support plans
│   ├── CreateBall.jsx      # New ball form
│   └── Auth.jsx            # Login / Register
├── store/
│   └── index.js            # Zustand store — all state + actions
├── utils/
│   ├── constants.js        # Houses, categories, ball types, budget categories
│   └── helpers.js          # Leaderboard computation, search, profile building
├── data/
│   └── sample.js           # Sample data (Vancouver, New York, London)
└── hooks/                  # Custom React hooks
```

## 🔧 Tech Stack

- **React 18** — UI framework
- **React Router v6** — Client-side routing
- **Zustand** — State management with localStorage persistence
- **Vite** — Build tool
- **CSS Variables** — Design system (no Tailwind dependency)

## 🎨 Design System

- **Fonts**: Playfair Display (display) + DM Sans (body)
- **Colors**: Gold (#C8B878) primary, dark background (#0a0a0a)
- **House Colors**: Each house has a signature color used throughout
- **Ball Type Badges**: Blue (mini), Gold (kiki), Orange (mainstream)

## 🗺️ Data Model

### Ball Object
```
{
  id, name, ballType (mini/kiki/mainstream),
  date, time, venue, host, commentator, dj,
  status (upcoming/live/completed), prizePot,
  judges: { count, names[] },
  tables: [{ house, purchased, placement }],
  categories: [{ name, prize, status, winner, runnerUp, house, runnerUpHouse, trophyCollected, prizePaid }],
  walkers: [{ name, house, categories[] }],
  spectators: [{ name }],
  virgins: [{ name, house, category }],
  grandPrize: { house, amount },
  mvpVoting: { open, nominees[], votes{} },
  supportPlan: [{ category, walker, supporters[], notes, refPhoto, banner }],
  budget: { revenue: {...}, expenses: {...} },
  checklist: [{ task, done }],
  workshops: [{ name, instructor, time, price, venue, rsvps[] }],
  schedule: [{ time, task, who }],
  moments: [{ author, text, videoUrl, createdAt }],
  livestreamUrl, recapVideoUrl, flyer,
  attendance, doorRevenue,
}
```

## 🔮 Roadmap

### Phase 2
- [ ] In-app ticket purchasing
- [ ] Push notifications for live balls
- [ ] Photo/video galleries per ball
- [ ] OTY Awards ceremony tracking
- [ ] Practice session check-ins

### Phase 3
- [ ] Regional/national aggregation layer
- [ ] API for third-party integrations
- [ ] Mobile app (React Native)
- [ ] Scoring system integration
- [ ] Analytics dashboard for organizers

## 📝 Credits

Built for the global ballroom community.

Inspired by:
- House of Mulan's ball support planning (The Motha Kiki Ball)
- VVJ Production's event management (Savannah's comprehensive spreadsheet)
- Vancouver's ballroom scene

---

*"The category is... REALNESS."* 💮
