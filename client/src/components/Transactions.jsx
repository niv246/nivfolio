import { useState, useEffect, useCallback, useRef } from 'react';
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
  const tradeButtonRef = useRef(null);
  const cashButtonRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [cashData] = await Promise.all([api('/api/portfolio/cash'), fetch('/api/portfolio/holdings').then(r => r.json()).catch(() => [])]);
      setCashOps(cashData.operations || []);
      setCashBalance(cashData.balance || 0);
      setTxList((cashData.operations || []).filter(op => op.type === 'buy' || op.type === 'sell')
        .map(op => ({ id: op.tx_id, ticker: op.ticker, type: op.type, amount: op.amount_usd, date: op.date, note: op.note })));
    } catch (err) { console.error('Failed to load:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteTx = async (id) => {
    if (!id) return;
    try { await api(`/api/portfolio/transaction/${id}`, { method: 'DELETE' }); await loadData(); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text2)' }} role="status" aria-live="polite">Loading...</div>;

  const cashOnly = cashOps.filter(op => op.type === 'deposit' || op.type === 'withdraw');

  const thStyle = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text3)', fontWeight: 500, borderBottom: '1px solid var(--border)', padding: '10px 16px' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl sm:text-[28px] font-bold" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>📋 Transactions</h1>
        <div className="flex items-center gap-2">
          <button type="button" ref={cashButtonRef} onClick={() => setShowCashModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs rounded-lg"
            style={{ background: 'var(--indigo-bg)', color: 'var(--indigo2)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <DollarSign size={14} aria-hidden="true" /><span className="hidden sm:inline">Cash</span>
          </button>
          <button type="button" ref={tradeButtonRef} onClick={() => setShowTxModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-xs font-semibold rounded-lg shadow-sm"
            style={{ background: 'var(--indigo)', color: '#fff' }}>
            <Plus size={14} aria-hidden="true" /><span className="hidden sm:inline">+ Trade</span>
          </button>
        </div>
      </div>

      {/* Cash Summary */}
      <div className="p-4 mb-6" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Cash Balance</div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
          ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4" role="tablist" aria-label="Transaction views">
        {['trades', 'cash'].map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} aria-controls={`tabpanel-${t}`} id={`tab-${t}`}
            onClick={() => setTab(t)}
            className="px-4 py-2 min-h-[44px] rounded-lg text-xs transition-all duration-150"
            style={{ background: tab === t ? 'var(--chip-bg)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text3)', fontWeight: tab === t ? 600 : 400 }}>
            {t === 'trades' ? '📊 Trades' : '💵 Cash Operations'}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'trades' ? (
          txList.length === 0 ? (
            <EmptyState emoji="📊" title="No trades yet" subtitle="Add your first buy or sell transaction" />
          ) : (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <table className="w-full">
                <thead><tr>
                  <th className="text-left" style={thStyle}>Date</th>
                  <th className="text-left" style={thStyle}>Type</th>
                  <th className="text-left" style={thStyle}>Ticker</th>
                  <th className="text-right" style={thStyle}>Amount</th>
                  <th className="text-left hidden sm:table-cell" style={thStyle}>Note</th>
                  <th style={{ ...thStyle, width: 48 }}><span className="sr-only">Actions</span></th>
                </tr></thead>
                <tbody>
                  {txList.map((tx, i) => (
                    <tr key={i} className="group" style={{ borderBottom: '1px solid var(--border2)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{new Date(tx.date).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 16px' }}><Tag color={tx.type === 'buy' ? 'green' : 'red'}>{tx.type.toUpperCase()}</Tag></td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12, background: 'var(--tag-bg)', padding: '2px 8px', borderRadius: 4, color: 'var(--text)' }}>{tx.ticker}</span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                        ${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="hidden sm:table-cell" style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text3)', maxWidth: 200 }}>{tx.note}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <button type="button" onClick={() => handleDeleteTx(tx.id)} aria-label={`Delete ${tx.type} ${tx.ticker}`}
                          className="del-btn p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-all duration-150"
                          style={{ color: 'var(--text3)', background: 'none', border: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>
                          <Trash2 size={14} aria-hidden="true" />
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
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <table className="w-full">
                <thead><tr>
                  <th className="text-left" style={thStyle}>Date</th>
                  <th className="text-left" style={thStyle}>Type</th>
                  <th className="text-right" style={thStyle}>Amount</th>
                  <th className="text-left hidden sm:table-cell" style={thStyle}>Note</th>
                </tr></thead>
                <tbody>
                  {cashOnly.map((op) => (
                    <tr key={op.id} style={{ borderBottom: '1px solid var(--border2)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{new Date(op.date).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 16px' }}><Tag color={op.type === 'deposit' ? 'green' : 'amber'}>{op.type.toUpperCase()}</Tag></td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                        ${parseFloat(op.amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="hidden sm:table-cell" style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text3)' }}>{op.note || '\u2014'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {showTxModal && <AddTxModal onClose={() => { setShowTxModal(false); tradeButtonRef.current?.focus(); }} onSaved={loadData} />}
      {showCashModal && <CashModal onClose={() => { setShowCashModal(false); cashButtonRef.current?.focus(); }} onSaved={loadData} />}
    </div>
  );
}

function EmptyState({ emoji, title, subtitle }) {
  return (
    <div className="text-center py-16">
      <div className="text-4xl mb-3" aria-hidden="true">{emoji}</div>
      <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>{title}</h2>
      <p className="text-sm" style={{ color: 'var(--text2)' }}>{subtitle}</p>
    </div>
  );
}
