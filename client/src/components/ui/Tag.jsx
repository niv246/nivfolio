const colorMap = {
  green: 'bg-[#dbeddb] text-[#2d6a4f]',
  red: 'bg-[#ffe2dd] text-[#93000a]',
  blue: 'bg-[#d3e5ef] text-[#2383e2]',
  yellow: 'bg-[#fdecc8] text-[#8b6914]',
  purple: 'bg-[#e8deee] text-[#6b21a8]',
  orange: 'bg-[#fadec9] text-[#9a3412]',
  gray: 'bg-[#f1f1ef] text-[#91918e]',
};

export default function Tag({ color = 'gray', children }) {
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium ${colorMap[color] || colorMap.gray}`}>
      {children}
    </span>
  );
}
