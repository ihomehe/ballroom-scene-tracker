import { HOUSE_COLORS } from './constants';

// ─── Formatting ──────────────────────────────────
export const formatDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const formatCurrency = (n) => `$${(n || 0).toLocaleString()}`;

export const houseColor = (name) => HOUSE_COLORS[name] || "#888";

// ─── Ball Helpers ────────────────────────────────
export function getAllBalls(cities, scope) {
  if (scope === "global") {
    return cities.flatMap(c => c.balls.map(b => ({ ...b, _city: c })));
  }
  const city = cities.find(c => c.id === scope);
  return (city?.balls || []).map(b => ({ ...b, _city: city }));
}

export function categoryProgress(ball) {
  const done = ball.categories.filter(c => c.status === "completed").length;
  return { done, total: ball.categories.length, pct: ball.categories.length ? (done / ball.categories.length) * 100 : 0 };
}

export function autoGrandPrize(ball) {
  const wins = {};
  ball.categories.forEach(c => {
    if (c.status === "completed" && c.house && c.house !== "Free Agent") {
      wins[c.house] = (wins[c.house] || 0) + 1;
    }
  });
  const sorted = Object.entries(wins).sort((a, b) => b[1] - a[1]);
  return sorted.length ? sorted[0][0] : null;
}

export function houseStandings(ball) {
  const wins = {};
  ball.categories.forEach(c => {
    if (c.status === "completed" && c.house && c.house !== "Free Agent") {
      wins[c.house] = (wins[c.house] || 0) + 1;
    }
  });
  return Object.entries(wins).sort((a, b) => b[1] - a[1]);
}

// ─── Leaderboards ────────────────────────────────
export function computeLeaderboards(cities, scope) {
  const balls = getAllBalls(cities, scope);
  const houseMap = {};
  const individualMap = {};

  balls.forEach(ball => {
    const countsForOTY = ball.ballType !== 'mini' && (ball.oty?.status === 'approved');
    ball.categories.forEach(cat => {
      if (cat.status !== "completed" || !cat.winner) return;

      // House stats
      if (cat.house) {
        if (!houseMap[cat.house]) {
          houseMap[cat.house] = { wins: 0, prizes: 0, categories: {}, cities: new Set(), balls: new Set(), grandPrizes: 0, otyWins: 0 };
        }
        const h = houseMap[cat.house];
        h.wins++;
        h.prizes += cat.prize;
        h.categories[cat.name] = (h.categories[cat.name] || 0) + 1;
        h.cities.add(ball._city?.name);
        h.balls.add(ball.name);
        if (countsForOTY) h.otyWins++;
      }

      // Individual stats
      if (!individualMap[cat.winner]) {
        individualMap[cat.winner] = { house: cat.house, wins: 0, prizes: 0, runnerUps: 0, mvps: 0, cities: new Set(), otyWins: 0 };
      }
      const w = individualMap[cat.winner];
      w.wins++;
      w.prizes += cat.prize;
      w.house = cat.house;
      w.cities.add(ball._city?.name);
      if (countsForOTY) w.otyWins++;

      if (cat.runnerUp) {
        if (!individualMap[cat.runnerUp]) {
          individualMap[cat.runnerUp] = { house: cat.runnerUpHouse, wins: 0, prizes: 0, runnerUps: 0, mvps: 0, cities: new Set(), otyWins: 0 };
        }
        individualMap[cat.runnerUp].runnerUps++;
      }
    });

    // Grand prize
    if (ball.grandPrize?.house && houseMap[ball.grandPrize.house]) {
      houseMap[ball.grandPrize.house].grandPrizes++;
      houseMap[ball.grandPrize.house].prizes += (ball.grandPrize.amount || 0);
    }

    // MVP
    const mvpVotes = ball.mvpVoting?.votes;
    if (mvpVotes) {
      const mvp = Object.entries(mvpVotes).sort((a, b) => b[1] - a[1])[0];
      if (mvp) {
        if (!individualMap[mvp[0]]) {
          individualMap[mvp[0]] = { house: null, wins: 0, prizes: 0, runnerUps: 0, mvps: 0, cities: new Set(), otyWins: 0 };
        }
        individualMap[mvp[0]].mvps++;
      }
    }
  });

  return {
    houses: Object.entries(houseMap)
      .map(([name, data]) => ({ name, ...data, cities: Array.from(data.cities), balls: Array.from(data.balls) }))
      .sort((a, b) => b.wins - a.wins || b.prizes - a.prizes),
    individuals: Object.entries(individualMap)
      .map(([name, data]) => ({ name, ...data, cities: Array.from(data.cities) }))
      .sort((a, b) => b.wins - a.wins || b.prizes - a.prizes),
    totalBalls: balls.length,
    totalPrize: balls.reduce((s, b) => s + b.prizePot, 0),
    totalAttendance: balls.reduce((s, b) => s + (b.attendance || 0), 0),
  };
}

