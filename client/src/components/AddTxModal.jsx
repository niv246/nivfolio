import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { api } from '../api';

export default function AddTxModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ ticker: '', type: 'buy', quantity: '', price: '', date: new Date().toISOString().split('T')[0], sector: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const searchTimeout = useRef(null);
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

  const handleTickerChange = (value) => {
    setForm({ ...form, ticker: value.toUpperCase() });
    clearTimeout(searchTimeout.current);
    if (value.length >= 1) {
      setSearching(true);
      searchTimeout.current = setTimeout(async () => {
        try { setSearchResults(await api(`/api/prices/search?q=${value}`)); }
        catch { setSearchResults([]); }
        finally { setSearching(false); }
      }, 300);
    } else setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      await api('/api/portfolio/transaction', { method: 'POST', body: { ticker: form.ticker, type: form.type, quantity: parseFloat(form.quantity), price: parseFloat(form.price), date: form.date, sector: form.sector || undefined } });
      onSaved(); onClose();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const totalCost = (parseFloat(form.quantity) || 0) * (parseFloat(form.price) || 0);
  const isBuy = form.type === 'buy';
  const inputStyle = { background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)', outline: 'none', width: '100%', minHeight: 44 };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}
      role="dialog" aria-modal="true" aria-labelledby="modal-title-trade"
      style={{ background: 'var(--modal-bg)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', padding: 16 }}>
      <div ref={modalRef} className="w-full sm:w-[420px] max-w-[calc(100vw-2rem)]"
        style={{ background: 'var(--bg2)', border: '1px solid var(--modal-border)', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 id="modal-title-trade" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            {isBuy ? '📈 Buy Stock' : '📉 Sell Stock'}
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
            <legend className="sr-only">Transaction type</legend>
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--chip-bg)' }}>
              {['buy', 'sell'].map((t) => (
                <button key={t} type="button" ref={t === 'buy' ? firstFocusRef : undefined}
                  onClick={() => setForm({ ...form, type: t })} aria-pressed={form.type === t}
                  className="flex-1 py-2 rounded-lg text-xs min-h-[44px] transition-all duration-150"
                  style={{
                    background: form.type === t ? (t === 'buy' ? 'var(--green-bg)' : 'var(--red-bg)') : 'transparent',
                    color: form.type === t ? (t === 'buy' ? 'var(--green2)' : 'var(--red2)') : 'var(--text3)',
                    fontWeight: form.type === t ? 700 : 400,
                  }}>
                  {t === 'buy' ? '📈 Buy' : '📉 Sell'}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="relative">
            <label htmlFor="tx-ticker" style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Ticker</label>
            <div className="relative">
              <input id="tx-ticker" type="text" value={form.ticker} required autoComplete="off"
                onChange={(e) => handleTickerChange(e.target.value)} placeholder="AAPL" style={inputStyle} />
              {searching && <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-pulse" style={{ color: 'var(--text3)' }} aria-hidden="true" />}
            </div>
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 rounded-lg max-h-40 overflow-y-auto" role="listbox"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                {searchResults.map((r) => (
                  <button key={r.symbol} type="button" role="option" onClick={() => { setForm({ ...form, ticker: r.symbol }); setSearchResults([]); }}
                    className="w-full text-left px-3 py-2 flex justify-between items-center min-h-[44px] transition-colors duration-150"
                    style={{ fontSize: 13, color: 'var(--text)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{r.symbol}</span>
                    <span style={{ color: 'var(--text3)', fontSize: 11 }} className="truncate ml-2">{r.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-shares" style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Shares</label>
              <input id="tx-shares" type="number" step="0.01" min="0.01" required value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="tx-price" style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Price ($)</label>
              <input id="tx-price" type="number" step="0.01" min="0.01" required value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div>
            <label htmlFor="tx-date" style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Date</label>
            <input id="tx-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
          </div>

          {totalCost > 0 && (
            <div className="rounded-xl p-3" style={{ background: 'var(--indigo-bg)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ fontSize: 10, color: 'var(--indigo2)', marginBottom: 2 }}>TOTAL</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--indigo2)' }}>
                ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}

          {error && (
            <div id="tx-error" className="rounded-lg px-3 py-2 text-sm" role="alert"
              style={{ background: 'var(--red-bg)', color: 'var(--red2)' }}>{error}</div>
          )}

          <button type="submit" disabled={submitting} aria-describedby={error ? 'tx-error' : undefined}
            className="w-full py-3 min-h-[44px] text-sm font-bold rounded-xl transition-all duration-150 disabled:opacity-50"
            style={{ background: isBuy ? 'var(--green)' : 'var(--red)', color: '#fff' }}>
            {submitting ? 'Processing...' : `${isBuy ? 'Buy' : 'Sell'} ${form.ticker || 'Stock'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
