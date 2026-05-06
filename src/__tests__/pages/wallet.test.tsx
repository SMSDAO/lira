import { render, screen } from '@testing-library/react';
import WalletPage from '@/pages/wallet';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/wallet',
    query: {},
    asPath: '/wallet',
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => <button>Connect Wallet</button>,
}));

// Configurable wagmi mock
const mockUseAccount = jest.fn();
jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
}));

describe('Wallet Page — disconnected', () => {
  beforeEach(() => {
    mockUseAccount.mockReturnValue({ address: undefined, isConnected: false });
  });

  it('renders without crashing', () => {
    render(<WalletPage />);
    // The gradient heading "Wallet" renders as a span inside h1
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('shows Connect Wallet section', () => {
    render(<WalletPage />);
    // The ConnectButton mock renders a button with "Connect Wallet"
    expect(screen.getByRole('button', { name: /Connect Wallet/i })).toBeInTheDocument();
  });

  it('shows Tier Status section', () => {
    render(<WalletPage />);
    expect(screen.getByText(/Tier Status/i)).toBeInTheDocument();
  });

  it('shows NFT Status section', () => {
    render(<WalletPage />);
    // The section heading is a <span> with exact text "NFT Status"
    expect(screen.getByText('NFT Status')).toBeInTheDocument();
  });

  it('shows Free tier when disconnected', () => {
    render(<WalletPage />);
    expect(screen.getByText(/🔒 Free/i)).toBeInTheDocument();
  });

  it('shows prompt to connect wallet for NFTs', () => {
    render(<WalletPage />);
    expect(
      screen.getByText(/Connect wallet to view your NFTs/i)
    ).toBeInTheDocument();
  });

  it('shows prompt to connect wallet for Pro features', () => {
    render(<WalletPage />);
    expect(
      screen.getByText(/Connect wallet to unlock Pro features/i)
    ).toBeInTheDocument();
  });
});

describe('Wallet Page — connected', () => {
  const mockAddress = '0xAbCd1234567890123456789012345678901234Ab';

  beforeEach(() => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
    });
  });

  it('shows Connected Wallet label', () => {
    render(<WalletPage />);
    expect(screen.getByText(/Connected Wallet/i)).toBeInTheDocument();
  });

  it('shows truncated wallet address', () => {
    render(<WalletPage />);
    // Truncated: first 6 chars + last 4 chars
    expect(screen.getByText(/0xAbCd.*34Ab/)).toBeInTheDocument();
  });

  it('shows Pro tier when connected', () => {
    render(<WalletPage />);
    expect(screen.getByText(/⚡ Pro/i)).toBeInTheDocument();
  });

  it('shows NFT grid when connected', () => {
    render(<WalletPage />);
    expect(screen.getByText(/Lira Genesis #001/i)).toBeInTheDocument();
    expect(screen.getByText(/DAO Pass #42/i)).toBeInTheDocument();
  });

  it('shows Online indicator', () => {
    render(<WalletPage />);
    expect(screen.getByText(/● Online/i)).toBeInTheDocument();
  });
});
