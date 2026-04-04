export default function PnL({ value, percent, showSign = true }) {
  if (value == null && percent == null) return <span className="text-[#91918e]">—</span>;

  const num = value ?? percent;
  const isPositive = num > 0;
  const isZero = num === 0;
  const color = isZero ? 'text-[#91918e]' : isPositive ? 'text-[#2d8a5e]' : 'text-[#c4554d]';
  const bg = isZero ? '' : isPositive ? 'bg-[#dbeddb]' : 'bg-[#ffe2dd]';
  const sign = showSign && isPositive ? '+' : '';

  const displayValue = value != null ? `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
  const displayPct = percent != null ? `${sign}${percent.toFixed(2)}%` : '';

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[12px] ${color}`}>
      {displayValue && <span>{displayValue}</span>}
      {displayPct && <span className={`px-1 py-0.5 rounded text-[11px] ${bg}`}>{displayPct}</span>}
    </span>
  );
}
