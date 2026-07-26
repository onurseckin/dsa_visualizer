import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from '../../routeTree.gen';
import type { TriviaConfig, TriviaProgress, TriviaSessionRecord } from '../../types/trivia';
import {
  createSession,
  readActiveSessionId,
  readTriviaSessions,
  updateSession,
  writeActiveSessionId,
} from '../../trivia/triviaSessions';
import { blankableLines, createProgress, parsePuzzleLines } from '../../trivia/triviaEngine';
import { MIN_PANEL_HEIGHT_PX, TRIVIA_LAYOUT_KEY } from '../../trivia/triviaLayout';
import { ALGORITHM_REGISTRY } from '../../algorithms/registry';

/* Route-level integration for /trivia (DESIGN.md R8.4, TASKS.md 9.1).

   Driven through a real router over the generated route tree rather than by
   rendering the page component directly: createFileRoute only produces a
   usable component once it is mounted by a router, and the route is the
   thing under test — the Home/Setup/Drill composition and the storage
   round-trip that nothing else in the tree performs.

   Round-3 IA (TASKS.md 9.1): the page now has a real third screen — Home —
   derived purely from `activeSessionId` (null = Home). These tests exercise
   the exact enter/exit/resume scenarios the design spec calls out, most
   pointedly the user's own repeated complaint: exiting a session must land
   somewhere that is not "editing session N", and that has to survive a
   reload, not just an in-memory navigate. */

const DECK: TriviaConfig = {
  deck: ['bubble-sort'],
  mode: 'choice',
  minBlanks: 3,
  maxBlanks: 4,
  includeDistractors: false,
};

/* The four algorithms carrying authored trivia metadata — the deck the drill is
   meant to be exercised on, and the one the engine flow spec proves out. */
const FOUR_DECK: TriviaConfig = {
  ...DECK,
  deck: ['two-sum', 'bubble-sort', 'binary-search-matrix', 'bfs-graph'],
  minBlanks: 1,
  maxBlanks: 3,
};

const renderTriviaRoute = async () => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/trivia'] }),
  });
  return render(<RouterProvider router={router} />);
};

const revealButtons = () => screen.getAllByRole('button', { name: /^Reveal line \d+$/ });

const readActiveSessionRecord = (): TriviaSessionRecord => {
  const sessions = readTriviaSessions();
  const activeId = readActiveSessionId();
  const found = activeId !== null ? sessions.find((s) => s.id === activeId) : undefined;
  if (!found) throw new Error('No active session — test assumed one was selected');
  return found;
};

/** Seeds a fully-formed session directly through the session store (bypassing
    the UI) and makes it the active one on whichever screen `lastScreen`
    names — the fast path for tests that need to start mid-Setup or
    mid-Drill rather than walking through Home. */
