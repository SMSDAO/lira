import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

export interface TabItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface TabBarProps {
  tabs: TabItem[];
}

export default function TabBar({ tabs }: TabBarProps) {
  const { pathname } = useRouter();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
      style={{
        background: 'rgba(11, 15, 26, 0.9)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.4)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200"
            style={
              isActive
                ? {
                    background:
                      'linear-gradient(to top, rgba(124,58,237,0.15), transparent)',
                  }
                : {}
            }
          >
            <span
              className="text-xl leading-none"
              style={
                isActive
                  ? {
                      filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.8))',
                      color: '#a78bfa',
                    }
                  : { color: 'rgba(255,255,255,0.4)' }
              }
            >
              {tab.icon}
            </span>
            <span
              className="text-[10px] font-medium tracking-wide"
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }
                  : { color: 'rgba(255,255,255,0.4)' }
              }
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
