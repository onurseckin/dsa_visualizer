import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CodePuzzle } from '../CodePuzzle';
import type { CodePuzzleProps } from '../CodePuzzle';
import { gradeRound, parsePuzzleLines } from '../../../trivia/triviaEngine';
import type { TriviaRound } from '../../../types/trivia';

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

  it('routes an HTML5 drop through the tile-placement callback', () => {
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

  it('keeps author hints behind a per-line toggle', () => {
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
});
