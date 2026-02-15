export const OTY_TEMPLATES = [
  {
    id: 'kiki-standard',
    name: 'Kiki OTY Standard',
    ballTypes: ['kiki'],
    disputeWindowDays: 7,
    activeMemberRule: { minActiveMembers: 3, activeMonthsLookback: 12 },
    checklist: [
      { id: 'all-ages', title: 'All-ages event', description: 'Ball is open to all ages per city policy.', required: true, kind: 'checkbox' },
      { id: 'panel-rep', title: 'Panel representation', description: 'Panel includes representation across eligible local houses.', required: true, kind: 'checkbox' },
      { id: 'safety', title: 'Safety plan', description: 'Basic venue + door + consent/safety protocols confirmed.', required: true, kind: 'checkbox' },
    ],
  },
  {
    id: 'mainstream-standard',
    name: 'Mainstream OTY Standard',
    ballTypes: ['mainstream'],
    disputeWindowDays: 10,
    activeMemberRule: { minActiveMembers: 3, activeMonthsLookback: 12 },
    checklist: [
      { id: 'all-ages', title: 'All-ages event', description: 'Ball is open to all ages per city policy.', required: true, kind: 'checkbox' },
      { id: 'panel-rep', title: 'Panel representation', description: 'Panel includes representation across eligible local houses.', required: true, kind: 'checkbox' },
      { id: 'talent', title: 'Talent confirmations', description: 'MC/DJ/Judges confirmed and documented.', required: true, kind: 'checkbox' },
    ],
  },
  {
    id: 'oty-lite',
    name: 'OTY Lite (Small Scenes)',
    ballTypes: ['kiki', 'mainstream'],
    disputeWindowDays: 7,
    activeMemberRule: { minActiveMembers: 3, activeMonthsLookback: 18 },
    checklist: [
      { id: 'all-ages', title: 'All-ages event', description: 'Ball is open to all ages per city policy.', required: true, kind: 'checkbox' },
      { id: 'results', title: 'Results posted', description: 'Results have been posted to the scene within the required timeframe.', required: true, kind: 'checkbox' },
    ],
  },
  {
    id: 'pilot-season',
    name: 'Pilot / Beta Season',
    ballTypes: ['kiki', 'mainstream'],
    disputeWindowDays: 14,
    activeMemberRule: { minActiveMembers: 3, activeMonthsLookback: 24 },
    checklist: [
      { id: 'basic', title: 'Basic eligibility', description: 'Meets minimum eligibility for this city.', required: true, kind: 'checkbox' },
    ],
  },
];
