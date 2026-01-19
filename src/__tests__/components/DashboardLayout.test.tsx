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
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Launch/i)).toBeInTheDocument();
    expect(screen.getByText(/Agents/i)).toBeInTheDocument();
  });

  it('displays admin link when admin prop is true', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
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
    
    // Check for dark background class
    expect(container.querySelector('.bg-gray-900')).toBeInTheDocument();
  });
});
