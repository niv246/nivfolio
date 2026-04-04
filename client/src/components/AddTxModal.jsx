import { useState, useEffect, useRef } from 'react';
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
          ticker: form.ticker,
          type: form.type,
          quantity: parseFloat(form.quantity),
          price: parseFloat(form.price),
          date: form.date,
          sector: form.sector || undefined,
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

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg border border-[rgba(55,53,47,0.09)] w-full max-w-md mx-4"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(55,53,47,0.06)]">
          <h3 className="text-[15px] font-semibold text-[#37352f]">
            {form.type === 'buy' ? '📈 Buy Stock' : '📉 Sell Stock'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-[#f7f6f3] rounded"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Type Toggle */}
          <div className="flex gap-1 bg-[#f7f6f3] rounded p-1">
            {['buy', 'sell'].map((t) => (
              <button key={t} type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={`flex-1 py-1.5 text-[13px] rounded transition-colors ${
                  form.type === t ? 'bg-white text-[#37352f] font-medium shadow-sm' : 'text-[#91918e]'
                }`}>
                {t === 'buy' ? '📈 Buy' : '📉 Sell'}
              </button>
            ))}
          </div>

          {/* Ticker */}
          <div className="relative">
            <label className="text-[11px] text-[#91918e] uppercase tracking-wider">Ticker</label>
            <div className="relative">
              <input type="text" value={form.ticker} required
                onChange={(e) => handleTickerChange(e.target.value)}
                placeholder="AAPL"
                className="w-full mt-1 px-3 py-2 text-[13px] border border-[rgba(55,53,47,0.09)] rounded outline-none focus:border-[#2383e2] font-mono"
              />
              {searching && <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#91918e] animate-pulse mt-0.5" />}
            </div>
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-[rgba(55,53,47,0.09)] rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {searchResults.map((r) => (
                  <button key={r.symbol} type="button"
                    onClick={() => selectTicker(r.symbol)}
                    className="w-full text-left px-3 py-2 hover:bg-[#f7f6f3] text-[13px] flex justify-between">
                    <span className="font-mono font-semibold">{r.symbol}</span>
                    <span className="text-[#91918e] truncate ml-2">{r.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#91918e] uppercase tracking-wider">Shares</label>
              <input type="number" step="0.01" min="0.01" required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-[13px] border border-[rgba(55,53,47,0.09)] rounded outline-none focus:border-[#2383e2] font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#91918e] uppercase tracking-wider">Price ($)</label>
              <input type="number" step="0.01" min="0.01" required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-[13px] border border-[rgba(55,53,47,0.09)] rounded outline-none focus:border-[#2383e2] font-mono"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-[11px] text-[#91918e] uppercase tracking-wider">Date</label>
            <input type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-[13px] border border-[rgba(55,53,47,0.09)] rounded outline-none focus:border-[#2383e2]"
            />
          </div>

          {/* Total */}
          {totalCost > 0 && (
            <div className="bg-[#f7f6f3] rounded px-3 py-2 text-[13px]">
              <span className="text-[#91918e]">Total: </span>
              <span className="font-mono font-semibold">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {error && (
            <div className="bg-[#ffe2dd] text-[#93000a] px-3 py-2 rounded text-[13px]">{error}</div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-2 text-[13px] text-white bg-[#2383e2] hover:bg-[#1a6bc4] rounded transition-colors disabled:opacity-50 font-medium">
            {submitting ? 'Processing...' : `${form.type === 'buy' ? 'Buy' : 'Sell'} ${form.ticker || 'Stock'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
