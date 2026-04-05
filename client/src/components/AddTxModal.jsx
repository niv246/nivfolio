import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { api } from '../api';

const SECTORS = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrial', 'Real Estate', 'Telecom', 'Materials', 'Utilities'];
const FINNHUB_MAP = { 'Technology': 'Technology', 'Healthcare': 'Healthcare', 'Financial Services': 'Finance', 'Financials': 'Finance', 'Energy': 'Energy', 'Consumer Cyclical': 'Consumer', 'Consumer Defensive': 'Consumer', 'Industrials': 'Industrial', 'Real Estate': 'Real Estate', 'Communication Services': 'Telecom', 'Basic Materials': 'Materials', 'Utilities': 'Utilities' };

export default function AddTxModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ ticker: '', type: 'buy', quantity: '', price: '', date: new Date().toISOString().split('T')[0], sector: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lookupData, setLookupData] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const searchTimeout = useRef(null);
  const lookupTimeout = useRef(null);
  const modalRef = useRef(null);
  const firstFocusRef = useRef(null);

  // Load portfolio value for % calculation
  useEffect(() => {
    api('/api/portfolio/stats').then(s => setPortfolioValue(s.portfolioValue || 0)).catch(() => {});
  }, []);

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
    return () => { document.removeEventListener('keydown', handleKeyDown); clearTimeout(lookupTimeout.current); clearTimeout(searchTimeout.current); };
  }, [onClose]);

  const doLookup = (ticker) => {
    clearTimeout(lookupTimeout.current);
    if (ticker.length < 1) { setLookupData(null); setLookupError(null); return; }
    lookupTimeout.current = setTimeout(async () => {
      setLookupLoading(true); setLookupError(null);
      try {
        const res = await fetch(`/api/prices/lookup/${ticker}`);
        if (!res.ok) { setLookupError('Ticker not found'); setLookupLoading(false); return; }
        const data = await res.json();
        setLookupData(data);
        if (data.price) setForm(prev => ({ ...prev, price: data.price.toFixed(2) }));
        const mapped = FINNHUB_MAP[data.sector] || (SECTORS.includes(data.sector) ? data.sector : '');
        if (mapped) setForm(prev => ({ ...prev, sector: mapped }));
      } catch { setLookupError('Connection error'); }
      setLookupLoading(false);
    }, 2000);
  };

  const handleTickerChange = (value) => {
    const ticker = value.toUpperCase();
    setForm(prev => ({ ...prev, ticker }));
    setLookupData(null); setLookupError(null);
    clearTimeout(searchTimeout.current);
    if (ticker.length >= 1) {
      setSearching(true);
      searchTimeout.current = setTimeout(async () => {
        try { setSearchResults(await api(`/api/prices/search?q=${value}`)); } catch { setSearchResults([]); }
        finally { setSearching(false); }
      }, 300);
    } else setSearchResults([]);
    doLookup(ticker);
  };

  const selectTicker = (symbol) => {
    setForm(prev => ({ ...prev, ticker: symbol }));
    setSearchResults([]);
    setLookupData(null); setLookupError(null);
    doLookup(symbol);
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
  const isLivePrice = lookupData?.price && form.price === lookupData.price.toFixed(2);
  const inputStyle = { background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)', outline: 'none', width: '100%', minHeight: 44 };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}
      role="dialog" aria-modal="true" aria-labelledby="modal-title-trade"
      style={{ background: 'var(--modal-bg)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', padding: 16 }}>
      <div ref={modalRef} className="w-full sm:w-[420px] max-w-[calc(100vw-2rem)]"
        style={{ background: 'var(--bg2)', border: '1px solid var(--modal-border)', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}
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
          {/* Buy/Sell toggle */}
          <fieldset>
            <legend className="sr-only">Transaction type</legend>
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--chip-bg)' }}>
              {['buy', 'sell'].map((t) => (
                <button key={t} type="button" ref={t === 'buy' ? firstFocusRef : undefined}
                  onClick={() => setForm({ ...form, type: t })} aria-pressed={form.type === t}
                  className="flex-1 py-2 rounded-lg text-xs min-h-[44px] transition-all duration-150"
                  style={{ background: form.type === t ? (t === 'buy' ? 'var(--green-bg)' : 'var(--red-bg)') : 'transparent', color: form.type === t ? (t === 'buy' ? 'var(--green2)' : 'var(--red2)') : 'var(--text3)', fontWeight: form.type === t ? 700 : 400 }}>
                  {t === 'buy' ? '📈 Buy' : '📉 Sell'}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Ticker */}
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
                  <button key={r.symbol} type="button" role="option" onClick={() => selectTicker(r.symbol)}
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

          {/* Stock Info Card */}
          {lookupLoading && (
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }} className="skeleton-pulse">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--chip-bg)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, width: '60%', background: 'var(--chip-bg)', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ height: 10, width: '40%', background: 'var(--chip-bg)', borderRadius: 4 }} />
                </div>
              </div>
            </div>
          )}
          {lookupError && !lookupLoading && (
            <div style={{ fontSize: 12, color: 'var(--red2)' }}>❌ {lookupError}</div>
          )}
          {lookupData && !lookupLoading && (
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.3s' }}>
              {lookupData.logo ? (
                <img src={lookupData.logo} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', background: 'var(--chip-bg)' }}
                  onError={e => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }} />
              ) : null}
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--ticker-bg)', display: lookupData.logo ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--ticker-color)', fontFamily: 'var(--mono)', flexShrink: 0 }}>
                {lookupData.ticker?.slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lookupData.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text2)', flexShrink: 0, marginLeft: 8 }}>{lookupData.ticker}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{lookupData.sector}</span>
                  {lookupData.price != null && (
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)' }}>${lookupData.price.toFixed(2)}</span>
                  )}
                  {lookupData.changePct != null && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', background: lookupData.changePct >= 0 ? 'var(--green-bg)' : 'var(--red-bg)', color: lookupData.changePct >= 0 ? 'var(--green2)' : 'var(--red2)' }}>
                      {lookupData.changePct >= 0 ? '▲' : '▼'} {lookupData.changePct >= 0 ? '+' : ''}{lookupData.changePct.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Shares + Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-shares" style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Shares</label>
              <input id="tx-shares" type="number" step="0.01" min="0.01" required value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="tx-price" style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Price ($)</label>
              <div style={{ position: 'relative' }}>
                <input id="tx-price" type="number" step="0.01" min="0.01" required value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} />
                {isLivePrice && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: 'var(--green2)', fontWeight: 600, fontFamily: 'var(--mono)' }}>LIVE</span>
                )}
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="tx-date" style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Date</label>
            <input id="tx-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
          </div>

          {/* Sector chips */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Sector</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SECTORS.map(s => (
                <button key={s} type="button" onClick={() => setForm({ ...form, sector: s })}
                  style={{ padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600, border: 'none', fontFamily: 'var(--font)', background: form.sector === s ? 'var(--indigo)' : 'var(--chip-bg)', color: form.sector === s ? '#fff' : 'var(--text3)', transition: 'all 0.2s' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Total preview */}
          {totalCost > 0 && (
            <div className="rounded-xl p-3" style={{ background: 'var(--indigo-bg)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ fontSize: 10, color: 'var(--indigo2)', marginBottom: 2 }}>TOTAL</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--indigo2)' }}>
                ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              {portfolioValue > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
                  📊 This position = {((totalCost / (portfolioValue + (isBuy ? totalCost : 0))) * 100).toFixed(1)}% of portfolio (${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 0 })} total)
                </div>
              )}
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
