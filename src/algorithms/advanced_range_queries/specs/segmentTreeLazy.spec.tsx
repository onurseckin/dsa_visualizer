import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { generateSegmentTreeLazySteps, segmentTreeLazy } from '../segmentTreeLazy';

// jsdom does not implement scrollIntoView, which the code viewer calls on the active line
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('segmentTreeLazy React component spec', () => {
  it('renders algorithm title in MainLayout', () => {
    const steps = generateSegmentTreeLazySteps(segmentTreeLazy.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={segmentTreeLazy}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Segment Tree (Lazy Propagation)')).toBeInTheDocument();
  });
});
