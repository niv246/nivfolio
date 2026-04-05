import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { api } from '../api';

export default function Settings() {
  const [settings, setSettings] = useState({ base_currency: 'USD', ils_rate: 3.6 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { api('/api/portfolio/settings').then(setSettings).catch(console.error); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api('/api/portfolio/settings', { method: 'PUT', body: { base_currency: settings.base_currency, ils_rate: settings.ils_rate } });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const inputStyle = { background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)', outline: 'none', minHeight: 44, width: '100%' };

  return (
    <div>
      <h1 className="text-2xl sm:text-[28px] font-bold mb-6" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>⚙️ Settings</h1>

      <div className="w-full sm:max-w-md" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {[
          { label: 'Base Currency', id: 'settings-currency', render: () => (
            <select id="settings-currency" value={settings.base_currency}
              onChange={(e) => setSettings({ ...settings, base_currency: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="USD">USD ($)</option>
              <option value="ILS">ILS (\u20AA)</option>
              <option value="EUR">EUR (\u20AC)</option>
            </select>
          )},
          { label: 'USD/ILS Rate', id: 'settings-rate', render: () => (
            <input id="settings-rate" type="number" step="0.0001" value={settings.ils_rate}
              onChange={(e) => setSettings({ ...settings, ils_rate: parseFloat(e.target.value) || 0 })}
              style={inputStyle} />
          )},
          { label: 'User', render: () => (
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{settings.name || 'Niv'}</span>
          )},
        ].map((row, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center px-5 py-3.5 gap-1 sm:gap-0"
            style={{ borderBottom: '1px solid var(--border2)', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <label htmlFor={row.id} className="sm:w-48" style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>{row.label}</label>
            <div className="flex-1">{row.render()}</div>
          </div>
        ))}
      </div>

      <button type="button" onClick={handleSave} disabled={saving} aria-busy={saving}
        className="mt-4 flex items-center gap-2 px-5 py-3 min-h-[44px] text-sm font-semibold rounded-lg transition-all duration-150 disabled:opacity-50"
        style={{ background: 'var(--indigo)', color: '#fff' }}>
        <Save size={16} aria-hidden="true" />
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
