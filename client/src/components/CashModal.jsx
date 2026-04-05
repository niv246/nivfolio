import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { api } from '../api';

export default function CashModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    type: 'deposit', amount: '', currency: 'USD', note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef(null);
  const firstFocusRef = useRef(null);

  // #6 Focus trap + Escape key + auto-focus
  useEffect(() => {
    const el = firstFocusRef.current;
    if (el) el.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api('/api/portfolio/cash', {
        method: 'POST',
        body: {
          type: form.type, amount: parseFloat(form.amount),
          currency: form.currency, note: form.note || undefined,
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

  const modalTitleId = 'modal-title-cash';

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onClose}
      role="dialog" aria-modal="true" aria-labelledby={modalTitleId}>
      <div ref={modalRef}
        className="bg-white rounded-lg border border-[rgba(55,53,47,0.09)] w-full sm:w-[400px] max-w-[calc(100vw-2rem)] mx-4"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(55,53,47,0.06)]">
          <h3 id={modalTitleId} className="text-base font-semibold text-[#37352f]">
            {form.type === 'deposit' ? '💰 Deposit Cash' : '💸 Withdraw Cash'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close dialog"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#f7f6f3] rounded transition-colors duration-150 cursor-pointer">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3" aria-busy={submitting}>
          {/* Type Toggle */}
          <fieldset>
            <legend className="sr-only">Operation type</legend>
            <div className="flex gap-1 bg-[#f7f6f3] rounded p-1">
              {['deposit', 'withdraw'].map((t) => (
                <button key={t} type="button" ref={t === 'deposit' ? firstFocusRef : undefined}
                  onClick={() => setForm({ ...form, type: t })}
                  aria-pressed={form.type === t}
                  className={`flex-1 py-2 text-sm rounded transition-colors duration-150 cursor-pointer min-h-[44px] ${
                    form.type === t ? 'bg-white text-[#37352f] font-medium shadow-sm' : 'text-[#91918e] hover:bg-white/50'
                  }`}>
                  {t === 'deposit' ? '💰 Deposit' : '💸 Withdraw'}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Amount */}
          <div>
            <label htmlFor="cash-amount" className="text-xs text-[#91918e] uppercase tracking-wider block">Amount (USD)</label>
            <input id="cash-amount" type="number" step="0.01" min="0.01" required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="1000.00"
              aria-invalid={error ? 'true' : undefined}
              className="w-full mt-1 px-3 py-2 text-sm border border-[rgba(55,53,47,0.09)] rounded outline-none focus:border-[#2383e2] font-mono min-h-[44px]"
            />
          </div>

          {/* Note */}
          <div>
            <label htmlFor="cash-note" className="text-xs text-[#91918e] uppercase tracking-wider block">Note (optional)</label>
            <input id="cash-note" type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Initial deposit"
              className="w-full mt-1 px-3 py-2 text-sm border border-[rgba(55,53,47,0.09)] rounded outline-none focus:border-[#2383e2] min-h-[44px]"
            />
          </div>

          {error && (
            <div id="cash-error" className="bg-[#ffe2dd] text-[#93000a] px-3 py-2 rounded text-sm" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting}
            aria-describedby={error ? 'cash-error' : undefined}
            className="w-full py-3 min-h-[44px] text-sm text-white bg-[#2383e2] hover:bg-[#1a6bc4] rounded transition-colors duration-150 disabled:opacity-50 font-medium cursor-pointer">
            {submitting ? 'Processing...' : form.type === 'deposit' ? 'Deposit' : 'Withdraw'}
          </button>
        </form>
      </div>
    </div>
  );
}
