import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TriviaSession } from '../TriviaSession';
import { TILE_MIME } from '../CodePuzzle';
import { parsePuzzleLines } from '../../../trivia/triviaEngine';
import type { TriviaMode, TriviaRound } from '../../../types/trivia';

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
const DECOY = 'seen[n] = i';

/* Hand-built rather than picked, so the tray contents and ids are fixed: the
   engine's shuffling is its own spec's problem, not this component's. */
const choiceRound = (blanks: number[] = [2, 5]): TriviaRound => ({
  algorithmId: 'two-sum',
  level: blanks.length,
  lines: LINES,
  blanks,
  tiles: [
    { id: 'answer-2', text: ANSWER_2, correctFor: 2 },
    { id: 'decoy-0', text: DECOY, correctFor: null },
    { id: 'answer-5', text: ANSWER_5, correctFor: 5 },
    { id: 'decoy-1', text: 'return seen', correctFor: null },
  ],
});

const typeRound = (blanks: number[] = [2, 5]): TriviaRound => ({
  algorithmId: 'two-sum',
  level: blanks.length,
  lines: LINES,
  blanks,
  tiles: [],
});

const setup = (round: TriviaRound, mode: TriviaMode = 'choice') => {
  const onSubmit = vi.fn();
  const onNext = vi.fn();
  const view = render(
    <TriviaSession
      round={round}
      algorithmTitle="Two Sum"
      mode={mode}
      onSubmit={onSubmit}
      onNext={onNext}
    />,
  );
  return { onSubmit, onNext, view };
};

const slot = (line: number): HTMLElement =>
  screen.getByRole('button', { name: new RegExp(`^Line ${line} `) });
const tile = (text: string): HTMLElement => screen.getByRole('button', { name: `Tile ${text}` });
const placedTile = (text: string): HTMLElement =>
  screen.getByRole('button', { name: `Tile ${text} (placed)` });
const field = (line: number): HTMLElement =>
  screen.getByRole('textbox', { name: new RegExp(`^Line ${line} `) });
const checkButton = (): HTMLElement => screen.getByRole('button', { name: 'Check answers' });
const nextButton = (): HTMLElement => screen.getByRole('button', { name: 'Next round' });

/** Click-and-place: the keyboard/mouse route that must work without real DnD. */
const place = (text: string, line: number): void => {
  fireEvent.click(tile(text));
  fireEvent.click(slot(line));
};

/** A dataTransfer stub that actually carries its payload between the two events. */
const makeTransfer = () => {
  const payload = new Map<string, string>();
  return {
    payload,
    setData: (format: string, value: string) => payload.set(format, value),
    getData: (format: string) => payload.get(format) ?? '',
    effectAllowed: 'none',
  };
};

