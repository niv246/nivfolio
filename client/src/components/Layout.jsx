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
  const { isDark, toggleTheme } = useTheme();

  const navStyle = {
    position: 'sticky', top: 0, zIndex: 50,
    background: 'var(--nav-blur)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
    height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', transition: 'background 0.4s',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:rounded focus:shadow focus:text-sm"
        style={{ background: 'var(--bg2)', color: 'var(--indigo2)' }}>Skip to main content</a>

      <header>
        <nav aria-label="Main navigation" style={navStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--indigo), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>N</div>
              NivFolio
            </div>

            {/* Desktop tabs */}
            <div className="hidden sm:flex" style={{ gap: 2, marginLeft: 16 }}>
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'}
                  style={({ isActive }) => ({
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--text)' : 'var(--text3)',
                    background: isActive ? 'var(--chip-bg)' : 'none',
                    border: 'none', fontFamily: 'var(--font)', transition: 'all 0.2s', textDecoration: 'none',
                  })}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Mobile hamburger */}
            <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              style={{ padding: 8, background: 'none', border: 'none', color: 'var(--text2)' }}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 6 }}>
              {/* Divider */}
              <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

              {/* Theme toggle */}
              <button type="button" onClick={toggleTheme} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                style={{ width: 44, height: 24, borderRadius: 99, background: 'var(--toggle-track)', border: 'none', position: 'relative', padding: 0, flexShrink: 0, transition: 'background 0.3s' }}>
                <div style={{ position: 'absolute', top: 3, left: 3, width: 18, height: 18, borderRadius: '50%', background: 'var(--toggle-knob)', transform: isDark ? 'translateX(0)' : 'translateX(20px)', transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), background 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                <span style={{ position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%)', fontSize: 11, lineHeight: 1, opacity: isDark ? 1 : 0, transition: 'opacity 0.3s' }}>🌙</span>
                <span style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', fontSize: 11, lineHeight: 1, opacity: isDark ? 0 : 1, transition: 'opacity 0.3s' }}>☀️</span>
              </button>

              <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

              <button type="button" style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'var(--text3)', background: 'none', border: 'none', fontFamily: 'var(--font)' }}>
                ↻ Refresh
              </button>
            </div>
          </div>
        </nav>

        {menuOpen && (
          <div className="sm:hidden" style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--text)' : 'var(--text3)', background: isActive ? 'var(--chip-bg)' : 'transparent',
                  textDecoration: 'none', minHeight: 44, display: 'flex', alignItems: 'center',
                })}>
                {item.label}
              </NavLink>
            ))}
            <button type="button" onClick={toggleTheme} style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text2)', background: 'none', border: 'none', textAlign: 'left', minHeight: 44 }}>
              {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        )}
      </header>

      <main id="main-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', flex: 1, width: '100%' }}>
        {children}
      </main>

      <footer style={{ textAlign: 'center', padding: 24, fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
        NivFolio v2.0 &bull; Prices delayed 15 min &bull; FinnHub API
      </footer>
    </div>
  );
}
