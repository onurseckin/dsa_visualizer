import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { DEFAULT_KMP_INPUT, generateKmpSteps, kmpStringMatch } from '../kmpStringMatch';

describe('kmpStringMatch React component spec', () => {
  it('renders algorithm title in MainLayout', () => {
    const steps = generateKmpSteps(DEFAULT_KMP_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={kmpStringMatch}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('KMP String Matching')).toBeInTheDocument();
  });
});