describe('TriviaSession Component Spec', () => {
  it('names the algorithm, states the level and explains the mode', () => {
    setup(choiceRound());

    expect(screen.getByRole('heading', { name: 'Two Sum' })).toBeInTheDocument();
    expect(screen.getByText('Hiding 2 lines')).toBeInTheDocument();
    expect(screen.getByText(/Drag the matching line into each blank/i)).toBeInTheDocument();
    expect(screen.getByText('Tiles')).toBeInTheDocument();
  });

  it('says "Hiding 1 line" for a single-blank round', () => {
    setup(choiceRound([2]));
    expect(screen.getByText('Hiding 1 line')).toBeInTheDocument();
  });

  it('places a tile by click and consumes it from the tray', () => {
    setup(choiceRound());

    fireEvent.click(tile(ANSWER_2));
    expect(tile(ANSWER_2)).toHaveAttribute('aria-pressed', 'true');
    // An empty slot advertises itself while a tile is held.
    expect(slot(2).style.borderColor).toBe('var(--border-accent)');

    fireEvent.click(slot(2));

    expect(slot(2)).toHaveTextContent(ANSWER_2);
    expect(slot(2)).toHaveAttribute('data-state', 'filled');
    expect(placedTile(ANSWER_2)).toBeDisabled();
    expect(screen.getByText('3 left')).toBeInTheDocument();
    expect(screen.getByText('1/2 filled')).toBeInTheDocument();
  });

  it('returns the tile to the tray when a filled slot is activated again', () => {
    setup(choiceRound());

    place(ANSWER_2, 2);
    fireEvent.click(slot(2));

    expect(slot(2)).toHaveTextContent('drop a line here');
    expect(slot(2)).toHaveAttribute('data-state', 'empty');
    expect(tile(ANSWER_2)).toBeEnabled();
    expect(screen.getByText('4 left')).toBeInTheDocument();
  });

  it('sends the displaced tile back to the tray when a slot is reused', () => {
    setup(choiceRound());

    place(ANSWER_2, 2);
    place(DECOY, 2);

    expect(slot(2)).toHaveTextContent(DECOY);
    expect(tile(ANSWER_2)).toBeEnabled();
    expect(placedTile(DECOY)).toBeDisabled();
  });

  it('drops the held tile on Escape', () => {
    setup(choiceRound());

    fireEvent.click(tile(ANSWER_2));
    fireEvent.keyDown(tile(ANSWER_2), { key: 'Escape' });

    expect(tile(ANSWER_2)).toHaveAttribute('aria-pressed', 'false');
    expect(slot(2).style.borderColor).toBe('var(--border-strong)');
  });

  it('will not check a 2-blank round until both blanks are filled', () => {
    const { onSubmit } = setup(choiceRound());

    expect(checkButton()).toBeDisabled();

    place(ANSWER_2, 2);
    expect(checkButton()).toBeDisabled();

    place(ANSWER_5, 5);
    expect(checkButton()).toBeEnabled();

    fireEvent.click(checkButton());
    expect(onSubmit).toHaveBeenCalledWith({ 2: ANSWER_2, 5: ANSWER_5 });
  });

  it('grades correct blanks green and wrong blanks red, with a summary', () => {
    const { onSubmit } = setup(choiceRound());

    place(ANSWER_2, 2);
    place(DECOY, 5);
    fireEvent.click(checkButton());

    expect(onSubmit).toHaveBeenCalledWith({ 2: ANSWER_2, 5: DECOY });
    expect(slot(2).style.borderColor).toBe('var(--success)');
    expect(slot(5).style.borderColor).toBe('var(--danger)');
    expect(screen.getByTestId('expected-5')).toHaveTextContent(ANSWER_5);
    expect(screen.getByText('1 of 2 correct')).toBeInTheDocument();

    // A graded round locks the board and the tray.
    expect(checkButton()).toBeDisabled();
    expect(slot(2)).toBeDisabled();
    expect(placedTile(DECOY)).toBeDisabled();
    expect(tile('return seen')).toBeDisabled();
  });

  it('reports an all-correct round as such', () => {
    setup(choiceRound());

    place(ANSWER_2, 2);
    place(ANSWER_5, 5);
    fireEvent.click(checkButton());

    expect(screen.getByRole('status')).toHaveTextContent('2 of 2 correct');
  });

  it('grades typed answers with surrounding whitespace ignored', () => {
    const { onSubmit } = setup(typeRound(), 'type');

    expect(screen.queryByText('Tiles')).not.toBeInTheDocument();

    fireEvent.change(field(2), { target: { value: `  ${ANSWER_2}  ` } });
    fireEvent.change(field(5), { target: { value: `\t${ANSWER_5}` } });
    fireEvent.click(checkButton());

    expect(onSubmit).toHaveBeenCalledWith({ 2: `  ${ANSWER_2}  `, 5: `\t${ANSWER_5}` });
    expect(screen.getByText('2 of 2 correct')).toBeInTheDocument();
    expect(slot(2).style.borderColor).toBe('var(--success)');
    expect(slot(5).style.borderColor).toBe('var(--success)');
  });

  it('fills a revealed blank with the truth but never credits it', () => {
    const { onSubmit } = setup(choiceRound());

    place(ANSWER_2, 2);
    fireEvent.click(screen.getByRole('button', { name: 'Reveal line 5' }));

    expect(slot(5)).toHaveTextContent(ANSWER_5);
    expect(checkButton()).toBeEnabled();

    fireEvent.click(checkButton());

    expect(onSubmit).toHaveBeenCalledWith({ 2: ANSWER_2, 5: '' });
    expect(slot(5)).toHaveAttribute('data-state', 'incorrect');
    expect(screen.getByText('1 of 2 correct')).toBeInTheDocument();
    expect(screen.getByText(/revealed lines never count/i)).toBeInTheDocument();
  });

  it('advances only once the round has been graded', () => {
    const { onNext } = setup(choiceRound());

    expect(nextButton()).toBeDisabled();
    fireEvent.click(nextButton());
    expect(onNext).not.toHaveBeenCalled();

    place(ANSWER_2, 2);
    place(ANSWER_5, 5);
    fireEvent.click(checkButton());

    expect(nextButton()).toBeEnabled();
    // Emphasised once it is the obvious next move.
    expect(nextButton()).toHaveClass('ui-btn--primary');

    fireEvent.click(nextButton());
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('places a dragged tile through the same path as a clicked one', () => {
    const { onSubmit } = setup(choiceRound());
    const dataTransfer = makeTransfer();

    fireEvent.dragStart(tile(ANSWER_2), { dataTransfer });
    fireEvent.dragOver(slot(2), { dataTransfer });
    fireEvent.drop(slot(2), { dataTransfer });
    fireEvent.dragEnd(placedTile(ANSWER_2));

    expect(dataTransfer.payload.get(TILE_MIME)).toBe('answer-2');
    expect(slot(2)).toHaveTextContent(ANSWER_2);
    expect(placedTile(ANSWER_2)).toBeDisabled();

    fireEvent.dragStart(tile(ANSWER_5), { dataTransfer });
    fireEvent.drop(slot(5), { dataTransfer });
    fireEvent.click(checkButton());

    expect(onSubmit).toHaveBeenCalledWith({ 2: ANSWER_2, 5: ANSWER_5 });
    expect(screen.getByText('2 of 2 correct')).toBeInTheDocument();
  });

  it('never lets one tile occupy two slots', () => {
    setup(choiceRound());
    const dataTransfer = makeTransfer();

    fireEvent.dragStart(tile(ANSWER_2), { dataTransfer });
    fireEvent.drop(slot(2), { dataTransfer });
    /* The platform can re-deliver a payload (a stale drag image, a repeated drop):
       the tile moves rather than being cloned into both slots. */
    fireEvent.drop(slot(5), { dataTransfer });

    expect(slot(2)).toHaveAttribute('data-state', 'empty');
    expect(slot(5)).toHaveTextContent(ANSWER_2);
    expect(screen.getByText('1/2 filled')).toBeInTheDocument();
  });

  it('ignores a drop that carries an id from outside the round', () => {
    setup(choiceRound());

    fireEvent.drop(slot(2), { dataTransfer: { getData: () => 'answer-99' } });

    expect(slot(2)).toHaveAttribute('data-state', 'empty');
  });

  it('resets the board when the next round arrives', () => {
    const { view, onSubmit, onNext } = setup(choiceRound());

    place(ANSWER_2, 2);
    fireEvent.click(screen.getByRole('button', { name: 'Reveal line 5' }));
    fireEvent.click(checkButton());
    expect(screen.getByText('1 of 2 correct')).toBeInTheDocument();

    view.rerender(
      <TriviaSession
        round={choiceRound([3])}
        algorithmTitle="Two Sum"
        mode="choice"
        onSubmit={onSubmit}
        onNext={onNext}
      />,
    );

    expect(screen.getByText('Hiding 1 line')).toBeInTheDocument();
    expect(slot(3)).toHaveAttribute('data-state', 'empty');
    expect(checkButton()).toBeDisabled();
    expect(screen.queryByText(/correct$/)).not.toBeInTheDocument();
    expect(screen.getByText('4 left')).toBeInTheDocument();
  });
});
