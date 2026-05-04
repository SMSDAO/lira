import { ReactNode } from 'react';
import TabBar, { TabItem } from './TabBar';
import Sidebar from './Sidebar';

interface PixelsLayoutProps {
  children: ReactNode;
  tabs: TabItem[];
  /** Optional content rendered in the desktop top-bar area of the sidebar */
  topBarContent?: ReactNode;
  logo?: ReactNode;
}

export default function PixelsLayout({
  children,
  tabs,
  topBarContent,
  logo,
}: PixelsLayoutProps) {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: '#0B0F1A', color: '#FFFFFF' }}
    >
      {/* Desktop sidebar */}
      <Sidebar tabs={tabs} logo={logo} topBarContent={topBarContent} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <TabBar tabs={tabs} />
    </div>
  );
}
