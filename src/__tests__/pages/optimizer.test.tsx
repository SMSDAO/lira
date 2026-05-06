import { render, screen, fireEvent, act } from '@testing-library/react';
import OptimizerPage from '@/pages/optimizer';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/optimizer',
    query: {},
    asPath: '/optimizer',
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button {...props}>{children}</button>
    ),
  },
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: { writeText: jest.fn() },
});

describe('Optimizer Page', () => {
  it('renders without crashing', () => {
    render(<OptimizerPage />);
    expect(screen.getByText(/Prompt Optimizer/i)).toBeInTheDocument();
  });

  it('displays the prompt textarea with placeholder', () => {
    render(<OptimizerPage />);
    expect(
      screen.getByPlaceholderText(/Enter your prompt here/i)
    ).toBeInTheDocument();
  });

  it('displays the Optimize button', () => {
    render(<OptimizerPage />);
    expect(screen.getByText(/✨ Optimize/i)).toBeInTheDocument();
  });

  it('shows a prompt label above the textarea', () => {
    render(<OptimizerPage />);
    // The textarea has an associated label "Your Prompt"
    expect(screen.getByRole('textbox', { name: /Your Prompt/i })).toBeInTheDocument();
  });

  it('does not show output panel on initial render', () => {
    render(<OptimizerPage />);
    expect(screen.queryByText(/Optimized Output/i)).not.toBeInTheDocument();
  });

  it('allows typing into the textarea', () => {
    render(<OptimizerPage />);
    const textarea = screen.getByPlaceholderText(/Enter your prompt here/i);
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });
    expect(textarea).toHaveValue('Test prompt');
  });

  it('shows output panel after optimization completes', async () => {
    jest.useFakeTimers();
    render(<OptimizerPage />);

    const textarea = screen.getByPlaceholderText(/Enter your prompt here/i);
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });

    const optimizeBtn = screen.getByText(/✨ Optimize/i);
    fireEvent.click(optimizeBtn);

    // Advance timers past the 1200ms delay
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByText(/Optimized Output/i)).toBeInTheDocument();
    expect(screen.getByText(/📋 Copy/i)).toBeInTheDocument();
    expect(screen.getByText(/🔄 Regenerate/i)).toBeInTheDocument();

    jest.useRealTimers();
  });
});
