import { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2 } from 'lucide-react';
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
  const tradeButtonRef = useRef(null);
  const cashButtonRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [cashData] = await Promise.all([api('/api/portfolio/cash'), fetch('/api/portfolio/holdings').then(r => r.json()).catch(() => [])]);
      setCashOps(cashData.operations || []); setCashBalance(cashData.balance || 0);
      setTxList((cashData.operations || []).filter(op => op.type === 'buy' || op.type === 'sell')
        .map(op => ({ id: op.tx_id, ticker: op.ticker, type: op.type, amount: op.amount_usd, date: op.date, note: op.note })));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteTx = async (id) => {
    if (!id) return;
    try { await api(`/api/portfolio/transaction/${id}`, { method: 'DELETE' }); await loadData(); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text2)' }} role="status" aria-live="polite">Loading...</div>;

  const cashOnly = cashOps.filter(op => op.type === 'deposit' || op.type === 'withdraw');
  const th = { fontSize: 11, fontWeight: 500, color: 'var(--text3)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 16px' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Transactions</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>Full history of all buys, sells and cash operations.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" ref={cashButtonRef} onClick={() => setShowCashModal(true)}
            style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, color: 'var(--text2)', background: 'none', border: 'none', fontFamily: 'var(--font)' }}>
            💵 Cash
          </button>
          <button type="button" ref={tradeButtonRef} onClick={() => setShowTxModal(true)}
            style={{ padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--indigo)', border: 'none', fontFamily: 'var(--font)' }}>
            + Trade
          </button>
        </div>
      </div>

      {/* Cash Operations */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>💵 Cash Operations</div>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--card-shadow)', marginBottom: 24 }}>
        {cashOnly.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No cash operations yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Date', 'Type', 'Amount', 'Note'].map((h, i) => (
                <th key={h} style={{ ...th, textAlign: i === 2 ? 'right' : 'left' }} className={i === 3 ? 'hidden sm:table-cell' : ''}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {cashOnly.map(op => (
                <tr key={op.id} style={{ borderBottom: '1px solid var(--border2)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{new Date(op.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}><Tag color={op.type === 'deposit' ? 'green' : 'amber'}>{op.type === 'deposit' ? 'Deposit' : 'Withdraw'}</Tag></td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>${parseFloat(op.amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="hidden sm:table-cell" style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)' }}>{op.note || '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stock Transactions */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>📋 Stock Transactions</div>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
        {txList.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No trades yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Date', 'Type', 'Ticker', 'Amount', ''].map((h, i) => (
                <th key={i} style={{ ...th, textAlign: i === 3 ? 'right' : 'left', width: i === 4 ? 48 : undefined }}>{h || <span className="sr-only">Actions</span>}</th>
              ))}
            </tr></thead>
            <tbody>
              {txList.map((tx, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border2)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{new Date(tx.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}><Tag color={tx.type === 'buy' ? 'green' : 'red'}>{tx.type === 'buy' ? 'Buy' : 'Sell'}</Tag></td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', background: 'var(--tag-bg)', padding: '2px 8px', borderRadius: 4, color: 'var(--text2)', fontSize: 12 }}>{tx.ticker}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>
                    ${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button type="button" onClick={() => handleDeleteTx(tx.id)} aria-label={`Delete ${tx.type} ${tx.ticker}`}
                      className="del-btn" style={{ color: 'var(--text3)', background: 'none', border: 'none', fontSize: 13, padding: 4 }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showTxModal && <AddTxModal onClose={() => { setShowTxModal(false); tradeButtonRef.current?.focus(); }} onSaved={loadData} />}
      {showCashModal && <CashModal onClose={() => { setShowCashModal(false); cashButtonRef.current?.focus(); }} onSaved={loadData} />}
    </div>
  );
}
