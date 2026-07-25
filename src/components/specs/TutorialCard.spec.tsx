import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TutorialCard } from '../primitives/TutorialCard';
import type { StepExplanation } from '../../types/dsa';

describe('TutorialCard Component Spec', () => {
  const sampleExplanation: StepExplanation & {
    intuition?: string;
    invariant?: string;
    rationale?: string;
  } = {
    what: 'Comparing element at index 0 (val 5) with pivot (val 3)',
    why: 'Partitioning step requires smaller elements on the left side.',
    intuition: 'Divide and conquer strategy relies on placing pivot in its final position.',
    invariant: 'Elements left of index i are strictly <= pivot.',
    rationale: '5 is > 3, so pivot pointer moves forward without swap.',
  };

  it('renders pedagogical insights (Intuition, Invariant, Rationale, Action) in default state', () => {
    render(
      <TutorialCard
        explanation={sampleExplanation}
        stepIndex={2}
        totalSteps={10}
        codeLine={14}
      />
    );

    expect(screen.getByText(/Step Tutorial Guide/i)).toBeInTheDocument();
    expect(screen.getByText('Step 3 / 10')).toBeInTheDocument();
    expect(screen.getByText('Line 14')).toBeInTheDocument();

    // Pedagogical Insights
    expect(screen.getByText(/ALGORITHM INTUITION & MENTAL MODEL/i)).toBeInTheDocument();
    expect(
      screen.getByText('Divide and conquer strategy relies on placing pivot in its final position.')
    ).toBeInTheDocument();

    expect(screen.getByText(/CURRENT STATE INVARIANT/i)).toBeInTheDocument();
    expect(screen.getByText('Elements left of index i are strictly <= pivot.')).toBeInTheDocument();

    expect(screen.getByText(/DECISION RATIONALE & WHY/i)).toBeInTheDocument();
    expect(screen.getByText('5 is > 3, so pivot pointer moves forward without swap.')).toBeInTheDocument();
  });

  it('supports tab filtering between All Insights, Intuition, Invariant, and Rationale', () => {
    render(
      <TutorialCard
        explanation={sampleExplanation}
        stepIndex={0}
      />
    );

    // Click '💡 Intuition' tab
    const intuitionTab = screen.getByRole('button', { name: /💡 Intuition/i });
    fireEvent.click(intuitionTab);

    expect(screen.getByText(/ALGORITHM INTUITION & MENTAL MODEL/i)).toBeInTheDocument();
    expect(screen.queryByText(/CURRENT STATE INVARIANT/i)).not.toBeInTheDocument();

    // Click '📐 Invariant' tab
    const invariantTab = screen.getByRole('button', { name: /📐 Invariant/i });
    fireEvent.click(invariantTab);

    expect(screen.getByText(/CURRENT STATE INVARIANT/i)).toBeInTheDocument();
    expect(screen.queryByText(/ALGORITHM INTUITION & MENTAL MODEL/i)).not.toBeInTheDocument();

    // Click '🎯 Rationale' tab
    const rationaleTab = screen.getByRole('button', { name: /🎯 Rationale/i });
    fireEvent.click(rationaleTab);

    expect(screen.getByText(/DECISION RATIONALE & WHY/i)).toBeInTheDocument();
  });

  it('supports collapsible toggle and initialCollapsed prop', () => {
    render(
      <TutorialCard
        what="Visiting node A"
        why="Unvisited node in queue"
        initialCollapsed={true}
      />
    );

    expect(screen.getByText(/Step Tutorial Guide/i)).toBeInTheDocument();
    expect(screen.queryByText(/Visiting node A/i)).not.toBeInTheDocument();

    const expandBtn = screen.getByRole('button', { name: /Show ▲/i });
    fireEvent.click(expandBtn);

    expect(screen.getByText(/Visiting node A/i)).toBeInTheDocument();

    const collapseBtn = screen.getByRole('button', { name: /Collapse ▼/i });
    fireEvent.click(collapseBtn);

    expect(screen.queryByText(/Visiting node A/i)).not.toBeInTheDocument();
  });

  it('starts expanded when initialCollapsed is false', () => {
    render(
      <TutorialCard
        what="Visiting node A"
        why="Unvisited node in queue"
        initialCollapsed={false}
      />
    );
    expect(screen.getByText(/Visiting node A/i)).toBeInTheDocument();
  });

  it('supports layout mode switches (horizontal, vertical, overlay)', () => {
    const handleLayoutChange = vi.fn();
    render(
      <TutorialCard
        what="Step explanation"
        why="Step rationale"
        layout="horizontal"
        onLayoutChange={handleLayoutChange}
      />
    );

    const sideLayoutBtn = screen.getByRole('button', { name: /Vertical Layout/i });
    fireEvent.click(sideLayoutBtn);

    expect(handleLayoutChange).toHaveBeenCalledWith('vertical');

    const floatLayoutBtn = screen.getByRole('button', { name: /Overlay Layout/i });
    fireEvent.click(floatLayoutBtn);

    expect(handleLayoutChange).toHaveBeenCalledWith('overlay');
  });

  it('triggers onClose callback when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <TutorialCard
        what="Step explanation"
        why="Step rationale"
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByTitle('Close tutorial');
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
