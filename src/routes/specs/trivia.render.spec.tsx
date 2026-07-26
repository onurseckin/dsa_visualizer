import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from '../../routeTree.gen';
import type { TriviaConfig } from '../../types/trivia';
import {
  TRIVIA_CONFIG_KEY,
  TRIVIA_PROGRESS_KEY,
  readTriviaProgress,
  writeTriviaConfig,
} from '../../trivia/triviaStorage';

/* Route-level integration for /trivia (DESIGN.md R8.4).

   Driven through a real router over the generated route tree rather than by
   rendering the page component directly: createFileRoute only produces a usable
   component once it is mounted by a router, and the route is the thing under
   test — the deck/settings/session composition and the storage round-trip that
   nothing else in the tree performs. */

const DECK: TriviaConfig = {
  deck: ['bubble-sort'],
  mode: 'choice',
  minBlanks: 3,
  maxBlanks: 4,
  includeDistractors: false,
};

const renderTriviaRoute = async () => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/trivia'] }),
  });
  const view = render(<RouterProvider router={router} />);
  // Route components are code-split, so the first paint is the router's pending
  // state; the coverage bar is the one element every trivia view renders.
  await screen.findByRole('progressbar', { name: 'Deck coverage' });
  return view;
};

import { ALGORITHM_REGISTRY } from '../../algorithms/registry';

const revealButtons = () => screen.getAllByRole('button', { name: /^Reveal line \d+$/ });

const FOUR_DECK: TriviaConfig = { ...DECK, deck: ['two-sum', 'bubble-sort', 'binary-search-matrix', 'bfs-graph'], minBlanks: 1, maxBlanks: 3 };

