import React, { useMemo, useState } from 'react';
import { useStore } from '../store';

const card = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 12,
};

function Section({ title, children }) {
  return (
    <div style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f', marginTop: 10 }}>
      <div style={{ fontWeight: 900, fontSize: 12 }}>{title}</div>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}

export default function Policy() {
  const { currentCity, cityPolicies, updateCityPolicy, currentUser } = useStore();
  const cityId = currentCity;
  const policy = useMemo(() => cityPolicies?.[cityId], [cityPolicies, cityId]);
  const isCityAdmin = currentUser?.role === 'city_admin' && (currentUser?.cities || []).includes(cityId);

  const [conductDraft, setConductDraft] = useState((policy?.communityConduct || []).join('\n'));
  const [govDraft, setGovDraft] = useState((policy?.governanceNotes || []).join('\n'));
  const [disputeDays, setDisputeDays] = useState(policy?.disputeWindowDays || 7);
  const [minMembers, setMinMembers] = useState(policy?.activeMemberRule?.minActiveMembers || 3);
  const [lookback, setLookback] = useState(policy?.activeMemberRule?.activeMonthsLookback || 12);

  if (!policy) {
    return (
      <div className="animate-in" style={card}>
        <div style={{ fontWeight: 900 }}>No policy found for this city.</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
          Switch to a city view to see city policies.
        </div>
      </div>
    );
  }

  const save = () => {
    updateCityPolicy(cityId, {
      disputeWindowDays: Number(disputeDays) || 7,
      activeMemberRule: { minActiveMembers: Number(minMembers) || 3, activeMonthsLookback: Number(lookback) || 12 },
      communityConduct: conductDraft.split('\n').map(x => x.trim()).filter(Boolean),
      governanceNotes: govDraft.split('\n').map(x => x.trim()).filter(Boolean),
    }, 'Edited city policy');
  };

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 12 }}>
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 950, fontFamily: 'var(--font-display)' }}>City Policy</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
          {cityId === 'global' ? 'Switch to a city to view policy.' : `Policy for ${cityId}. Revisions are logged.`}
        </div>

        <Section title="OTY Rules">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: '#777' }}>Dispute window (days)</div>
              <input disabled={!isCityAdmin} value={disputeDays} onChange={e => setDisputeDays(e.target.value)} style={{ width: '100%', marginTop: 6, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#777' }}>House panel eligibility</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                Min active members: <b>{minMembers}</b> · Activity lookback: <b>{lookback} months</b>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <input disabled={!isCityAdmin} value={minMembers} onChange={e => setMinMembers(e.target.value)} placeholder="min" style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
                <input disabled={!isCityAdmin} value={lookback} onChange={e => setLookback(e.target.value)} placeholder="months" style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd' }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-dim)' }}>
            Checklist items are managed via Templates → Apply/Customize.
          </div>
        </Section>

        <Section title="Community Conduct">
          <textarea disabled={!isCityAdmin} value={conductDraft} onChange={e => setConductDraft(e.target.value)} style={{ width: '100%', minHeight: 140, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12, resize: 'vertical' }} />
        </Section>

        <Section title="Governance Notes">
          <textarea disabled={!isCityAdmin} value={govDraft} onChange={e => setGovDraft(e.target.value)} style={{ width: '100%', minHeight: 120, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12, resize: 'vertical' }} />
        </Section>

        {isCityAdmin && (
          <button onClick={save} style={{ marginTop: 12, width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid #C8B87840', background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#000', fontWeight: 900, cursor: 'pointer' }}>
            Save policy changes
          </button>
        )}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 12 }}>Revision history</div>
        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          {(policy.revisions || []).slice(0, 10).map((r, i) => (
            <div key={i} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{new Date(r.at).toLocaleString()}</div>
              <div style={{ fontWeight: 800, marginTop: 2 }}>{r.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
