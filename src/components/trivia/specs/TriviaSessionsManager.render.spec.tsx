import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TriviaSessionsManager } from '../TriviaSessionsManager';
import type { TriviaSessionRecord } from '../../../types/trivia';
import { DEFAULT_TRIVIA_CONFIG, createProgress } from '../../../trivia/triviaEngine';

describe('TriviaSessionsManager', () => {
  const dummySession: TriviaSessionRecord = {
    id: 'session_1',
    name: 'Session 1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: DEFAULT_TRIVIA_CONFIG,
    progress: createProgress(DEFAULT_TRIVIA_CONFIG),
    status: 'active',
  };

  const otherSession: TriviaSessionRecord = {
    ...dummySession,
    id: 'session_2',
    name: 'Session 2',
  };

  it('renders as a closed popover by default and opens on demand', () => {
    const { rerender } = render(
      <TriviaSessionsManager
        isOpen={false}
        onClose={vi.fn()}
        sessions={[dummySession]}
        activeId={dummySession.id}
        onSelectSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
        onCreateNewSession={vi.fn()}
        onOpenReset={vi.fn()}
        canReset={false}
      />
    );

    expect(screen.queryByRole('dialog', { name: 'Sessions' })).not.toBeInTheDocument();

    rerender(
      <TriviaSessionsManager
        isOpen
        onClose={vi.fn()}
        sessions={[dummySession]}
        activeId={dummySession.id}
        onSelectSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
        onCreateNewSession={vi.fn()}
        onOpenReset={vi.fn()}
        canReset={false}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Sessions' })).toBeInTheDocument();
    expect(screen.getByText('Session 1')).toBeInTheDocument();
  });

  it('resumes and renames a non-active session, and creates a new one via the icon-only row', () => {
    const onSelectSession = vi.fn();
    const onRenameSession = vi.fn();
    const onCreateNewSession = vi.fn();

    render(
      <TriviaSessionsManager
        isOpen
        onClose={vi.fn()}
        sessions={[dummySession, otherSession]}
        activeId={dummySession.id}
        onSelectSession={onSelectSession}
        onRenameSession={onRenameSession}
        onDeleteSession={vi.fn()}
        onCreateNewSession={onCreateNewSession}
        onOpenReset={vi.fn()}
        canReset={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(onSelectSession).toHaveBeenCalledWith(otherSession);

    fireEvent.click(screen.getByRole('button', { name: 'Rename Session 2' }));
    const input = screen.getByDisplayValue('Session 2');
    fireEvent.change(input, { target: { value: 'Renamed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save session name' }));
    expect(onRenameSession).toHaveBeenCalledWith('session_2', 'Renamed');

    // A single plus glyph, icon only — no "+ New session" text duplicate.
    const newSessionBtn = screen.getByRole('button', { name: 'New session' });
    expect(newSessionBtn.textContent).toBe('');
    fireEvent.click(newSessionBtn);
    expect(onCreateNewSession).toHaveBeenCalled();
  });

  it('disables deleting the last remaining session but allows it once there are two', () => {
    const onDeleteSession = vi.fn();
    const { rerender } = render(
      <TriviaSessionsManager
        isOpen
        onClose={vi.fn()}
        sessions={[dummySession]}
        activeId={dummySession.id}
        onSelectSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={onDeleteSession}
        onCreateNewSession={vi.fn()}
        onOpenReset={vi.fn()}
        canReset={false}
      />
    );

    expect(screen.getByRole('button', { name: 'Delete Session 1' })).toBeDisabled();

    rerender(
      <TriviaSessionsManager
        isOpen
        onClose={vi.fn()}
        sessions={[dummySession, otherSession]}
        activeId={dummySession.id}
        onSelectSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={onDeleteSession}
        onCreateNewSession={vi.fn()}
        onOpenReset={vi.fn()}
        canReset={false}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: 'Delete Session 2' });
    expect(deleteBtn).toBeEnabled();
    fireEvent.click(deleteBtn);
    expect(onDeleteSession).toHaveBeenCalledWith('session_2');
  });

  it('shows "Reset progress" in the footer only when there is something to reset', () => {
    const onOpenReset = vi.fn();
    const { rerender } = render(
      <TriviaSessionsManager
        isOpen
        onClose={vi.fn()}
        sessions={[dummySession]}
        activeId={dummySession.id}
        onSelectSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
        onCreateNewSession={vi.fn()}
        onOpenReset={onOpenReset}
        canReset={false}
      />
    );

    expect(screen.queryByRole('button', { name: 'Reset progress' })).not.toBeInTheDocument();

    rerender(
      <TriviaSessionsManager
        isOpen
        onClose={vi.fn()}
        sessions={[dummySession]}
        activeId={dummySession.id}
        onSelectSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
        onCreateNewSession={vi.fn()}
        onOpenReset={onOpenReset}
        canReset
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }));
    expect(onOpenReset).toHaveBeenCalled();
  });
});
