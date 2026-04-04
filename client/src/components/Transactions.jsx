import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, DollarSign } from 'lucide-react';
import { api } from '../api';
import Tag from './ui/Tag';
import AddTxModal from './AddTxModal';
import CashModal from './CashModal';

export default function Transactions() {
  const [txList, setTxList] = useState([]);
  const [cashOps, setCashOps] = useState([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [tab, setTab] = useState('trades');

  const loadData = useCallback(async () => {
    try {
      const [cashData, holdingsRes] = await Promise.all([
        api('/api/portfolio/cash'),
        fetch('/api/portfolio/holdings').then(r => r.json()).catch(() => []),
      ]);
      setCashOps(cashData.operations || []);
      setCashBalance(cashData.balance || 0);

      // Get all transactions for history
      const allTx = (cashData.operations || [])
        .filter((op) => op.type === 'buy' || op.type === 'sell')
        .map((op) => ({
          id: op.tx_id,
          ticker: op.ticker,
          type: op.type,
          amount: op.amount_usd,
          date: op.date,
          note: op.note,
        }));
      setTxList(allTx);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteTx = async (id) => {
    if (!id) return;
    try {
      await api(`/api/portfolio/transaction/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-20 text-[#91918e]">Loading...</div>;

  const cashOnly = cashOps.filter((op) => op.type === 'deposit' || op.type === 'withdraw');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#37352f]">📋 History</h1>
        <div className="flex items-center gap-2">
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

      {/* Cash Summary */}
      <div className="border border-[rgba(55,53,47,0.09)] rounded-lg p-4 mb-6">
        <div className="text-[11px] text-[#91918e] uppercase tracking-wider mb-1">Cash Balance</div>
        <div className="text-xl font-bold font-mono text-[#37352f]">
          ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {['trades', 'cash'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded text-[13px] transition-colors ${
              tab === t ? 'bg-[#f1f1ef] text-[#37352f] font-medium' : 'text-[#91918e] hover:bg-[#f7f6f3]'
            }`}>
            {t === 'trades' ? '📊 Trades' : '💵 Cash Operations'}
          </button>
        ))}
      </div>

      {tab === 'trades' ? (
        txList.length === 0 ? (
          <EmptyState emoji="📊" title="No trades yet" subtitle="Add your first buy or sell transaction" />
        ) : (
          <div className="border border-[rgba(55,53,47,0.09)] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f7f6f3]">
                  <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Date</th>
                  <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Type</th>
                  <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Ticker</th>
                  <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Amount</th>
                  <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Note</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {txList.map((tx, i) => (
                  <tr key={i} className="group border-t border-[rgba(55,53,47,0.06)] hover:bg-[#f7f6f3]">
                    <td className="px-3 py-2 text-[12px] text-[#91918e]">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <Tag color={tx.type === 'buy' ? 'green' : 'red'}>{tx.type.toUpperCase()}</Tag>
                    </td>
                    <td className="px-3 py-2 font-mono text-[12px] font-semibold">{tx.ticker}</td>
                    <td className="px-3 py-2 text-right font-mono text-[12px]">
                      ${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-[12px] text-[#91918e] truncate max-w-[200px]">{tx.note}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => handleDeleteTx(tx.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#c4554d] hover:bg-[#ffe2dd] rounded transition-all">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        cashOnly.length === 0 ? (
          <EmptyState emoji="💵" title="No cash operations" subtitle="Deposit or withdraw funds to get started" />
        ) : (
          <div className="border border-[rgba(55,53,47,0.09)] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f7f6f3]">
                  <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Date</th>
                  <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Type</th>
                  <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Amount</th>
                  <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-[#91918e] font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {cashOnly.map((op) => (
                  <tr key={op.id} className="border-t border-[rgba(55,53,47,0.06)] hover:bg-[#f7f6f3]">
                    <td className="px-3 py-2 text-[12px] text-[#91918e]">{new Date(op.date).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <Tag color={op.type === 'deposit' ? 'green' : 'red'}>{op.type.toUpperCase()}</Tag>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[12px]">
                      ${parseFloat(op.amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-[12px] text-[#91918e]">{op.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {showTxModal && <AddTxModal onClose={() => setShowTxModal(false)} onSaved={loadData} />}
      {showCashModal && <CashModal onClose={() => setShowCashModal(false)} onSaved={loadData} />}
    </div>
  );
}

function EmptyState({ emoji, title, subtitle }) {
  return (
    <div className="text-center py-16">
      <div className="text-4xl mb-3">{emoji}</div>
      <h2 className="text-[15px] font-semibold text-[#37352f] mb-1">{title}</h2>
      <p className="text-[13px] text-[#91918e]">{subtitle}</p>
    </div>
  );
}
