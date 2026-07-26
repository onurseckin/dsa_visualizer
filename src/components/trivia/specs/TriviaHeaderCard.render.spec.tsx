import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TriviaHeaderCard } from '../TriviaHeaderCard';
import { DEFAULT_TRIVIA_CONFIG, createProgress } from '../../../trivia/triviaEngine';

describe('TriviaHeaderCard', () => {
  const config = DEFAULT_TRIVIA_CONFIG;
  const progress = createProgress(config);

  it('renders title, badges, and action buttons', () => {
    const onToggleSetup = vi.fn();
    const onCreateNewSession = vi.fn();
    const onOpenReset = vi.fn();

    render(
      <TriviaHeaderCard
        activeSession={null}
        level={1}
        config={config}
        progress={progress}
        sourcesCount={2}
        coverage={50}
        showSetup={true}
        isDeckEmpty={false}
        onToggleSetup={onToggleSetup}
        onCreateNewSession={onCreateNewSession}
        onOpenReset={onOpenReset}
      />
    );

    expect(screen.getByText('Trivia')).toBeInTheDocument();
    expect(screen.getByText('50% covered')).toBeInTheDocument();

    const startBtn = screen.getByRole('button', { name: 'Start drilling' });
    fireEvent.click(startBtn);
    expect(onToggleSetup).toHaveBeenCalled();

    const newBtn = screen.getByRole('button', { name: 'New session' });
    fireEvent.click(newBtn);
    expect(onCreateNewSession).toHaveBeenCalled();

    const resetBtn = screen.getByRole('button', { name: 'Reset progress' });
    fireEvent.click(resetBtn);
    expect(onOpenReset).toHaveBeenCalled();
  });
});
