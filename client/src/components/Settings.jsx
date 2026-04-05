import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Settings() {
  const [settings, setSettings] = useState({ base_currency: 'USD', ils_rate: 3.6 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { api('/api/portfolio/settings').then(setSettings).catch(console.error); }, []);

  const handleSave = async () => {
    setSaving(true);
    try { await api('/api/portfolio/settings', { method: 'PUT', body: { base_currency: settings.base_currency, ils_rate: settings.ils_rate } }); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const inputStyle = { background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, outline: 'none', transition: 'border-color 0.2s, background 0.3s' };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Settings</h1>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 32 }}>Currency and exchange rate.</p>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--card-shadow)', transition: 'background 0.3s', maxWidth: 600 }}>
        {[
          { label: '💱 Display Currency', id: 'settings-currency', render: () => (
            <div style={{ display: 'flex', gap: 8 }}>
              {['USD', 'ILS', 'EUR'].map(c => (
                <button key={c} type="button" onClick={() => setSettings({ ...settings, base_currency: c })}
                  style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', fontFamily: 'var(--font)',
                    background: settings.base_currency === c ? 'var(--indigo)' : 'var(--chip-bg)',
                    color: settings.base_currency === c ? '#fff' : 'var(--text3)', transition: 'all 0.2s' }}>
                  {c === 'USD' ? '$ Dollar' : c === 'ILS' ? '\u20AA Shekel' : '\u20AC Euro'}
                </button>
              ))}
            </div>
          )},
          { label: '📊 USD/ILS Rate', id: 'settings-rate', render: () => (
            <input id="settings-rate" type="number" step="0.0001" value={settings.ils_rate}
              onChange={e => setSettings({ ...settings, ils_rate: parseFloat(e.target.value) || 0 })}
              style={{ ...inputStyle, width: 120 }} onFocus={e => e.target.style.borderColor = 'var(--indigo)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          )},
          { label: '👤 User', render: () => <span style={{ fontSize: 13, color: 'var(--text)' }}>{settings.name || 'Niv'}</span> },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 20px', borderBottom: '1px solid var(--border2)', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <label htmlFor={row.id} style={{ width: 200, flexShrink: 0, fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>{row.label}</label>
            <div style={{ flex: 1 }}>{row.render()}</div>
          </div>
        ))}
      </div>

      <button type="button" onClick={handleSave} disabled={saving} aria-busy={saving}
        style={{ marginTop: 16, padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--indigo)', border: 'none', fontFamily: 'var(--font)', opacity: saving ? 0.5 : 1 }}>
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
