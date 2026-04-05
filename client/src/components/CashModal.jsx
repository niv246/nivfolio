import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { api } from '../api';

export default function CashModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ type: 'deposit', amount: '', currency: 'USD', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef(null);
  const firstFocusRef = useRef(null);

  useEffect(() => {
    firstFocusRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && modalRef.current) {
        const f = modalRef.current.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      await api('/api/portfolio/cash', { method: 'POST', body: { type: form.type, amount: parseFloat(form.amount), currency: form.currency, note: form.note || undefined } });
      onSaved(); onClose();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const inputStyle = { background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)', outline: 'none', width: '100%', minHeight: 44 };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}
      role="dialog" aria-modal="true" aria-labelledby="modal-title-cash"
      style={{ background: 'var(--modal-bg)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', padding: 16 }}>
      <div ref={modalRef} className="w-full sm:w-[380px] max-w-[calc(100vw-2rem)]"
        style={{ background: 'var(--bg2)', border: '1px solid var(--modal-border)', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 id="modal-title-cash" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            {form.type === 'deposit' ? '💰 Deposit Cash' : '💸 Withdraw Cash'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close dialog"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
            style={{ color: 'var(--text3)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3" aria-busy={submitting}>
          <fieldset>
            <legend className="sr-only">Operation type</legend>
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--chip-bg)' }}>
              {['deposit', 'withdraw'].map((t) => (
                <button key={t} type="button" ref={t === 'deposit' ? firstFocusRef : undefined}
                  onClick={() => setForm({ ...form, type: t })} aria-pressed={form.type === t}
                  className="flex-1 py-2 rounded-lg text-xs min-h-[44px] transition-all duration-150"
                  style={{
                    background: form.type === t ? (t === 'deposit' ? 'var(--green-bg)' : 'var(--amber-bg)') : 'transparent',
                    color: form.type === t ? (t === 'deposit' ? 'var(--green2)' : 'var(--amber)') : 'var(--text3)',
                    fontWeight: form.type === t ? 700 : 400,
                  }}>
                  {t === 'deposit' ? '💰 Deposit' : '💸 Withdraw'}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="cash-amount" style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Amount (USD)</label>
            <input id="cash-amount" type="number" step="0.01" min="0.01" required value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="1000.00"
              aria-invalid={error ? 'true' : undefined} style={inputStyle} />
          </div>

          <div>
            <label htmlFor="cash-note" style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Note (optional)</label>
            <input id="cash-note" type="text" value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Initial deposit"
              style={{ ...inputStyle, fontFamily: 'var(--sans)' }} />
          </div>

          {error && (
            <div id="cash-error" className="rounded-lg px-3 py-2 text-sm" role="alert"
              style={{ background: 'var(--red-bg)', color: 'var(--red2)' }}>{error}</div>
          )}

          <button type="submit" disabled={submitting} aria-describedby={error ? 'cash-error' : undefined}
            className="w-full py-3 min-h-[44px] text-sm font-bold rounded-xl transition-all duration-150 disabled:opacity-50"
            style={{ background: 'var(--indigo)', color: '#fff' }}>
            {submitting ? 'Processing...' : form.type === 'deposit' ? 'Deposit' : 'Withdraw'}
          </button>
        </form>
      </div>
    </div>
  );
}
