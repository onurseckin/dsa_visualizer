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
});
