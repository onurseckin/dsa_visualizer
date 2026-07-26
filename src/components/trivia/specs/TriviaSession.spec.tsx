import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TriviaSession } from '../TriviaSession';
import { TILE_MIME } from '../CodePuzzle';
import { parsePuzzleLines } from '../../../trivia/triviaEngine';
import { readTriviaLayout, TRIVIA_LAYOUT_KEY } from '../../../trivia/triviaLayout';
import type { TriviaMeta, TriviaMode, TriviaRound } from '../../../types/trivia';

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
   engine's shuffling is its own spec's problem, not this component's.
   algorithmId is a real registry id ('two-sum') on purpose — TriviaSession
   now also renders that algorithm's ProblemDescriptionCard above the puzzle
   (TASKS.md 9.7), so this proves the real getAlgorithm lookup wires through,
   not a stub. */
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

const setup = (
  round: TriviaRound,
  mode: TriviaMode = 'choice',
  extra: {
    onEditSettings?: () => void;
    onBackToHome?: () => void;
    onStudyInWorkspace?: (algorithmId?: string) => void;
    hints?: TriviaMeta['hints'];
  } = {},
) => {
  const onSubmit = vi.fn();
  const onNext = vi.fn();
  const view = render(
    <TriviaSession
      round={round}
      algorithmTitle="Two Sum"
      mode={mode}
      level={round.level}
      coverage={43}
      onSubmit={onSubmit}
      onNext={onNext}
      onEditSettings={extra.onEditSettings}
      onBackToHome={extra.onBackToHome}
      onStudyInWorkspace={extra.onStudyInWorkspace}
      hints={extra.hints}
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
const checkButton = (): HTMLElement => screen.getByRole('button', { name: /^Check answers/ });
const nextButton = (): HTMLElement => screen.getByRole('button', { name: /^Next round/ });
const retryButton = (): HTMLElement => screen.getByRole('button', { name: /^Retry/ });
/** The round's own <h2> title — disambiguated from ProblemDescriptionCard's
    own <h1> "Two Sum" above the puzzle, which shares the same accessible
    name. */
const roundHeading = (): HTMLElement => screen.getByRole('heading', { level: 2, name: 'Two Sum' });

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

/** Drag-and-drop: still the way to place a specific tile into a specific
    (possibly non-next) blank after the click redesign (see 5.1/5.2) — a
    plain click now commits straight to the next empty blank instead. */
const place = (text: string, line: number): void => {
  const dataTransfer = makeTransfer();
  fireEvent.dragStart(tile(text), { dataTransfer });
  fireEvent.drop(slot(line), { dataTransfer });
};

/* problemExpanded now lives in triviaLayout.ts (v2, TASKS.md 9.8) rather than
   local-only state, so every render reads real localStorage — isolate tests
   from each other the same way MainLayout.spec.tsx isolates workspaceLayout. */
afterEach(() => {
  window.localStorage.clear();
});

describe('TriviaSession Component Spec', () => {
  it('names the algorithm, states the level and explains the mode', () => {
    setup(choiceRound());

    expect(roundHeading()).toBeInTheDocument();
    expect(screen.getByText('Hiding 2 lines')).toBeInTheDocument();
    expect(screen.getByText(/Drag the matching line into each blank/i)).toBeInTheDocument();
    expect(screen.getByText('Tiles')).toBeInTheDocument();
  });

  it('says "Hiding 1 line" for a single-blank round', () => {
    setup(choiceRound([2]));
    expect(screen.getByText('Hiding 1 line')).toBeInTheDocument();
  });

  it('shows the trailing "Level N · X% covered" line instead of a badge row', () => {
    setup(choiceRound());
    expect(screen.getByText('Level 2 · 43% covered')).toBeInTheDocument();
  });

  it('renders the drilled algorithm\'s problem description above the puzzle, expanded by default', () => {
    setup(choiceRound());

    // ProblemDescriptionCard's own header strip, distinct from the round's h2.
    expect(screen.getByRole('heading', { level: 1, name: 'Two Sum' })).toBeInTheDocument();
    expect(screen.getByTestId('problem-description-details')).toBeInTheDocument();
  });

  it('persists collapsing the problem panel through triviaLayout, restoring it across a reload', () => {
    const { view } = setup(choiceRound());

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.queryByTestId('problem-description-details')).not.toBeInTheDocument();
    expect(readTriviaLayout().problemExpanded).toBe(false);

    // A reload is just another mount reading the same persisted key.
    view.unmount();
    setup(choiceRound());

    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('problem-description-details')).not.toBeInTheDocument();
  });

  it('falls back to the problem panel expanded when the stored trivia layout is malformed', () => {
    window.localStorage.setItem(TRIVIA_LAYOUT_KEY, '{not json');

    setup(choiceRound());

    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('problem-description-details')).toBeInTheDocument();
  });

  it('renders neither "Edit deck & settings" nor "Back to Trivia Home" when no handler is given', () => {
    setup(choiceRound());
    expect(screen.queryByRole('button', { name: 'Edit deck & settings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to Trivia Home' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Exit to setup' })).not.toBeInTheDocument();
    expect(screen.queryByText(/pause/i)).not.toBeInTheDocument();
  });

  it('fires onEditSettings and onBackToHome as two separate, never-shared handlers (TASKS.md 9.1)', () => {
    const onEditSettings = vi.fn();
    const onBackToHome = vi.fn();
    setup(choiceRound(), 'choice', { onEditSettings, onBackToHome });

    fireEvent.click(screen.getByRole('button', { name: 'Edit deck & settings' }));
    expect(onEditSettings).toHaveBeenCalledTimes(1);
    expect(onBackToHome).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Back to Trivia Home' }));
    expect(onBackToHome).toHaveBeenCalledTimes(1);
    expect(onEditSettings).toHaveBeenCalledTimes(1);
  });

  it('never renders a ghost-variant button anywhere on the drill screen (9.5)', () => {
    setup(choiceRound(), 'choice', { onEditSettings: vi.fn(), onBackToHome: vi.fn() });
    place(ANSWER_2, 2);

    screen.getAllByRole('button').forEach((button) => {
      expect(button.className).not.toMatch(/ui-btn--ghost/);
    });
  });

  it('fills the next empty blank directly on a plain tile click — no second click on a slot required', () => {
    setup(choiceRound());

    fireEvent.click(tile(ANSWER_2));

    expect(slot(2)).toHaveTextContent(ANSWER_2);
    expect(slot(2)).toHaveAttribute('data-state', 'filled');
    expect(placedTile(ANSWER_2)).toBeDisabled();
    expect(screen.getByText('3 left')).toBeInTheDocument();
    expect(screen.getByText('1/2 filled')).toBeInTheDocument();
  });

  it('keeps filling forward: the next plain click lands on the next still-empty blank', () => {
    setup(choiceRound());

    fireEvent.click(tile(ANSWER_2));
    expect(slot(2)).toHaveTextContent(ANSWER_2);

    // Line 2 is taken now, so a click on any tile fills line 5 next — the
    // user's own scenario: "if I already filled the first line ... it
    // should directly fill the second line, which is the next line."
    fireEvent.click(tile(ANSWER_5));
    expect(slot(5)).toHaveTextContent(ANSWER_5);
    expect(screen.getByText('2/2 filled')).toBeInTheDocument();
  });

  it('fills the next empty blank on a plain click, while a drag can still target a specific later blank out of order', () => {
    setup(choiceRound());

    fireEvent.click(tile(ANSWER_2));
    expect(slot(2)).toHaveTextContent(ANSWER_2);

    const dataTransfer = makeTransfer();
    fireEvent.dragStart(tile(ANSWER_5), { dataTransfer });
    fireEvent.drop(slot(5), { dataTransfer });

    expect(slot(5)).toHaveTextContent(ANSWER_5);
    expect(screen.getByText('2/2 filled')).toBeInTheDocument();
  });

  it('falls back to select-then-click-a-slot once every blank already has an answer', () => {
    setup(choiceRound());

    place(ANSWER_2, 2);
    place(ANSWER_5, 5);
    expect(screen.getByText('2/2 filled')).toBeInTheDocument();

    // Nowhere automatic left to go, so a plain click on a fresh tile holds
    // it for a manual swap instead of doing nothing.
    fireEvent.click(tile(DECOY));
    expect(tile(DECOY)).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(slot(2));
    expect(slot(2)).toHaveTextContent(DECOY);
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

  it('drops the held tile on Escape after a drag-start selects it', () => {
    setup(choiceRound());
    const dataTransfer = makeTransfer();

    fireEvent.dragStart(tile(ANSWER_2), { dataTransfer });
    expect(tile(ANSWER_2)).toHaveAttribute('aria-pressed', 'true');

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
    expect(screen.getByText(/1 of 2 correct/)).toBeInTheDocument();

    // A graded round replaces Check with Next round — it is not merely
    // disabled in place — and locks the board and the tray.
    expect(screen.queryByRole('button', { name: /^Check answers/ })).not.toBeInTheDocument();
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
    expect(screen.getByText(/2 of 2 correct/)).toBeInTheDocument();
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
    expect(screen.getByText(/1 of 2 correct/)).toBeInTheDocument();
    expect(slot(5)).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/revealed, not credited/i),
    );
  });

  it('advances only once the round has been graded', () => {
    const { onNext } = setup(choiceRound());

    expect(screen.queryByRole('button', { name: /^Next round/ })).not.toBeInTheDocument();
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

  it('places a dragged tile into a specific blank — the still-supported way to fill out of order', () => {
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
    expect(screen.getByText(/2 of 2 correct/)).toBeInTheDocument();
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
    expect(screen.getByText(/1 of 2 correct/)).toBeInTheDocument();

    view.rerender(
      <TriviaSession
        round={choiceRound([3])}
        algorithmTitle="Two Sum"
        mode="choice"
        level={1}
        coverage={43}
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

  it('marks the current shortcut-target blank so ⌘E/⌘I are discoverable directly on the Eye/Hint buttons themselves', () => {
    setup(choiceRound());
    expect(screen.getByTestId('shortcut-target-2')).toBeInTheDocument();
    expect(screen.queryByTestId('shortcut-target-5')).not.toBeInTheDocument();

    place(ANSWER_2, 2);
    // Line 2 is filled now, so line 5 becomes the new current target.
    expect(screen.getByTestId('shortcut-target-5')).toBeInTheDocument();
    expect(screen.queryByTestId('shortcut-target-2')).not.toBeInTheDocument();
  });

  it('reveals the current-target line with the global ⌘E shortcut even when nothing is focused', () => {
    setup(choiceRound());

    fireEvent.keyDown(window, { key: 'e', metaKey: true });

    expect(slot(2)).toHaveTextContent(ANSWER_2);
    expect(slot(2)).toHaveAttribute('aria-label', expect.stringMatching(/revealed/i));
  });

  it('toggles the hint for the current-target line with the global ⌘H shortcut even when nothing is focused', () => {
    setup(choiceRound(), 'choice', {
      hints: [{ line: 2, hint: 'An empty map of value to index.' }],
    });

    fireEvent.keyDown(window, { key: 'h', metaKey: true });
    expect(screen.getByTestId('hint-2')).toHaveTextContent('An empty map of value to index.');

    fireEvent.keyDown(window, { key: 'h', metaKey: true });
    expect(screen.queryByTestId('hint-2')).not.toBeInTheDocument();
  });

  it('clears the board with the global ⌘R shortcut regardless of focus', () => {
    setup(choiceRound());
    place(ANSWER_2, 2);
    expect(slot(2)).toHaveTextContent(ANSWER_2);

    fireEvent.keyDown(window, { key: 'r', metaKey: true });
    expect(slot(2)).toHaveAttribute('data-state', 'empty');
  });

  it('checks the round with the global ⌘Enter shortcut even when nothing is focused, once every blank is filled', () => {
    const { onSubmit } = setup(choiceRound());

    place(ANSWER_2, 2);
    place(ANSWER_5, 5);

    fireEvent.keyDown(window, { key: 'Enter', metaKey: true });
    expect(onSubmit).toHaveBeenCalledWith({ 2: ANSWER_2, 5: ANSWER_5 });
  });

  it('does not check with ⌘Enter while blanks remain empty', () => {
    const { onSubmit } = setup(choiceRound());

    place(ANSWER_2, 2);
    fireEvent.keyDown(window, { key: 'Enter', metaKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('advances with the global ⌘Enter shortcut once graded, even when nothing is focused', () => {
    const { onNext } = setup(choiceRound());

    place(ANSWER_2, 2);
    place(ANSWER_5, 5);
    fireEvent.click(checkButton());

    fireEvent.keyDown(window, { key: 'Enter', metaKey: true });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('shows a visible Retry control with its ⌘R hint, clearing the board without fetching a new round', () => {
    const { onNext } = setup(choiceRound());

    place(ANSWER_2, 2);
    expect(retryButton()).toBeInTheDocument();

    fireEvent.click(retryButton());
    expect(slot(2)).toHaveAttribute('data-state', 'empty');
    expect(onNext).not.toHaveBeenCalled();
  });
});
