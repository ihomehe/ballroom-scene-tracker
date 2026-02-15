import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SAMPLE_DATA } from '../data/sample';
import { OTY_TEMPLATES } from '../data/otyTemplates';

const defaultCityPolicyFromTemplate = (templateId = 'pilot-season') => {
  const t = OTY_TEMPLATES.find(x => x.id === templateId) || OTY_TEMPLATES[0];
  return {
    templateId: t.id,
    disputeWindowDays: t.disputeWindowDays,
    activeMemberRule: t.activeMemberRule,
    otyChecklist: t.checklist,
    communityConduct: [
      'No harassment or threats.',
      'No doxxing or sharing private information.',
      'No impersonation (aliases are fine; claiming another person’s identity is not).',
      'No non-consensual images or recordings.',
      'Respect venue rules and consent culture.',
    ],
    governanceNotes: [
      'City Admins certify OTY and verify houses/admins.',
      'House Admins verify their members and manage house roles/history.',
      'Disputes must be filed within the dispute window; after that, results are locked unless the city admin overrides with a logged reason.',
    ],
    revisions: [{ at: new Date().toISOString(), note: `Initialized from template: ${t.name}` }],
  };
};

export const useStore = create(
  persist(
    (set, get) => ({
      // ─── Core Data ─────────────────────────────
      cities: SAMPLE_DATA,
      currentCity: "vancouver",
      isAdmin: false,
      currentUser: null, // { id, name, house, role, email, cities }

      // ─── Policy / Templates ────────────────────
      otyTemplates: OTY_TEMPLATES,
      cityPolicies: {
        vancouver: defaultCityPolicyFromTemplate('kiki-standard'),
        newyork: defaultCityPolicyFromTemplate('mainstream-standard'),
        london: defaultCityPolicyFromTemplate('kiki-standard'),
      },

      // ─── Governance / Profiles ────────────────
      // walkerProfiles[name] = { claimedByUserId, photoUrl, statement, visibility, verification }
      walkerProfiles: {},
      // houseProfiles[name] = { claimedByUserId, crestUrl, statement, verification }
      houseProfiles: {},

      // ─── Attendance intents (lightweight, external registration) ─────────
      // ballIntents[ballId] = { [userId]: { status, updatedAt } }
      ballIntents: {},
      setBallIntent: (ballId, userId, status) => set(s => {
        if (!ballId || !userId) return {};
        const cur = s.ballIntents[ballId] || {};
        const next = { ...cur };
        if (!status) {
          delete next[userId];
        } else {
          next[userId] = { status, updatedAt: new Date().toISOString() };
        }
        return { ballIntents: { ...s.ballIntents, [ballId]: next } };
      }),
      getBallIntentSummary: (ballId) => {
        const intents = (get().ballIntents || {})[ballId] || {};
        const counts = { interested: 0, planning: 0, registered: 0, not_attending: 0 };
        Object.values(intents).forEach(v => {
          if (!v?.status) return;
          if (v.status === 'interested') counts.interested++;
          else if (v.status === 'planning') counts.planning++;
          else if (v.status === 'registered') counts.registered++;
          else if (v.status === 'not_attending') counts.not_attending++;
        });
        return { counts, intents };
      },

      // ─── Preparation status (lightweight pulse; text only) ───────────────
      // prepStatus[userId] = { [ballId]: { status, updatedAt } }
      prepStatus: {},
      setPrepStatus: (ballId, userId, status) => set(s => {
        if (!ballId || !userId) return {};
        const curUser = s.prepStatus[userId] || {};
        const nextUser = { ...curUser };
        if (!status) delete nextUser[ballId];
        else nextUser[ballId] = { status, updatedAt: new Date().toISOString() };
        return { prepStatus: { ...s.prepStatus, [userId]: nextUser } };
      }),
      getPrepStatus: (ballId, userId) => {
        const u = (get().prepStatus || {})[userId] || {};
        return u[ballId] || null;
      },

      // ─── Standalone workshops (city-level; registration handled externally) ─
      // cityWorkshops[cityId] = [{id, title, instructor, date, time, venue, tags, registrationUrl, registrationNotes, linkedBallId?}]
      cityWorkshops: { vancouver: [], newyork: [], london: [] },
      addCityWorkshop: (cityId, ws) => set(s => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const entry = { id, createdAt: new Date().toISOString(), ...ws };
        const cur = s.cityWorkshops[cityId] || [];
        return { cityWorkshops: { ...s.cityWorkshops, [cityId]: [entry, ...cur] } };
      }),
      deleteCityWorkshop: (cityId, workshopId) => set(s => {
        const cur = s.cityWorkshops[cityId] || [];
        return { cityWorkshops: { ...s.cityWorkshops, [cityId]: cur.filter(w => w.id !== workshopId) } };
      }),

      // ─── Disputes / Audit ─────────────────────
      disputes: [], // {id, cityId, kind, target, message, status, createdAt, createdByUserId, resolvedAt, resolvedByUserId, resolutionNote }
      // cityGovernance[cityId] = { name, admins: [userId] }
      cityGovernance: { vancouver: { name: 'Vancouver City Admin', admins: [] } },

      // ─── Auth ──────────────────────────────────
      users: [], // registered users
      login: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),
      register: (user) => set(s => {
        const id = Date.now().toString();
        return {
          users: [...s.users, { ...user, id, createdAt: new Date().toISOString() }],
          currentUser: { ...user, id },
        };
      }),

      // ─── Profile management ───────────────────
      setWalkerProfile: (name, data) => set(s => ({
        walkerProfiles: { ...s.walkerProfiles, [name]: { ...(s.walkerProfiles[name] || {}), ...data } },
      })),
      setHouseProfile: (name, data) => set(s => ({
        houseProfiles: { ...s.houseProfiles, [name]: { ...(s.houseProfiles[name] || {}), ...data } },
      })),
      claimWalkerProfile: (name, userId) => set(s => ({
        walkerProfiles: {
          ...s.walkerProfiles,
          [name]: { ...(s.walkerProfiles[name] || {}), claimedByUserId: userId, claimedAt: new Date().toISOString() },
        },
      })),
      claimHouseProfile: (name, userId) => set(s => ({
        houseProfiles: {
          ...s.houseProfiles,
          [name]: { ...(s.houseProfiles[name] || {}), claimedByUserId: userId, claimedAt: new Date().toISOString() },
        },
      })),
      verifyWalker: (name, verification) => set(s => ({
        walkerProfiles: {
          ...s.walkerProfiles,
          [name]: { ...(s.walkerProfiles[name] || {}), verification: { ...verification, verifiedAt: new Date().toISOString() } },
        },
      })),
      verifyHouse: (name, verification) => set(s => ({
        houseProfiles: {
          ...s.houseProfiles,
          [name]: { ...(s.houseProfiles[name] || {}), verification: { ...verification, verifiedAt: new Date().toISOString() } },
        },
      })),

      // ─── Alias / History helpers ─────────────
      addAlias: (primaryName, alias) => set(s => {
        const key = primaryName;
        const cur = s.walkerProfiles[key] || {};
        const history = Array.isArray(cur.aliasHistory) ? cur.aliasHistory : [];
        const next = [...new Set([...history, alias].filter(Boolean).map(x => String(x).trim()).filter(Boolean))];
        return { walkerProfiles: { ...s.walkerProfiles, [key]: { ...cur, aliasHistory: next } } };
      }),
      renamePrimaryAlias: (oldName, newName) => set(s => {
        const o = s.walkerProfiles[oldName] || {};
        const merged = { ...o, aliasHistory: [...new Set([...(o.aliasHistory || []), oldName].filter(Boolean))] };
        const { [oldName]: _omit, ...rest } = s.walkerProfiles;
        return { walkerProfiles: { ...rest, [newName]: merged } };
      }),

      // ─── Dispute workflow ────────────────────
      submitDispute: (payload) => set(s => ({
        disputes: [{
          id: Date.now().toString(),
          status: 'open',
          createdAt: new Date().toISOString(),
          ...payload,
        }, ...s.disputes],
      })),
      resolveDispute: (id, status, resolvedByUserId, resolutionNote) => set(s => ({
        disputes: s.disputes.map(d => d.id === id ? ({
          ...d,
          status,
          resolvedByUserId,
          resolvedAt: new Date().toISOString(),
          resolutionNote: resolutionNote || null,
        }) : d),
      })),

      // ─── OTY certification workflow ───────────
      submitOTY: (ballId, submittedByUserId) => set(s => ({
        cities: s.cities.map(c => ({
          ...c,
          balls: c.balls.map(b => {
            if (b.id !== ballId) return b;
            const oty = b.oty || { status: 'not_submitted' };
            if (b.ballType === 'mini') return { ...b, oty: { ...oty, status: 'not_eligible' } };
            return {
              ...b,
              oty: { ...oty, status: 'pending', submittedByUserId, submittedAt: new Date().toISOString(), checklist: oty.checklist || {}, attestations: oty.attestations || [] },
            };
          }),
        })),
      })),
      reviewOTY: (ballId, decision, reviewerUserId, note) => set(s => ({
        cities: s.cities.map(c => ({
          ...c,
          balls: c.balls.map(b => {
            if (b.id !== ballId) return b;
            const oty = b.oty || { status: 'not_submitted' };
            const nextStatus = decision === 'approve' ? 'approved' : decision === 'needs_changes' ? 'needs_changes' : 'rejected';
            return {
              ...b,
              oty: {
                ...oty,
                status: nextStatus,
                reviewedByUserId: reviewerUserId,
                reviewedAt: new Date().toISOString(),
                note: note || null,
              },
            };
          }),
        })),
      })),

      // ─── City policy actions ───────────────────
      applyOTYTemplateToCity: (cityId, templateId, note) => set(s => {
        const next = defaultCityPolicyFromTemplate(templateId);
        next.revisions = [{ at: new Date().toISOString(), note: note || `Applied template ${templateId}` }, ...(next.revisions || [])];
        return { cityPolicies: { ...s.cityPolicies, [cityId]: next } };
      }),
      updateCityPolicy: (cityId, patch, revisionNote) => set(s => {
        const cur = s.cityPolicies[cityId] || defaultCityPolicyFromTemplate('pilot-season');
        const revisions = [{ at: new Date().toISOString(), note: revisionNote || 'Updated policy' }, ...(cur.revisions || [])];
        return { cityPolicies: { ...s.cityPolicies, [cityId]: { ...cur, ...patch, revisions } } };
      }),

      // ─── Navigation ────────────────────────────
      setCurrentCity: (id) => set({ currentCity: id }),
      setIsAdmin: (v) => set({ isAdmin: v }),

      // ─── City Management ───────────────────────
      addCity: (city) => set(s => ({
        cities: [...s.cities, { id: city.name.toLowerCase().replace(/\s+/g, "-"), ...city, balls: [] }],
      })),

      // ─── Ball Management ───────────────────────
      addBall: (cityId, ball) => set(s => ({
        cities: s.cities.map(c =>
          c.id === cityId ? { ...c, balls: [{ ...ball, id: Date.now() }, ...c.balls] } : c
        ),
      })),

      updateBall: (ball) => set(s => ({
        cities: s.cities.map(c => ({
          ...c,
          balls: c.balls.map(b => b.id === ball.id ? ball : b),
        })),
      })),

      deleteBall: (ballId) => set(s => ({
        cities: s.cities.map(c => ({
          ...c,
          balls: c.balls.filter(b => b.id !== ballId),
        })),
      })),

      // ─── Walker/Spectator RSVP ─────────────────
      addWalker: (ballId, walker) => set(s => ({
        cities: s.cities.map(c => ({
          ...c,
          balls: c.balls.map(b =>
            b.id === ballId ? { ...b, walkers: [...(b.walkers || []), walker] } : b
          ),
        })),
      })),

      addSpectator: (ballId, spectator) => set(s => ({
        cities: s.cities.map(c => ({
          ...c,
          balls: c.balls.map(b =>
            b.id === ballId ? { ...b, spectators: [...(b.spectators || []), spectator] } : b
          ),
        })),
      })),

      // ─── Category Management ───────────────────
      setWinner: (ballId, catIndex, winner, house, runnerUp, runnerUpHouse) => set(s => ({
        cities: s.cities.map(c => ({
          ...c,
          balls: c.balls.map(b => {
            if (b.id !== ballId) return b;
            const cats = [...b.categories];
            cats[catIndex] = {
              ...cats[catIndex],
              winner, house,
              runnerUp: runnerUp || null,
              runnerUpHouse: runnerUp ? runnerUpHouse : null,
              status: "completed",
            };
            return { ...b, categories: cats };
          }),
        })),
      })),

      setCategoryLive: (ballId, catIndex) => set(s => ({
        cities: s.cities.map(c => ({
          ...c,
          balls: c.balls.map(b => {
            if (b.id !== ballId) return b;
            return {
              ...b,
              categories: b.categories.map((cat, i) => ({
                ...cat,
                status: cat.status === "completed" ? "completed" : i === catIndex ? "in_progress" : "pending",
              })),
            };
          }),
        })),
      })),

      // ─── MVP Voting ────────────────────────────
      openMVP: (ballId) => set(s => ({
        cities: s.cities.map(c => ({
          ...c,
          balls: c.balls.map(b => {
            if (b.id !== ballId) return b;
            const nominees = new Set();
            b.categories.forEach(cat => { if (cat.winner) nominees.add(cat.winner); if (cat.runnerUp) nominees.add(cat.runnerUp); });
            b.walkers?.forEach(w => nominees.add(w.name));
            b.virgins?.forEach(v => nominees.add(v.name));
            return { ...b, mvpVoting: { open: true, nominees: Array.from(nominees), votes: Object.fromEntries(Array.from(nominees).map(n => [n, 0])) } };
          }),
        })),
      })),

      voteMVP: (ballId, nominee) => set(s => ({
        cities: s.cities.map(c => ({
          ...c,
          balls: c.balls.map(b => {
            if (b.id !== ballId) return b;
            return { ...b, mvpVoting: { ...b.mvpVoting, votes: { ...b.mvpVoting.votes, [nominee]: (b.mvpVoting.votes[nominee] || 0) + 1 } } };
          }),
        })),
      })),

      closeMVP: (ballId) => set(s => ({
        cities: s.cities.map(c => ({
          ...c,
          balls: c.balls.map(b =>
            b.id === ballId ? { ...b, mvpVoting: { ...b.mvpVoting, open: false } } : b
          ),
        })),
      })),

      // ─── Community Moments ─────────────────────
      addMoment: (ballId, moment) => set(s => ({
        cities: s.cities.map(c => ({
          ...c,
          balls: c.balls.map(b =>
            b.id === ballId ? { ...b, moments: [...(b.moments || []), { ...moment, id: Date.now(), createdAt: new Date().toISOString() }] } : b
          ),
        })),
      })),

      // ─── House Management ──────────────────────
      houses: {},
      updateHouse: (houseName, data) => set(s => ({
        houses: { ...s.houses, [houseName]: { ...(s.houses[houseName] || {}), ...data } },
      })),

      addHouseMember: (houseName, member) => set(s => ({
        houses: {
          ...s.houses,
          [houseName]: {
            ...(s.houses[houseName] || { members: [], practices: [], supportPlans: {} }),
            members: [...((s.houses[houseName]?.members) || []), member],
          },
        },
      })),

      removeHouseMember: (houseName, memberName) => set(s => {
        const cur = (s.houses?.[houseName]?.members) || [];
        return {
          houses: {
            ...s.houses,
            [houseName]: {
              ...(s.houses[houseName] || { members: [], practices: [], supportPlans: {} }),
              members: cur.filter(m => (m.name || '').toLowerCase() !== (memberName || '').toLowerCase()),
            },
          },
        };
      }),


      addPractice: (houseName, practice) => set(s => ({
        houses: {
          ...s.houses,
          [houseName]: {
            ...(s.houses[houseName] || {}),
            practices: [...((s.houses[houseName]?.practices) || []), { ...practice, id: Date.now() }],
          },
        },
      })),

      // Ball support plan (like the Mulan support doc)
      setSupportPlan: (houseName, ballId, plan) => set(s => ({
        houses: {
          ...s.houses,
          [houseName]: {
            ...(s.houses[houseName] || {}),
            supportPlans: { ...((s.houses[houseName]?.supportPlans) || {}), [ballId]: plan },
          },
        },
      })),

      
      // ─── Individual Supports (per ball) ─────────────────────
      // userSupportPlans[ballId][userId] = { categories: [], needs: [], notes, referenceUrls: [], prepUpdates: [{at, text}] }
      userSupportPlans: {},
      setUserSupportPlan: (ballId, userId, plan) => set(s => ({
        userSupportPlans: {
          ...s.userSupportPlans,
          [ballId]: { ...((s.userSupportPlans || {})[ballId] || {}), [userId]: { ...( ((s.userSupportPlans||{})[ballId]||{})[userId] || {}), ...plan } },
        },
      })),
      addPrepUpdate: (ballId, userId, text) => set(s => {
        const curBall = (s.userSupportPlans || {})[ballId] || {};
        const cur = curBall[userId] || { categories: [], needs: [], referenceUrls: [], prepUpdates: [] };
        const upd = { at: new Date().toISOString(), text };
        return {
          userSupportPlans: {
            ...s.userSupportPlans,
            [ballId]: { ...curBall, [userId]: { ...cur, prepUpdates: [upd, ...(cur.prepUpdates || [])] } },
          },
        };
      }),

      // userSupportOffers[userId] = ['sewing','hair',...]
      userSupportOffers: {},
      setUserSupportOffers: (userId, offers) => set(s => ({
        userSupportOffers: { ...s.userSupportOffers, [userId]: offers },
      })),

      // supportAssignments[ballId] = [{id, fromUserId, fromName, toUserId, toName, type, note, createdAt}]
      supportAssignments: {},
      addSupportAssignment: (ballId, assignment) => set(s => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const cur = (s.supportAssignments || {})[ballId] || [];
        const entry = { id, createdAt: new Date().toISOString(), ...assignment };
        return { supportAssignments: { ...s.supportAssignments, [ballId]: [entry, ...cur] } };
      }),
      deleteSupportAssignment: (ballId, assignmentId) => set(s => {
        const cur = (s.supportAssignments || {})[ballId] || [];
        return { supportAssignments: { ...s.supportAssignments, [ballId]: cur.filter(a => a.id !== assignmentId) } };
      }),

      // Helper: aggregate house support for a given ball
      getHouseSupportSummary: (houseName, ballId) => {
        const s = get();
        const members = (s.houses?.[houseName]?.members) || [];
        const users = s.users || [];
        const memberUserIds = members
          .map(m => users.find(u => (u.name || '').toLowerCase() === (m.name || '').toLowerCase())?.id)
          .filter(Boolean);
        const plansByBall = (s.userSupportPlans || {})[ballId] || {};
        const offers = s.userSupportOffers || {};
        const assigns = (s.supportAssignments || {})[ballId] || [];
        const needsRows = members.map(m => {
          const uid = users.find(u => (u.name || '').toLowerCase() === (m.name || '').toLowerCase())?.id;
          const p = uid ? (plansByBall[uid] || {}) : {};
          return { member: m.name, userId: uid || null, categories: p.categories || [], needs: p.needs || [], notes: p.notes || '', referenceUrls: p.referenceUrls || [], prepUpdates: p.prepUpdates || [] };
        });
        const offersRows = members.map(m => {
          const uid = users.find(u => (u.name || '').toLowerCase() === (m.name || '').toLowerCase())?.id;
          return { member: m.name, userId: uid || null, offers: uid ? (offers[uid] || []) : [] };
        });
        const houseAssigns = assigns.filter(a => {
          const fromIn = a.fromUserId && memberUserIds.includes(a.fromUserId);
          const toIn = a.toUserId && memberUserIds.includes(a.toUserId);
          // also match by name if no ids
          const fromByName = !a.fromUserId && members.some(m => (m.name || '').toLowerCase() === (a.fromName || '').toLowerCase());
          const toByName = !a.toUserId && members.some(m => (m.name || '').toLowerCase() === (a.toName || '').toLowerCase());
          return fromIn || toIn || fromByName || toByName;
        });
        // Unmet needs: needs where no assignment covers that need type
        const assignedTo = new Set(houseAssigns.map(a => `${(a.toUserId||a.toName||'').toString().toLowerCase()}::${(a.type||'').toLowerCase()}`));
        const unmet = [];
        needsRows.forEach(r => {
          (r.needs || []).forEach(n => {
            const key = `${(r.userId||r.member||'').toString().toLowerCase()}::${(n||'').toLowerCase()}`;
            if (!assignedTo.has(key)) unmet.push({ member: r.member, need: n });
          });
        });
        return { members: members.map(m => m.name), needsRows, offersRows, assignments: houseAssigns, unmet };
      },
// ─── Workshops ─────────────────────────────
      addWorkshop: (ballId, workshop) => set(s => ({
        cities: s.cities.map(c => ({
          ...c,
          balls: c.balls.map(b =>
            b.id === ballId ? { ...b, workshops: [...(b.workshops || []), { ...workshop, id: Date.now(), rsvps: [] }] } : b
          ),
        })),
      })),

      rsvpWorkshop: (ballId, workshopId, name) => set(s => ({
        cities: s.cities.map(c => ({
          ...c,
          balls: c.balls.map(b => {
            if (b.id !== ballId) return b;
            return {
              ...b,
              workshops: (b.workshops || []).map(w =>
                w.id === workshopId ? { ...w, rsvps: [...w.rsvps, name] } : w
              ),
            };
          }),
        })),
      })),

      // ─── Reset ─────────────────────────────────
      reset: () => set({ cities: SAMPLE_DATA, houses: {}, currentUser: null, users: [] }),
    }),
    { name: 'ballroom-store-v1' }
  )
);
