import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { api } from '../api';
import { useTheme } from '../context/ThemeContext';
import PnL from './ui/PnL';

export default function Monthly() {
  const { isDark } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const ct = isDark ? { grid: 'rgba(255,255,255,0.03)', axisText: '#475569', green: '#10b981', red: '#ef4444', tooltipBg: '#111827', tooltipBorder: 'rgba(255,255,255,0.05)', tooltipText: '#f1f5f9' }
    : { grid: 'rgba(0,0,0,0.04)', axisText: '#9ca3af', green: '#059669', red: '#dc2626', tooltipBg: '#ffffff', tooltipBorder: 'rgba(0,0,0,0.08)', tooltipText: '#1a1a2e' };

  useEffect(() => {
    api('/api/portfolio/holdings').then(() => api('/api/portfolio/cash'))
      .then(d => setTransactions(d.operations || []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text2)' }} role="status" aria-live="polite">Loading...</div>;

  const sellOps = transactions.filter(op => op.type === 'sell');
  const monthlyMap = {};
  sellOps.forEach(op => {
    const d = new Date(op.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, realized: 0, count: 0 };
    monthlyMap[key].realized += parseFloat(op.amount_usd) || 0;
    monthlyMap[key].count += 1;
  });
  const monthlyData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  const th = { fontSize: 11, fontWeight: 500, color: 'var(--text3)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 16px' };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Monthly Summary</h1>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 32 }}>Monthly P&L shows realized gains from sell transactions.</p>

      {monthlyData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">📅</div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No sell transactions yet</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>Monthly P&L shows realized gains from sell transactions</p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', marginBottom: 16 }}>📊 Realized P&L by Month</div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 24, boxShadow: 'var(--card-shadow)' }}>
            <div style={{ height: 180 }}>
              <ResponsiveContainer>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: ct.axisText, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: ct.grid }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: ct.axisText, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toLocaleString()}`} />
                  <Tooltip formatter={v => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    contentStyle={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 8, fontSize: 12, fontFamily: 'JetBrains Mono', color: ct.tooltipText }} />
                  <Bar dataKey="realized" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {monthlyData.map((e, i) => <Cell key={i} fill={e.realized >= 0 ? ct.green : ct.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Month', 'Sell Proceeds', 'Trades'].map((h, i) => (
                  <th key={h} style={{ ...th, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {monthlyData.map(m => (
                  <tr key={m.month} style={{ borderBottom: '1px solid var(--border2)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', background: 'var(--indigo-bg)', color: 'var(--indigo2)' }}>{formatMonth(m.month)}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}><PnL value={m.realized} /></td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{m.count}</td>
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
