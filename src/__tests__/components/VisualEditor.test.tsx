import { render, screen, fireEvent } from '@testing-library/react';
import VisualEditor from '@/components/editor/VisualEditor';

// VisualEditor uses window.addEventListener for drag — mock it
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

beforeAll(() => {
  // Suppress drag-related event listener warnings in jsdom
  window.addEventListener = jest.fn();
  window.removeEventListener = jest.fn();
});

afterAll(() => {
  window.addEventListener = originalAddEventListener;
  window.removeEventListener = originalRemoveEventListener;
});

describe('VisualEditor', () => {
  it('renders palette buttons', () => {
    render(<VisualEditor />);
    expect(screen.getByText(/\+ State/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Trigger/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Action/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Safety Check/i)).toBeInTheDocument();
  });

  it('shows empty canvas message initially', () => {
    render(<VisualEditor />);
    expect(screen.getByText(/Add blocks from the palette/i)).toBeInTheDocument();
  });

  it('adds a block when palette button is clicked', () => {
    render(<VisualEditor />);
    fireEvent.click(screen.getByText(/\+ State/i));
    // After adding a block the empty canvas message disappears
    expect(screen.queryByText(/Add blocks from the palette/i)).not.toBeInTheDocument();
  });

  it('shows Generate DSL button', () => {
    render(<VisualEditor />);
    expect(screen.getByText(/Generate DSL/i)).toBeInTheDocument();
  });

  it('generates DSL when button is clicked with blocks on canvas', () => {
    render(<VisualEditor />);
    fireEvent.click(screen.getByText(/\+ State/i));
    fireEvent.click(screen.getByText(/Generate DSL/i));
    expect(screen.getByText(/Generated DSL/i)).toBeInTheDocument();
    expect(screen.getByText(/version "1.0"/i)).toBeInTheDocument();
  });
});
