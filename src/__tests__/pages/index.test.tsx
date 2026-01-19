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
    expect(screen.getByText(/Decentralized Token Launch/i)).toBeInTheDocument();
  });

  it('displays feature cards', () => {
    render(<Home />);
    expect(screen.getByText(/Auto Token Launch/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantum Oracle/i)).toBeInTheDocument();
    expect(screen.getByText(/Parallel Agents/i)).toBeInTheDocument();
  });

  it('displays CTA buttons', () => {
    render(<Home />);
    expect(screen.getByText(/Launch Token/i)).toBeInTheDocument();
    expect(screen.getByText(/View Dashboard/i)).toBeInTheDocument();
  });

  it('renders Connect Wallet button', () => {
    render(<Home />);
    expect(screen.getByText(/Connect Wallet/i)).toBeInTheDocument();
  });
});
