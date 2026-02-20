import { render, screen } from '@testing-library/react';
import Home from '@/pages/index';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock RainbowKit and Wagmi
jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => <button>Connect Wallet</button>,
}));

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />);
    expect(screen.getByText(/Lira Protocol/i)).toBeInTheDocument();
  });

  it('displays hero section', () => {
    render(<Home />);
    expect(screen.getByText(/Quantum-Powered/i)).toBeInTheDocument();
  });

  it('displays feature cards', () => {
    render(<Home />);
    expect(screen.getByText(/Auto Token Launch/i)).toBeInTheDocument();
    // Use getAllByText since "Quantum Oracle" may appear multiple times
    const quantumTexts = screen.getAllByText(/Quantum Oracle/i);
    expect(quantumTexts.length).toBeGreaterThan(0);
    expect(screen.getByText(/Parallel Agents/i)).toBeInTheDocument();
  });

  it('displays CTA buttons', () => {
    render(<Home />);
    // Use getAllByText since "Launch Token" appears multiple times
    const launchButtons = screen.getAllByText(/Launch.*Token/i);
    expect(launchButtons.length).toBeGreaterThan(0);
    expect(screen.getByText(/Explore Dashboard/i)).toBeInTheDocument();
  });

  it('renders Connect Wallet button', () => {
    render(<Home />);
    expect(screen.getByText(/Connect Wallet/i)).toBeInTheDocument();
  });
});
