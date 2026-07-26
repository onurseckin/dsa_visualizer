/* Trivia: progressive code-occlusion drill for memorising solutions.

   The technique is cloze deletion applied to source lines, escalated by
   coverage rather than by a timer: at level N the drill hides N lines at once,
   and it will not move to N+1 until every blankable line of every deck entry has
   been drilled at level N. That guarantees you meet each line before the work
   gets harder, instead of re-drilling whichever lines the shuffle happens to
   favour. Missed lines are additionally weighted to come back sooner, which is
   the Leitner idea reduced to its useful core.

   Two answer modes share one round shape: `choice` supplies shuffled tiles to
   drag into the blanks (the intermediate step), `type` asks you to write the
   line from memory (the hard step). */

export type TriviaMode = "choice" | "type";

export interface TriviaConfig {
  /** Algorithm ids in the current deck. */
  deck: string[];
  mode: TriviaMode;
  /** Difficulty floor — how many lines are hidden in the first round. */
  minBlanks: number;
  /** Difficulty ceiling — the drill completes after this level is covered. */
  maxBlanks: number;
  /** Choice mode: also offer plausible wrong lines, not just the real ones. */
  includeDistractors: boolean;
}

export interface PuzzleLine {
  /** 1-based, matching the `codeLine` numbering the step engine already uses. */
  number: number;
  /** The full source line, indentation included. */
  text: string;
  /** Leading whitespace, shown as a fixed prefix so answers never hinge on it. */
  indent: string;
  /** The answerable content of the line (text without its indent). */
  content: string;
  /** Blank, or author-excluded, lines are never hidden. */
  blankable: boolean;
}

export interface TriviaTile {
  id: string;
  text: string;
  /** The line number this tile answers, or null for a distractor. */
  correctFor: number | null;
}

export interface TriviaRound {
  algorithmId: string;
  /** How many lines this round hides. */
  level: number;
  lines: PuzzleLine[];
  /** Hidden line numbers, ascending. */
  blanks: number[];
  /** Shuffled candidates for `choice` mode; empty in `type` mode. */
  tiles: TriviaTile[];
}

export interface TriviaLineStat {
  attempts: number;
  misses: number;
}

export interface TriviaProgress {
  /** Current difficulty: how many lines are hidden per round. */
  level: number;
  /** algorithmId -> level -> line numbers already drilled at that level. */
  drilled: Record<string, Record<string, number[]>>;
  /** algorithmId -> line number -> running accuracy, drives weighted recall. */
  stats: Record<string, Record<string, TriviaLineStat>>;
  /** True once `maxBlanks` has been fully covered. */
  completed: boolean;
  roundsPlayed: number;
}

export interface TriviaGrade {
  /** Line number -> whether the submitted answer matched. */
  perBlank: Record<number, boolean>;
  allCorrect: boolean;
}

/* Author-supplied trivia metadata on an algorithm. Everything is optional: a
   solution with no metadata still drills correctly straight from its `code`. */
export interface TriviaMeta {
  /** 1-based line numbers to never hide (a bare `return`, a decorative line). */
  skipLines?: number[];
  /** Plausible-but-wrong lines, used as distractor tiles in choice mode. */
  distractors?: string[];
  /** Nudges shown on request, keyed by line number. */
  hints?: { line: number; hint: string }[];
  /** Comprehensive line-by-line educational explanations keyed by 1-based line number. */
  lineExplanations?: Record<number, string>;
}

/* Round 3 session IA (TASKS.md 9.1): `status` never told a caller *which
   screen* a session was left on, only a derived active/paused label — that
   ambiguity is the root of "I still see Setup related to session one" after
   Exit. `lastScreen` replaces it outright: it is the one durable fact "which
   screen does Resume land on", vs. `activeSessionId` (page-level, not stored
   per-session) which is the one durable fact "is any session even open right
   now". Screen is always derived from the pair, never hand-set. */
export type TriviaScreen = "setup" | "drill";

export interface TriviaSessionRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  config: TriviaConfig;
  progress: TriviaProgress;
  /** Which screen Resume returns to. Set on every exit, not just on entry. */
  lastScreen: TriviaScreen;
}
