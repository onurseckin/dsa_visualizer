import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CodePuzzle } from '../CodePuzzle';
import type { CodePuzzleProps } from '../CodePuzzle';
import { gradeRound, parsePuzzleLines } from '../../../trivia/triviaEngine';
import type { TriviaRound } from '../../../types/trivia';
import { N_QUEENS_CODE } from '../../../algorithms/backtracking/nQueens';

const CODE = [
  'def two_sum(nums, target):',
  '    seen = {}',
  '    for i, n in enumerate(nums):',
  '        if target - n in seen:',
  '            return [seen[target - n], i]',
  '        seen[n] = i',
].join('\n');

const LINES = parsePuzzleLines(CODE);

const ANSWER_2 = 'seen = {}';
const ANSWER_5 = 'return [seen[target - n], i]';

const makeRound = (blanks: number[]): TriviaRound => ({
  algorithmId: 'two-sum',
  level: blanks.length,
  lines: LINES,
  blanks,
  tiles: blanks.map((number) => ({
    id: `answer-${number}`,
    text: LINES[number - 1].content,
    correctFor: number,
  })),
});

const handlers = () => ({
  onSlotActivate: vi.fn(),
  onTileDrop: vi.fn(),
  onTypeAnswer: vi.fn(),
  onReveal: vi.fn(),
});

const renderPuzzle = (overrides: Partial<CodePuzzleProps> = {}) => {
  const props: CodePuzzleProps = {
    round: makeRound([2, 5]),
    mode: 'choice',
    filled: {},
    ...handlers(),
    ...overrides,
  };
  const view = render(<CodePuzzle {...props} />);
  return { props, view };
};

const slot = (line: number): HTMLElement =>
  screen.getByRole('button', { name: new RegExp(`^Line ${line} `) });

const explainToggle = (): HTMLElement =>
  screen.getByRole('button', { name: 'Toggle line explanations' });

