import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { ALGORITHM_REGISTRY } from '../../registry';
import { generateZAlgorithmSteps, zAlgorithm } from '../zAlgorithm';

describe('zAlgorithm React component spec', () => {
  it('renders algorithm title in MainLayout', () => {
    const steps = generateZAlgorithmSteps(zAlgorithm.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY['z-algorithm']}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Z-Algorithm String Matching')).toBeInTheDocument();
  });
});
