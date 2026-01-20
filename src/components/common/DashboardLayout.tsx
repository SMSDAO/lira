import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FiHome, FiUser, FiZap, FiCpu, FiSettings, FiBarChart2, FiCode } from 'react-icons/fi';
import { useUserRole } from '@/hooks/useUserRole';
import { UserRole, ROLE_CONFIGS } from '@/lib/rbac';
import { useAccount } from 'wagmi';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { address } = useAccount();
  const userRole = useUserRole();

  // Base navigation available to all users
  const baseNavigation = [
    { name: 'Home', href: '/', icon: FiHome },
    { name: 'Dashboard', href: '/dashboard', icon: FiBarChart2 },
    { name: 'Launch Token', href: '/launch', icon: FiZap },
    { name: 'Agents', href: '/agents', icon: FiCpu },
    { name: 'Profile', href: '/profile', icon: FiUser },
  ];

  // Role-specific navigation
  const roleNavigation = [];
  
  if (userRole === UserRole.ADMIN) {
    roleNavigation.push({ name: 'Admin', href: '/admin', icon: FiSettings });
  }
  
  if (userRole === UserRole.DEV || userRole === UserRole.ADMIN) {
    roleNavigation.push({ name: 'Dev Portal', href: '/dev', icon: FiCode });
  }

  const navigation = [...baseNavigation, ...roleNavigation];

  const isActive = (href: string) => router.pathname === href || router.pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-neo-darker">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-neo-dark border-r border-neo-blue/30">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-neo-blue/30">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-neo-blue to-neo-purple rounded-lg flex items-center justify-center text-xl font-bold">
                L
              </div>
              <span className="text-2xl font-bold text-neo-blue">LIRA</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive(item.href)
                    ? 'bg-neo-blue/20 text-neo-blue shadow-aura'
                    : 'text-gray-400 hover:bg-neo-darker hover:text-neo-blue'
                }`}
              >
                <item.icon className="text-xl" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-neo-blue/30">
            {address && (
              <div className="mb-2 text-xs text-center">
                <span className="text-gray-500">Role: </span>
                <span className={`font-semibold ${
                  userRole === UserRole.ADMIN ? 'text-neo-pink' :
                  userRole === UserRole.DEV ? 'text-neo-purple' :
                  'text-neo-blue'
                }`}>
                  {ROLE_CONFIGS[userRole].label}
                </span>
              </div>
            )}
            <div className="text-xs text-gray-500 text-center">
              © 2026 Lira Protocol
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-neo-dark/80 backdrop-blur-sm border-b border-neo-blue/30">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 bg-neo-darker border border-neo-blue/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-neo-blue"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectButton />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
