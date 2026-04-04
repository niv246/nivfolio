import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { api } from '../api';

export default function Settings() {
  const [settings, setSettings] = useState({ base_currency: 'USD', ils_rate: 3.6 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api('/api/portfolio/settings').then(setSettings).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api('/api/portfolio/settings', {
        method: 'PUT',
        body: { base_currency: settings.base_currency, ils_rate: settings.ils_rate },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#37352f] mb-6">⚙️ Settings</h1>

      <div className="max-w-md">
        <div className="border border-[rgba(55,53,47,0.09)] rounded-lg divide-y divide-[rgba(55,53,47,0.06)]">
          {/* Currency */}
          <div className="flex items-center px-4 py-3">
            <label className="w-48 text-[13px] text-[#91918e]">Base Currency</label>
            <select
              value={settings.base_currency}
              onChange={(e) => setSettings({ ...settings, base_currency: e.target.value })}
              className="flex-1 text-[13px] text-[#37352f] bg-transparent border border-[rgba(55,53,47,0.09)] rounded px-2 py-1 outline-none focus:border-[#2383e2]"
            >
              <option value="USD">USD ($)</option>
              <option value="ILS">ILS (₪)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          {/* ILS Rate */}
          <div className="flex items-center px-4 py-3">
            <label className="w-48 text-[13px] text-[#91918e]">USD/ILS Rate</label>
            <input
              type="number"
              step="0.0001"
              value={settings.ils_rate}
              onChange={(e) => setSettings({ ...settings, ils_rate: parseFloat(e.target.value) || 0 })}
              className="flex-1 text-[13px] text-[#37352f] font-mono bg-transparent border border-[rgba(55,53,47,0.09)] rounded px-2 py-1 outline-none focus:border-[#2383e2]"
            />
          </div>

          {/* User Name */}
          <div className="flex items-center px-4 py-3">
            <label className="w-48 text-[13px] text-[#91918e]">User</label>
            <span className="text-[13px] text-[#37352f]">{settings.name || 'Niv'}</span>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="mt-4 flex items-center gap-1.5 px-4 py-2 text-[13px] text-white bg-[#2383e2] hover:bg-[#1a6bc4] rounded transition-colors disabled:opacity-50">
          <Save size={14} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
