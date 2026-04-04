import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { api } from '../api';
import PnL from './ui/PnL';

export default function Monthly() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/portfolio/holdings').then(() => {
      // We need sell transactions for realized P&L
      return api('/api/portfolio/cash');
    }).then((data) => {
      setTransactions(data.operations || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-[#91918e]">Loading...</div>;

  // Group sell operations by month for realized P&L
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

  const isEmpty = monthlyData.length === 0;

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#37352f] mb-6">📅 Monthly P&L</h1>

      {isEmpty ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">📅</div>
          <h2 className="text-[15px] font-semibold text-[#37352f] mb-1">No sell transactions yet</h2>
          <p className="text-[13px] text-[#91918e]">Monthly P&L shows realized gains from sell transactions</p>
        </div>
      ) : (
        <>
          {/* Bar Chart */}
          <div className="mb-8">
            <h2 className="text-[15px] font-semibold text-[#37352f] mb-3">📊 Monthly Realized P&L</h2>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,53,47,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip
                    formatter={(v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    contentStyle={{ background: '#fff', border: '1px solid rgba(55,53,47,0.09)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="realized" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((entry, i) => (
                      <Cell key={i} fill={entry.realized >= 0 ? '#2d8a5e' : '#c4554d'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Table */}
          <div className="border border-[rgba(55,53,47,0.09)] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f7f6f3]">
                  <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Month</th>
                  <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Sell Proceeds</th>
                  <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Trades</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((m) => (
                  <tr key={m.month} className="border-t border-[rgba(55,53,47,0.06)] hover:bg-[#f7f6f3]">
                    <td className="px-3 py-2 text-[13px] font-medium">{formatMonth(m.month)}</td>
                    <td className="px-3 py-2 text-right"><PnL value={m.realized} /></td>
                    <td className="px-3 py-2 text-right text-[12px] text-[#91918e]">{m.count}</td>
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
