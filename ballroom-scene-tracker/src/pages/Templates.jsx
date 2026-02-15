import React, { useMemo, useState } from 'react';
import { useStore } from '../store';

const card = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 12,
};

export default function Templates() {
  const { currentCity, otyTemplates, cityPolicies, applyOTYTemplateToCity, updateCityPolicy, currentUser } = useStore();
  const cityId = currentCity;
  const isCityAdmin = currentUser?.role === 'city_admin' && (currentUser?.cities || []).includes(cityId);
  const policy = useMemo(() => cityPolicies?.[cityId], [cityPolicies, cityId]);

  const [selected, setSelected] = useState(policy?.templateId || (otyTemplates?.[0]?.id));
  const [note, setNote] = useState('');

  const template = useMemo(() => (otyTemplates || []).find(t => t.id === selected), [otyTemplates, selected]);

  const apply = () => {
    if (!isCityAdmin) return;
    applyOTYTemplateToCity(cityId, selected, note || `Applied template ${selected}`);
    setNote('');
  };

  const customizeChecklist = () => {
    if (!isCityAdmin || !template) return;
    // Lightweight: clone template checklist into policy so city admin can edit later.
    updateCityPolicy(cityId, { otyChecklist: template.checklist }, `Customized OTY checklist from template: ${template.name}`);
  };

  if (cityId === 'global') {
    return (
      <div className="animate-in" style={card}>
        <div style={{ fontWeight: 900 }}>Templates</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
          Switch to a city view to apply templates.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 12 }}>
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 950, fontFamily: 'var(--font-display)' }}>OTY Rules Templates</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
          Apply a template to create a city rules baseline. Your city admin can refine it over time.
        </div>

        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          {(otyTemplates || []).map(t => (
            <label key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: selected === t.id ? '#141414' : '#0f0f0f', cursor: 'pointer' }}>
              <input type="radio" checked={selected === t.id} onChange={() => setSelected(t.id)} />
              <div>
                <div style={{ fontWeight: 900, fontSize: 12 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                  Dispute window: {t.disputeWindowDays} days · House panel: {t.activeMemberRule.minActiveMembers}+ active members
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                  Checklist: {t.checklist.length} items
                </div>
              </div>
            </label>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 12 }}>Preview</div>
          <div style={{ marginTop: 8, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0f0f0f' }}>
            {template ? (
              <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--text-dim)', fontSize: 11 }}>
                {template.checklist.map(x => (
                  <li key={x.id}><b style={{ color: '#ddd' }}>{x.title}</b> — {x.description}</li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Select a template.</div>
            )}
          </div>
        </div>

        {isCityAdmin ? (
          <>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note (logged in revisions)" style={{ marginTop: 12, width: '100%', minHeight: 70, padding: 10, borderRadius: 12, border: '1px solid var(--border-light)', background: '#0b0b0b', color: '#ddd', fontSize: 12, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={apply} style={{ flex: 1, padding: '10px 12px', borderRadius: 12, border: '1px solid #C8B87840', background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#000', fontWeight: 900, cursor: 'pointer' }}>Apply template</button>
              <button onClick={customizeChecklist} style={{ flex: 1, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-light)', background: '#101010', color: '#ddd', fontWeight: 900, cursor: 'pointer' }}>Clone checklist</button>
            </div>
          </>
        ) : (
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-dim)' }}>
            Only city admins can apply templates.
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 12 }}>Current city template</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
          {policy?.templateId ? `Active: ${policy.templateId}` : 'No template applied yet.'}
        </div>
      </div>
    </div>
  );
}
