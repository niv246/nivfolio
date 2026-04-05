import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { api } from '../api';
import { useTheme } from '../context/ThemeContext';
import PnL from './ui/PnL';

export default function Monthly() {
  const { isDark } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const ct = isDark ? {
    grid: 'rgba(255,255,255,0.03)', axisText: '#475569', green: '#10b981', red: '#ef4444',
    tooltipBg: '#111827', tooltipBorder: 'rgba(255,255,255,0.05)', tooltipText: '#f1f5f9',
  } : {
    grid: 'rgba(0,0,0,0.04)', axisText: '#9ca3af', green: '#059669', red: '#dc2626',
    tooltipBg: '#ffffff', tooltipBorder: 'rgba(0,0,0,0.08)', tooltipText: '#1a1a2e',
  };

  useEffect(() => {
    api('/api/portfolio/holdings').then(() => api('/api/portfolio/cash'))
      .then((data) => setTransactions(data.operations || []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text2)' }} role="status" aria-live="polite">Loading...</div>;

  const sellOps = transactions.filter((op) => op.type === 'sell');
  const monthlyMap = {};
  sellOps.forEach((op) => {
    const d = new Date(op.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, realized: 0, count: 0 };
    monthlyMap[key].realized += parseFloat(op.amount_usd) || 0;
    monthlyMap[key].count += 1;
  });
  const monthlyData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div>
      <h1 className="text-2xl sm:text-[28px] font-bold mb-6" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>📅 Monthly P&L</h1>

      {monthlyData.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3" aria-hidden="true">📅</div>
          <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>No sell transactions yet</h2>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>Monthly P&L shows realized gains from sell transactions</p>
        </div>
      ) : (
        <>
          <div className="mb-8 p-5" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', marginBottom: 12 }}>📊 Monthly Realized P&L</h2>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: ct.axisText, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: ct.grid }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: ct.axisText, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip formatter={(v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    contentStyle={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, fontSize: 12, fontFamily: 'JetBrains Mono', color: ct.tooltipText }} />
                  <Bar dataKey="realized" radius={[6, 6, 0, 0]}>
                    {monthlyData.map((entry, i) => (
                      <Cell key={i} fill={entry.realized >= 0 ? ct.green : ct.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <table className="w-full">
              <thead>
                <tr>
                  {['Month', 'Sell Proceeds', 'Trades'].map((h, i) => (
                    <th key={h} className={i === 0 ? 'text-left' : 'text-right'} style={{ padding: '10px 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text3)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((m) => (
                  <tr key={m.month} style={{ borderBottom: '1px solid var(--border2)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{formatMonth(m.month)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}><PnL value={m.realized} /></td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{m.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function formatMonth(ym) {
  const [y, m] = ym.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m) - 1]} ${y}`;
}
