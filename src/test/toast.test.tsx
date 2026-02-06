import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { ToastProvider, useToast } from '../context/ToastContext';

const TestTrigger = ({ message = 'Test', type = 'success' as const, duration = 3000 }) => {
  const { addToast } = useToast();
  return (
    <button onClick={() => addToast({ message, type, duration })}>
      {`Add ${message}`}
    </button>
  );
};

const renderWithProvider = (ui: React.ReactElement = <TestTrigger />) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe('Toast System', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('should show a toast when triggered and auto-dismiss after duration', () => {
    renderWithProvider();

    fireEvent.click(screen.getByText('Add Test'));
    expect(screen.getByText('Test')).toBeInTheDocument();

    // Advance past the 3s duration + 300ms exit animation
    act(() => { vi.advanceTimersByTime(3000); });
    act(() => { vi.advanceTimersByTime(300); });

    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('should pause timer on mouseEnter and toast should NOT disappear while hovered', () => {
    renderWithProvider();

    fireEvent.click(screen.getByText('Add Test'));
    const toastEl = screen.getByText('Test').closest('.toast')!;

    // Advance 2 seconds out of 3
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByText('Test')).toBeInTheDocument();

    // Hover over the toast
    fireEvent.mouseEnter(toastEl);

    // Advance well past the original duration — toast should still be visible
    act(() => { vi.advanceTimersByTime(10000); });
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should resume timer on mouseLeave and dismiss with correct remaining time', () => {
    renderWithProvider();

    fireEvent.click(screen.getByText('Add Test'));
    const toastEl = screen.getByText('Test').closest('.toast')!;

    // Advance 2 seconds (1 second remaining)
    act(() => { vi.advanceTimersByTime(2000); });

    // Pause
    fireEvent.mouseEnter(toastEl);
    act(() => { vi.advanceTimersByTime(5000); }); // time passes while paused

    // Resume
    fireEvent.mouseLeave(toastEl);

    // After 500ms — less than remaining 1s — toast should still be there
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('Test')).toBeInTheDocument();

    // After the remaining ~500ms + exit animation
    act(() => { vi.advanceTimersByTime(500); });
    act(() => { vi.advanceTimersByTime(300); });

    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('should deduplicate toasts with the same message and type', () => {
    renderWithProvider();

    fireEvent.click(screen.getByText('Add Test'));
    fireEvent.click(screen.getByText('Add Test'));

    const toasts = screen.getAllByText('Test');
    expect(toasts).toHaveLength(1);
  });

  it('should reset timer on deduplication so toast stays longer', () => {
    renderWithProvider();

    fireEvent.click(screen.getByText('Add Test'));

    // Advance 2 seconds
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByText('Test')).toBeInTheDocument();

    // Trigger duplicate — timer should reset to full 3s
    fireEvent.click(screen.getByText('Add Test'));

    // Advance 2 more seconds (4s total, would be gone without reset)
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByText('Test')).toBeInTheDocument();

    // Advance remaining 1s + animation
    act(() => { vi.advanceTimersByTime(1000); });
    act(() => { vi.advanceTimersByTime(300); });

    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('should allow different toasts with different messages', () => {
    renderWithProvider(
      <>
        <TestTrigger message="First" />
        <TestTrigger message="Second" />
      </>
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('should remove toast when close button is clicked', () => {
    renderWithProvider();

    fireEvent.click(screen.getByText('Add Test'));
    expect(screen.getByText('Test')).toBeInTheDocument();

    // Click the close button (the × inside the toast)
    const closeButton = screen.getByText('Test').closest('.toast')!.querySelector('button')!;
    fireEvent.click(closeButton);

    // Wait for exit animation
    act(() => { vi.advanceTimersByTime(300); });

    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });
});
