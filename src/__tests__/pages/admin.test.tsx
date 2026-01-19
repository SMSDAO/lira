import { render, screen, fireEvent } from '@testing-library/react';
import Admin from '@/pages/admin/index';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/admin',
    query: {},
    asPath: '/admin',
  }),
}));

// Mock Wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  }),
}));

jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => <button>Connect Wallet</button>,
}));

describe('Admin Page', () => {
  it('renders without crashing', () => {
    render(<Admin />);
    expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
  });

  it('displays protocol stats', () => {
    render(<Admin />);
    expect(screen.getByText(/Total Users/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Volume/i)).toBeInTheDocument();
    expect(screen.getByText(/Protocol Fees/i)).toBeInTheDocument();
  });

  it('displays fee management section', () => {
    render(<Admin />);
    expect(screen.getByText(/Fee Settings/i)).toBeInTheDocument();
  });

  it('displays user management section', () => {
    render(<Admin />);
    expect(screen.getByText(/User Management/i)).toBeInTheDocument();
  });

  it('displays security settings', () => {
    render(<Admin />);
    expect(screen.getByText(/Security/i)).toBeInTheDocument();
  });

  it('displays billing section', () => {
    render(<Admin />);
    expect(screen.getByText(/Billing/i)).toBeInTheDocument();
  });

  it('allows fee configuration', () => {
    render(<Admin />);
    const feeInput = screen.getByLabelText(/Launch Fee/i);
    
    fireEvent.change(feeInput, { target: { value: '0.5' } });
    
    expect(feeInput).toHaveValue(0.5);
  });

  it('displays withdraw fees button', () => {
    render(<Admin />);
    expect(screen.getByText(/Withdraw Fees/i)).toBeInTheDocument();
  });
});
