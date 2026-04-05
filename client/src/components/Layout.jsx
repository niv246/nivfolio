import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const navItems = [
  { to: '/', label: '📊 Dashboard' },
  { to: '/monthly', label: '📅 Monthly' },
  { to: '/transactions', label: '📋 History' },
  { to: '/settings', label: '⚙️ Settings' },
];

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* #4 Skip Navigation */}
      <a href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow focus:text-[#2383e2] focus:text-sm">
        Skip to main content
      </a>

      {/* #10 Semantic header */}
      <header>
        <nav aria-label="Main navigation"
          className="sticky top-0 z-50 bg-white border-b border-[rgba(55,53,47,0.09)] px-4 sm:px-6 min-h-[48px] flex items-center gap-1">
          <span className="text-[15px] font-bold mr-4 text-[#37352f]">NivFolio</span>

          {/* Mobile hamburger */}
          <button type="button" onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="sm:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#f7f6f3] rounded transition-colors ml-auto cursor-pointer">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded text-sm transition-colors duration-150 hover:bg-[#f7f6f3] min-h-[44px] flex items-center ${
                    isActive
                      ? 'bg-[#f1f1ef] text-[#37352f] font-medium'
                      : 'text-[#91918e]'
                  }`
                }
                aria-current={({ isActive }) => isActive ? 'page' : undefined}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="sm:hidden bg-white border-b border-[rgba(55,53,47,0.09)] px-4 py-2 flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded text-sm transition-colors duration-150 min-h-[44px] flex items-center ${
                    isActive
                      ? 'bg-[#f1f1ef] text-[#37352f] font-medium'
                      : 'text-[#91918e] hover:bg-[#f7f6f3]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* #4 main-content id, #10 semantic main */}
      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {children}
      </main>

      {/* #10 Semantic footer */}
      <footer className="border-t border-[rgba(55,53,47,0.06)] py-4 text-center text-xs text-[#91918e]">
        NivFolio &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
