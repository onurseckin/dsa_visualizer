import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TriviaConfig } from '../../../types/trivia';
import { DEFAULT_TRIVIA_CONFIG, MAX_BLANKS_CEILING } from '../../../trivia/triviaEngine';
import { TriviaSettings } from '../TriviaSettings';

const config = (patch: Partial<TriviaConfig> = {}): TriviaConfig => ({
  ...DEFAULT_TRIVIA_CONFIG,
  ...patch,
});

const slider = (label: RegExp): HTMLInputElement => {
  const input = screen.getByLabelText(label);
  return input as HTMLInputElement;
};

describe('TriviaSettings', () => {
  it('emits a mode patch from the segmented control and explains the mode', () => {
    const onChange = vi.fn();
    render(<TriviaSettings config={config({ mode: 'choice' })} onChange={onChange} />);

    const choice = screen.getByRole('button', { name: 'Drag tiles' });
    expect(choice).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/drag the matching line into each blank/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Type from memory' }));
    expect(onChange).toHaveBeenCalledWith({ mode: 'type' });
  });

  it('explains the typing mode when it is the active one', () => {
    render(<TriviaSettings config={config({ mode: 'type' })} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Type from memory' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText(/type each missing line from memory/i)).toBeInTheDocument();
  });

  it('does not re-emit the mode already selected', () => {
    const onChange = vi.fn();
    render(<TriviaSettings config={config({ mode: 'choice' })} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Drag tiles' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('emits a minBlanks patch alone while it stays under the ceiling', () => {
    const onChange = vi.fn();
    render(<TriviaSettings config={config({ minBlanks: 1, maxBlanks: 4 })} onChange={onChange} />);

    fireEvent.change(slider(/starting blanks/i), { target: { value: '3' } });
    expect(onChange).toHaveBeenCalledWith({ minBlanks: 3 });
  });

  it('pushes the ceiling up when the floor is raised past it', () => {
    const onChange = vi.fn();
    render(<TriviaSettings config={config({ minBlanks: 1, maxBlanks: 2 })} onChange={onChange} />);

    fireEvent.change(slider(/starting blanks/i), { target: { value: '5' } });
    expect(onChange).toHaveBeenCalledWith({ minBlanks: 5, maxBlanks: 5 });
  });

  it('never lets the ceiling drop below the floor', () => {
    const onChange = vi.fn();
    render(<TriviaSettings config={config({ minBlanks: 3, maxBlanks: 5 })} onChange={onChange} />);

    const max = slider(/hardest level/i);
    // The range itself refuses the invalid span, not only the handler.
    expect(max.min).toBe('3');
    expect(max.max).toBe(String(MAX_BLANKS_CEILING));

    fireEvent.change(max, { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith({ maxBlanks: 3 });
  });

  it('keeps both blank counts inside the engine range', () => {
    const onChange = vi.fn();
    render(<TriviaSettings config={config({ minBlanks: 2, maxBlanks: 4 })} onChange={onChange} />);

    fireEvent.change(slider(/hardest level/i), { target: { value: '99' } });
    expect(onChange).toHaveBeenLastCalledWith({ maxBlanks: MAX_BLANKS_CEILING });

    fireEvent.change(slider(/starting blanks/i), { target: { value: '0' } });
    expect(onChange).toHaveBeenLastCalledWith({ minBlanks: 1 });
  });

  it('shows the configured span in the header', () => {
    const { rerender } = render(
      <TriviaSettings config={config({ minBlanks: 2, maxBlanks: 5 })} onChange={vi.fn()} />,
    );
    expect(screen.getByText('2–5 blanks')).toBeInTheDocument();

    rerender(<TriviaSettings config={config({ minBlanks: 1, maxBlanks: 1 })} onChange={vi.fn()} />);
    expect(screen.getByText('1 blank')).toBeInTheDocument();
  });

  it('toggles distractors off and back on, reporting state through aria-pressed', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TriviaSettings config={config({ includeDistractors: true })} onChange={onChange} />,
    );

    const on = screen.getByRole('button', { name: /distractors on/i });
    expect(on).toHaveClass('ui-btn--selected');
    fireEvent.click(on);
    expect(onChange).toHaveBeenCalledWith({ includeDistractors: false });

    rerender(<TriviaSettings config={config({ includeDistractors: false })} onChange={onChange} />);
    const off = screen.getByRole('button', { name: /distractors off/i });
    expect(off).not.toHaveClass('ui-btn--selected');
    fireEvent.click(off);
    expect(onChange).toHaveBeenLastCalledWith({ includeDistractors: true });
  });

  it('explains every control in one line', () => {
    render(<TriviaSettings config={config()} onChange={vi.fn()} />);

    expect(screen.getByText(/how many lines the first level hides/i)).toBeInTheDocument();
    expect(screen.getByText(/the drill finishes once every line has been drilled/i)).toBeInTheDocument();
    expect(screen.getByText(/adds plausible wrong lines to the tray/i)).toBeInTheDocument();
  });

  it('keeps the panel neutral with token colours and no raw hex', () => {
    const { container } = render(<TriviaSettings config={config()} onChange={vi.fn()} />);

    const card = container.querySelector<HTMLElement>('.ui-card');
    expect(card?.style.borderColor).toBe('var(--border-default)');
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
