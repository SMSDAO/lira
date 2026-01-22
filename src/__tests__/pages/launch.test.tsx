import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Launch from '@/pages/launch/index';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/launch',
    query: {},
    asPath: '/launch',
  }),
}));

// Mock Wagmi hooks
const mockUseAccount = jest.fn(() => ({
  address: '0x1234567890123456789012345678901234567890',
  isConnected: true,
}));

jest.mock('wagmi', () => ({
  useAccount: mockUseAccount,
  useContractWrite: () => ({
    write: jest.fn(),
    isLoading: false,
    isSuccess: false,
  }),
  usePrepareContractWrite: () => ({
    config: {},
  }),
}));

jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => <button>Connect Wallet</button>,
}));

describe('Launch Page', () => {
  it('renders without crashing', () => {
    render(<Launch />);
    expect(screen.getByText(/Launch Your Token/i)).toBeInTheDocument();
  });

  it('displays token configuration form', () => {
    render(<Launch />);
    expect(screen.getByLabelText(/Token Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Token Symbol/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Initial Supply/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<Launch />);
    const launchButton = screen.getByText(/Launch Token/i);
    
    fireEvent.click(launchButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Token name is required/i)).toBeInTheDocument();
    });
  });

  it('validates token symbol format', async () => {
    render(<Launch />);
    const symbolInput = screen.getByLabelText(/Token Symbol/i);
    
    fireEvent.change(symbolInput, { target: { value: 'invalid symbol with spaces' } });
    fireEvent.blur(symbolInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Symbol must be alphanumeric/i)).toBeInTheDocument();
    });
  });

  it('validates supply is positive number', async () => {
    render(<Launch />);
    const supplyInput = screen.getByLabelText(/Initial Supply/i);
    
    fireEvent.change(supplyInput, { target: { value: '-100' } });
    fireEvent.blur(supplyInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Supply must be positive/i)).toBeInTheDocument();
    });
  });

  it('displays launch fee information', () => {
    render(<Launch />);
    expect(screen.getByText(/Launch Fee/i)).toBeInTheDocument();
  });

  it('shows connect wallet message when not connected', () => {
    // Override the mock for this test
    mockUseAccount.mockReturnValueOnce({
      address: undefined,
      isConnected: false,
    });
    
    render(<Launch />);
    expect(screen.getByText(/Connect your wallet/i)).toBeInTheDocument();
  });
});
