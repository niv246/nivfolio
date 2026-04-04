import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../api';

export default function CashModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    type: 'deposit', amount: '', currency: 'USD', note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api('/api/portfolio/cash', {
        method: 'POST',
        body: {
          type: form.type,
          amount: parseFloat(form.amount),
          currency: form.currency,
          note: form.note || undefined,
        },
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg border border-[rgba(55,53,47,0.09)] w-full max-w-sm mx-4"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(55,53,47,0.06)]">
          <h3 className="text-[15px] font-semibold text-[#37352f]">
            {form.type === 'deposit' ? '💰 Deposit Cash' : '💸 Withdraw Cash'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-[#f7f6f3] rounded"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Type Toggle */}
          <div className="flex gap-1 bg-[#f7f6f3] rounded p-1">
            {['deposit', 'withdraw'].map((t) => (
              <button key={t} type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={`flex-1 py-1.5 text-[13px] rounded transition-colors ${
                  form.type === t ? 'bg-white text-[#37352f] font-medium shadow-sm' : 'text-[#91918e]'
                }`}>
                {t === 'deposit' ? '💰 Deposit' : '💸 Withdraw'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="text-[11px] text-[#91918e] uppercase tracking-wider">Amount (USD)</label>
            <input type="number" step="0.01" min="0.01" required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="1000.00"
              className="w-full mt-1 px-3 py-2 text-[13px] border border-[rgba(55,53,47,0.09)] rounded outline-none focus:border-[#2383e2] font-mono"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-[11px] text-[#91918e] uppercase tracking-wider">Note (optional)</label>
            <input type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Initial deposit"
              className="w-full mt-1 px-3 py-2 text-[13px] border border-[rgba(55,53,47,0.09)] rounded outline-none focus:border-[#2383e2]"
            />
          </div>

          {error && (
            <div className="bg-[#ffe2dd] text-[#93000a] px-3 py-2 rounded text-[13px]">{error}</div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-2 text-[13px] text-white bg-[#2383e2] hover:bg-[#1a6bc4] rounded transition-colors disabled:opacity-50 font-medium">
            {submitting ? 'Processing...' : form.type === 'deposit' ? 'Deposit' : 'Withdraw'}
          </button>
        </form>
      </div>
    </div>
  );
}
