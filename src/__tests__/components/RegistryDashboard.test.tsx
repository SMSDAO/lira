import { render, screen, act } from '@testing-library/react';
import RegistryDashboard from '@/components/registry/RegistryDashboard';

// Suppress act() warning from the interval-based live update
jest.useFakeTimers();

describe('RegistryDashboard', () => {
  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders the dashboard heading', () => {
    render(<RegistryDashboard />);
    expect(screen.getByText(/TradeOS Registry/i)).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<RegistryDashboard />);
    expect(screen.getByText(/Total TVL/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg\. APY/i)).toBeInTheDocument();
    // "Active" appears in multiple places (stat card + status badges + filter)
    expect(screen.getAllByText(/Active/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/High Risk/i)).toBeInTheDocument();
  });

  it('renders seeded contracts in the table', () => {
    render(<RegistryDashboard />);
    expect(screen.getByText(/ETH\/USDC Yield Vault/i)).toBeInTheDocument();
    expect(screen.getByText(/BTC Margin Strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/Stablecoin Ladder/i)).toBeInTheDocument();
  });

  it('renders status filter buttons', () => {
    render(<RegistryDashboard />);
    expect(screen.getByRole('button', { name: /^All$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Active$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Paused$/i })).toBeInTheDocument();
  });

  it('renders the table header columns', () => {
    render(<RegistryDashboard />);
    expect(screen.getByText(/^Contract$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Status$/i)).toBeInTheDocument();
    expect(screen.getByText(/^APY$/i)).toBeInTheDocument();
    expect(screen.getByText(/^TVL$/i)).toBeInTheDocument();
  });

  it('shows live indicator button', () => {
    render(<RegistryDashboard />);
    expect(screen.getByText(/Live/i)).toBeInTheDocument();
  });

  it('ticks live updates without crashing', () => {
    render(<RegistryDashboard />);
    act(() => { jest.advanceTimersByTime(6000); });
    // Still renders the table after live update ticks
    expect(screen.getByText(/ETH\/USDC Yield Vault/i)).toBeInTheDocument();
  });
});
