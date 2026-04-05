const colors = {
  green:  { bg: 'var(--green-bg)',  text: 'var(--green2)' },
  red:    { bg: 'var(--red-bg)',    text: 'var(--red2)' },
  blue:   { bg: 'var(--indigo-bg)', text: 'var(--indigo2)' },
  gray:   { bg: 'var(--chip-bg)',   text: 'var(--text2)' },
  amber:  { bg: 'rgba(245,158,11,0.15)', text: 'var(--amber)' },
  purple: { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa' },
  yellow: { bg: 'rgba(245,158,11,0.15)', text: 'var(--amber)' },
  orange: { bg: 'rgba(249,115,22,0.15)', text: 'var(--orange)' },
};

export default function Tag({ color = 'gray', children }) {
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      background: c.bg, color: c.text,
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '99px',
      fontSize: '11px', fontWeight: 700,
      fontFamily: 'var(--mono)',
      lineHeight: '18px',
    }}>
      {children}
    </span>
  );
}
