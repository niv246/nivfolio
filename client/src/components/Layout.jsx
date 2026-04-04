import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: '📊 Dashboard' },
  { to: '/monthly', label: '📅 Monthly' },
  { to: '/transactions', label: '📋 History' },
  { to: '/settings', label: '⚙️ Settings' },
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-[rgba(55,53,47,0.09)] px-6 py-2 flex items-center gap-1">
        <span className="text-[15px] font-bold mr-4 text-[#37352f]">NivFolio</span>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-[13px] transition-colors ${
                isActive
                  ? 'bg-[#f1f1ef] text-[#37352f] font-medium'
                  : 'text-[#91918e] hover:bg-[#f7f6f3]'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
