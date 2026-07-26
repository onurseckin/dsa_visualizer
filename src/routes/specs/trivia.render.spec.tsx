import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from '../../routeTree.gen';
import type { TriviaConfig, TriviaProgress, TriviaSessionRecord } from '../../types/trivia';
import { TRIVIA_CONFIG_KEY, TRIVIA_PROGRESS_KEY, writeTriviaConfig } from '../../trivia/triviaStorage';
import {
  TRIVIA_SESSIONS_KEY,
  createSession,
  readActiveSessionId,
  readTriviaSessions,
} from '../../trivia/triviaSessions';
import { blankableLines, parsePuzzleLines } from '../../trivia/triviaEngine';
import { ALGORITHM_REGISTRY } from '../../algorithms/registry';

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
  // state; the "Sessions" trigger in the slim top bar is the one element every
  // trivia view renders, in both setup and drill mode.
  await screen.findByRole('button', { name: /^Sessions/ });
  return view;
};

const revealButtons = () => screen.getAllByRole('button', { name: /^Reveal line \d+$/ });

/** Sessions are the only unit of state now — this reads the one the page has
    active, the same way trivia.tsx itself does. */
const readActiveSessionRecord = (): TriviaSessionRecord => {
  const sessions = readTriviaSessions();
  const activeId = readActiveSessionId();
  return sessions.find((s) => s.id === activeId) ?? sessions[0];
};

/** Everything but Start drilling/Check/Next now lives behind the "Sessions"
    popover: new session, rename, delete, and the destructive reset. */
const openSessionsPopover = () => {
  fireEvent.click(screen.getByRole('button', { name: /^Sessions/ }));
};

/* The four algorithms carrying authored trivia metadata — the deck the drill is
   meant to be exercised on, and the one the engine flow spec proves out. */
