import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { ALGORITHM_REGISTRY } from '../../registry';
import { generateSegmentTreeSteps, segmentTree } from '../segmentTree';

// jsdom does not implement scrollIntoView, which the code viewer calls on the active line
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('segmentTree React component spec', () => {
  it('renders algorithm title in MainLayout', () => {
    const steps = generateSegmentTreeSteps(segmentTree.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY['segment-tree']}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Segment Tree (Range Sum Query & Update)')).toBeInTheDocument();
  });
});
