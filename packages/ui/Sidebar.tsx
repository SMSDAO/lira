import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useState } from 'react';
import type { TabItem } from './TabBar';

interface SidebarProps {
  tabs: TabItem[];
  logo?: ReactNode;
  topBarContent?: ReactNode;
}

export default function Sidebar({ tabs, logo, topBarContent }: SidebarProps) {
  const { pathname } = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="hidden md:flex flex-col h-screen sticky top-0 z-40 transition-all duration-300"
      style={{
        width: collapsed ? '72px' : '220px',
        background: 'rgba(18, 24, 38, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '10px 0 30px rgba(0,0,0,0.4)',
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        {!collapsed && (
          <div className="flex-1 overflow-hidden">{logo ?? <span className="text-lg font-bold" style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LIRA</span>}</div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          ) : (
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          )}
        </button>
      </div>

      {/* Top bar extra content (wallet, avatar, theme) */}
      {!collapsed && topBarContent && (
        <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {topBarContent}
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group"
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(37,99,235,0.15))',
                      boxShadow: '0 0 20px rgba(124,58,237,0.2)',
                      border: '1px solid rgba(124,58,237,0.3)',
                    }
                  : {
                      border: '1px solid transparent',
                    }
              }
            >
              <span
                className="text-xl leading-none flex-shrink-0"
                style={
                  isActive
                    ? { filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.8))', color: '#a78bfa' }
                    : { color: 'rgba(255,255,255,0.4)' }
                }
              >
                {tab.icon}
              </span>
              {!collapsed && (
                <span
                  className="text-sm font-medium truncate"
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }
                      : { color: 'rgba(255,255,255,0.55)' }
                  }
                >
                  {tab.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
