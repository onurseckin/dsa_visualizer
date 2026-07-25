import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProblemHeader, ProblemHeaderProps } from '../ProblemHeader';
import { TopicGuide } from '../../../types/dsa';

const topicGuide: TopicGuide = {
  overview: 'Hashing trades memory for speed by remembering what you have already seen.',
  sections: [
    { heading: 'The core idea', body: 'You keep a map from value to index as you scan.' },
    { heading: 'Why it is correct', body: 'Every earlier element is already in the map.' },
    { heading: 'When to reach for it', body: 'Use it when order does not matter.' },
    { heading: 'Common pitfalls', body: 'Do not insert before you look up, or you match yourself.' },
  ],
  keyTerms: [
    { term: 'hash map', definition: 'A structure giving average constant-time lookup by key.' },
    { term: 'complement', definition: 'The value that pairs with the current one to hit the target.' },
  ],
};

const baseProps: ProblemHeaderProps = {
  title: 'Two Sum',
  category: 'arrays_and_hashing',
  difficulty: 'Easy',
  description: 'Return the indices of the two numbers that add up to the target.',
  constraints: ['2 <= nums.length <= 10^4'],
  examples: [{ input: 'nums = [2,7,11,15]', output: '[0,1]', explanation: 'Because 2 + 7 == 9.' }],
  topicGuide,
  expanded: false,
  onToggleExpanded: () => undefined,
};

const renderHeader = (overrides: Partial<ProblemHeaderProps> = {}) =>
  render(<ProblemHeader {...baseProps} {...overrides} />);

describe('ProblemHeader', () => {
  it('shows the title and badges but hides the lesson when collapsed', () => {
    renderHeader();

    expect(screen.getByRole('heading', { level: 1, name: 'Two Sum' })).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Arrays and hashing')).toBeInTheDocument();

    expect(screen.queryByText(topicGuide.overview)).toBeNull();
    expect(screen.queryByText('The core idea')).toBeNull();
    expect(screen.queryByText(baseProps.description)).toBeNull();
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('renders the overview, every section, the problem statement, constraints and examples when expanded', () => {
    renderHeader({ expanded: true });

    expect(screen.getByText(topicGuide.overview)).toBeInTheDocument();

    expect(screen.getByText('Problem')).toBeInTheDocument();
    expect(screen.getByText(baseProps.description)).toBeInTheDocument();

    for (const section of topicGuide.sections) {
      expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument();
      expect(screen.getByText(section.body)).toBeInTheDocument();
    }

    expect(screen.getByText('Constraints')).toBeInTheDocument();
    expect(screen.getByText('2 <= nums.length <= 10^4')).toBeInTheDocument();

    expect(screen.getByText('Examples')).toBeInTheDocument();
    expect(screen.getByText('nums = [2,7,11,15]')).toBeInTheDocument();
    expect(screen.getByText('[0,1]')).toBeInTheDocument();
    expect(screen.getByText('Because 2 + 7 == 9.')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('renders key terms as a real definition list', () => {
    const { container } = renderHeader({ expanded: true });

    const list = container.querySelector('dl');
    expect(list).not.toBeNull();
    expect(screen.getByText('Key terms')).toBeInTheDocument();

    const terms = container.querySelectorAll('dt');
    const definitions = container.querySelectorAll('dd');
    expect(terms).toHaveLength(2);
    expect(definitions).toHaveLength(2);
    expect(terms[0]).toHaveTextContent('hash map');
    expect(definitions[0]).toHaveTextContent(
      'A structure giving average constant-time lookup by key.',
    );
    expect(terms[1]).toHaveTextContent('complement');
  });

  it('omits the key-terms block when the guide has none', () => {
    const { container } = renderHeader({
      expanded: true,
      topicGuide: { overview: topicGuide.overview, sections: topicGuide.sections },
    });

    expect(container.querySelector('dl')).toBeNull();
    expect(screen.queryByText('Key terms')).toBeNull();
  });

  it('calls onToggleExpanded when the Details button is pressed', () => {
    const onToggleExpanded = vi.fn();
    renderHeader({ onToggleExpanded });

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));

    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
  });

  it('shows the reset-layout button only when a handler is supplied', () => {
    const onResetLayout = vi.fn();
    const { unmount } = renderHeader();
    expect(screen.queryByRole('button', { name: /reset layout/i })).toBeNull();
    unmount();

    renderHeader({ onResetLayout });
    fireEvent.click(screen.getByRole('button', { name: /reset layout/i }));
    expect(onResetLayout).toHaveBeenCalledTimes(1);
  });

  it('omits constraints and examples blocks when they are empty', () => {
    renderHeader({ expanded: true, constraints: [], examples: [] });

    expect(screen.queryByText('Constraints')).toBeNull();
    expect(screen.queryByText('Examples')).toBeNull();
  });
});