// ─── Person Profile ──────────────────────────────
export function buildProfile(cities, name) {
  const p = {
    name,
    houses: new Set(),
    cities: new Set(),
    ballsWalked: 0,
    ballsSpectated: 0,
    wins: 0,
    runnerUps: 0,
    prizes: 0,
    mvps: 0,
    otyWins: 0,
    categoriesWalked: {},
    results: [],
    virginBalls: [],
    supportRoles: [],
    ballHistory: [],
  };

  cities.forEach(city => {
    city.balls.forEach(ball => {
      const countsForOTY = ball.ballType !== 'mini' && (ball.oty?.status === 'approved');
      const walker = ball.walkers?.find(w => w.name === name);
      if (walker) {
        p.ballsWalked++;
        p.houses.add(walker.house);
        p.cities.add(city.name);
        walker.categories?.forEach(c => {
          p.categoriesWalked[c] = (p.categoriesWalked[c] || 0) + 1;
        });
        p.ballHistory.push({ ball: ball.name, city: city.name, date: ball.date, role: "walker", type: ball.ballType });
      }

      if (ball.spectators?.find(s => s.name === name)) {
        p.ballsSpectated++;
        p.ballHistory.push({ ball: ball.name, city: city.name, date: ball.date, role: "spectator", type: ball.ballType });
      }

      if (ball.virgins?.find(v => v.name === name)) {
        p.virginBalls.push({ ball: ball.name, city: city.name });
      }

      // Support roles (house support planning)
      ball.supportPlan?.forEach(sp => {
        if (sp.supporters?.includes(name)) {
          p.supportRoles.push({ ball: ball.name, city: city.name, walker: sp.walker, category: sp.category });
        }
      });

      ball.categories.forEach(cat => {
        if (cat.status === "completed" && cat.winner === name) {
          p.wins++;
          p.prizes += cat.prize;
          if (countsForOTY) p.otyWins++;
          p.results.push({
            ball: ball.name, city: city.name, date: ball.date,
            category: cat.name, house: cat.house, prize: cat.prize, place: "🏆",
          });
        }
        if (cat.status === "completed" && cat.runnerUp === name) {
          p.runnerUps++;
          p.results.push({
            ball: ball.name, city: city.name, date: ball.date,
            category: cat.name, house: cat.runnerUpHouse, prize: 0, place: "🥈",
          });
        }
      });

      const mvp = ball.mvpVoting?.votes
        ? Object.entries(ball.mvpVoting.votes).sort((a, b) => b[1] - a[1])[0]
        : null;
      if (mvp && mvp[0] === name) p.mvps++;
    });
  });

  return { ...p, houses: Array.from(p.houses), cities: Array.from(p.cities) };
}

// ─── Search ──────────────────────────────────────
export function globalSearch(cities, query) {
  if (!query || query.length < 2) return { people: [], balls: [], houses: [] };
  const q = query.toLowerCase();
  const peopleMap = new Map();
  const ballResults = [];

  cities.forEach(city => {
    city.balls.forEach(ball => {
      if (ball.name.toLowerCase().includes(q)) {
        ballResults.push({ ...ball, _city: city });
      }

      // Search walkers
      ball.walkers?.forEach(w => {
        if (w.name.toLowerCase().includes(q)) {
          const key = w.name;
          if (!peopleMap.has(key)) {
            peopleMap.set(key, { name: w.name, house: w.house, cities: new Set() });
          }
          peopleMap.get(key).cities.add(city.name);
        }
      });

      // Search winners/runners
      ball.categories.forEach(cat => {
        [{ name: cat.winner, house: cat.house }, { name: cat.runnerUp, house: cat.runnerUpHouse }]
          .filter(x => x.name?.toLowerCase().includes(q))
          .forEach(x => {
            if (!peopleMap.has(x.name)) {
              peopleMap.set(x.name, { name: x.name, house: x.house, cities: new Set() });
            }
            peopleMap.get(x.name).cities.add(city.name);
          });
      });
    });
  });

  // Cross-city disambiguation
  const people = Array.from(peopleMap.values()).map(p => ({
    ...p,
    cities: Array.from(p.cities),
    disambiguation: p.cities.size > 1 ? Array.from(p.cities).join(", ") : null,
  }));

  return { people, balls: ballResults };
}
