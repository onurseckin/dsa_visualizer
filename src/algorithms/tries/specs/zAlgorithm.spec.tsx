import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { generateZAlgorithmSteps, zAlgorithm } from '../zAlgorithm';

describe('zAlgorithm React component spec', () => {
  it('renders algorithm title in MainLayout', () => {
    const steps = generateZAlgorithmSteps(zAlgorithm.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={zAlgorithm}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Z-Algorithm String Matching')).toBeInTheDocument();
  });
});
