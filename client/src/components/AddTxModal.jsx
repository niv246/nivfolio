import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import { api } from '../api';

export default function AddTxModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    ticker: '', type: 'buy', quantity: '', price: '', date: new Date().toISOString().split('T')[0], sector: '',
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const searchTimeout = useRef(null);
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

  const handleTickerChange = (value) => {
    setForm({ ...form, ticker: value.toUpperCase() });
    clearTimeout(searchTimeout.current);
    if (value.length >= 1) {
      setSearching(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await api(`/api/prices/search?q=${value}`);
          setSearchResults(results);
        } catch { setSearchResults([]); }
        finally { setSearching(false); }
      }, 300);
    } else {
      setSearchResults([]);
    }
  };

  const selectTicker = (symbol) => {
    setForm({ ...form, ticker: symbol });
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api('/api/portfolio/transaction', {
        method: 'POST',
        body: {
          ticker: form.ticker, type: form.type,
          quantity: parseFloat(form.quantity), price: parseFloat(form.price),
          date: form.date, sector: form.sector || undefined,
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

  const totalCost = (parseFloat(form.quantity) || 0) * (parseFloat(form.price) || 0);
  const modalTitleId = 'modal-title-trade';

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onClose}
      role="dialog" aria-modal="true" aria-labelledby={modalTitleId}>
      <div ref={modalRef}
        className="bg-white rounded-lg border border-[rgba(55,53,47,0.09)] w-full sm:w-[440px] max-w-[calc(100vw-2rem)] mx-4"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(55,53,47,0.06)]">
          <h3 id={modalTitleId} className="text-base font-semibold text-[#37352f]">
            {form.type === 'buy' ? '📈 Buy Stock' : '📉 Sell Stock'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close dialog"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#f7f6f3] rounded transition-colors duration-150 cursor-pointer">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3" aria-busy={submitting}>
          {/* Type Toggle */}
          <fieldset>
            <legend className="sr-only">Transaction type</legend>
            <div className="flex gap-1 bg-[#f7f6f3] rounded p-1">
              {['buy', 'sell'].map((t) => (
                <button key={t} type="button" ref={t === 'buy' ? firstFocusRef : undefined}
                  onClick={() => setForm({ ...form, type: t })}
                  aria-pressed={form.type === t}
                  className={`flex-1 py-2 text-sm rounded transition-colors duration-150 cursor-pointer min-h-[44px] ${
                    form.type === t ? 'bg-white text-[#37352f] font-medium shadow-sm' : 'text-[#91918e] hover:bg-white/50'
                  }`}>
                  {t === 'buy' ? '📈 Buy' : '📉 Sell'}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Ticker */}
          <div className="relative">
            <label htmlFor="tx-ticker" className="text-xs text-[#91918e] uppercase tracking-wider block">Ticker</label>
            <div className="relative">
              <input id="tx-ticker" type="text" value={form.ticker} required
                onChange={(e) => handleTickerChange(e.target.value)}
                placeholder="AAPL" autoComplete="off"
                aria-invalid={error && !form.ticker ? 'true' : undefined}
                className="w-full mt-1 px-3 py-2 text-sm border border-[rgba(55,53,47,0.09)] rounded outline-none focus:border-[#2383e2] font-mono min-h-[44px]"
              />
              {searching && <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#91918e] animate-pulse mt-0.5" aria-hidden="true" />}
            </div>
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-[rgba(55,53,47,0.09)] rounded-lg shadow-lg max-h-40 overflow-y-auto" role="listbox">
                {searchResults.map((r) => (
                  <button key={r.symbol} type="button" role="option"
                    onClick={() => selectTicker(r.symbol)}
                    className="w-full text-left px-3 py-2 hover:bg-[#f7f6f3] text-sm flex justify-between cursor-pointer min-h-[44px] items-center transition-colors duration-150">
                    <span className="font-mono font-semibold">{r.symbol}</span>
                    <span className="text-[#91918e] truncate ml-2">{r.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity + Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-shares" className="text-xs text-[#91918e] uppercase tracking-wider block">Shares</label>
              <input id="tx-shares" type="number" step="0.01" min="0.01" required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm border border-[rgba(55,53,47,0.09)] rounded outline-none focus:border-[#2383e2] font-mono min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="tx-price" className="text-xs text-[#91918e] uppercase tracking-wider block">Price ($)</label>
              <input id="tx-price" type="number" step="0.01" min="0.01" required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm border border-[rgba(55,53,47,0.09)] rounded outline-none focus:border-[#2383e2] font-mono min-h-[44px]"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="tx-date" className="text-xs text-[#91918e] uppercase tracking-wider block">Date</label>
            <input id="tx-date" type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm border border-[rgba(55,53,47,0.09)] rounded outline-none focus:border-[#2383e2] min-h-[44px]"
            />
          </div>

          {/* Total */}
          {totalCost > 0 && (
            <div className="bg-[#f7f6f3] rounded px-3 py-2 text-sm">
              <span className="text-[#91918e]">Total: </span>
              <span className="font-mono font-semibold">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {/* #11 Error with role="alert" and aria-describedby */}
          {error && (
            <div id="tx-error" className="bg-[#ffe2dd] text-[#93000a] px-3 py-2 rounded text-sm" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting}
            aria-describedby={error ? 'tx-error' : undefined}
            className="w-full py-3 min-h-[44px] text-sm text-white bg-[#2383e2] hover:bg-[#1a6bc4] rounded transition-colors duration-150 disabled:opacity-50 font-medium cursor-pointer">
            {submitting ? 'Processing...' : `${form.type === 'buy' ? 'Buy' : 'Sell'} ${form.ticker || 'Stock'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
