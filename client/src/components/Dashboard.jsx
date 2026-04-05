import { useState, useEffect, useCallback, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { RefreshCw, Plus, DollarSign } from 'lucide-react';
import { api } from '../api';
import { useTheme } from '../context/ThemeContext';
import Tag from './ui/Tag';
import PnL from './ui/PnL';
import AddTxModal from './AddTxModal';
import CashModal from './CashModal';

const SECTOR_COLORS = {
  Technology: '#6366f1', Healthcare: '#cb7b3c', Finance: '#9b7fc4',
  Energy: '#4da386', Consumer: '#d46a6a', Industrial: '#7c8db5',
  'Real Estate': '#c9738e', Telecom: '#5b9ec4', Materials: '#b5894e',
  Utilities: '#6ba35b', Other: '#64748b', Cash: '#f0c040'
};

export default function Dashboard() {
  const { isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const tradeButtonRef = useRef(null);
  const cashButtonRef = useRef(null);

  const ct = isDark ? {
    stroke: '#6366f1', grid: 'rgba(255,255,255,0.03)', axisText: '#475569',
    tooltipBg: '#111827', tooltipBorder: 'rgba(255,255,255,0.05)', tooltipText: '#f1f5f9',
    pieStroke: 'none', pieStrokeW: 0,
  } : {
    stroke: '#4f46e5', grid: 'rgba(0,0,0,0.04)', axisText: '#9ca3af',
    tooltipBg: '#ffffff', tooltipBorder: 'rgba(0,0,0,0.08)', tooltipText: '#1a1a2e',
    pieStroke: '#ffffff', pieStrokeW: 2,
  };

  const loadData = useCallback(async () => {
    try {
      const [s, h, snap] = await Promise.all([api('/api/portfolio/stats'), api('/api/portfolio/holdings'), api('/api/snapshots')]);
      setStats(s); setHoldings(h); setSnapshots(snap);
    } catch (err) { console.error('Failed to load dashboard:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await api('/api/prices/refresh'); await loadData(); }
    catch (err) { console.error('Refresh failed:', err); }
    finally { setRefreshing(false); }
  };

  if (loading) return (
    <div className="text-center py-20" style={{ color: 'var(--text2)' }} role="status" aria-live="polite">Loading...</div>
  );

  const sectorData = {};
  holdings.forEach((h) => { const s = h.sector || 'Other'; sectorData[s] = (sectorData[s] || 0) + (h.marketValue || 0); });
  if (stats?.cash > 0) sectorData['Cash'] = stats.cash;
  const pieData = Object.entries(sectorData).map(([name, value]) => ({ name, value: Math.round(value) }));
  const isEmpty = holdings.length === 0 && (!stats || stats.cash === 0);

  const gradientFor = (label) => {
    if (label === 'Portfolio Value' || label === 'Cash') return 'var(--gradient-indigo)';
    if (label === 'Stocks P&L') return stats?.stocksPnl >= 0 ? 'var(--gradient-green)' : 'var(--gradient-red)';
    if (label === 'Daily Change') return stats?.dailyChange >= 0 ? 'var(--gradient-green)' : 'var(--gradient-red)';
    return 'var(--gradient-gray)';
  };

  return (
    <div aria-busy={refreshing}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl sm:text-[28px] font-bold" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>📊 Portfolio</h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs rounded-lg transition-all duration-150 disabled:opacity-50"
            style={{ background: 'var(--chip-bg)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button type="button" ref={cashButtonRef} onClick={() => setShowCashModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs rounded-lg transition-all duration-150"
            style={{ background: 'var(--indigo-bg)', color: 'var(--indigo2)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <DollarSign size={14} aria-hidden="true" /><span className="hidden sm:inline">Cash</span>
          </button>
          <button type="button" ref={tradeButtonRef} onClick={() => setShowTxModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-xs font-semibold rounded-lg shadow-sm transition-all duration-150"
            style={{ background: 'var(--indigo)', color: '#fff' }}>
            <Plus size={14} aria-hidden="true" /><span className="hidden sm:inline">+ Trade</span>
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3" aria-hidden="true">📊</div>
          <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>No portfolio yet</h2>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>Deposit cash and add your first trade to get started</p>
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Portfolio Value', val: `$${stats.portfolioValue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}` },
                { label: 'Daily Change', val: <PnL value={stats.dailyChange} percent={stats.dailyChangePct} /> },
                { label: 'Stocks P&L', val: <PnL value={stats.stocksPnl} percent={stats.stocksPnlPct} /> },
                { label: 'Cash', val: `$${stats.cash?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}` },
              ].map((c) => (
                <div key={c.label} className="p-4 sm:p-5" style={{ background: gradientFor(c.label), border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--card-shadow)', transition: 'background 0.3s, border-color 0.3s' }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', letterSpacing: '-0.02em', color: typeof c.val === 'string' ? 'var(--text)' : undefined }}>{c.val}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {pieData.length > 0 && (
              <div className="p-5" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, transition: 'background 0.3s' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', marginBottom: 12 }}>🥧 Allocation</h2>
                <div className="h-48">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={72}
                        paddingAngle={1.5} dataKey="value" stroke={ct.pieStroke} strokeWidth={ct.pieStrokeW}>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={SECTOR_COLORS[entry.name] || '#64748b'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `$${v.toLocaleString()}`}
                        contentStyle={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, fontSize: 12, fontFamily: 'var(--mono)', color: ct.tooltipText }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {pieData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text2)' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: SECTOR_COLORS[d.name] || '#64748b', flexShrink: 0 }} aria-hidden="true" />
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {snapshots.length > 1 && (
              <div className="p-5" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, transition: 'background 0.3s' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', marginBottom: 12 }}>📈 Performance</h2>
                <div className="h-48">
                  <ResponsiveContainer>
                    <AreaChart data={snapshots}>
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ct.stroke} stopOpacity={isDark ? 0.25 : 0.12} />
                          <stop offset="100%" stopColor={ct.stroke} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: ct.axisText, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: ct.grid }} tickLine={false}
                        tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                      <YAxis tick={{ fontSize: 11, fill: ct.axisText, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        contentStyle={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, fontSize: 12, fontFamily: 'JetBrains Mono', color: ct.tooltipText, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }} />
                      <Area type="monotone" dataKey="total_value_usd" stroke={ct.stroke} fill="url(#areaGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {holdings.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', transition: 'background 0.3s' }}>
              <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>📁 Holdings ({holdings.length})</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>Prices delayed 15 min</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Ticker','Sector','Shares','Avg Cost','Price','Value','P&L','Day'].map((h, i) => (
                        <th key={h} className={`${i >= 2 ? 'text-right' : 'text-left'} px-4 py-2.5 ${(i === 1 || i === 3) ? 'hidden sm:table-cell' : ''} ${i === 7 ? 'hidden md:table-cell' : ''}`}
                          style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text3)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => (
                      <tr key={h.ticker} style={{ borderBottom: '1px solid var(--border2)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="px-4 py-3">
                          <TickerBadge ticker={h.ticker} sector={h.sector} />
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell"><Tag color={sectorTagColor(h.sector)}>{h.sector}</Tag></td>
                        <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{h.shares?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>${h.avgCost?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>${h.currentPrice?.toFixed(2) || '\u2014'}</td>
                        <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>${h.marketValue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '\u2014'}</td>
                        <td className="px-4 py-3 text-right"><PnL value={h.pnl} percent={h.pnlPct} /></td>
                        <td className="px-4 py-3 text-right hidden md:table-cell"><PnL percent={h.dayChangePct} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showTxModal && <AddTxModal onClose={() => { setShowTxModal(false); tradeButtonRef.current?.focus(); }} onSaved={loadData} />}
      {showCashModal && <CashModal onClose={() => { setShowCashModal(false); cashButtonRef.current?.focus(); }} onSaved={loadData} />}
    </div>
  );
}

function TickerBadge({ ticker, sector }) {
  const color = SECTOR_COLORS[sector] || '#64748b';
  return (
    <div className="flex items-center gap-2">
      <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color, fontFamily: 'var(--mono)' }}>
        {ticker.slice(0, 2)}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)' }}>{ticker}</div>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{sector}</div>
      </div>
    </div>
  );
}

function sectorTagColor(sector) {
  const map = { Technology: 'blue', Healthcare: 'amber', Finance: 'purple', Energy: 'green', Consumer: 'red', Industrial: 'gray', 'Real Estate': 'orange' };
  return map[sector] || 'gray';
}
