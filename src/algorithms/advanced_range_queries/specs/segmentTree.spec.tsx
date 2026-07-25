import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { generateSegmentTreeSteps, segmentTree } from '../segmentTree';

describe('segmentTree React component spec', () => {
  it('renders algorithm title in MainLayout', () => {
    const steps = generateSegmentTreeSteps(segmentTree.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={segmentTree}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Segment Tree (Range Sum Query & Update)')).toBeInTheDocument();
  });
});
