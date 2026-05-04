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

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />);
    expect(screen.getByText(/LIRA Protocol/i)).toBeInTheDocument();
  });

  it('displays welcome header', () => {
    render(<Home />);
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  it('displays quick optimize section', () => {
    render(<Home />);
    expect(screen.getByText(/Quick Optimize/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter a prompt to optimize/i)).toBeInTheDocument();
  });

  it('renders link to optimizer', () => {
    render(<Home />);
    expect(screen.getByText(/Go to Optimizer/i)).toBeInTheDocument();
  });

  it('displays recent prompts section', () => {
    render(<Home />);
    expect(screen.getByText(/Recent Prompts/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate a smart contract/i)).toBeInTheDocument();
  });

  it('displays platform feature grid', () => {
    render(<Home />);
    expect(screen.getByText(/Platform/i)).toBeInTheDocument();
    expect(screen.getByText(/Token Launch/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Agents/i)).toBeInTheDocument();
  });

  it('renders Connect Wallet button', () => {
    render(<Home />);
    expect(screen.getByText(/Connect Wallet/i)).toBeInTheDocument();
  });
});