const seedActiveSession = (
  name: string,
  config: TriviaConfig,
  progress: TriviaProgress,
  lastScreen: 'setup' | 'drill' = 'setup',
): TriviaSessionRecord => {
  const created = createSession(name, config, progress);
  const updated = updateSession(created.id, { lastScreen });
  writeActiveSessionId(created.id);
  return updated ?? created;
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

  it('auto-creates and enters "Session 1" on a genuine first visit, landing directly on Setup', async () => {
    await renderTriviaRoute();

    expect(await screen.findByText('Build your deck')).toBeInTheDocument();
    expect(screen.getByText('Now editing session')).toBeInTheDocument();
    expect(screen.getByText('Session 1')).toBeInTheDocument();
    expect(screen.getByText('0 in deck')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start drilling' })).toBeDisabled();

    const sessions = readTriviaSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].name).toBe('Session 1');
    expect(sessions[0].lastScreen).toBe('setup');
    expect(sessions[0].config.deck).toEqual([]);
    expect(readActiveSessionId()).toBe(sessions[0].id);
  });

  it('creates a new session from Home and lands directly on its empty Setup screen', async () => {
    // Fresh render auto-creates and enters "Session 1"; step back out to
    // Home first so this test can prove the *from-Home* creation path on a
    // real Home screen with an existing, unselected session already on it.
    await renderTriviaRoute();
    await screen.findByText('Build your deck');
    fireEvent.click(screen.getByRole('button', { name: 'Back to Trivia Home' }));
    await screen.findByRole('heading', { name: 'Trivia' });

    fireEvent.click(screen.getAllByRole('button', { name: 'New session' })[0]);

    expect(await screen.findByText('Build your deck')).toBeInTheDocument();
    expect(screen.getByText('Now editing session')).toBeInTheDocument();
    expect(screen.getByText('New session')).toBeInTheDocument();
    expect(screen.getByText('0 in deck')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start drilling' })).toBeDisabled();

    const created = readActiveSessionRecord();
    expect(created.name).toBe('Session 2');
    expect(created.lastScreen).toBe('setup');
    expect(created.config.deck).toEqual([]);
  });

  it('starts a session with a code puzzle once an algorithm is picked', async () => {
    // A fresh render already auto-creates and enters "Session 1" on Setup —
    // no need to create one by hand first (that path is covered above).
    await renderTriviaRoute();
    await screen.findByText('Build your deck');

    fireEvent.change(screen.getByLabelText('Filter algorithms'), {
      target: { value: 'bubble' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add all Arrays & Hashing' }));

    expect(await screen.findByText('1 in deck')).toBeInTheDocument();
    await waitFor(() => {
      expect(readActiveSessionRecord().config.deck).toEqual(['bubble-sort']);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Start drilling' }));

    expect(await screen.findByText('solution.py')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Bubble Sort' })).toBeInTheDocument();
    expect(screen.getByTestId('code-puzzle-well')).toBeInTheDocument();
    expect(screen.getByText('Tiles')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Check answers/ })).toBeDisabled();
    expect(screen.queryByText('Build your deck')).not.toBeInTheDocument();

    expect(screen.getByText('Level 1 · 0% covered')).toBeInTheDocument();
    expect(screen.getByText('Hiding 1 line')).toBeInTheDocument();
    expect(revealButtons()).toHaveLength(1);
    expect(readActiveSessionRecord().lastScreen).toBe('drill');
  });

  it('restores a session seeded mid-Drill and reports the configured minBlanks as the level', async () => {
    seedActiveSession('Session 1', DECK, createProgress(DECK), 'drill');

    await renderTriviaRoute();

    expect(await screen.findByText('Level 3 · 0% covered')).toBeInTheDocument();
    expect(await screen.findByText('solution.py')).toBeInTheDocument();
    expect(screen.getByText('Hiding 3 lines')).toBeInTheDocument();
    expect(revealButtons()).toHaveLength(3);
    expect(readActiveSessionRecord().progress.roundsPlayed).toBe(0);
    expect(screen.queryByText('Build your deck')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Trivia' })).not.toBeInTheDocument();
  });

  it('drills a four-algorithm deck, serving a real solution from the deck each round', async () => {
    seedActiveSession('Session 1', FOUR_DECK, createProgress(FOUR_DECK), 'drill');
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
      fireEvent.click(screen.getByRole('button', { name: /^(Next round|Try again)/ }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Check answers/ })).toBeDisabled();
      });
    }

    expect(readActiveSessionRecord().progress.roundsPlayed).toBe(4);
  });

  it('grades a submitted round, persists the progress, and serves the next one', async () => {
    seedActiveSession('Session 1', DECK, createProgress(DECK), 'drill');
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    revealButtons().forEach((button) => fireEvent.click(button));

    const check = screen.getByRole('button', { name: /^Check answers/ });
    await waitFor(() => expect(check).toBeEnabled());
    fireEvent.click(check);

    await waitFor(() => expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1));

    const drilled = readActiveSessionRecord().progress.drilled['bubble-sort']?.['3'] ?? [];
    expect(drilled).toHaveLength(3);

    await waitFor(() => {
      expect(screen.getByText(/^Level 3 · \d+% covered$/)).toBeInTheDocument();
      expect(screen.queryByText('Level 3 · 0% covered')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^(Next round|Try again)/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Check answers/ })).toBeDisabled();
    });
    expect(revealButtons()).toHaveLength(3);
    expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1);
  });

  it('"Edit deck & settings" returns to Setup without losing the deck or leaving the session', async () => {
    seedActiveSession('Session 1', DECK, createProgress(DECK), 'drill');
    await renderTriviaRoute();
    const sessionId = readActiveSessionId();
    await screen.findByText('solution.py');

    fireEvent.click(screen.getByRole('button', { name: 'Edit deck & settings' }));

    expect(await screen.findByText('Build your deck')).toBeInTheDocument();
    expect(screen.getByText('1 in deck')).toBeInTheDocument();
    expect(screen.queryByText('solution.py')).not.toBeInTheDocument();
    // Same session stays active — this is not the Home exit.
    expect(readActiveSessionId()).toBe(sessionId);
    expect(readActiveSessionRecord().lastScreen).toBe('setup');

    fireEvent.click(screen.getByRole('button', { name: 'Start drilling' }));
    expect(await screen.findByText('solution.py')).toBeInTheDocument();
  });

  it('"Back to Trivia Home" from Setup lands on Home, and a remount stays on Home — the user\'s exact repeated complaint', async () => {
    // roundsPlayed > 0 so the Home card reads "Paused · Setup" rather than
    // "New" — the point under test is which screen it resumes to, which
    // "New" (a session with no progress) does not distinguish.
    seedActiveSession('Session 1', DECK, { ...createProgress(DECK), roundsPlayed: 1 }, 'setup');
    await renderTriviaRoute();
    await screen.findByText('Build your deck');

    fireEvent.click(screen.getByRole('button', { name: 'Back to Trivia Home' }));

    expect(await screen.findByRole('heading', { name: 'Trivia' })).toBeInTheDocument();
    expect(screen.queryByText('Build your deck')).not.toBeInTheDocument();
    expect(readActiveSessionId()).toBeNull();

    // The exact scenario from the round-3 complaint: "When I go back, I still
    // see Setup related to session one." A real reload is just another read
    // of the same activeSessionId pointer — it must still say Home, not
    // silently re-enter session one's setup screen.
    cleanup();
    await renderTriviaRoute();

    expect(await screen.findByRole('heading', { name: 'Trivia' })).toBeInTheDocument();
    expect(screen.queryByText('Build your deck')).not.toBeInTheDocument();
    expect(screen.getByText('Session 1')).toBeInTheDocument();
    expect(screen.getByText('Paused · Setup')).toBeInTheDocument();
  });

  it('"Back to Trivia Home" from Drill records lastScreen: drill, so Resume returns to Drill next time, with a fresh round (never claiming to restore exact blanks)', async () => {
    seedActiveSession('Session 1', DECK, createProgress(DECK), 'drill');
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    // Real, earned progress first, so the Home card reads "Paused ·
    // Drilling" rather than "New".
    revealButtons().forEach((button) => fireEvent.click(button));
    const check = screen.getByRole('button', { name: /^Check answers/ });
    await waitFor(() => expect(check).toBeEnabled());
    fireEvent.click(check);
    await waitFor(() => expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1));

    fireEvent.click(screen.getByRole('button', { name: 'Back to Trivia Home' }));

    expect(await screen.findByRole('heading', { name: 'Trivia' })).toBeInTheDocument();
    expect(screen.getByText('Paused · Drilling')).toBeInTheDocument();
    // Resume's own copy never overpromises exact restoration.
    expect(screen.getByRole('button', { name: 'Resume' })).toHaveAttribute(
      'title',
      expect.stringMatching(/Resumes at Level \d+ with a new round/),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));

    expect(await screen.findByText('solution.py')).toBeInTheDocument();
    expect(readActiveSessionRecord().lastScreen).toBe('drill');
  });

  it('keeps two sessions fully independent: switching back and forth via Home restores each one exactly as left', async () => {
    // Fresh render auto-creates and enters "Session 1" directly on Setup —
    // that becomes Session A below, no manual creation needed.
    await renderTriviaRoute();
    await screen.findByText('Build your deck');

    // Session A, drilled for one real round.
    fireEvent.change(screen.getByLabelText('Filter algorithms'), { target: { value: 'bubble' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add all Arrays & Hashing' }));
    await waitFor(() => expect(readActiveSessionRecord().config.deck).toEqual(['bubble-sort']));
    fireEvent.click(screen.getByRole('button', { name: 'Start drilling' }));
    await screen.findByText('solution.py');

    revealButtons().forEach((button) => fireEvent.click(button));
    let check = screen.getByRole('button', { name: /^Check answers/ });
    await waitFor(() => expect(check).toBeEnabled());
    fireEvent.click(check);
    await waitFor(() => expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1));

    const sessionAId = readActiveSessionId();
    const drilledOnA = readActiveSessionRecord().progress.drilled['bubble-sort']?.['1'] ?? [];
    expect(drilledOnA.length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Back to Trivia Home' }));
    expect(await screen.findByRole('heading', { name: 'Trivia' })).toBeInTheDocument();

    // Session B, a different deck, drilled differently.
    fireEvent.click(screen.getAllByRole('button', { name: 'New session' })[0]);
    await screen.findByText('Build your deck');
    const sessionBId = readActiveSessionId();
    expect(sessionBId).not.toBe(sessionAId);
    expect(readActiveSessionRecord().config.deck).toEqual([]);

    fireEvent.change(screen.getByLabelText('Filter algorithms'), { target: { value: 'two' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add all Arrays & Hashing' }));
    await waitFor(() => expect(readActiveSessionRecord().config.deck).toEqual(['two-sum']));
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

    // Back to Home, then Resume A from its own card specifically — both
    // cards are on Home at once, so the card is found by its own name first
    // and the Resume button scoped to that card, rather than assuming order.
    fireEvent.click(screen.getByRole('button', { name: 'Back to Trivia Home' }));
    await screen.findByRole('heading', { name: 'Trivia' });

    const sessionAName = readTriviaSessions().find((s) => s.id === sessionAId)?.name ?? '';
    const sessionACard = screen.getByText(sessionAName).closest('.ui-card');
    if (!sessionACard) throw new Error('Session A card not found on Home');
    fireEvent.click(within(sessionACard as HTMLElement).getByRole('button', { name: 'Resume' }));
    await waitFor(() => expect(readActiveSessionId()).toBe(sessionAId));

    const resumedA = readActiveSessionRecord();
    expect(resumedA.config.deck).toEqual(['bubble-sort']);
    expect(resumedA.progress.roundsPlayed).toBe(1);
    expect(resumedA.progress.drilled['bubble-sort']?.['1']).toEqual(drilledOnA);
    expect(resumedA.progress.drilled['two-sum']).toBeUndefined();

    const sessionBAfter = readTriviaSessions().find((s) => s.id === sessionBId);
    expect(sessionBAfter?.config.deck).toEqual(['two-sum']);
    expect(sessionBAfter?.progress.roundsPlayed).toBe(1);
  });

  it('raises maxBlanks on a session without resetting its drilled progress, via Edit deck & settings', async () => {
    seedActiveSession('Session 1', DECK, createProgress(DECK), 'drill');
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

    fireEvent.click(screen.getByRole('button', { name: 'Edit deck & settings' }));
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
    seedActiveSession('Finished Deck', finishedConfig, finishedProgress, 'drill');

    await renderTriviaRoute();
    expect(await screen.findByText('Deck complete')).toBeInTheDocument();

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

  it('offers "Back to Trivia Home" as a distinct exit from the completion card, not just "Adjust settings"', async () => {
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
    // lastScreen: 'drill' — a finished session reached via drilling, not
    // via Setup, so this exercises the completion card as it is actually
    // reached: there is no Setup detour already on screen to fall back on.
    seedActiveSession('Finished Deck', finishedConfig, finishedProgress, 'drill');

    await renderTriviaRoute();
    expect(await screen.findByText('Deck complete')).toBeInTheDocument();

    // Both actions present and distinctly labelled — never the same button
    // asked to both "edit" and "leave entirely".
    expect(screen.getByRole('button', { name: 'Adjust settings to keep going' })).toBeInTheDocument();
    const homeBtn = screen.getByRole('button', { name: 'Back to Trivia Home' });

    fireEvent.click(homeBtn);

    expect(await screen.findByRole('heading', { name: 'Trivia' })).toBeInTheDocument();
    expect(readActiveSessionId()).toBeNull();
    expect(screen.getByText('Deck complete')).toBeInTheDocument(); // now the card's status badge on the Home card
  });

  it('keeps the sessions list and active pointer consistent through rename, delete, and create in quick succession, all from Home', async () => {
    // Fresh render auto-creates and enters "Session 1" directly on Setup —
    // that becomes Session A below, no manual creation needed.
    await renderTriviaRoute();
    await screen.findByText('Build your deck');
    const sessionA = readActiveSessionRecord();

    fireEvent.click(screen.getByRole('button', { name: 'Back to Trivia Home' }));
    await screen.findByRole('heading', { name: 'Trivia' });
    fireEvent.click(screen.getAllByRole('button', { name: 'New session' })[0]);
    await screen.findByText('Build your deck');
    const sessionB = readActiveSessionRecord();

    fireEvent.click(screen.getByRole('button', { name: 'Back to Trivia Home' }));
    await screen.findByRole('heading', { name: 'Trivia' });
    fireEvent.click(screen.getAllByRole('button', { name: 'New session' })[0]);
    await screen.findByText('Build your deck');
    const sessionC = readActiveSessionRecord();

    fireEvent.click(screen.getByRole('button', { name: 'Back to Trivia Home' }));
    await screen.findByRole('heading', { name: 'Trivia' });
    await waitFor(() => expect(readTriviaSessions()).toHaveLength(3));

    // Rename C ...
    fireEvent.click(screen.getByRole('button', { name: `Rename ${sessionC.name}` }));
    fireEvent.change(screen.getByDisplayValue(sessionC.name), {
      target: { value: 'Focus Session' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save session name' }));
    expect(await screen.findByText('Focus Session')).toBeInTheDocument();

    // ...immediately delete a different session (B) ...
    fireEvent.click(screen.getByRole('button', { name: `Delete ${sessionB.name}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete session' }));
    await waitFor(() => expect(readTriviaSessions()).toHaveLength(2));

    // ...then immediately create yet another new one.
    fireEvent.click(screen.getAllByRole('button', { name: 'New session' })[0]);
    await screen.findByText('Build your deck');
    await waitFor(() => expect(readTriviaSessions()).toHaveLength(3));
    const sessionD = readActiveSessionRecord();

    const finalSessions = readTriviaSessions();
    expect(finalSessions.find((s) => s.id === sessionB.id)).toBeUndefined();
    const finalA = finalSessions.find((s) => s.id === sessionA.id);
    expect(finalA).toBeDefined();
    expect(finalA?.name).toBe(sessionA.name);
    const finalC = finalSessions.find((s) => s.id === sessionC.id);
    expect(finalC?.name).toBe('Focus Session');
    expect(readActiveSessionId()).toBe(sessionD.id);
    expect(sessionD.id).not.toBe(sessionB.id);
    expect(finalSessions.map((s) => s.id).sort()).toEqual(
      [sessionA.id, sessionC.id, sessionD.id].sort(),
    );
  });

  it('deleting every session returns Home to its empty state — zero sessions is legitimate now', async () => {
    // Fresh render auto-creates and enters "Session 1" directly on Setup —
    // step back out to Home so there is exactly one session to delete; the
    // deletion itself (mid-mount, not bootstrap-driven) is unaffected by the
    // bootstrap change.
    await renderTriviaRoute();
    await screen.findByText('Build your deck');
    fireEvent.click(screen.getByRole('button', { name: 'Back to Trivia Home' }));
    await screen.findByRole('heading', { name: 'Trivia' });

    expect(screen.getByRole('button', { name: /^Delete /})).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /^Delete /}));
    fireEvent.click(screen.getByRole('button', { name: 'Delete session' }));

    expect(await screen.findByText('Build your first trivia deck')).toBeInTheDocument();
    expect(readTriviaSessions()).toEqual([]);
  });

  it('shows an unambiguous "New session" identity right after creating one, distinct from a session with real progress', async () => {
    seedActiveSession('Session 1', DECK, createProgress(DECK), 'drill');
    await renderTriviaRoute();
    await screen.findByText('solution.py');

    revealButtons().forEach((button) => fireEvent.click(button));
    const check = screen.getByRole('button', { name: /^Check answers/ });
    await waitFor(() => expect(check).toBeEnabled());
    fireEvent.click(check);
    await waitFor(() => expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1));

    fireEvent.click(screen.getByRole('button', { name: 'Edit deck & settings' }));
    expect(await screen.findByText('Now editing session')).toBeInTheDocument();
    expect(screen.getByText('Paused · progress saved')).toBeInTheDocument();
    expect(screen.queryByText('New session')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to Trivia Home' }));
    await screen.findByRole('heading', { name: 'Trivia' });
    fireEvent.click(screen.getAllByRole('button', { name: 'New session' })[0]);

    expect(await screen.findByText('New session')).toBeInTheDocument();
    expect(screen.queryByText('Paused · progress saved')).not.toBeInTheDocument();
    expect(readActiveSessionRecord().config.deck).toEqual([]);
  });

  /* TASKS.md 9.8: "I want this width and height adjustment on sections
     supported inside of trivia sections as well, like the trivia main page"
     — Home is the one screen that previously had no resize handle wired to
     it at all (the schema reserved the slot but nothing rendered a
     DragHandle for it). A reload has to see the pinned height, not just the
     same render. */
  it('persists a resized Home session-list panel height across a reload', async () => {
    // Fresh render auto-creates and enters "Session 1" directly on Setup —
    // step back out to Home first so there is a real Home screen to resize.
    const { unmount } = await renderTriviaRoute();
    await screen.findByText('Build your deck');
    fireEvent.click(screen.getByRole('button', { name: 'Back to Trivia Home' }));
    await screen.findByRole('heading', { name: 'Trivia' });

    const handle = screen.getByRole('separator', { name: 'Resize the trivia session list' });
    expect(handle).toHaveAttribute('aria-valuetext', 'Automatic, sized to content');

    fireEvent.keyDown(handle, { key: 'ArrowDown' });

    const stored = JSON.parse(window.localStorage.getItem(TRIVIA_LAYOUT_KEY) ?? 'null');
    expect(stored?.panelHeights.sessionList).toBe(MIN_PANEL_HEIGHT_PX);
    expect(handle).toHaveAttribute('aria-valuenow', String(MIN_PANEL_HEIGHT_PX));

    unmount();
    await renderTriviaRoute();
    await screen.findByRole('heading', { name: 'Trivia' });

    const reloadedHandle = screen.getByRole('separator', { name: 'Resize the trivia session list' });
    expect(reloadedHandle).toHaveAttribute('aria-valuenow', String(MIN_PANEL_HEIGHT_PX));
    expect(reloadedHandle).not.toHaveAttribute('aria-valuetext');
  });

  it('never renders a ghost-variant button anywhere on the /trivia route (9.5)', async () => {
    // Checked on both screens a fresh visit actually reaches: the
    // auto-created session's Setup screen first, then Home once backed out
    // of it — a strict superset of the single screen this used to check.
    await renderTriviaRoute();
    await screen.findByText('Build your deck');
    screen.getAllByRole('button').forEach((button) => {
      expect(button.className).not.toMatch(/ui-btn--ghost/);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Back to Trivia Home' }));
    await screen.findByRole('heading', { name: 'Trivia' });
    screen.getAllByRole('button').forEach((button) => {
      expect(button.className).not.toMatch(/ui-btn--ghost/);
    });
  });
});
