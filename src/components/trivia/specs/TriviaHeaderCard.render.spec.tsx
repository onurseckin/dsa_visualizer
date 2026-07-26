import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TriviaHeaderCard } from '../TriviaHeaderCard';
import { DEFAULT_TRIVIA_CONFIG, createProgress } from '../../../trivia/triviaEngine';

/* Only ever mounted while setup is showing (routes/trivia.tsx renders it
   exclusively inside the showSetup branch), so there is no "showSetup" prop
   or alternate drilling-mode label left to cover here. */
describe('TriviaHeaderCard', () => {
  const config = DEFAULT_TRIVIA_CONFIG;
  const progress = createProgress(config);
  const DECK_LINE_COUNTS = [7, 2, 15];

  it('renders title, badges, and the single "Start drilling" action', () => {
    const onStartDrilling = vi.fn();

    render(
      <TriviaHeaderCard
        activeSession={{
          id: 's1',
          name: 'Session 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          progress: { ...progress, roundsPlayed: 1 },
          lastScreen: 'setup',
        }}
        level={1}
        config={config}
        progress={{ ...progress, roundsPlayed: 1 }}
        sourcesCount={2}
        coverage={50}
        isDeckEmpty={false}
        onStartDrilling={onStartDrilling}
        onBackToHome={vi.fn()}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />
    );

    expect(screen.getByText('Now editing session')).toBeInTheDocument();
    expect(screen.getByText('Session 1')).toBeInTheDocument();
    // roundsPlayed: 1 means this session has earned progress, so the badge
    // must say so regardless of the stored `status` field (paused here) —
    // it is what reassures the user that editing settings won't wipe it.
    expect(screen.getByText('Paused · progress saved')).toBeInTheDocument();
    expect(screen.getByText('50% covered')).toBeInTheDocument();

    const startBtn = screen.getByRole('button', { name: 'Start drilling' });
    fireEvent.click(startBtn);
    expect(onStartDrilling).toHaveBeenCalled();

    // Everything else (new session, reset, study in workspace) now lives in
    // the Home screen or TriviaSession's own header, not here.
    expect(screen.queryByRole('button', { name: /new session/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset progress' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Study in workspace' })).not.toBeInTheDocument();
  });

  it('renders the unambiguous "Back to Trivia Home" exit (TASKS.md 9.1) and fires it on click', () => {
    const onBackToHome = vi.fn();

    render(
      <TriviaHeaderCard
        activeSession={{
          id: 's1',
          name: 'Session 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          progress,
          lastScreen: 'setup',
        }}
        level={1}
        config={config}
        progress={progress}
        sourcesCount={2}
        coverage={50}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={onBackToHome}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />
    );

    const homeBtn = screen.getByRole('button', { name: 'Back to Trivia Home' });
    fireEvent.click(homeBtn);
    expect(onBackToHome).toHaveBeenCalledTimes(1);
  });

  it('never renders a ghost-variant button anywhere on the card (9.5)', () => {
    render(
      <TriviaHeaderCard
        activeSession={{
          id: 's1',
          name: 'Session 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          progress,
          lastScreen: 'setup',
        }}
        level={1}
        config={config}
        progress={progress}
        sourcesCount={2}
        coverage={50}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        onRenameSession={vi.fn()}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />
    );

    screen.getAllByRole('button').forEach((button) => {
      expect(button.className).not.toMatch(/ui-btn--ghost/);
    });
  });

  it('disables "Start drilling" while the deck is empty, and labels a never-drilled session "New"', () => {
    render(
      <TriviaHeaderCard
        activeSession={{
          id: 's1',
          name: 'Session 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          progress,
          lastScreen: 'setup',
        }}
        level={1}
        config={config}
        progress={progress}
        sourcesCount={0}
        coverage={0}
        isDeckEmpty
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />
    );

    // This screen is only ever setup, never a running drill, so a session
    // that has never played a round reads as "New", not "Active" — "Active"
    // would misstate what is actually happening on screen.
    expect(screen.getByText('New session')).toBeInTheDocument();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start drilling' })).toBeDisabled();
  });

  it('supports inline session renaming when onRenameSession is provided', () => {
    const onRenameSession = vi.fn();

    render(
      <TriviaHeaderCard
        activeSession={{
          id: 's1',
          name: 'Session 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          progress,
          lastScreen: 'setup',
        }}
        level={1}
        config={config}
        progress={progress}
        sourcesCount={2}
        coverage={50}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        onRenameSession={onRenameSession}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />
    );

    const renameBtn = screen.getByRole('button', { name: 'Rename Session 1' });
    fireEvent.click(renameBtn);

    const input = screen.getByLabelText('Rename active session');
    fireEvent.change(input, { target: { value: 'My Custom Deck' } });

    const saveBtn = screen.getByRole('button', { name: 'Save session name' });
    fireEvent.click(saveBtn);

    expect(onRenameSession).toHaveBeenCalledWith('s1', 'My Custom Deck');
  });

  /* These four moved here from TriviaSettings' own spec: the deck-lines and
     blanks-count badges used to live on TriviaSettings' own Card header, but
     the user asked for the session card and drill settings to be united
     under one section, so TriviaSettings no longer has a Card (or a header)
     of its own — this single merged card's actions row is the only place
     either badge appears now (TASKS.md: "unite that session part and the
     drill settings section together"). */
  it('surfaces the deck line-count range in the actions row', () => {
    render(
      <TriviaHeaderCard
        activeSession={{
          id: 's1',
          name: 'Session 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          progress,
          lastScreen: 'setup',
        }}
        level={1}
        config={config}
        progress={progress}
        sourcesCount={2}
        coverage={50}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={[7, 2, 15]}
        onChangeSettings={vi.fn()}
      />
    );

    expect(screen.getByText('Deck lines: 2–15')).toBeInTheDocument();
  });

  it('falls back to a dash for the deck range when the deck is empty', () => {
    render(
      <TriviaHeaderCard
        activeSession={{
          id: 's1',
          name: 'Session 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          progress,
          lastScreen: 'setup',
        }}
        level={1}
        config={config}
        progress={progress}
        sourcesCount={0}
        coverage={0}
        isDeckEmpty
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={[]}
        onChangeSettings={vi.fn()}
      />
    );

    expect(screen.getByText('Deck lines: —')).toBeInTheDocument();
  });

  it('shows the configured blanks span in the actions row', () => {
    const { rerender } = render(
      <TriviaHeaderCard
        activeSession={{
          id: 's1',
          name: 'Session 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config: { ...config, minBlanks: 2, maxBlanks: 5 },
          progress,
          lastScreen: 'setup',
        }}
        level={2}
        config={{ ...config, minBlanks: 2, maxBlanks: 5 }}
        progress={progress}
        sourcesCount={2}
        coverage={50}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />
    );
    expect(screen.getByText('2–5 blanks')).toBeInTheDocument();

    rerender(
      <TriviaHeaderCard
        activeSession={{
          id: 's1',
          name: 'Session 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config: { ...config, minBlanks: 1, maxBlanks: 1 },
          progress,
          lastScreen: 'setup',
        }}
        level={1}
        config={{ ...config, minBlanks: 1, maxBlanks: 1 }}
        progress={progress}
        sourcesCount={2}
        coverage={50}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />
    );
    expect(screen.getByText('1 blank')).toBeInTheDocument();
  });

  it('keeps the merged card neutral with token colours and no raw hex', () => {
    const { container } = render(
      <TriviaHeaderCard
        activeSession={{
          id: 's1',
          name: 'Session 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          progress,
          lastScreen: 'setup',
        }}
        level={1}
        config={config}
        progress={progress}
        sourcesCount={2}
        coverage={50}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />
    );

    const card = container.querySelector<HTMLElement>('.ui-card');
    expect(card?.style.borderColor).toBe('var(--border-default)');
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
