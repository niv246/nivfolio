import { useState, useEffect, useCallback, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { RefreshCw, Plus, DollarSign } from 'lucide-react';
import { api } from '../api';
import Tag from './ui/Tag';
import PnL from './ui/PnL';
import AddTxModal from './AddTxModal';
import CashModal from './CashModal';

const SECTOR_COLORS = {
  Technology: '#2383e2', Healthcare: '#2d8a5e', Finance: '#8b6914',
  Energy: '#c4554d', Consumer: '#9333ea', Industrial: '#6b7280',
  'Real Estate': '#d97706', Telecom: '#0891b2', Materials: '#a3a3a3',
  Utilities: '#65a30d', Other: '#91918e'
};

const SECTOR_EMOJI = {
  Technology: '\u{1F4BB}', Healthcare: '\u{1F3E5}', Finance: '\u{1F3E6}', Energy: '\u26A1',
  Consumer: '\u{1F6CD}\uFE0F', Industrial: '\u{1F3ED}', 'Real Estate': '\u{1F3E0}', Telecom: '\u{1F4E1}',
  Materials: '\u{1F9F1}', Utilities: '\u{1F4A1}', Other: '\u{1F4E6}'
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const tradeButtonRef = useRef(null);
  const cashButtonRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [s, h, snap] = await Promise.all([
        api('/api/portfolio/stats'),
        api('/api/portfolio/holdings'),
        api('/api/snapshots'),
      ]);
      setStats(s);
      setHoldings(h);
      setSnapshots(snap);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api('/api/prices/refresh');
      await loadData();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return (
    <div className="text-center py-20 text-[#91918e]" role="status" aria-live="polite">
      <span>Loading...</span>
    </div>
  );

  const sectorData = {};
  holdings.forEach((h) => {
    const s = h.sector || 'Other';
    sectorData[s] = (sectorData[s] || 0) + (h.marketValue || 0);
  });
  const pieData = Object.entries(sectorData).map(([name, value]) => ({ name, value: Math.round(value) }));
  const isEmpty = holdings.length === 0 && (!stats || stats.cash === 0);

  return (
    <div aria-busy={refreshing}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#37352f]">📊 Portfolio</h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm text-[#37352f] bg-[#f7f6f3] hover:bg-[#eeedea] border border-[rgba(55,53,47,0.09)] rounded-lg transition-colors duration-150 disabled:opacity-50 cursor-pointer">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button type="button" ref={cashButtonRef} onClick={() => setShowCashModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm text-[#2383e2] bg-[#d3e5ef] hover:bg-[#b8d4e8] border border-[#2383e2]/20 rounded-lg transition-colors duration-150 cursor-pointer">
            <DollarSign size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Cash</span>
          </button>
          <button type="button" ref={tradeButtonRef} onClick={() => setShowTxModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-[#2383e2] hover:bg-[#1a6bc4] rounded-lg shadow-sm transition-colors duration-150 cursor-pointer">
            <Plus size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Trade</span>
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3" aria-hidden="true">📊</div>
          <h2 className="text-base font-semibold text-[#37352f] mb-1">No portfolio yet</h2>
          <p className="text-sm text-[#91918e]">Deposit cash and add your first trade to get started</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Portfolio Value" value={`$${stats.portfolioValue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`} />
              <StatCard label="Daily Change" value={<PnL value={stats.dailyChange} percent={stats.dailyChangePct} />} />
              <StatCard label="Stocks P&L" value={<PnL value={stats.stocksPnl} percent={stats.stocksPnlPct} />} />
              <StatCard label="Cash" value={`$${stats.cash?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`} />
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {pieData.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-[#37352f] mb-3">🥧 Sector Allocation</h2>
                <div className="h-48">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={72}
                        paddingAngle={1.5} dataKey="value" stroke="#fff" strokeWidth={2}>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={SECTOR_COLORS[entry.name] || '#91918e'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `$${v.toLocaleString()}`}
                        contentStyle={{ background: '#fff', border: '1px solid rgba(55,53,47,0.09)', borderRadius: '8px', fontSize: '13px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pieData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1 text-xs text-[#91918e]">
                      <span className="w-2 h-2 rounded-full" style={{ background: SECTOR_COLORS[d.name] || '#91918e' }} aria-hidden="true" />
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {snapshots.length > 1 && (
              <div>
                <h2 className="text-base font-semibold text-[#37352f] mb-3">📈 Performance</h2>
                <div className="h-48">
                  <ResponsiveContainer>
                    <AreaChart data={snapshots}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2383e2" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#2383e2" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,53,47,0.06)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        contentStyle={{ background: '#fff', border: '1px solid rgba(55,53,47,0.09)', borderRadius: '8px', fontSize: '13px' }} />
                      <Area type="monotone" dataKey="total_value_usd" stroke="#2383e2" fill="url(#colorValue)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Holdings Table */}
          {holdings.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-[#37352f] mb-3">📁 Holdings</h2>
              <div className="border border-[rgba(55,53,47,0.09)] rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f7f6f3]">
                      <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-[#91918e] font-medium">Ticker</th>
                      <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-[#91918e] font-medium hidden sm:table-cell">Sector</th>
                      <th className="text-right px-3 py-2 text-xs uppercase tracking-wider text-[#91918e] font-medium">Shares</th>
                      <th className="text-right px-3 py-2 text-xs uppercase tracking-wider text-[#91918e] font-medium hidden sm:table-cell">Avg Cost</th>
                      <th className="text-right px-3 py-2 text-xs uppercase tracking-wider text-[#91918e] font-medium">Price</th>
                      <th className="text-right px-3 py-2 text-xs uppercase tracking-wider text-[#91918e] font-medium">Value</th>
                      <th className="text-right px-3 py-2 text-xs uppercase tracking-wider text-[#91918e] font-medium">P&L</th>
                      <th className="text-right px-3 py-2 text-xs uppercase tracking-wider text-[#91918e] font-medium hidden md:table-cell">Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => (
                      <tr key={h.ticker} className="border-t border-[rgba(55,53,47,0.06)] hover:bg-[#f7f6f3] transition-colors duration-150">
                        <td className="px-3 py-2 font-mono text-sm font-semibold">{h.ticker}</td>
                        <td className="px-3 py-2 hidden sm:table-cell"><Tag color={sectorTagColor(h.sector)}>{h.sector}</Tag></td>
                        <td className="px-3 py-2 text-right font-mono text-sm">{h.shares?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-sm hidden sm:table-cell">${h.avgCost?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-sm">${h.currentPrice?.toFixed(2) || '\u2014'}</td>
                        <td className="px-3 py-2 text-right font-mono text-sm">${h.marketValue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '\u2014'}</td>
                        <td className="px-3 py-2 text-right"><PnL value={h.pnl} percent={h.pnlPct} /></td>
                        <td className="px-3 py-2 text-right hidden md:table-cell"><PnL percent={h.dayChangePct} /></td>
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

function StatCard({ label, value }) {
  return (
    <div className="border border-[rgba(55,53,47,0.09)] rounded-lg p-4">
      <div className="text-xs text-[#91918e] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-base font-semibold text-[#37352f]">{value}</div>
    </div>
  );
}

function sectorTagColor(sector) {
  const map = { Technology: 'blue', Healthcare: 'green', Finance: 'yellow', Energy: 'red', Consumer: 'purple', Industrial: 'gray', 'Real Estate': 'orange' };
  return map[sector] || 'gray';
}
