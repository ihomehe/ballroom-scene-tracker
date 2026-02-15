export const HOUSES = [
  { name: "House of Mulan", color: "#FF2D55", emoji: "💮" },
  { name: "House of Monroe", color: "#BF5AF2", emoji: "💜" },
  { name: "House of Siriano", color: "#64D2FF", emoji: "💎" },
  { name: "House of Garcon", color: "#30D158", emoji: "💚" },
  { name: "House of Amazon", color: "#FF9F0A", emoji: "🔥" },
  { name: "House of Revlon", color: "#FFD60A", emoji: "⭐" },
  { name: "Free Agent", color: "#98989D", emoji: "🕊️" },
];

export const HOUSE_COLORS = Object.fromEntries(HOUSES.map(h => [h.name, h.color]));
export const HOUSE_NAMES = HOUSES.map(h => h.name);

export const CATEGORIES = [
  "European Runway", "Vogue Femme", "Old Way", "New Way", "Realness",
  "Face", "Body", "Sex Siren", "Best Dressed", "Lip Sync",
  "Hands Performance", "Bizarre", "Town & Country", "Labels & Logos",
  "Hair Affair", "Streetwear", "Tag Team Realness", "Sex Appeal",
  "Shake That Ass", "Comm vs Comm",
];

export const OTA_CATEGORIES = CATEGORIES.filter(c =>
  !["Tag Team Realness", "Comm vs Comm", "Shake That Ass"].includes(c)
);

export const BALL_TYPES = {
  mini: { label: "Mini Ball", color: "#64D2FF", countsForOTY: false, description: "Casual — does not count toward OTY Awards" },
  kiki: { label: "Kiki Ball", color: "#C8B878", countsForOTY: true, description: "Counts toward OTY Awards" },
  mainstream: { label: "Mainstream Ball", color: "#FF9F0A", countsForOTY: true, description: "Major event — counts toward OTY Awards" },
};

export const BALL_STATUSES = {
  upcoming: { label: "UPCOMING", color: "#64C8FF" },
  live: { label: "● LIVE", color: "#FF3250" },
  completed: { label: "COMPLETED", color: "#C8B878" },
};

export const USER_ROLES = {
  spectator: { label: "Spectator / Community", tier: 0, description: "Browse, watch, vote" },
  walker: { label: "Walker", tier: 1, description: "Walk balls, track stats" },
  house: { label: "House Member", tier: 2, description: "Manage house, plan support" },
  admin: { label: "Organizer / Admin", tier: 3, description: "Full ball management" },
};

export const BUDGET_CATEGORIES = {
  revenue: {
    tickets: "Tickets",
    tables: "Table Sales",
    grants: "Grants",
    sponsorships: "Sponsorships",
    workshops: "Workshop Revenue",
    donations: "Donations",
    other: "Other Revenue",
  },
  expenses: {
    talent: "Judges / Guest Artists",
    travel: "Travel (incl. Baggage)",
    perDiem: "Per Diem + Transport + Accommodations",
    staff: "Staff + Contractors",
    marketing: "Marketing + Ads (Designer, Trophies, Print)",
    venue: "Venue + Technical Equipment",
    food: "Food, Supplies + Misc",
    prizes: "Category Prizes",
    workshops: "Workshop Expenses",
    other: "Other Expenses",
  },
};
