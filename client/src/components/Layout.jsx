import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/', label: '📊 Dashboard' },
  { to: '/monthly', label: '📅 Monthly' },
  { to: '/transactions', label: '📋 Transactions' },
  { to: '/settings', label: '⚙️ Settings' },
];

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <a href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:rounded focus:shadow focus:text-sm"
        style={{ background: 'var(--bg2)', color: 'var(--indigo2)' }}>
        Skip to main content
      </a>

      <header>
        <nav aria-label="Main navigation"
          className="sticky top-0 z-50 px-4 sm:px-6 min-h-[48px] flex items-center gap-2"
          style={{ background: 'var(--nav-blur)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>

          {/* Logo */}
          <div className="flex items-center gap-2 mr-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, var(--indigo), var(--cyan))' }}>N</div>
            <span className="text-[15px] font-bold" style={{ letterSpacing: '-0.02em', color: 'var(--text)' }}>NivFolio</span>
          </div>

          {/* Mobile hamburger */}
          <button type="button" onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}
            className="sm:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg ml-auto"
            style={{ color: 'var(--text2)' }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                style={({ isActive }) => ({
                  background: isActive ? 'var(--chip-bg)' : 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--text3)',
                  fontWeight: isActive ? 600 : 400,
                  padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                  minHeight: '44px', display: 'flex', alignItems: 'center',
                  transition: 'background 0.15s, color 0.15s',
                })}
                onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'var(--hover)'; }}
                onMouseLeave={e => { const isAct = e.currentTarget.getAttribute('aria-current'); if (!isAct) e.currentTarget.style.background = 'transparent'; }}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden sm:flex items-center gap-2 ml-auto">
            {/* Theme toggle */}
            <button type="button" onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="relative rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
              style={{ width: 44, height: 24 }}>
              <div style={{ width: 44, height: 24, borderRadius: 99, background: 'var(--toggle-track)', position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: 3, left: 3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--toggle-knob)',
                  transform: isDark ? 'translateX(0)' : 'translateX(20px)',
                  transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
                <span style={{ position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%)', fontSize: 10, opacity: isDark ? 1 : 0, transition: 'opacity 0.2s' }}>🌙</span>
                <span style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', fontSize: 10, opacity: isDark ? 0 : 1, transition: 'opacity 0.2s' }}>☀️</span>
              </div>
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="sm:hidden px-4 py-2 flex flex-col gap-1" style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  background: isActive ? 'var(--chip-bg)' : 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--text3)',
                  fontWeight: isActive ? 600 : 400,
                  padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
                  minHeight: '44px', display: 'flex', alignItems: 'center',
                })}>
                {item.label}
              </NavLink>
            ))}
            <button type="button" onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 min-h-[44px]"
              style={{ color: 'var(--text2)', fontSize: '13px' }}>
              {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        )}
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {children}
      </main>

      <footer className="py-4 text-center text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text3)' }}>
        NivFolio &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