describe('CodePuzzle Component Spec', () => {
  it('prints the solution with line numbers and turns each blank into a labelled slot', () => {
    renderPuzzle();

    expect(screen.getByTestId('code-row-1')).toHaveTextContent('def two_sum(nums, target):');
    expect(screen.getByTestId('code-row-3')).toHaveTextContent('for i, n in enumerate(nums):');
    expect(screen.getByTestId('code-row-1')).toHaveTextContent('1');

    // Blanked lines are slots, not code.
    expect(screen.queryByTestId('code-row-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('blank-row-2')).toBeInTheDocument();
    expect(slot(2)).toBeInTheDocument();
    expect(slot(5)).toBeInTheDocument();
    expect(screen.getByTestId('code-puzzle-well')).toBeInTheDocument();
  });

  it('renders the indent as a fixed prefix outside the graded slot', () => {
    renderPuzzle();

    expect(screen.getByTestId('indent-2').textContent).toBe('    ');
    expect(screen.getByTestId('indent-5').textContent).toBe('            ');
    // The prefix is scenery: it is not announced and it is not part of the answer.
    expect(screen.getByTestId('indent-5')).toHaveAttribute('aria-hidden', 'true');
    expect(slot(5)).toHaveTextContent('drop a line here');
  });

  it('renders a plain code row\'s indentation through its own span, preserving nested Python indentation levels', () => {
    // Verified line numbers/indents against the source directly: line 2 is
    // 4-space indented, line 7 is 8-space, line 8 is 12-space, line 13 is
    // 16-space — the same fixture the CodeBlockViewer fix was proven against.
    const nQueensLines = parsePuzzleLines(N_QUEENS_CODE);
    const round: TriviaRound = {
      algorithmId: 'n-queens',
      level: 0,
      lines: nQueensLines,
      blanks: [],
      tiles: [],
    };
    renderPuzzle({ round });

    expect(screen.getByTestId('indent-2').textContent).toBe('    ');
    expect(screen.getByTestId('indent-7').textContent).toBe('        ');
    expect(screen.getByTestId('indent-8').textContent).toBe('            ');
    expect(screen.getByTestId('indent-13').textContent).toBe('                ');

    // Strictly increasing indentation depth, distinct at every level — the
    // failure mode this guards against is every level collapsing to zero.
    const lengths = [2, 7, 8, 13].map(
      (n) => screen.getByTestId(`indent-${n}`).textContent?.length ?? 0
    );
    expect(lengths).toEqual([...lengths].sort((a, b) => a - b));
    expect(new Set(lengths).size).toBe(4);

    // The row's own text still reads correctly once indent and content are
    // split apart and rendered as siblings.
    expect(screen.getByTestId('code-row-13')).toHaveTextContent('continue');
    expect(screen.getByTestId('code-row-1')).toHaveTextContent('def solve_n_queens(n: int) -> list[list[str]]:');
  });

  it('draws an empty slot dashed and brightens its edge while a tile is held', () => {
    const { view, props } = renderPuzzle();

    expect(slot(2)).toHaveAttribute('data-state', 'empty');
    expect(slot(2).style.borderStyle).toBe('dashed');
    expect(slot(2).style.borderColor).toBe('var(--border-strong)');
    expect(slot(2)).toHaveAttribute('aria-pressed', 'false');

    view.rerender(<CodePuzzle {...props} hasSelection />);
    expect(slot(2).style.borderColor).toBe('var(--border-accent)');
  });

  it('activates a slot by click, reporting the line it belongs to', () => {
    const { props } = renderPuzzle();

    fireEvent.click(slot(5));
    expect(props.onSlotActivate).toHaveBeenCalledWith(5);
  });

  it('shows a filled slot as pressed, with the placed line as its text', () => {
    renderPuzzle({ filled: { 2: ANSWER_2 } });

    expect(slot(2)).toHaveTextContent(ANSWER_2);
    expect(slot(2)).toHaveAttribute('aria-pressed', 'true');
    expect(slot(2)).toHaveAttribute('data-state', 'filled');
    expect(slot(2).style.borderStyle).toBe('solid');
  });

  it('routes an HTML5 drop landing exactly on the slot through the tile-placement callback', () => {
    const { props } = renderPuzzle();

    fireEvent.drop(slot(2), { dataTransfer: { getData: () => 'answer-2' } });

    expect(props.onTileDrop).toHaveBeenCalledWith(2, 'answer-2');
    expect(props.onSlotActivate).not.toHaveBeenCalled();
  });

  it('falls back to the click path when a drag carries no payload', () => {
    const { props } = renderPuzzle();

    fireEvent.drop(slot(2), { dataTransfer: { getData: () => '' } });

    expect(props.onTileDrop).not.toHaveBeenCalled();
    expect(props.onSlotActivate).toHaveBeenCalledWith(2);
  });

  it('routes a drop landing anywhere on the wider blank row, not just the small slot button', () => {
    const { props } = renderPuzzle();

    // The row is the real drop target now, so a drop on its own padding
    // (outside the tiny slot button entirely) still resolves to that line.
    fireEvent.drop(screen.getByTestId('blank-row-5'), { dataTransfer: { getData: () => 'answer-5' } });

    expect(props.onTileDrop).toHaveBeenCalledWith(5, 'answer-5');
  });

  it('drops on the nearest blank row by vertical distance when the pointer lands outside any row entirely', () => {
    const { props } = renderPuzzle();

    const rowTwo = screen.getByTestId('blank-row-2');
    const rowFive = screen.getByTestId('blank-row-5');
    rowTwo.getBoundingClientRect = () => new DOMRect(0, 0, 400, 20);
    rowFive.getBoundingClientRect = () => new DOMRect(0, 20, 400, 20);

    const well = screen.getByTestId('code-puzzle-well');
    // jsdom has no native DragEvent, so `fireEvent.drop(el, { clientY })`
    // silently drops clientY (it falls back to a plain Event, whose init
    // dict ignores unknown keys) — build the event by hand and stamp
    // clientY on directly, which React's synthetic event still reads off
    // correctly since it's a plain property lookup either way.
    const dropEvent = createEvent.drop(well, { dataTransfer: { getData: () => 'answer-5' } });
    Object.defineProperty(dropEvent, 'clientY', { value: 45, configurable: true });

    // Dropped on the well itself (e.g. a gap/padding area), 5px below row
    // five's own bottom edge and 25px past row two's — nearer to five.
    fireEvent(well, dropEvent);

    expect(props.onTileDrop).toHaveBeenCalledWith(5, 'answer-5');
    expect(props.onSlotActivate).not.toHaveBeenCalled();
  });

  it('marks graded blanks with the success and danger edges and reveals the real line when wrong', () => {
    const round = makeRound([2, 5]);
    const filled = { 2: ANSWER_2, 5: 'return seen' };
    renderPuzzle({ round, filled, grade: gradeRound(round, filled) });

    expect(slot(2)).toHaveAttribute('data-state', 'correct');
    expect(slot(2).style.borderColor).toBe('var(--success)');
    expect(slot(2).style.background).toBe('var(--success-soft)');

    expect(slot(5)).toHaveAttribute('data-state', 'incorrect');
    expect(slot(5).style.borderColor).toBe('var(--danger)');
    expect(screen.getByTestId('expected-5')).toHaveTextContent(ANSWER_5);
    expect(screen.queryByTestId('expected-2')).not.toBeInTheDocument();

    // A graded board is read-only.
    expect(slot(2)).toBeDisabled();
    expect(slot(5)).toBeDisabled();
  });

  it('offers a monospace input per blank in type mode', () => {
    const { props } = renderPuzzle({ round: makeRound([2]), mode: 'type' });

    const field = screen.getByRole('textbox', { name: /^Line 2 / });
    expect(field).toHaveAttribute('placeholder', 'type the line');
    expect(field.parentElement?.getAttribute('style')).toContain('--font-ui: var(--font-code)');

    fireEvent.change(field, { target: { value: '  seen = {}  ' } });
    expect(props.onTypeAnswer).toHaveBeenCalledWith(2, '  seen = {}  ');

    // No tile affordance in type mode.
    expect(screen.queryByText('drop a line here')).not.toBeInTheDocument();
  });

  it('submits on Enter from a focused blank input', () => {
    const onSubmit = vi.fn();
    renderPuzzle({ round: makeRound([2]), mode: 'type', onSubmit });

    fireEvent.keyDown(screen.getByRole('textbox', { name: /^Line 2 / }), { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalled();
  });

  it('Tab and Shift+Tab cycle only through the blank inputs in ascending order, wrapping at both ends', () => {
    renderPuzzle({ round: makeRound([2, 4, 5]), mode: 'type' });

    const first = screen.getByRole('textbox', { name: /^Line 2 / });
    const second = screen.getByRole('textbox', { name: /^Line 4 / });
    const third = screen.getByRole('textbox', { name: /^Line 5 / });

    first.focus();
    fireEvent.keyDown(first, { key: 'Tab' });
    expect(second).toHaveFocus();

    fireEvent.keyDown(second, { key: 'Tab' });
    expect(third).toHaveFocus();

    // Wraps from the last blank back to the first.
    fireEvent.keyDown(third, { key: 'Tab' });
    expect(first).toHaveFocus();

    // Shift+Tab wraps backward from the first to the last.
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(third).toHaveFocus();
  });

  it('reveals a chosen blank and locks the reveal once graded', () => {
    const round = makeRound([2, 5]);
    const { view, props } = renderPuzzle({ round });

    fireEvent.click(screen.getByRole('button', { name: 'Reveal line 5' }));
    expect(props.onReveal).toHaveBeenCalledWith(5);

    view.rerender(
      <CodePuzzle
        {...props}
        revealed={[5]}
        filled={{ 2: ANSWER_2, 5: ANSWER_5 }}
        grade={gradeRound(round, { 2: ANSWER_2, 5: '' })}
      />,
    );

    expect(screen.getByRole('button', { name: 'Reveal line 5' })).toBeDisabled();
    // Revealed reads as a miss, never as a win.
    expect(slot(5)).toHaveAttribute('data-state', 'incorrect');
    expect(slot(5).getAttribute('aria-label')).toContain('revealed');
  });

  it('keeps author hints behind a per-line toggle (self-managed when unwired to a parent)', () => {
    renderPuzzle({ hints: [{ line: 2, hint: 'An empty map of value to index.' }] });

    expect(screen.queryByTestId('hint-2')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hint for line 5' })).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'Hint for line 2' });
    fireEvent.click(toggle);

    expect(screen.getByTestId('hint-2')).toHaveTextContent('An empty map of value to index.');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(toggle);
    expect(screen.queryByTestId('hint-2')).not.toBeInTheDocument();
  });

  it('renders hint-open state as controlled and delegates the toggle upward when openHints/onToggleHint are supplied', () => {
    const onToggleHint = vi.fn();
    renderPuzzle({
      hints: [{ line: 2, hint: 'An empty map.' }],
      openHints: [2],
      onToggleHint,
    });

    // Already open from the controlled prop, not from a click.
    expect(screen.getByTestId('hint-2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hint for line 2' }));
    expect(onToggleHint).toHaveBeenCalledWith(2);
    // Delegated, not handled locally — it stays open because the parent
    // hasn't changed the controlled prop, not because of local state.
    expect(screen.getByTestId('hint-2')).toBeInTheDocument();
  });

  it('marks the current shortcut-target blank with a single Kbd hint, never repeated per row', () => {
    renderPuzzle({ activeShortcutLine: 5 });

    expect(screen.getByTestId('shortcut-target-5')).toBeInTheDocument();
    expect(screen.queryByTestId('shortcut-target-2')).not.toBeInTheDocument();
  });

  it('renders no explain icon on a blank row for a line missing from lineExplanations', () => {
    renderPuzzle({ lineExplanations: { 5: 'Only line 5 is explained.' } });

    expect(screen.queryByRole('button', { name: 'Explain line 2' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explain line 5' })).toBeInTheDocument();
  });

  it('opens a right-side click popover for a blank row explanation, independent of the hint toggle and of the header toggle', () => {
    renderPuzzle({
      hints: [{ line: 2, hint: 'An empty map of value to index.' }],
      lineExplanations: { 2: 'Creates an empty map that remembers values already seen.' },
    });

    // Header hover-toggle defaults off in trivia — confirm it really is off,
    // since the blank-row click affordance must work regardless.
    expect(explainToggle()).not.toHaveAttribute('aria-pressed');

    const explainButton = screen.getByRole('button', { name: 'Explain line 2' });
    const hintToggle = screen.getByRole('button', { name: 'Hint for line 2' });

    fireEvent.click(explainButton);
    const popover = screen.getByTestId('line-explain-popover-2');
    expect(popover).toHaveTextContent('Creates an empty map that remembers values already seen.');
    expect(popover).toHaveAttribute('data-side', 'right');
    // Opening the explanation does not touch the hint's own open state.
    expect(screen.queryByTestId('hint-2')).not.toBeInTheDocument();

    fireEvent.click(hintToggle);
    expect(screen.getByTestId('hint-2')).toHaveTextContent('An empty map of value to index.');
    // Both stay open at once — no shared state between the two affordances.
    expect(screen.getByTestId('line-explain-popover-2')).toBeInTheDocument();

    // Clicking the explain button again closes its own popover.
    fireEvent.click(explainButton);
    expect(screen.queryByTestId('line-explain-popover-2')).not.toBeInTheDocument();
  });

  it('does not show a hover popover on a code row until the header toggle is switched on (trivia defaults off)', () => {
    renderPuzzle({ round: makeRound([5]), lineExplanations: { 1: 'Declares the function signature.' } });

    expect(explainToggle()).not.toHaveAttribute('aria-pressed');
    fireEvent.mouseEnter(screen.getByTestId('code-row-1'));
    expect(screen.queryByTestId('line-explain-popover-1')).not.toBeInTheDocument();
  });

  it('shows a left-side popover when hovering a plain code row once the header toggle is switched on', () => {
    renderPuzzle({ round: makeRound([5]), lineExplanations: { 1: 'Declares the function signature.' } });

    fireEvent.click(explainToggle());
    expect(explainToggle()).toHaveAttribute('aria-pressed', 'true');

    const row = screen.getByTestId('code-row-1');
    fireEvent.mouseEnter(row);
    const popover = screen.getByTestId('line-explain-popover-1');
    expect(popover).toHaveTextContent('Declares the function signature.');
    expect(popover).toHaveAttribute('data-side', 'left');

    fireEvent.mouseLeave(row);
    expect(screen.queryByTestId('line-explain-popover-1')).not.toBeInTheDocument();
  });

  it('does nothing when hovering a code row with no authored explanation, even with the toggle on', () => {
    renderPuzzle({ round: makeRound([5]), lineExplanations: { 3: 'Walks the array.' } });

    fireEvent.click(explainToggle());
    fireEvent.mouseEnter(screen.getByTestId('code-row-1'));
    expect(screen.queryByTestId('line-explain-popover-1')).not.toBeInTheDocument();
  });

  it('shows a left-side hover popover for an explained blank row too, while the header toggle is on', () => {
    renderPuzzle({ round: makeRound([2, 5]), lineExplanations: { 2: 'An empty seen map.' } });

    fireEvent.click(explainToggle());
    const row = screen.getByTestId('blank-row-2');
    fireEvent.mouseEnter(row);

    const popover = screen.getByTestId('line-explain-popover-2');
    expect(popover).toHaveTextContent('An empty seen map.');
    expect(popover).toHaveAttribute('data-side', 'left');
  });
});