const FOUR_DECK: TriviaConfig = {
  ...DECK,
  deck: ['two-sum', 'bubble-sort', 'binary-search-matrix', 'bfs-graph'],
  minBlanks: 1,
  maxBlanks: 3,
};

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

    expect(screen.queryByText('solution.py')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Check answers/ })).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Deck coverage' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );

    // A first visit auto-creates and activates one session — the page never
    // has a "no session selected" state — but merely looking never writes the
    // legacy bare config/progress keys.
    expect(window.localStorage.getItem(TRIVIA_CONFIG_KEY)).toBeNull();
    expect(window.localStorage.getItem(TRIVIA_PROGRESS_KEY)).toBeNull();
    const created = readActiveSessionRecord();
    expect(created.name).toBe('Session 1');
    expect(created.config.deck).toEqual([]);
    expect(created.progress.roundsPlayed).toBe(0);
  });

  it('starts a session with a code puzzle once an algorithm is picked', async () => {
    await renderTriviaRoute();

    fireEvent.change(await screen.findByLabelText('Filter algorithms'), {
      target: { value: 'bubble' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add all Arrays & Hashing' }));

    expect(await screen.findByText('1 in deck')).toBeInTheDocument();
    // The deck is persisted as it is edited, before any drill has run — inside
    // the active session's own record now, not a bare config key.
    await waitFor(() => {
      expect(readActiveSessionRecord().config.deck).toEqual(['bubble-sort']);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Start drilling' }));

    expect(await screen.findByText('solution.py')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bubble Sort' })).toBeInTheDocument();
    expect(screen.getByTestId('code-puzzle-well')).toBeInTheDocument();
    expect(screen.getByText('Tiles')).toBeInTheDocument();
    // Nothing is filled yet, so the round cannot be checked.
    expect(screen.getByRole('button', { name: /^Check answers/ })).toBeDisabled();
    expect(screen.queryByText('Build your deck')).not.toBeInTheDocument();

    // Default config: one blank per round, ceiling of three. Drill mode shows
    // the level/coverage as TriviaSession's own trailing line now, not the
    // setup screen's badge row.
    expect(screen.getByText('Level 1 · 0% covered')).toBeInTheDocument();
    expect(screen.getByText('Hiding 1 line')).toBeInTheDocument();
    expect(revealButtons()).toHaveLength(1);
  });

  it('restores the stored deck and reports the configured minBlanks as the level', async () => {
    writeTriviaConfig(DECK);

    await renderTriviaRoute();

    expect(await screen.findByText('Level 3 · 0% covered')).toBeInTheDocument();
    expect(await screen.findByText('solution.py')).toBeInTheDocument();
    expect(screen.getByText('Hiding 3 lines')).toBeInTheDocument();
    expect(revealButtons()).toHaveLength(3);
    expect(readActiveSessionRecord().progress.roundsPlayed).toBe(0);

    // A stored deck skips setup entirely.
    expect(screen.queryByText('Build your deck')).not.toBeInTheDocument();
  });

  it('drills a four-algorithm deck, serving a real solution from the deck each round', async () => {
    writeTriviaConfig(FOUR_DECK);
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    const titles = FOUR_DECK.deck.map((id) => ALGORITHM_REGISTRY[id].title);
    expect(readActiveSessionRecord().config.deck).toEqual(FOUR_DECK.deck);

    /* The route seeds pickRound from Math.random, so which of the four appears is
       not fixed; what must hold every round is that the puzzle belongs to the deck
       and is playable. Four rounds is enough to catch a loop that dries up. */
    for (let round = 0; round < 4; round += 1) {
      const heading = screen.getByRole('heading', { level: 2 });
      expect(titles).toContain(heading.textContent);
      expect(revealButtons()).toHaveLength(1);

      revealButtons().forEach((button) => fireEvent.click(button));
      const check = screen.getByRole('button', { name: /^Check answers/ });
      await waitFor(() => expect(check).toBeEnabled());
      fireEvent.click(check);

      await waitFor(() => expect(readActiveSessionRecord().progress.roundsPlayed).toBe(round + 1));
      // Revealing every blank means nothing was actually recalled, so the
      // round grades as incorrect and the button reads "Try again" — it still
      // advances to a fresh round underneath (see TriviaSession's handleNext).
      fireEvent.click(screen.getByRole('button', { name: /^(Next round|Try again)/ }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Check answers/ })).toBeDisabled();
      });
    }

    expect(readActiveSessionRecord().progress.roundsPlayed).toBe(4);
  });

  it('grades a submitted round, persists the progress, and serves the next one', async () => {
    writeTriviaConfig(DECK);
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    // Revealing every blank is the mouse-cheap way to complete a round; the
    // engine records the reveals as misses, which is exactly what we assert.
    revealButtons().forEach((button) => fireEvent.click(button));

    const check = screen.getByRole('button', { name: /^Check answers/ });
    await waitFor(() => expect(check).toBeEnabled());
    fireEvent.click(check);

    await waitFor(() => expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1));
    expect(window.localStorage.getItem(TRIVIA_PROGRESS_KEY)).toBeNull();
    expect(window.localStorage.getItem(TRIVIA_SESSIONS_KEY)).not.toBeNull();

    const drilled = readActiveSessionRecord().progress.drilled['bubble-sort']?.['3'] ?? [];
    expect(drilled).toHaveLength(3);

    // Coverage is derived from that progress, so the trailing line moved off 0%.
    await waitFor(() => {
      expect(screen.getByText(/^Level 3 · \d+% covered$/)).toBeInTheDocument();
      expect(screen.queryByText('Level 3 · 0% covered')).not.toBeInTheDocument();
    });

    // Every blank was revealed, so this round grades as incorrect and the
    // button reads "Try again" — it still advances to a fresh round.
    fireEvent.click(screen.getByRole('button', { name: /^(Next round|Try again)/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Check answers/ })).toBeDisabled();
    });
    expect(revealButtons()).toHaveLength(3);
    expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1);
  });

  it('reopens deck setup from a running session without losing the deck', async () => {
    writeTriviaConfig(DECK);
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    fireEvent.click(screen.getByRole('button', { name: 'Exit to setup' }));

    expect(await screen.findByText('Build your deck')).toBeInTheDocument();
    expect(screen.getByText('1 in deck')).toBeInTheDocument();
    expect(screen.queryByText('solution.py')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start drilling' }));
    expect(await screen.findByText('solution.py')).toBeInTheDocument();
  });

  it('reopens on setup after a remount, not a fresh drill round, once a session was left paused', async () => {
    writeTriviaConfig(DECK);
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    fireEvent.click(screen.getByRole('button', { name: 'Exit to setup' }));
    expect(await screen.findByText('Build your deck')).toBeInTheDocument();

    // Simulate a page reload: the deck config makes this session non-empty,
    // so mount-time state must also consult the session's persisted status
    // (like handleSelectSession does) rather than only the deck length —
    // otherwise a paused session with a real deck resumes straight into a
    // brand-new drill round instead of reopening setup.
    cleanup();
    await renderTriviaRoute();

    expect(await screen.findByText('Build your deck')).toBeInTheDocument();
    expect(screen.queryByText('solution.py')).not.toBeInTheDocument();
  });

  it('clears trivia storage only after the reset is confirmed', async () => {
    writeTriviaConfig(DECK);
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    // Drill one round for real first, so there is something worth resetting —
    // the "Reset progress" action is scoped to a session with progress.
    revealButtons().forEach((button) => fireEvent.click(button));
    const check = screen.getByRole('button', { name: /^Check answers/ });
    await waitFor(() => expect(check).toBeEnabled());
    fireEvent.click(check);
    await waitFor(() => expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1));

    openSessionsPopover();
    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/Reset trivia progress\?/i);
    // Nothing is wiped until the destructive action is actually confirmed.
    expect(readActiveSessionRecord().config.deck).toEqual(['bubble-sort']);
    expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Keep drilling' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1);
    expect(screen.getByText('solution.py')).toBeInTheDocument();

    openSessionsPopover();
    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete my progress' }));

    expect(window.localStorage.getItem(TRIVIA_CONFIG_KEY)).toBeNull();
    expect(window.localStorage.getItem(TRIVIA_PROGRESS_KEY)).toBeNull();
    const resetSession = readActiveSessionRecord();
    expect(resetSession.config.deck).toEqual([]);
    expect(resetSession.progress.roundsPlayed).toBe(0);
    // Back to an empty deck, so setup is the only view left.
    expect(await screen.findByText('Build your deck')).toBeInTheDocument();
    expect(screen.getByText('0 in deck')).toBeInTheDocument();
    expect(screen.queryByText('solution.py')).not.toBeInTheDocument();
  });

  /* Round-trip proof for the user's own bug report: "I created the previous
     session system to make sure that I can have different sessions ... they
     should all be there." This drives two whole sessions through the real
     UI — deck, drill, exit, switch — rather than unit-testing the storage
     helpers in isolation, because the reported break was in how trivia.tsx
     wires activeId/activeSession/config/progress together, not in any one
     function. */
  it('keeps two sessions fully independent: switching back and forth restores each one exactly as left', async () => {
    writeTriviaConfig(DECK);
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    // Drill session A ("Session 1") for one real round so it has genuine,
    // non-zero progress worth protecting.
    revealButtons().forEach((button) => fireEvent.click(button));
    let check = screen.getByRole('button', { name: /^Check answers/ });
    await waitFor(() => expect(check).toBeEnabled());
    fireEvent.click(check);
    await waitFor(() => expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1));

    const sessionAId = readActiveSessionId();
    const drilledOnA = readActiveSessionRecord().progress.drilled['bubble-sort']?.['3'] ?? [];
    expect(drilledOnA.length).toBeGreaterThan(0);

    // Exit A to setup — this alone must be the auto-save; there is no
    // separate "save" action anywhere in the UI.
    fireEvent.click(screen.getByRole('button', { name: 'Exit to setup' }));
    expect(await screen.findByText('Build your deck')).toBeInTheDocument();

    // Create session B from the Sessions drawer and give it a different deck.
    openSessionsPopover();
    fireEvent.click(screen.getByRole('button', { name: 'New session' }));
    await waitFor(() => expect(readActiveSessionId()).not.toBe(sessionAId));
    const sessionBId = readActiveSessionId();
    expect(screen.getByText('Session 2')).toBeInTheDocument();
    expect(readActiveSessionRecord().config.deck).toEqual([]);

    fireEvent.change(screen.getByLabelText('Filter algorithms'), { target: { value: 'two' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add all Arrays & Hashing' }));
    await waitFor(() => expect(readActiveSessionRecord().config.deck).toEqual(['two-sum']));

    // Drill B differently from A (default settings: 1 blank, ceiling 3).
    fireEvent.click(screen.getByRole('button', { name: 'Start drilling' }));
    await screen.findByText('solution.py');
    revealButtons().forEach((button) => fireEvent.click(button));
    check = screen.getByRole('button', { name: /^Check answers/ });
    await waitFor(() => expect(check).toBeEnabled());
    fireEvent.click(check);
    await waitFor(() => expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1));

    const sessionBSnapshot = readActiveSessionRecord();
    expect(sessionBSnapshot.id).toBe(sessionBId);
    expect(sessionBSnapshot.config.deck).toEqual(['two-sum']);

    // Switch back to A via the Sessions drawer's "Resume" button — only one
    // non-active session is listed at this point, so the button is unique.
    openSessionsPopover();
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    await waitFor(() => expect(readActiveSessionId()).toBe(sessionAId));

    // A's exact deck, settings, level and drilled-line progress must come
    // back untouched — not B's, and not a blank/fresh one.
    const resumedA = readActiveSessionRecord();
    expect(resumedA.config.deck).toEqual(['bubble-sort']);
    expect(resumedA.config.minBlanks).toBe(3);
    expect(resumedA.config.maxBlanks).toBe(4);
    expect(resumedA.progress.roundsPlayed).toBe(1);
    expect(resumedA.progress.drilled['bubble-sort']?.['3']).toEqual(drilledOnA);
    expect(resumedA.progress.drilled['two-sum']).toBeUndefined();
    expect(await screen.findByText('Build your deck')).toBeInTheDocument();
    expect(screen.getByText('1 in deck')).toBeInTheDocument();

    // B is untouched in storage too, not silently merged or dropped.
    const sessionBAfter = readTriviaSessions().find((s) => s.id === sessionBId);
    expect(sessionBAfter?.config.deck).toEqual(['two-sum']);
    expect(sessionBAfter?.progress.roundsPlayed).toBe(1);
  });

  it('raises maxBlanks on session A without resetting its drilled progress', async () => {
    writeTriviaConfig(DECK);
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    revealButtons().forEach((button) => fireEvent.click(button));
    const check = screen.getByRole('button', { name: /^Check answers/ });
    await waitFor(() => expect(check).toBeEnabled());
    fireEvent.click(check);
    await waitFor(() => expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1));

    const beforeDrilled = readActiveSessionRecord().progress.drilled;
    const beforeStats = readActiveSessionRecord().progress.stats;
    const beforeLevel = readActiveSessionRecord().progress.level;

    fireEvent.click(screen.getByRole('button', { name: 'Exit to setup' }));
    expect(await screen.findByText('Build your deck')).toBeInTheDocument();

    // Raise the hardest level — the user's own words: "without losing my
    // progress on trivia, I should be able to change the session settings
    // and increase the level further."
    fireEvent.change(screen.getByLabelText('Hardest level'), { target: { value: '6' } });
    await waitFor(() => expect(readActiveSessionRecord().config.maxBlanks).toBe(6));

    const afterPatch = readActiveSessionRecord();
    expect(afterPatch.progress.roundsPlayed).toBe(1);
    expect(afterPatch.progress.drilled).toEqual(beforeDrilled);
    expect(afterPatch.progress.stats).toEqual(beforeStats);
    expect(afterPatch.progress.level).toBe(beforeLevel);
  });

  it('resumes a session that finished its deck once maxBlanks is raised, without erasing its drilled history', async () => {
    const bubbleSort = ALGORITHM_REGISTRY['bubble-sort'];
    const allBlankable = blankableLines(parsePuzzleLines(bubbleSort.code, bubbleSort.trivia));

    const finishedConfig: TriviaConfig = {
      deck: ['bubble-sort'],
      mode: 'choice',
      minBlanks: 1,
      maxBlanks: 1,
      includeDistractors: false,
    };
    const finishedProgress: TriviaProgress = {
      level: 1,
      drilled: { 'bubble-sort': { '1': allBlankable } },
      stats: {},
      completed: true,
      roundsPlayed: allBlankable.length,
    };
    createSession('Finished Deck', finishedConfig, finishedProgress);

    await renderTriviaRoute();
    expect(await screen.findByText('Deck complete')).toBeInTheDocument();

    // The completion card itself has no controls — this is the one way back
    // to settings without losing the session or its history.
    fireEvent.click(screen.getByRole('button', { name: 'Adjust settings to keep going' }));
    expect(await screen.findByText('Build your deck')).toBeInTheDocument();

    const beforeDrilled = readActiveSessionRecord().progress.drilled['bubble-sort']?.['1'] ?? [];

    fireEvent.change(screen.getByLabelText('Hardest level'), { target: { value: '2' } });
    await waitFor(() => expect(readActiveSessionRecord().config.maxBlanks).toBe(2));

    const revived = readActiveSessionRecord();
    expect(revived.progress.completed).toBe(false);
    expect(revived.progress.drilled['bubble-sort']?.['1']).toEqual(beforeDrilled);

    fireEvent.click(screen.getByRole('button', { name: 'Start drilling' }));
    expect(await screen.findByText('solution.py')).toBeInTheDocument();
    expect(screen.queryByText('Deck complete')).not.toBeInTheDocument();
  });

  it('keeps the sessions list and active pointer consistent through rename, delete, and create in quick succession', async () => {
    await renderTriviaRoute();
    const sessionA = readActiveSessionRecord();

    openSessionsPopover();
    fireEvent.click(screen.getByRole('button', { name: 'New session' }));
    await waitFor(() => expect(readTriviaSessions()).toHaveLength(2));
    const sessionB = readActiveSessionRecord();

    openSessionsPopover();
    fireEvent.click(screen.getByRole('button', { name: 'New session' }));
    await waitFor(() => expect(readTriviaSessions()).toHaveLength(3));
    const sessionC = readActiveSessionRecord();
    expect(readActiveSessionId()).toBe(sessionC.id);

    // Rename the active session (C) ... scoped to the drawer itself, since
    // the active session's name is also a rename button's accessible name
    // on the setup screen sitting behind this overlay (TriviaHeaderCard).
    openSessionsPopover();
    const dialog = screen.getByRole('dialog', { name: 'Sessions' });
    fireEvent.click(within(dialog).getByRole('button', { name: `Rename ${sessionC.name}` }));
    fireEvent.change(within(dialog).getByDisplayValue(sessionC.name), {
      target: { value: 'Focus Session' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save session name' }));
    expect(await within(dialog).findByText('Focus Session')).toBeInTheDocument();

    // ...immediately delete a different, non-active session (B) ...
    fireEvent.click(within(dialog).getByRole('button', { name: `Delete ${sessionB.name}` }));
    await waitFor(() => expect(readTriviaSessions()).toHaveLength(2));
    expect(readActiveSessionId()).toBe(sessionC.id);

    // ...then immediately create yet another new one, all without closing
    // and reopening the drawer in between the rename and the delete.
    fireEvent.click(within(dialog).getByRole('button', { name: 'New session' }));
    await waitFor(() => expect(readTriviaSessions()).toHaveLength(3));
    const sessionD = readActiveSessionRecord();

    const finalSessions = readTriviaSessions();
    // B is genuinely gone, not merely hidden.
    expect(finalSessions.find((s) => s.id === sessionB.id)).toBeUndefined();
    // A survived, untouched by any of the rename/delete/create traffic.
    const finalA = finalSessions.find((s) => s.id === sessionA.id);
    expect(finalA).toBeDefined();
    expect(finalA?.name).toBe(sessionA.name);
    // C survived under its new name.
    const finalC = finalSessions.find((s) => s.id === sessionC.id);
    expect(finalC?.name).toBe('Focus Session');
    // The active pointer landed on the newest session — not the one just
    // deleted, and not stuck on a stale id.
    expect(readActiveSessionId()).toBe(sessionD.id);
    expect(sessionD.id).not.toBe(sessionB.id);
    expect(finalSessions.map((s) => s.id).sort()).toEqual(
      [sessionA.id, sessionC.id, sessionD.id].sort()
    );
  });

  it('shows an unambiguous "New session" identity right after creating one, distinct from a session with real progress', async () => {
    writeTriviaConfig(DECK);
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    revealButtons().forEach((button) => fireEvent.click(button));
    const check = screen.getByRole('button', { name: /^Check answers/ });
    await waitFor(() => expect(check).toBeEnabled());
    fireEvent.click(check);
    await waitFor(() => expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1));

    fireEvent.click(screen.getByRole('button', { name: 'Exit to setup' }));
    expect(await screen.findByText('Now editing session')).toBeInTheDocument();
    // Session 1 has real, earned progress now, so it must read as a resume,
    // never as a blank slate the user could mistake for a fresh start.
    expect(screen.getByText('Paused · progress saved')).toBeInTheDocument();
    expect(screen.queryByText('New session')).not.toBeInTheDocument();

    openSessionsPopover();
    fireEvent.click(screen.getByRole('button', { name: 'New session' }));

    // The moment a brand-new session is created, the setup screen must make
    // it unmistakable this is the new (default-named) session, not Session 1.
    expect(await screen.findByText('Session 2')).toBeInTheDocument();
    expect(screen.getByText('New session')).toBeInTheDocument();
    expect(screen.queryByText('Session 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Paused · progress saved')).not.toBeInTheDocument();
    expect(readActiveSessionRecord().config.deck).toEqual([]);
  });
});
