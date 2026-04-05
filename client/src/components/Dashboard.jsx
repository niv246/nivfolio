import { useState, useEffect, useCallback, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
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
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await api('/api/prices/refresh'); await loadData(); } catch (err) { console.error(err); }
    finally { setRefreshing(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text2)' }} role="status" aria-live="polite">Loading...</div>;

  const sectorData = {};
  holdings.forEach(h => { const s = h.sector || 'Other'; sectorData[s] = (sectorData[s] || 0) + (h.marketValue || 0); });
  if (stats?.cash > 0) sectorData['Cash'] = stats.cash;
  const totalPortfolio = Object.values(sectorData).reduce((a, b) => a + b, 0);
  const pieData = Object.entries(sectorData).map(([name, value]) => ({ name, value: Math.round(value), pct: totalPortfolio > 0 ? ((value / totalPortfolio) * 100).toFixed(1) : '0' }));
  const isEmpty = holdings.length === 0 && (!stats || stats.cash === 0);

  const gradientFor = (label) => {
    if (label === 'Total Portfolio') return 'var(--gradient-indigo)';
    if (label === 'Cash Available') return 'var(--gradient-gray)';
    if (label === 'Overall P&L') return (stats?.stocksPnl || 0) >= 0 ? 'var(--gradient-green)' : 'var(--gradient-red)';
    if (label === 'Daily Change') return (stats?.dailyChange || 0) >= 0 ? 'var(--gradient-green)' : 'var(--gradient-red)';
    return 'var(--gradient-gray)';
  };

  const th = { fontSize: 11, fontWeight: 500, color: 'var(--text3)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 16px' };

  return (
    <div aria-busy={refreshing}>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Portfolio Dashboard</h1>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 32 }}>Track your investments and performance in one place.</p>

      {/* Action buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={handleRefresh} disabled={refreshing}
          style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'var(--text3)', background: 'none', border: 'none', fontFamily: 'var(--font)', opacity: refreshing ? 0.5 : 1 }}>
          ↻ Refresh
        </button>
        <button type="button" ref={cashButtonRef} onClick={() => setShowCashModal(true)}
          style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, color: 'var(--text2)', background: 'none', border: 'none', fontFamily: 'var(--font)' }}>
          💵 <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text)' }}>${stats?.cash?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}</span>
        </button>
        <button type="button" ref={tradeButtonRef} onClick={() => setShowTxModal(true)}
          style={{ padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--indigo)', border: 'none', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 4 }}>
          + Trade
        </button>
      </div>

      {isEmpty ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">📊</div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No portfolio yet</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>Deposit cash and add your first trade to get started</p>
        </div>
      ) : (
        <>
          {/* Cards */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }} className="cards-grid">
              {[
                { label: 'Total Portfolio', emoji: '💰', val: `$${stats.portfolioValue?.toLocaleString('en-US', { minimumFractionDigits: 0 }) || '0'}` },
                { label: 'Cash Available', emoji: '💵', val: `$${stats.cash?.toLocaleString('en-US', { minimumFractionDigits: 0 }) || '0'}`, extra: stats.portfolioValue > 0 ? `${((stats.cash / stats.portfolioValue) * 100).toFixed(1)}% cash` : null },
                { label: 'Overall P&L', emoji: '📈', val: <span style={{ color: (stats.stocksPnl || 0) >= 0 ? 'var(--green2)' : 'var(--red2)' }}>${Math.abs(stats.stocksPnl || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>, pnl: stats.stocksPnlPct },
                { label: 'Daily Change', emoji: '🕐', val: <span style={{ color: (stats.dailyChange || 0) >= 0 ? 'var(--green2)' : 'var(--red2)' }}>${Math.abs(stats.dailyChange || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>, pnl: stats.dailyChangePct },
              ].map(c => (
                <div key={c.label} style={{ borderRadius: 16, padding: '16px 20px', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', background: gradientFor(c.label), transition: 'background 0.3s' }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>{c.emoji} {c.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', letterSpacing: '-0.02em' }}>{c.val}</div>
                  {c.pnl != null && <PnL percent={c.pnl} />}
                  {c.extra && <div style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', marginTop: 4, background: 'rgba(245,158,11,0.15)', color: 'var(--amber2)' }}>{c.extra}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Panels: Pie (1fr) + Chart (2fr) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 24 }} className="panels-grid">
            {pieData.length > 0 && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--card-shadow)', transition: 'background 0.3s' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 16 }}>🥧 Allocation</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <div style={{ width: 180, height: 180 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={22} outerRadius={38} dataKey="value" stroke={ct.pieStroke} strokeWidth={ct.pieStrokeW}>
                          {pieData.map(e => <Cell key={e.name} fill={SECTOR_COLORS[e.name] || '#64748b'} />)}
                        </Pie>
                        <Tooltip formatter={v => `$${v.toLocaleString()}`} contentStyle={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, fontSize: 12, fontFamily: 'var(--mono)', color: ct.tooltipText }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: SECTOR_COLORS[d.name] || '#64748b', flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{d.name}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', width: 36, textAlign: 'right' }}>{d.pct}%</span>
                      <div style={{ width: 56, height: 5, borderRadius: 99, background: 'var(--weight-track)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, background: SECTOR_COLORS[d.name] || '#64748b', width: `${d.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {snapshots.length > 1 && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--card-shadow)', transition: 'background 0.3s' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 16 }}>📈 Performance</div>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer>
                    <AreaChart data={snapshots}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ct.stroke} stopOpacity={isDark ? 0.25 : 0.12} />
                          <stop offset="100%" stopColor={ct.stroke} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: ct.axisText, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: ct.grid }} tickLine={false}
                        tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                      <YAxis tick={{ fontSize: 10, fill: ct.axisText, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false}
                        tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        contentStyle={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, fontSize: 12, fontFamily: 'JetBrains Mono', color: ct.tooltipText }} />
                      <Area type="monotone" dataKey="total_value_usd" stroke={ct.stroke} fill="url(#areaGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Holdings Table */}
          {holdings.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--card-shadow)', transition: 'background 0.3s' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>📁 Holdings ({holdings.length})</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>Prices delayed 15 min &bull; FinnHub</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['Ticker', 'Shares', 'Avg Cost', 'Price', 'Value', 'P&L', 'Weight', 'Daily'].map((h, i) => (
                      <th key={h} style={{ ...th, textAlign: i === 0 ? 'left' : 'right' }} className={i === 2 ? 'hidden sm:table-cell' : i === 7 ? 'hidden md:table-cell' : ''}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {holdings.map(h => {
                      const sColor = SECTOR_COLORS[h.sector] || '#64748b';
                      const weight = totalPortfolio > 0 ? ((h.marketValue || 0) / totalPortfolio * 100).toFixed(1) : '0';
                      return (
                        <tr key={h.ticker} style={{ borderBottom: '1px solid var(--border2)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '12px 16px', fontSize: 12 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 26, height: 26, borderRadius: 8, background: `${sColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: sColor, fontFamily: 'var(--mono)' }}>{h.ticker.slice(0, 2)}</div>
                              <div><div style={{ fontWeight: 700, fontFamily: 'var(--mono)' }}>{h.ticker}</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>{h.sector}</div></div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, textAlign: 'right', fontFamily: 'var(--mono)' }}>{h.shares?.toFixed(0)}</td>
                          <td className="hidden sm:table-cell" style={{ padding: '12px 16px', fontSize: 12, textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--text2)' }}>${h.avgCost?.toFixed(2)}</td>
                          <td style={{ padding: '12px 16px', fontSize: 12, textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600 }}>${h.currentPrice?.toFixed(2) || '\u2014'}</td>
                          <td style={{ padding: '12px 16px', fontSize: 12, textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600 }}>${h.marketValue?.toLocaleString('en-US', { minimumFractionDigits: 0 }) || '\u2014'}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12, color: (h.pnl || 0) >= 0 ? 'var(--green2)' : 'var(--red2)' }}>{(h.pnl || 0) >= 0 ? '' : '-'}${Math.abs(h.pnl || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
                            <PnL percent={h.pnlPct} />
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', width: 32, textAlign: 'right' }}>{weight}%</span>
                              <div style={{ width: 48, height: 5, borderRadius: 99, background: 'var(--weight-track)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 99, background: 'var(--indigo)', width: `${weight}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="hidden md:table-cell" style={{ padding: '12px 16px', textAlign: 'right' }}><PnL percent={h.dayChangePct} /></td>
                        </tr>
                      );
                    })}
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
