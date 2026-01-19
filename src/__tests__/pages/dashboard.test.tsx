import { render, screen } from '@testing-library/react';
import Dashboard from '@/pages/dashboard/index';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/dashboard',
    query: {},
    asPath: '/dashboard',
  }),
}));

// Mock RainbowKit and Wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  }),
  useBalance: () => ({
    data: { formatted: '10.5', symbol: 'ETH' },
  }),
}));

jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => <button>Connect Wallet</button>,
}));

describe('Dashboard Page', () => {
  it('renders without crashing', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Portfolio/i)).toBeInTheDocument();
  });

  it('displays user wallet address when connected', () => {
    render(<Dashboard />);
    expect(screen.getByText(/0x123/i)).toBeInTheDocument();
  });

  it('displays portfolio stats cards', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Total Value/i)).toBeInTheDocument();
    expect(screen.getByText(/Tokens Launched/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Agents/i)).toBeInTheDocument();
  });

  it('displays recent activity section', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
  });

  it('displays quick actions', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Launch Token/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Agent/i)).toBeInTheDocument();
  });
});
