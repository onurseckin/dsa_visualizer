import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { ALGORITHM_REGISTRY } from '../../registry';
import { DEFAULT_KMP_INPUT, generateKmpSteps } from '../kmpStringMatch';

describe('kmpStringMatch React component spec', () => {
  it('renders algorithm title in MainLayout', () => {
    const steps = generateKmpSteps(DEFAULT_KMP_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY['kmp-string-match']}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('KMP String Matching')).toBeInTheDocument();
  });
});
