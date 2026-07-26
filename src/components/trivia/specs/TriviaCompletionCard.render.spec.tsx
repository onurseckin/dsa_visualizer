import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TriviaCompletionCard } from '../TriviaCompletionCard';

describe('TriviaCompletionCard', () => {
  it('renders correctly with singular algorithm and blank', () => {
    render(<TriviaCompletionCard sourcesCount={1} maxBlanks={1} />);
    expect(screen.getByText('Deck complete')).toBeInTheDocument();
    expect(screen.getByText('Curriculum covered')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Every line of all 1 algorithm has been drilled at up to 1 blank. Raise the hardest level to keep going, add more algorithms, or reset progress to start the deck over.'
      )
    ).toBeInTheDocument();
  });

  it('renders correctly with plural algorithms and blanks', () => {
    render(<TriviaCompletionCard sourcesCount={5} maxBlanks={3} />);
    expect(
      screen.getByText(
        'Every line of all 5 algorithms has been drilled at up to 3 blanks. Raise the hardest level to keep going, add more algorithms, or reset progress to start the deck over.'
      )
    ).toBeInTheDocument();
  });
});
