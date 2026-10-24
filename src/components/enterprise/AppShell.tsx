import Link from 'next/link';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/launch', label: 'Launch' },
  { href: '/agents', label: 'Agents' },
  { href: '/social', label: 'Social' },
  { href: '/admin', label: 'Admin' },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="enterprise-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <header className="enterprise-header glass-panel">
        <div className="brand-wrap">
          <div className="brand-mark">L</div>
          <div>
            <p className="eyebrow">LIRA OS</p>
            <h1 className="brand-name">Enterprise</h1>
          </div>
        </div>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <button type="button" className="header-pill">
            Status: Live
          </button>
        </div>
      </header>

      <div className="enterprise-layout">
        <aside className="enterprise-sidebar glass-panel">
          <div className="sidebar-section">
            <p className="section-label">Navigation</p>
            <div className="sidebar-list">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="sidebar-item">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <p className="section-label">Runtime</p>
            <div className="status-stack">
              <div className="status-row">
                <span>Chain</span>
                <strong>Base</strong>
              </div>
              <div className="status-row">
                <span>Indexer</span>
                <strong>Online</strong>
              </div>
              <div className="status-row">
                <span>Wallet</span>
                <strong>Ready</strong>
              </div>
            </div>
          </div>
        </aside>

        <main className="enterprise-main">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
