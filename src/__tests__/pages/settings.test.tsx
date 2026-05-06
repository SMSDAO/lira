import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPage from '@/pages/settings';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/settings',
    query: {},
    asPath: '/settings',
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

// Provide localStorage mock for jsdom
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
});

describe('Settings Page', () => {
  it('renders without crashing', () => {
    render(<SettingsPage />);
    // The gradient heading "Settings" is the h1
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('displays theme toggle buttons', () => {
    render(<SettingsPage />);
    expect(screen.getByRole('button', { name: /🌙 Dark/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /☀️ Light/i })).toBeInTheDocument();
  });

  it('displays layout density buttons', () => {
    render(<SettingsPage />);
    expect(
      screen.getByRole('button', { name: /📐 Comfortable/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /📏 Compact/i })
    ).toBeInTheDocument();
  });

  it('displays API key input', () => {
    render(<SettingsPage />);
    expect(screen.getByPlaceholderText(/sk-/i)).toBeInTheDocument();
  });

  it('displays API Key section with Local Dev Only badge', () => {
    render(<SettingsPage />);
    // "API Key" heading span is the section label
    const apiKeyItems = screen.getAllByText(/API Key/i);
    expect(apiKeyItems.length).toBeGreaterThan(0);
    expect(screen.getByText(/Local Dev Only/i)).toBeInTheDocument();
  });

  it('displays Save Settings button', () => {
    render(<SettingsPage />);
    expect(screen.getByText(/💾 Save Settings/i)).toBeInTheDocument();
  });

  it('allows switching theme to Light', () => {
    render(<SettingsPage />);
    const lightBtn = screen.getByRole('button', { name: /☀️ Light/i });
    fireEvent.click(lightBtn);
    // After clicking, the button remains visible (no crash)
    expect(lightBtn).toBeInTheDocument();
  });

  it('allows switching density to Compact', () => {
    render(<SettingsPage />);
    const compactBtn = screen.getByRole('button', { name: /📏 Compact/i });
    fireEvent.click(compactBtn);
    expect(compactBtn).toBeInTheDocument();
  });

  it('saves theme and density to localStorage when Save is clicked', () => {
    render(<SettingsPage />);

    // Change to light theme
    fireEvent.click(screen.getByRole('button', { name: /☀️ Light/i }));

    // Enter API key (not persisted)
    const apiInput = screen.getByPlaceholderText(/sk-/i);
    fireEvent.change(apiInput, { target: { value: 'sk-test-key' } });

    // Save
    fireEvent.click(screen.getByText(/💾 Save Settings/i));

    // Theme and density are persisted
    expect(localStorageMock.getItem('lira:settings:theme')).toBe('light');
    // API key is NOT written to storage for security
    expect(localStorageMock.getItem('lira:settings:apiKey')).toBeNull();
  });

  it('shows saved confirmation after clicking save', () => {
    jest.useFakeTimers();
    render(<SettingsPage />);

    fireEvent.click(screen.getByText(/💾 Save Settings/i));

    expect(screen.getByText(/✅ Saved!/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('shows note that API key is not stored', () => {
    render(<SettingsPage />);
    expect(
      screen.getByText(/kept in session state only/i)
    ).toBeInTheDocument();
  });
});
