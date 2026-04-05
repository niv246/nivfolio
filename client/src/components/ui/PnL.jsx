export default function PnL({ value, percent, showSign = true }) {
  if (value == null && percent == null) return <span style={{ color: 'var(--text3)' }}>{'\u2014'}</span>;

  const num = value ?? percent;
  const isPositive = num > 0;
  const isZero = num === 0;
  const color = isZero ? 'var(--text3)' : isPositive ? 'var(--green2)' : 'var(--red2)';
  const bg = isZero ? 'transparent' : isPositive ? 'var(--green-bg)' : 'var(--red-bg)';
  const sign = showSign && isPositive ? '+' : '';
  const arrow = isZero ? '' : isPositive ? '\u25B2 ' : '\u25BC ';

  const displayValue = value != null ? `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
  const displayPct = percent != null ? `${arrow}${sign}${percent.toFixed(2)}%` : '';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {displayValue && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color, fontWeight: 700 }}>{displayValue}</span>}
      {displayPct && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', marginTop: value != null ? 4 : 0, background: bg, color }}>
          {displayPct}
        </span>
      )}
    </span>
  );
}
