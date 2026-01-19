import { render, screen, fireEvent } from '@testing-library/react';
import Agents from '@/pages/agents/index';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/agents',
    query: {},
    asPath: '/agents',
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

describe('Agents Page', () => {
  it('renders without crashing', () => {
    render(<Agents />);
    expect(screen.getByText(/AI Agents/i)).toBeInTheDocument();
  });

  it('displays agent list', () => {
    render(<Agents />);
    expect(screen.getByText(/Your Agents/i)).toBeInTheDocument();
  });

  it('displays create agent button', () => {
    render(<Agents />);
    expect(screen.getByText(/Create New Agent/i)).toBeInTheDocument();
  });

  it('shows create agent form when button clicked', () => {
    render(<Agents />);
    const createButton = screen.getByText(/Create New Agent/i);
    
    fireEvent.click(createButton);
    
    expect(screen.getByLabelText(/Agent Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Model Type/i)).toBeInTheDocument();
  });

  it('displays agent execution section', () => {
    render(<Agents />);
    expect(screen.getByText(/Execute Agent/i)).toBeInTheDocument();
  });

  it('displays batch execution option', () => {
    render(<Agents />);
    expect(screen.getByText(/Batch Execute/i)).toBeInTheDocument();
  });

  it('shows agent stats', () => {
    render(<Agents />);
    expect(screen.getByText(/Total Agents/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Executions/i)).toBeInTheDocument();
  });
});