describe('/trivia route', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // The router's scroll restoration calls window.scrollTo, which jsdom refuses.
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('opens on deck setup with an empty deck and no drill to run', async () => {
    await renderTriviaRoute();

    expect(await screen.findByText('Build your deck')).toBeInTheDocument();
    expect(screen.getByText('Drill settings')).toBeInTheDocument();
    expect(screen.getByText('0 in deck')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start drilling' })).toBeDisabled();
    expect(screen.getByText(/Add at least one algorithm to the deck/i)).toBeInTheDocument();

    // No session, and nothing has been written to storage by merely looking.
    expect(screen.queryByText('solution.py')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check answers' })).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Deck coverage' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
    expect(window.localStorage.getItem(TRIVIA_CONFIG_KEY)).toBeNull();
  });

  it('starts a session with a code puzzle once an algorithm is picked', async () => {
    await renderTriviaRoute();

    fireEvent.change(await screen.findByLabelText('Filter algorithms'), {
      target: { value: 'bubble' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add all Arrays & Hashing' }));

    expect(await screen.findByText('1 in deck')).toBeInTheDocument();
    // The deck is persisted as it is edited, before any drill has run.
    await waitFor(() => {
      expect(window.localStorage.getItem(TRIVIA_CONFIG_KEY)).not.toBeNull();
    });
    expect(
      JSON.parse(window.localStorage.getItem(TRIVIA_CONFIG_KEY) ?? '{}').deck,
    ).toEqual(['bubble-sort']);

    fireEvent.click(screen.getByRole('button', { name: 'Start drilling' }));

    expect(await screen.findByText('solution.py')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bubble Sort' })).toBeInTheDocument();
    expect(screen.getByTestId('code-puzzle-well')).toBeInTheDocument();
    expect(screen.getByText('Tiles')).toBeInTheDocument();
    // Nothing is filled yet, so the round cannot be checked.
    expect(screen.getByRole('button', { name: 'Check answers' })).toBeDisabled();
    expect(screen.queryByText('Build your deck')).not.toBeInTheDocument();

    // Default config: one blank per round, ceiling of three.
    expect(screen.getByText('Level 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Hiding 1 line')).toBeInTheDocument();
    expect(revealButtons()).toHaveLength(1);
  });

  it('restores the stored deck and reports the configured minBlanks as the level', async () => {
    writeTriviaConfig(DECK);

    await renderTriviaRoute();

    expect(await screen.findByText('Level 3 of 4')).toBeInTheDocument();
    expect(await screen.findByText('solution.py')).toBeInTheDocument();
    expect(screen.getByText('Hiding 3 lines')).toBeInTheDocument();
    expect(revealButtons()).toHaveLength(3);
    expect(screen.getByText('0 rounds')).toBeInTheDocument();

    // A stored deck skips setup entirely.
    expect(screen.queryByText('Build your deck')).not.toBeInTheDocument();
  });

  it('drills a four-algorithm deck, serving a real solution from the deck each round', async () => {
    writeTriviaConfig(FOUR_DECK);
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    const titles = FOUR_DECK.deck.map((id) => ALGORITHM_REGISTRY[id].title);
    expect(screen.getByText('4 algorithms in the deck', { exact: false })).toBeInTheDocument();

    /* The route seeds pickRound from Math.random, so which of the four appears is
       not fixed; what must hold every round is that the puzzle belongs to the deck
       and is playable. Four rounds is enough to catch a loop that dries up. */
    for (let round = 0; round < 4; round += 1) {
      const heading = screen.getByRole('heading', { level: 2 });
      expect(titles).toContain(heading.textContent);
      expect(revealButtons()).toHaveLength(1);

      revealButtons().forEach((button) => fireEvent.click(button));
      const check = screen.getByRole('button', { name: 'Check answers' });
      await waitFor(() => expect(check).toBeEnabled());
      fireEvent.click(check);

      await waitFor(() => expect(readTriviaProgress().roundsPlayed).toBe(round + 1));
      fireEvent.click(screen.getByRole('button', { name: 'Next round' }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Check answers' })).toBeDisabled();
      });
    }

    expect(readTriviaProgress().roundsPlayed).toBe(4);
    expect(screen.getByText('4 rounds')).toBeInTheDocument();
  });

  it('grades a submitted round, persists the progress, and serves the next one', async () => {
    writeTriviaConfig(DECK);
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    // Revealing every blank is the mouse-cheap way to complete a round; the
    // engine records the reveals as misses, which is exactly what we assert.
    revealButtons().forEach((button) => fireEvent.click(button));

    const check = screen.getByRole('button', { name: 'Check answers' });
    await waitFor(() => expect(check).toBeEnabled());
    fireEvent.click(check);

    await waitFor(() => expect(readTriviaProgress().roundsPlayed).toBe(1));
    expect(screen.getByText('1 round')).toBeInTheDocument();
    expect(window.localStorage.getItem(TRIVIA_PROGRESS_KEY)).not.toBeNull();

    const drilled = readTriviaProgress().drilled['bubble-sort']?.['3'] ?? [];
    expect(drilled).toHaveLength(3);

    // Coverage is derived from that progress, so the indicator moved off zero.
    await waitFor(() => {
      const value = screen.getByRole('progressbar', { name: 'Deck coverage' });
      expect(Number(value.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next round' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Check answers' })).toBeDisabled();
    });
    expect(revealButtons()).toHaveLength(3);
    expect(readTriviaProgress().roundsPlayed).toBe(1);
  });

  it('reopens deck setup from a running session without losing the deck', async () => {
    writeTriviaConfig(DECK);
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    fireEvent.click(screen.getByRole('button', { name: 'Edit deck' }));

    expect(await screen.findByText('Build your deck')).toBeInTheDocument();
    expect(screen.getByText('1 in deck')).toBeInTheDocument();
    expect(screen.queryByText('solution.py')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start drilling' }));
    expect(await screen.findByText('solution.py')).toBeInTheDocument();
  });

  it('clears trivia storage only after the reset is confirmed', async () => {
    writeTriviaConfig(DECK);
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/Reset trivia progress\?/i);
    expect(window.localStorage.getItem(TRIVIA_CONFIG_KEY)).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Keep drilling' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(TRIVIA_CONFIG_KEY)).not.toBeNull();
    expect(screen.getByText('solution.py')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete my progress' }));

    expect(window.localStorage.getItem(TRIVIA_CONFIG_KEY)).toBeNull();
    expect(window.localStorage.getItem(TRIVIA_PROGRESS_KEY)).toBeNull();
    // Back to an empty deck, so setup is the only view left.
    expect(await screen.findByText('Build your deck')).toBeInTheDocument();
    expect(screen.getByText('0 in deck')).toBeInTheDocument();
    expect(screen.queryByText('solution.py')).not.toBeInTheDocument();
  });
});
