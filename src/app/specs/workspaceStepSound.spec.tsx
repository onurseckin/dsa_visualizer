import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from '../../routeTree.gen';
import { ALGORITHM_REGISTRY } from '../../algorithms/registry';
import { deriveStepCue } from '../../engine/stepSound';
import type { SoundCue } from '../../engine/stepSound';

/* Cross-boundary wiring spec (DESIGN.md R3.5): the workspace route is what joins
   the pure cue classifier to the audio engine, so it is the only place where a
   missing prevStep, a wrong totalSteps or a lost dedupe guard would show up. The
   engine itself is mocked — this asserts the call, not the sound. */

// Typed so mock.calls carries SoundCue instead of an untyped tuple.
const playCue = vi.fn<[SoundCue], void>();

vi.mock('../../engine/soundEngine', () => ({
  default: {
    playCue: (cue: SoundCue): void => playCue(cue),
  },
}));

/* Two Sum takes an object input, so the route feeds it the curated defaultInput
   rather than a seeded random array — the step list is identical to this one. */
const twoSum = ALGORITHM_REGISTRY['two-sum'];
const steps = twoSum.generateSteps(twoSum.defaultInput);

const renderWorkspace = (): void => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/workspace/two-sum'] }),
  });
  render(<RouterProvider router={router} />);
};

const stepForward = (): void => {
  fireEvent.click(screen.getByRole('button', { name: 'Step forward' }));
};

describe('Workspace step sound wiring', () => {
  beforeAll(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  beforeEach(() => {
    window.localStorage.clear();
    playCue.mockClear();
  });

  it('stays silent on first render so landing on a workspace makes no noise', async () => {
    renderWorkspace();

    expect(await screen.findByRole('heading', { name: 'Two Sum' })).toBeInTheDocument();
    expect(playCue).not.toHaveBeenCalled();
  });

  it('plays the cue derived from the step and its predecessor on every advance', async () => {
    renderWorkspace();
    await screen.findByRole('heading', { name: 'Two Sum' });

    stepForward();
    await waitFor(() => expect(playCue).toHaveBeenCalledTimes(1));
    expect(playCue).toHaveBeenLastCalledWith(deriveStepCue(steps[1], steps[0], steps.length));

    stepForward();
    await waitFor(() => expect(playCue).toHaveBeenCalledTimes(2));
    expect(playCue).toHaveBeenLastCalledWith(deriveStepCue(steps[2], steps[1], steps.length));
  });

  it('gives every transition a cue — no step is silent', async () => {
    renderWorkspace();
    await screen.findByRole('heading', { name: 'Two Sum' });

    for (let i = 1; i < steps.length; i++) {
      stepForward();
      await waitFor(() => expect(playCue).toHaveBeenCalledTimes(i));
    }

    expect(playCue.mock.calls.every(([cue]) => cue.pitch >= 0 && cue.pitch <= 1)).toBe(true);
    expect(playCue.mock.calls[steps.length - 2][0].kind).toBe('complete');
  });

  it('does not re-fire when the index does not move', async () => {
    renderWorkspace();
    await screen.findByRole('heading', { name: 'Two Sum' });

    stepForward();
    await waitFor(() => expect(playCue).toHaveBeenCalledTimes(1));

    // Backward then forward lands on index 1 again: a real move each way, one cue each.
    fireEvent.click(screen.getByRole('button', { name: 'Step backward' }));
    await waitFor(() => expect(playCue).toHaveBeenCalledTimes(2));
    stepForward();
    await waitFor(() => expect(playCue).toHaveBeenCalledTimes(3));

    // The forward button disables itself at the end, so no cue can be re-triggered there.
    for (let i = 0; i < steps.length; i++) {
      const button = screen.getByRole('button', { name: 'Step forward' });
      if ((button as HTMLButtonElement).disabled) break;
      fireEvent.click(button);
    }
    const callsAtEnd = playCue.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Step forward' }));
    expect(playCue).toHaveBeenCalledTimes(callsAtEnd);
  });

  it('makes no sound at all while sound is disabled', async () => {
    window.localStorage.setItem('dsa_visualizer_sound_enabled', 'false');
    renderWorkspace();
    await screen.findByRole('heading', { name: 'Two Sum' });

    stepForward();
    stepForward();

    await waitFor(() => expect(screen.getByLabelText(/Step 3 of/)).toBeInTheDocument());
    expect(playCue).not.toHaveBeenCalled();
  });
});
