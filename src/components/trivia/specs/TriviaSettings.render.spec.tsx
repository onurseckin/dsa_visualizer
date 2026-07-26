import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TriviaConfig } from '../../../types/trivia';
import { DEFAULT_TRIVIA_CONFIG, MAX_BLANKS_CEILING } from '../../../trivia/triviaEngine';
import { TriviaSettings } from '../TriviaSettings';

const config = (patch: Partial<TriviaConfig> = {}): TriviaConfig => ({
  ...DEFAULT_TRIVIA_CONFIG,
  ...patch,
});

// Deliberately uneven so min/max in "Deck lines: N–M" are never the same number.
const DECK_LINE_COUNTS = [3, 5, 9];

const slider = (label: RegExp): HTMLInputElement => {
  const input = screen.getByLabelText(label);
  return input as HTMLInputElement;
};

/* TriviaSettings no longer renders its own Card/header — the user asked for
   the session card and drill settings to be united under one section, so the
   deck-lines badge, blanks-count badge, and the neutral-colour/no-raw-hex
   check all moved to TriviaHeaderCard.render.spec.tsx (the component that
   now owns that single merged header). */
describe('TriviaSettings', () => {
  it('emits a mode patch from the segmented control and explains the mode', () => {
    const onChange = vi.fn();
    render(
      <TriviaSettings
        config={config({ mode: 'choice' })}
        onChange={onChange}
        deckLineCounts={DECK_LINE_COUNTS}
      />,
    );

    const choice = screen.getByRole('button', { name: 'Drag tiles' });
    expect(choice).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/drag the matching line into each blank/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Type from memory' }));
    expect(onChange).toHaveBeenCalledWith({ mode: 'type' });
  });

  it('explains the typing mode when it is the active one', () => {
    render(
      <TriviaSettings
        config={config({ mode: 'type' })}
        onChange={vi.fn()}
        deckLineCounts={DECK_LINE_COUNTS}
      />,
    );

    expect(screen.getByRole('button', { name: 'Type from memory' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText(/type each missing line from memory/i)).toBeInTheDocument();
  });

  it('does not re-emit the mode already selected', () => {
    const onChange = vi.fn();
    render(
      <TriviaSettings
        config={config({ mode: 'choice' })}
        onChange={onChange}
        deckLineCounts={DECK_LINE_COUNTS}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Drag tiles' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('emits a minBlanks patch alone while it stays under the ceiling', () => {
    const onChange = vi.fn();
    render(
      <TriviaSettings
        config={config({ minBlanks: 1, maxBlanks: 4 })}
        onChange={onChange}
        deckLineCounts={DECK_LINE_COUNTS}
      />,
    );

    fireEvent.change(slider(/starting blanks/i), { target: { value: '3' } });
    expect(onChange).toHaveBeenCalledWith({ minBlanks: 3 });
  });

  it('never lets the floor rise above the ceiling, and never moves the ceiling to do it', () => {
    const onChange = vi.fn();
    render(
      <TriviaSettings
        config={config({ minBlanks: 1, maxBlanks: 2 })}
        onChange={onChange}
        deckLineCounts={DECK_LINE_COUNTS}
      />,
    );

    const min = slider(/starting blanks/i);
    // The range itself refuses the invalid span, not only the handler.
    expect(min.max).toBe('2');

    fireEvent.change(min, { target: { value: '5' } });
    // Clamped to the ceiling's own value — the ceiling itself is never
    // touched, so the two sliders never move each other.
    expect(onChange).toHaveBeenCalledWith({ minBlanks: 2 });
  });

  it('never lets the ceiling drop below the floor', () => {
    const onChange = vi.fn();
    render(
      <TriviaSettings
        config={config({ minBlanks: 3, maxBlanks: 5 })}
        onChange={onChange}
        deckLineCounts={DECK_LINE_COUNTS}
      />,
    );

    const max = slider(/hardest level/i);
    // The range itself refuses the invalid span, not only the handler.
    expect(max.min).toBe('3');
    expect(max.max).toBe(String(MAX_BLANKS_CEILING));

    fireEvent.change(max, { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith({ maxBlanks: 3 });
  });

  it('keeps both blank counts inside the engine range', () => {
    const onChange = vi.fn();
    render(
      <TriviaSettings
        config={config({ minBlanks: 2, maxBlanks: 4 })}
        onChange={onChange}
        deckLineCounts={DECK_LINE_COUNTS}
      />,
    );

    // Comfortably past the 100-wide range, so the range input's own clamp
    // (not just the handler) is what pins the emitted value to the ceiling.
    fireEvent.change(slider(/hardest level/i), { target: { value: String(MAX_BLANKS_CEILING + 500) } });
    expect(onChange).toHaveBeenLastCalledWith({ maxBlanks: MAX_BLANKS_CEILING });

    fireEvent.change(slider(/starting blanks/i), { target: { value: '0' } });
    expect(onChange).toHaveBeenLastCalledWith({ minBlanks: 1 });
  });

  it('toggles distractors off and back on, reporting state through aria-pressed', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TriviaSettings
        config={config({ includeDistractors: true })}
        onChange={onChange}
        deckLineCounts={DECK_LINE_COUNTS}
      />,
    );

    const on = screen.getByRole('button', { name: /distractors on/i });
    expect(on).toHaveClass('ui-btn--selected');
    fireEvent.click(on);
    expect(onChange).toHaveBeenCalledWith({ includeDistractors: false });

    rerender(
      <TriviaSettings
        config={config({ includeDistractors: false })}
        onChange={onChange}
        deckLineCounts={DECK_LINE_COUNTS}
      />,
    );
    const off = screen.getByRole('button', { name: /distractors off/i });
    expect(off).not.toHaveClass('ui-btn--selected');
    fireEvent.click(off);
    expect(onChange).toHaveBeenLastCalledWith({ includeDistractors: true });
  });

  it('explains every control in one line', () => {
    render(
      <TriviaSettings config={config()} onChange={vi.fn()} deckLineCounts={DECK_LINE_COUNTS} />,
    );

    expect(screen.getByText(/how many lines the first level hides/i)).toBeInTheDocument();
    expect(screen.getByText(/the drill finishes once every line has been drilled/i)).toBeInTheDocument();
    expect(screen.getByText(/adds plausible wrong lines to the tray/i)).toBeInTheDocument();
  });

  it('warns when some deck algorithms have the hardest level or fewer lines, without blocking the slider', () => {
    render(
      <TriviaSettings
        config={config({ minBlanks: 1, maxBlanks: 8 })}
        onChange={vi.fn()}
        deckLineCounts={[3, 8, 20]}
      />,
    );

    // 3 (< 8) and 8 (== 8) both qualify: an algorithm with exactly as many
    // blankable lines as the hardest level still gets every one of them
    // hidden the moment the drill reaches that level — full-blank, not
    // merely "short".
    expect(
      screen.getByText(
        '2 of 3 questions in this deck have 8 lines or fewer and will be shown fully blank at this level.',
      ),
    ).toBeInTheDocument();
    expect(slider(/hardest level/i)).not.toBeDisabled();
  });

  it('warns on the exact boundary: a question with precisely maxBlanks lines is fully blanked too', () => {
    render(
      <TriviaSettings
        config={config({ minBlanks: 1, maxBlanks: 5 })}
        onChange={vi.fn()}
        deckLineCounts={[5, 12]}
      />,
    );

    expect(
      screen.getByText(
        '1 of 2 questions in this deck have 5 lines or fewer and will be shown fully blank at this level.',
      ),
    ).toBeInTheDocument();
  });

  it('omits the short-deck warning once every algorithm strictly exceeds the hardest level', () => {
    render(
      <TriviaSettings
        config={config({ minBlanks: 1, maxBlanks: 3 })}
        onChange={vi.fn()}
        deckLineCounts={[4, 8, 20]}
      />,
    );

    expect(screen.queryByText(/questions in this deck have .* lines or fewer/i)).not.toBeInTheDocument();
  });

  it('omits the short-deck warning when the deck is empty', () => {
    render(
      <TriviaSettings
        config={config({ minBlanks: 1, maxBlanks: 3 })}
        onChange={vi.fn()}
        deckLineCounts={[]}
      />,
    );

    expect(screen.queryByText(/questions in this deck have .* lines or fewer/i)).not.toBeInTheDocument();
  });
});
