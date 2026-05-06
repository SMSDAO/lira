import { render, screen, fireEvent } from '@testing-library/react';
import HistoryPage from '@/pages/history';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/history',
    query: {},
    asPath: '/history',
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

describe('History Page', () => {
  it('renders without crashing', () => {
    render(<HistoryPage />);
    expect(screen.getByText(/^History$/i)).toBeInTheDocument();
  });

  it('displays all mock history items on initial render', () => {
    render(<HistoryPage />);
    // All 6 MOCK_HISTORY items should be visible
    expect(
      screen.getByText(/Generate a smart contract for ERC-20 token/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Analyze DEX liquidity pool/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Optimize gas usage for batch NFT/i)
    ).toBeInTheDocument();
  });

  it('displays search input', () => {
    render(<HistoryPage />);
    expect(screen.getByPlaceholderText(/Search prompts/i)).toBeInTheDocument();
  });

  it('displays tag filter buttons including All', () => {
    render(<HistoryPage />);
    expect(screen.getByRole('button', { name: /^All$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /DEX/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /NFT/i })).toBeInTheDocument();
  });

  it('filters items by search query', () => {
    render(<HistoryPage />);
    const searchInput = screen.getByPlaceholderText(/Search prompts/i);

    fireEvent.change(searchInput, { target: { value: 'DEX' } });

    expect(
      screen.getByText(/Analyze DEX liquidity pool/i)
    ).toBeInTheDocument();
    // This item should not appear
    expect(
      screen.queryByText(/Optimize gas usage for batch NFT/i)
    ).not.toBeInTheDocument();
  });

  it('filters items by tag', () => {
    render(<HistoryPage />);
    const nftButton = screen.getByRole('button', { name: /^NFT$/i });

    fireEvent.click(nftButton);

    expect(
      screen.getByText(/Optimize gas usage for batch NFT/i)
    ).toBeInTheDocument();
    // Items from other tags should not appear
    expect(
      screen.queryByText(/Analyze DEX liquidity pool/i)
    ).not.toBeInTheDocument();
  });

  it('shows empty state when no results match search', () => {
    render(<HistoryPage />);
    const searchInput = screen.getByPlaceholderText(/Search prompts/i);

    fireEvent.change(searchInput, {
      target: { value: 'zzz-no-match-zzz' },
    });

    expect(screen.getByText(/No results found/i)).toBeInTheDocument();
  });

  it('resets to all items when All filter is clicked', () => {
    render(<HistoryPage />);
    // First apply a tag filter
    const nftButton = screen.getByRole('button', { name: /^NFT$/i });
    fireEvent.click(nftButton);

    // Then click All
    const allButton = screen.getByRole('button', { name: /^All$/i });
    fireEvent.click(allButton);

    // All items should be visible again
    expect(
      screen.getByText(/Generate a smart contract for ERC-20 token/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Optimize gas usage for batch NFT/i)
    ).toBeInTheDocument();
  });
});
