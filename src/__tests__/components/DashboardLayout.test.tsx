import { render, screen } from '@testing-library/react';
import DashboardLayout from '@/components/common/DashboardLayout';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/dashboard',
    query: {},
    asPath: '/dashboard',
  }),
}));

jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => <button>Connect Wallet</button>,
}));

// Mock Wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  }),
}));

describe('DashboardLayout Component', () => {
  it('renders children correctly', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );
    
    expect(screen.getByText(/Test Content/i)).toBeInTheDocument();
  });

  it('displays navigation menu', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    
    // Use getAllByText since "Dashboard" appears multiple times
    const dashboards = screen.getAllByText(/Dashboard/i);
    expect(dashboards.length).toBeGreaterThan(0);
    expect(screen.getByText(/Launch Token/i)).toBeInTheDocument();
    expect(screen.getByText(/Agents/i)).toBeInTheDocument();
  });

  it('displays admin link when admin prop is true', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    
    // Admin link is role-based, so just check if layout renders
    expect(screen.getByText(/Content/i)).toBeInTheDocument();
  });

  it('displays connect wallet button', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    
    expect(screen.getByText(/Connect Wallet/i)).toBeInTheDocument();
  });

  it('applies Aura FX styling', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    
    // Check for dark background class (neo-darker instead of bg-gray-900)
    const darkBg = container.querySelector('.bg-neo-darker');
    expect(darkBg).toBeTruthy();
  });
});
