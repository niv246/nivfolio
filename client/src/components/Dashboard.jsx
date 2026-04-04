import { useState, useEffect, useCallback } from 'react';
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
  Technology: '💻', Healthcare: '🏥', Finance: '🏦', Energy: '⚡',
  Consumer: '🛍️', Industrial: '🏭', 'Real Estate': '🏠', Telecom: '📡',
  Materials: '🧱', Utilities: '💡', Other: '📦'
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);

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

  if (loading) return <div className="text-center py-20 text-[#91918e]">Loading...</div>;

  // Sector allocation for pie chart
  const sectorData = {};
  holdings.forEach((h) => {
    const s = h.sector || 'Other';
    sectorData[s] = (sectorData[s] || 0) + (h.marketValue || 0);
  });
  const pieData = Object.entries(sectorData).map(([name, value]) => ({ name, value: Math.round(value) }));

  const isEmpty = holdings.length === 0 && (!stats || stats.cash === 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#37352f]">📊 Portfolio</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-[#91918e] hover:bg-[#f7f6f3] rounded transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={() => setShowCashModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-[#2383e2] hover:bg-[#f7f6f3] rounded transition-colors">
            <DollarSign size={14} /> Cash
          </button>
          <button onClick={() => setShowTxModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-white bg-[#2383e2] hover:bg-[#1a6bc4] rounded transition-colors">
            <Plus size={14} /> Trade
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">📊</div>
          <h2 className="text-[15px] font-semibold text-[#37352f] mb-1">No portfolio yet</h2>
          <p className="text-[13px] text-[#91918e]">Deposit cash and add your first trade to get started</p>
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
            {/* Pie Chart */}
            {pieData.length > 0 && (
              <div>
                <h2 className="text-[15px] font-semibold text-[#37352f] mb-3">🥧 Sector Allocation</h2>
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
                        contentStyle={{ background: '#fff', border: '1px solid rgba(55,53,47,0.09)', borderRadius: '8px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pieData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1 text-[11px] text-[#91918e]">
                      <span className="w-2 h-2 rounded-full" style={{ background: SECTOR_COLORS[d.name] || '#91918e' }} />
                      {SECTOR_EMOJI[d.name] || '📦'} {d.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Chart */}
            {snapshots.length > 1 && (
              <div>
                <h2 className="text-[15px] font-semibold text-[#37352f] mb-3">📈 Performance</h2>
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
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        contentStyle={{ background: '#fff', border: '1px solid rgba(55,53,47,0.09)', borderRadius: '8px', fontSize: '12px' }} />
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
              <h2 className="text-[15px] font-semibold text-[#37352f] mb-3">📁 Holdings</h2>
              <div className="border border-[rgba(55,53,47,0.09)] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f7f6f3]">
                      <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Ticker</th>
                      <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Sector</th>
                      <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Shares</th>
                      <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Avg Cost</th>
                      <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Price</th>
                      <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Value</th>
                      <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">P&L</th>
                      <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => (
                      <tr key={h.ticker} className="border-t border-[rgba(55,53,47,0.06)] hover:bg-[#f7f6f3] transition-colors">
                        <td className="px-3 py-2 font-mono text-[12px] font-semibold">{h.ticker}</td>
                        <td className="px-3 py-2"><Tag color={sectorTagColor(h.sector)}>{SECTOR_EMOJI[h.sector] || '📦'} {h.sector}</Tag></td>
                        <td className="px-3 py-2 text-right font-mono text-[12px]">{h.shares?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-[12px]">${h.avgCost?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-[12px]">${h.currentPrice?.toFixed(2) || '—'}</td>
                        <td className="px-3 py-2 text-right font-mono text-[12px]">${h.marketValue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '—'}</td>
                        <td className="px-3 py-2 text-right"><PnL value={h.pnl} percent={h.pnlPct} /></td>
                        <td className="px-3 py-2 text-right"><PnL percent={h.dayChangePct} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showTxModal && <AddTxModal onClose={() => setShowTxModal(false)} onSaved={loadData} />}
      {showCashModal && <CashModal onClose={() => setShowCashModal(false)} onSaved={loadData} />}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="border border-[rgba(55,53,47,0.09)] rounded-lg p-4">
      <div className="text-[11px] text-[#91918e] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[15px] font-semibold text-[#37352f]">{value}</div>
    </div>
  );
}

function sectorTagColor(sector) {
  const map = { Technology: 'blue', Healthcare: 'green', Finance: 'yellow', Energy: 'red', Consumer: 'purple', Industrial: 'gray', 'Real Estate': 'orange' };
  return map[sector] || 'gray';
}
