import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TriviaSessionsManager } from '../TriviaSessionsManager';
import type { TriviaSessionRecord } from '../../../types/trivia';
import { DEFAULT_TRIVIA_CONFIG, createProgress } from '../../../trivia/triviaEngine';

describe('TriviaSessionsManager', () => {
  const dummySession: TriviaSessionRecord = {
    id: 'session_1',
    name: 'Trivia 1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: DEFAULT_TRIVIA_CONFIG,
    progress: createProgress(DEFAULT_TRIVIA_CONFIG),
    status: 'active',
  };

  it('renders saved session items and triggers resume and delete', () => {
    const onSelectSession = vi.fn();
    const onRenameSession = vi.fn();
    const onDeleteSession = vi.fn();

    render(
      <TriviaSessionsManager
        sessions={[dummySession]}
        activeId={null}
        onSelectSession={onSelectSession}
        onRenameSession={onRenameSession}
        onDeleteSession={onDeleteSession}
      />
    );

    expect(screen.getByText('Saved Trivia Sessions')).toBeInTheDocument();
    expect(screen.getByText('Trivia 1')).toBeInTheDocument();

    const resumeBtn = screen.getByRole('button', { name: 'Resume' });
    fireEvent.click(resumeBtn);
    expect(onSelectSession).toHaveBeenCalledWith(dummySession);

    const deleteBtn = screen.getByRole('button', { name: 'Delete Trivia 1' });
    fireEvent.click(deleteBtn);
    expect(onDeleteSession).toHaveBeenCalledWith('session_1');
  });
});
