import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Search,
  Hash,
  Network,
  Activity,
  Info,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Binary,
  GitCommit,
  Eye,
  BookOpen,
} from "lucide-react";
import { useCanvasBox, type Size } from "./vizGeometry";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type SAMStudioModality =
  | "suffix_automaton_online"
  | "suffix_array_kasai_lcp"
  | "distinct_substrings_dag_dp"
  | "pattern_search_occurrence_count";

export type SAMPresetId = "banana" | "abracadabra" | "aabaab" | "mississippi" | "cocoa" | "bababab";

export interface SAMState {
  readonly id: number;
  readonly len: number;
  readonly link: number;
  readonly next: Readonly<Record<string, number>>;
  readonly isClone: boolean;
  readonly firstPos: number;
  readonly cloneFrom?: number;
}

export interface SuffixAutomaton {
  readonly text: string;
  readonly states: readonly SAMState[];
  readonly last: number;
  readonly totalTransitions: number;
  readonly distinctSubstrings: number;
}

export type SAMConstructionPhase =
  | "init"
  | "extend_start"
  | "create_cur"
  | "traverse_links"
  | "link_to_root"
  | "link_continuous"
  | "split_clone"
  | "redirect_links"
  | "extend_complete"
  | "built";

export interface SAMStepTrace {
  readonly stepIndex: number;
  readonly charIndex: number;
  readonly char: string;
  readonly phase: SAMConstructionPhase;
  readonly title: string;
  readonly description: string;
  readonly curStateId?: number;
  readonly cloneStateId?: number;
  readonly activeStateId?: number;
  readonly qStateId?: number;
  readonly pStateId?: number;
  readonly redirectedEdges?: readonly { from: number; to: number; char: string }[];
  readonly samSnapshot: SuffixAutomaton;
}

export interface SuffixArrayResult {
  readonly text: string;
  readonly sa: readonly number[];
  readonly rank: readonly number[];
  readonly suffixes: readonly string[];
}

export interface KasaiStepTrace {
  readonly stepIndex: number;
  readonly charIndex: number;
  readonly saRank: number;
  readonly prevSARank: number;
  readonly prevSuffixIndex: number;
  readonly hInitial: number;
  readonly hFinal: number;
  readonly matchLength: number;
  readonly description: string;
  readonly matchedChars: string;
}

export interface KasaiLCPResult {
  readonly text: string;
  readonly sa: readonly number[];
  readonly rank: readonly number[];
  readonly lcp: readonly number[];
  readonly hValues: readonly number[];
  readonly maxLCP: number;
  readonly avgLCP: number;
  readonly steps: readonly KasaiStepTrace[];
}

export interface LCPQueryResult {
  readonly suffixIndex1: number;
  readonly suffixIndex2: number;
  readonly rank1: number;
  readonly rank2: number;
  readonly lcpValue: number;
  readonly commonPrefix: string;
  readonly minLCPRankIndex: number;
}

export interface DAGSubstringsDPResult {
  readonly dp: readonly number[];
  readonly totalDistinct: number;
  readonly sumFormulaTotal: number;
  readonly topologicalOrder: readonly number[];
}

export interface KthSubstringResult {
  readonly k: number;
  readonly substring: string;
  readonly path: readonly { from: number; to: number; char: string }[];
  readonly found: boolean;
  readonly stateId: number;
}

export interface SAMPatternSearchResult {
  readonly pattern: string;
  readonly found: boolean;
  readonly matchedLength: number;
  readonly finalStateId: number | null;
  readonly path: readonly { from: number; to: number; char: string }[];
  readonly occurrences: readonly number[];
  readonly occurrenceCount: number;
  readonly mismatchIndex: number | null;
  readonly mismatchChar: string | null;
}

export interface EndposPropagationResult {
  readonly endposMap: Readonly<Record<number, readonly number[]>>;
  readonly occurrenceCounts: Readonly<Record<number, number>>;
  readonly linkTreeChildren: Readonly<Record<number, readonly number[]>>;
}

export interface SAMGraphNode {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly len: number;
  readonly link: number;
  readonly isClone: boolean;
  readonly isTerminal?: boolean;
  readonly occurrences?: number;
  readonly endpos?: readonly number[];
  readonly label: string;
  readonly layer: number;
}

export interface SAMGraphEdge {
  readonly from: number;
  readonly to: number;
  readonly char?: string;
  readonly type: "transition" | "suffix_link" | "tree_link";
  readonly isRedirected?: boolean;
  readonly isCloneEdge?: boolean;
}

export interface SAMGraphLayout {
  readonly nodes: readonly SAMGraphNode[];
  readonly edges: readonly SAMGraphEdge[];
  readonly width: number;
  readonly height: number;
}

export interface SAMPreset {
  readonly id: SAMPresetId;
  readonly name: string;
  readonly text: string;
  readonly defaultPattern: string;
  readonly defaultK: number;
  readonly defaultSuffixQuery: readonly [number, number];
  readonly description: string;
  readonly theoryNotes: string;
  readonly properties: {
    readonly states: number;
    readonly transitions: number;
    readonly distinctSubstrings: number;
    readonly maxLCP: number;
  };
}

export interface SuffixAutomataStudioProps {
  readonly initialText?: string;
  readonly initialModality?: SAMStudioModality;
  readonly initialPreset?: SAMPresetId;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onPresetChange?: (id: SAMPresetId) => void;
  readonly onModalityChange?: (modality: SAMStudioModality) => void;
}

// ============================================================================
// 2. PRESETS DICTIONARY
// ============================================================================

export const SAM_STUDIO_PRESETS: Record<SAMPresetId, SAMPreset> = {
  banana: {
    id: "banana",
    name: "Banana (Classic Suffix Split)",
    text: "banana",
    defaultPattern: "an",
    defaultK: 7,
    defaultSuffixQuery: [1, 3],
    description:
      "The quintessential string showcasing suffix automaton cloning when transition on 'a' splits continuous len.",
    theoryNotes:
      "Upon reading the second 'a' (index 3), state q (len 1, 'a') has len[q] != len[p] + 1 (len 2 vs len 1 + 1), triggering a state split clone.",
    properties: {
      states: 10,
      transitions: 11,
      distinctSubstrings: 15,
      maxLCP: 3,
    },
  },
  abracadabra: {
    id: "abracadabra",
    name: "Abracadabra (Multi-Periodicity)",
    text: "abracadabra",
    defaultPattern: "abra",
    defaultK: 25,
    defaultSuffixQuery: [0, 7],
    description:
      "Classic magic incantation exhibiting rich overlapping prefixes, repeated occurrences of 'abra', and deep suffix links.",
    theoryNotes:
      "'abra' appears twice at index 0 and 7. The suffix link tree branches into multiple shared suffix equivalence classes.",
    properties: {
      states: 12,
      transitions: 17,
      distinctSubstrings: 54,
      maxLCP: 4,
    },
  },
  aabaab: {
    id: "aabaab",
    name: "AABAAB (Fibonacci Substring)",
    text: "aabaab",
    defaultPattern: "aab",
    defaultK: 8,
    defaultSuffixQuery: [0, 3],
    description:
      "Repetitive prefix doubling structure with overlapping squares and maximum suffix link rewiring.",
    theoryNotes:
      "Showcases periodic repetitions where state cloning preserves endpos disjointness across both occurrences of 'aab'.",
    properties: {
      states: 7,
      transitions: 8,
      distinctSubstrings: 14,
      maxLCP: 3,
    },
  },
  mississippi: {
    id: "mississippi",
    name: "Mississippi (High Multiplicity)",
    text: "mississippi",
    defaultPattern: "iss",
    defaultK: 20,
    defaultSuffixQuery: [1, 4],
    description:
      "Dense repetition of 'i', 's', and 'p' producing multiple identical rank neighbors and high Kasai LCP values.",
    theoryNotes:
      "Demonstrates multiple clone splitting events on characters 's' and 'i', illustrating endpos propagation up the link tree.",
    properties: {
      states: 18,
      transitions: 24,
      distinctSubstrings: 53,
      maxLCP: 4,
    },
  },
  cocoa: {
    id: "cocoa",
    name: "Cocoa (Short Disjoint Clone)",
    text: "cocoa",
    defaultPattern: "co",
    defaultK: 6,
    defaultSuffixQuery: [0, 2],
    description:
      "Compact 5-character string demonstrating clone splitting on 'o' and clean distinct substring paths.",
    theoryNotes:
      "Transition from 'c' to 'co' creates equivalence classes that split when the second 'co' is encountered.",
    properties: {
      states: 6,
      transitions: 8,
      distinctSubstrings: 12,
      maxLCP: 2,
    },
  },
  bababab: {
    id: "bababab",
    name: "BABABAB (Alternating Period)",
    text: "bababab",
    defaultPattern: "bab",
    defaultK: 9,
    defaultSuffixQuery: [0, 2],
    description:
      "Alternating binary sequence illustrating maximal LCP cascades and tight SAM graph topologies.",
    theoryNotes:
      "With period 2, the suffix array exhibits maximal LCP values (5, 4, 3, 2, 1) and Kasai's h-value descends smoothly.",
    properties: {
      states: 8,
      transitions: 8,
      distinctSubstrings: 13,
      maxLCP: 5,
    },
  },
};

// ============================================================================
// 3. PURE ALGORITHMS & HELPERS
// ============================================================================

/**
 * Counts the total number of distinct substrings in O(|V|) time using SAM formula:
 * Sum_{u > 0} (len[u] - len[link[u]])
 */
export function countDistinctSubstringsSAM(sam: SuffixAutomaton): number {
  let count = 0;
  for (let u = 1; u < sam.states.length; u++) {
    const st = sam.states[u];
    const parentLen = st.link >= 0 ? sam.states[st.link].len : 0;
    count += st.len - parentLen;
  }
  return count;
}

/**
 * Builds the Suffix Automaton in O(N) time and O(N) space.
 * Guarantee: states <= 2N - 1, transitions <= 3N - 4 for N >= 3.
 */
export function buildSuffixAutomaton(text: string): SuffixAutomaton {
  const states: SAMState[] = [{ id: 0, len: 0, link: -1, next: {}, isClone: false, firstPos: -1 }];
  let last = 0;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const cur = states.length;
    states.push({
      id: cur,
      len: states[last].len + 1,
      link: 0,
      next: {},
      isClone: false,
      firstPos: i,
    });

    let p = last;
    while (p !== -1 && !(c in states[p].next)) {
      states[p] = {
        ...states[p],
        next: { ...states[p].next, [c]: cur },
      };
      p = states[p].link;
    }

    if (p === -1) {
      states[cur] = { ...states[cur], link: 0 };
    } else {
      const q = states[p].next[c];
      if (states[p].len + 1 === states[q].len) {
        states[cur] = { ...states[cur], link: q };
      } else {
        const clone = states.length;
        states.push({
          id: clone,
          len: states[p].len + 1,
          link: states[q].link,
          next: { ...states[q].next },
          isClone: true,
          firstPos: states[q].firstPos,
          cloneFrom: q,
        });

        while (p !== -1 && states[p].next[c] === q) {
          states[p] = {
            ...states[p],
            next: { ...states[p].next, [c]: clone },
          };
          p = states[p].link;
        }

        states[q] = { ...states[q], link: clone };
        states[cur] = { ...states[cur], link: clone };
      }
    }

    last = cur;
  }

  let totalTransitions = 0;
  for (const st of states) {
    totalTransitions += Object.keys(st.next).length;
  }

  const distinctSubstrings = countDistinctSubstringsSAM({
    text,
    states,
    last,
    totalTransitions,
    distinctSubstrings: 0,
  });

  return {
    text,
    states,
    last,
    totalTransitions,
    distinctSubstrings,
  };
}

/**
 * Builds step-by-step trace of online SAM construction for visualizer scrubbing.
 */
export function buildSuffixAutomatonStepByStep(text: string): SAMStepTrace[] {
  const steps: SAMStepTrace[] = [];
  const currentStates: SAMState[] = [
    { id: 0, len: 0, link: -1, next: {}, isClone: false, firstPos: -1 },
  ];
  let last = 0;

  const snap = (): SuffixAutomaton => {
    let tr = 0;
    for (const s of currentStates) tr += Object.keys(s.next).length;
    const sam: SuffixAutomaton = {
      text,
      states: currentStates.map((s) => ({ ...s, next: { ...s.next } })),
      last,
      totalTransitions: tr,
      distinctSubstrings: 0,
    };
    return {
      ...sam,
      distinctSubstrings: countDistinctSubstringsSAM(sam),
    };
  };

  steps.push({
    stepIndex: 0,
    charIndex: -1,
    char: "",
    phase: "init",
    title: "Initialize SAM Root",
    description: "Initial state 0 initialized with len=0, link=-1 (the empty prefix).",
    activeStateId: 0,
    samSnapshot: snap(),
  });

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const cur = currentStates.length;

    steps.push({
      stepIndex: steps.length,
      charIndex: i,
      char: c,
      phase: "extend_start",
      title: `Step ${i + 1}/${text.length}: Process Char '${c}'`,
      description: `Extending automaton with character '${c}' at text index ${i}. Starting from last state ${last}.`,
      activeStateId: last,
      samSnapshot: snap(),
    });

    currentStates.push({
      id: cur,
      len: currentStates[last].len + 1,
      link: 0,
      next: {},
      isClone: false,
      firstPos: i,
    });

    steps.push({
      stepIndex: steps.length,
      charIndex: i,
      char: c,
      phase: "create_cur",
      title: `Create State cur=${cur}`,
      description: `Created new state ${cur} with len=${currentStates[cur].len} (len[last]+1) representing prefix "${text.slice(0, i + 1)}".`,
      curStateId: cur,
      activeStateId: cur,
      samSnapshot: snap(),
    });

    let p = last;
    const redirected: { from: number; to: number; char: string }[] = [];

    while (p !== -1 && !(c in currentStates[p].next)) {
      currentStates[p] = {
        ...currentStates[p],
        next: { ...currentStates[p].next, [c]: cur },
      };
      redirected.push({ from: p, to: cur, char: c });
      p = currentStates[p].link;
    }

    steps.push({
      stepIndex: steps.length,
      charIndex: i,
      char: c,
      phase: "traverse_links",
      title: `Traverse Suffix Links from ${last}`,
      description: `Walked suffix links adding transition '${c}' -> ${cur} on states [${redirected.map((r) => r.from).join(", ")}]. Stopped at state p=${p}.`,
      curStateId: cur,
      pStateId: p,
      redirectedEdges: [...redirected],
      samSnapshot: snap(),
    });

    if (p === -1) {
      currentStates[cur] = { ...currentStates[cur], link: 0 };
      steps.push({
        stepIndex: steps.length,
        charIndex: i,
        char: c,
        phase: "link_to_root",
        title: `Link cur=${cur} to Root (0)`,
        description: `Reached p=-1 without finding existing transition on '${c}'. Character '${c}' has not appeared in any suffix; link[cur]=0.`,
        curStateId: cur,
        activeStateId: 0,
        samSnapshot: snap(),
      });
    } else {
      const q = currentStates[p].next[c];
      if (currentStates[p].len + 1 === currentStates[q].len) {
        currentStates[cur] = { ...currentStates[cur], link: q };
        steps.push({
          stepIndex: steps.length,
          charIndex: i,
          char: c,
          phase: "link_continuous",
          title: `Continuous Transition: Link cur=${cur} -> q=${q}`,
          description: `len[q] == len[p] + 1 (${currentStates[q].len} == ${currentStates[p].len + 1}). Continuous transition; link[${cur}] = ${q}.`,
          curStateId: cur,
          qStateId: q,
          pStateId: p,
          samSnapshot: snap(),
        });
      } else {
        const clone = currentStates.length;
        currentStates.push({
          id: clone,
          len: currentStates[p].len + 1,
          link: currentStates[q].link,
          next: { ...currentStates[q].next },
          isClone: true,
          firstPos: currentStates[q].firstPos,
          cloneFrom: q,
        });

        steps.push({
          stepIndex: steps.length,
          charIndex: i,
          char: c,
          phase: "split_clone",
          title: `State Split: Clone q=${q} -> clone=${clone}`,
          description: `Non-continuous transition len[q]=${currentStates[q].len} > len[p]+1=${currentStates[p].len + 1}. Cloned state ${q} into state ${clone} with len=${currentStates[clone].len}.`,
          curStateId: cur,
          qStateId: q,
          cloneStateId: clone,
          pStateId: p,
          samSnapshot: snap(),
        });

        const cloneRedirected: { from: number; to: number; char: string }[] = [];
        while (p !== -1 && currentStates[p].next[c] === q) {
          currentStates[p] = {
            ...currentStates[p],
            next: { ...currentStates[p].next, [c]: clone },
          };
          cloneRedirected.push({ from: p, to: clone, char: c });
          p = currentStates[p].link;
        }

        currentStates[q] = { ...currentStates[q], link: clone };
        currentStates[cur] = { ...currentStates[cur], link: clone };

        steps.push({
          stepIndex: steps.length,
          charIndex: i,
          char: c,
          phase: "redirect_links",
          title: `Redirect Ancestral Transitions to Clone ${clone}`,
          description: `Redirected transitions on states [${cloneRedirected.map((r) => r.from).join(", ")}] from ${q} to ${clone}. Set link[${q}]=${clone} and link[${cur}]=${clone}.`,
          curStateId: cur,
          qStateId: q,
          cloneStateId: clone,
          redirectedEdges: [...cloneRedirected],
          samSnapshot: snap(),
        });
      }
    }

    last = cur;
    steps.push({
      stepIndex: steps.length,
      charIndex: i,
      char: c,
      phase: "extend_complete",
      title: `Complete Extension for '${c}'`,
      description: `Character '${c}' integrated. Updated last = ${last}. Automaton now has ${currentStates.length} states.`,
      activeStateId: last,
      samSnapshot: snap(),
    });
  }

  steps.push({
    stepIndex: steps.length,
    charIndex: text.length,
    char: "",
    phase: "built",
    title: "Suffix Automaton Construction Complete",
    description: `Full SAM constructed for "${text}". Total states: ${currentStates.length} (<= 2N-1 = ${2 * text.length - 1}), distinct substrings: ${countDistinctSubstringsSAM(snap())}.`,
    samSnapshot: snap(),
  });

  return steps;
}

/**
 * Builds standard Suffix Array SA and Rank array in O(N log N) / O(N^2) comparison.
 */
export function buildSuffixArray(text: string): SuffixArrayResult {
  const n = text.length;
  const indices: number[] = Array.from({ length: n }, (_, i) => i);
  indices.sort((a, b) => {
    const sA = text.slice(a);
    const sB = text.slice(b);
    return sA.localeCompare(sB);
  });

  const sa = indices;
  const rank = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    rank[sa[i]] = i;
  }

  const suffixes = sa.map((idx) => text.slice(idx));

  return {
    text,
    sa,
    rank,
    suffixes,
  };
}

/**
 * Computes Kasai's LCP array in O(N) time with invariant h[i+1] >= h[i] - 1.
 */
export function computeKasaiLCP(text: string, sa: readonly number[]): KasaiLCPResult {
  const n = text.length;
  if (n === 0) {
    return {
      text,
      sa: [],
      rank: [],
      lcp: [],
      hValues: [],
      maxLCP: 0,
      avgLCP: 0,
      steps: [],
    };
  }

  const rank = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    rank[sa[i]] = i;
  }

  const lcp = new Array(Math.max(n - 1, 0)).fill(0);
  const hValues = new Array(n).fill(0);
  const steps: KasaiStepTrace[] = [];

  let h = 0;
  for (let i = 0; i < n; i++) {
    const r = rank[i];
    const hInit = h;

    if (r > 0) {
      const j = sa[r - 1];
      while (i + h < n && j + h < n && text[i + h] === text[j + h]) {
        h++;
      }
      lcp[r - 1] = h;
      hValues[i] = h;

      steps.push({
        stepIndex: steps.length,
        charIndex: i,
        saRank: r,
        prevSARank: r - 1,
        prevSuffixIndex: j,
        hInitial: hInit,
        hFinal: h,
        matchLength: h,
        description: `Suffix[${i}] ("${text.slice(i, Math.min(n, i + 8))}") vs SA-prev Suffix[${j}] ("${text.slice(j, Math.min(n, j + 8))}"): Started at h=${hInit} (by invariant h>=h_prev-1), expanded to LCP=${h}.`,
        matchedChars: text.slice(i, i + h),
      });

      if (h > 0) {
        h--;
      }
    } else {
      hValues[i] = 0;
      h = 0;
      steps.push({
        stepIndex: steps.length,
        charIndex: i,
        saRank: 0,
        prevSARank: -1,
        prevSuffixIndex: -1,
        hInitial: 0,
        hFinal: 0,
        matchLength: 0,
        description: `Suffix[${i}] ("${text.slice(i, Math.min(n, i + 8))}") is first in lexicographical order (rank 0); no SA predecessor.`,
        matchedChars: "",
      });
    }
  }

  const maxLCP = lcp.length > 0 ? Math.max(...lcp) : 0;
  const sumLCP = lcp.reduce((acc, v) => acc + v, 0);
  const avgLCP = lcp.length > 0 ? sumLCP / lcp.length : 0;

  return {
    text,
    sa,
    rank,
    lcp,
    hValues,
    maxLCP,
    avgLCP,
    steps,
  };
}

/**
 * Queries Range Minimum Query (RMQ) LCP between any two suffixes in O(N) interval scan.
 */
export function queryLCPInterval(
  lcp: readonly number[],
  rank1: number,
  rank2: number,
): LCPQueryResult {
  if (rank1 === rank2) {
    return {
      suffixIndex1: rank1,
      suffixIndex2: rank2,
      rank1,
      rank2,
      lcpValue: 0,
      commonPrefix: "",
      minLCPRankIndex: rank1,
    };
  }

  const rMin = Math.min(rank1, rank2);
  const rMax = Math.max(rank1, rank2);

  let minVal = Infinity;
  let minIdx = rMin;

  for (let k = rMin; k < rMax; k++) {
    if (lcp[k] < minVal) {
      minVal = lcp[k];
      minIdx = k;
    }
  }

  return {
    suffixIndex1: rank1,
    suffixIndex2: rank2,
    rank1,
    rank2,
    lcpValue: minVal === Infinity ? 0 : minVal,
    commonPrefix: "",
    minLCPRankIndex: minIdx,
  };
}

/**
 * Computes DP path counts for distinct substrings on the SAM DAG.
 * dp[u] = 1 + Sum_{(u -> v)} dp[v]
 */
export function computeDAGSubstringsDP(sam: SuffixAutomaton): DAGSubstringsDPResult {
  const numStates = sam.states.length;
  if (numStates === 0) {
    return {
      dp: [],
      totalDistinct: 0,
      sumFormulaTotal: 0,
      topologicalOrder: [],
    };
  }

  // Sort states by length descending (topological order for SAM DAG)
  const order: number[] = Array.from({ length: numStates }, (_, i) => i);
  order.sort((a, b) => sam.states[b].len - sam.states[a].len);

  const dp: number[] = new Array(numStates).fill(1); // 1 accounts for empty string ending at node u

  for (const u of order) {
    const st = sam.states[u];
    for (const charKey of Object.keys(st.next)) {
      const v = st.next[charKey];
      dp[u] += dp[v];
    }
  }

  const totalDistinct = dp[0] > 0 ? dp[0] - 1 : 0;
  const sumFormulaTotal = countDistinctSubstringsSAM(sam);

  return {
    dp,
    totalDistinct,
    sumFormulaTotal,
    topologicalOrder: order,
  };
}

/**
 * Finds the k-th lexicographical substring (1-indexed) in O(|S|) using SAM DAG path DP.
 */
export function findKthSubstring(sam: SuffixAutomaton, k: number): KthSubstringResult {
  const { dp, totalDistinct } = computeDAGSubstringsDP(sam);

  if (k < 1 || k > totalDistinct || sam.states.length === 0) {
    return {
      k,
      substring: "",
      path: [],
      found: false,
      stateId: 0,
    };
  }

  let currK = k;
  let currU = 0;
  let result = "";
  const path: { from: number; to: number; char: string }[] = [];

  while (currK > 0) {
    const st = sam.states[currU];
    const sortedChars = Object.keys(st.next).sort();

    let transitioned = false;
    for (const c of sortedChars) {
      const v = st.next[c];
      const count = dp[v];

      if (currK === 1) {
        result += c;
        path.push({ from: currU, to: v, char: c });
        currU = v;
        currK = 0;
        transitioned = true;
        break;
      } else if (currK <= count) {
        result += c;
        path.push({ from: currU, to: v, char: c });
        currK -= 1; // consumed 1 item ending at v
        currU = v;
        transitioned = true;
        break;
      } else {
        currK -= count;
      }
    }

    if (!transitioned) {
      break;
    }
  }

  return {
    k,
    substring: result,
    path,
    found: result.length > 0,
    stateId: currU,
  };
}

/**
 * Computes endpos propagation and occurrence counts across the Suffix Link Tree.
 */
export function computeEndposOccurrences(
  sam: SuffixAutomaton,
  textLength: number,
): EndposPropagationResult {
  const numStates = sam.states.length;
  const endposMap: Record<number, number[]> = {};
  const linkTreeChildren: Record<number, number[]> = {};

  for (let i = 0; i < numStates; i++) {
    endposMap[i] = [];
    linkTreeChildren[i] = [];
  }

  // Populate base endpos and build link tree children
  for (let i = 0; i < numStates; i++) {
    const st = sam.states[i];
    if (i > 0 && !st.isClone && st.firstPos >= 0 && st.firstPos < textLength) {
      endposMap[i].push(st.firstPos);
    }
    if (st.link >= 0 && st.link < numStates) {
      linkTreeChildren[st.link].push(i);
    }
  }

  // Sort states by len descending to propagate endpos up the link tree
  const order: number[] = Array.from({ length: numStates }, (_, i) => i);
  order.sort((a, b) => sam.states[b].len - sam.states[a].len);

  for (const u of order) {
    const p = sam.states[u].link;
    if (p >= 0) {
      endposMap[p] = Array.from(new Set([...endposMap[p], ...endposMap[u]])).sort((a, b) => a - b);
    }
  }

  const occurrenceCounts: Record<number, number> = {};
  for (let i = 0; i < numStates; i++) {
    occurrenceCounts[i] = endposMap[i].length;
  }

  return {
    endposMap,
    occurrenceCounts,
    linkTreeChildren,
  };
}

/**
 * Searches for pattern P on the SAM in O(|P|) time, finding occurrences via endpos.
 */
export function searchPatternSAM(sam: SuffixAutomaton, pattern: string): SAMPatternSearchResult {
  if (pattern.length === 0 || sam.states.length === 0) {
    return {
      pattern,
      found: false,
      matchedLength: 0,
      finalStateId: null,
      path: [],
      occurrences: [],
      occurrenceCount: 0,
      mismatchIndex: null,
      mismatchChar: null,
    };
  }

  let curr = 0;
  const path: { from: number; to: number; char: string }[] = [];

  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (!(c in sam.states[curr].next)) {
      return {
        pattern,
        found: false,
        matchedLength: i,
        finalStateId: curr,
        path,
        occurrences: [],
        occurrenceCount: 0,
        mismatchIndex: i,
        mismatchChar: c,
      };
    }
    const nextSt = sam.states[curr].next[c];
    path.push({ from: curr, to: nextSt, char: c });
    curr = nextSt;
  }

  const { endposMap, occurrenceCounts } = computeEndposOccurrences(sam, sam.text.length);
  const endposList = endposMap[curr] || [];
  const occurrences = endposList
    .map((endIdx) => endIdx - pattern.length + 1)
    .filter((startIdx) => startIdx >= 0)
    .sort((a, b) => a - b);

  return {
    pattern,
    found: true,
    matchedLength: pattern.length,
    finalStateId: curr,
    path,
    occurrences,
    occurrenceCount: occurrenceCounts[curr] || occurrences.length,
    mismatchIndex: null,
    mismatchChar: null,
  };
}

/**
 * Computes 2D graph layout coordinates for SAM DAG and Suffix Link Tree views.
 */
export function layoutSAMGraph(
  sam: SuffixAutomaton,
  box: Size,
  viewMode: "dag" | "link_tree" = "dag",
): SAMGraphLayout {
  const numStates = sam.states.length;
  if (numStates === 0) {
    return { nodes: [], edges: [], width: box.width, height: box.height };
  }

  const width = Math.max(box.width, 320);
  const height = Math.max(box.height, 260);
  const padX = 48;
  const padY = 40;

  const { endposMap, occurrenceCounts } = computeEndposOccurrences(sam, sam.text.length);

  if (viewMode === "link_tree") {
    // Suffix Link Tree Layout (rooted at state 0)
    const childrenMap: Record<number, number[]> = {};
    for (let i = 0; i < numStates; i++) childrenMap[i] = [];
    for (let i = 1; i < numStates; i++) {
      const p = sam.states[i].link;
      if (p >= 0 && p < numStates) {
        childrenMap[p].push(i);
      }
    }

    // Assign tree depths and column slots
    const depths: number[] = new Array(numStates).fill(0);
    const columns: number[] = new Array(numStates).fill(0);
    let nextLeaf = 0;
    let maxDepth = 0;

    const assignTree = (u: number, d: number) => {
      depths[u] = d;
      maxDepth = Math.max(maxDepth, d);
      const ch = childrenMap[u];
      if (ch.length === 0) {
        columns[u] = nextLeaf++;
      } else {
        ch.forEach((c) => assignTree(c, d + 1));
        const minC = Math.min(...ch.map((c) => columns[c]));
        const maxC = Math.max(...ch.map((c) => columns[c]));
        columns[u] = (minC + maxC) / 2;
      }
    };

    assignTree(0, 0);

    const totalLeaves = Math.max(nextLeaf, 1);
    const usableWidth = width - padX * 2;
    const usableHeight = height - padY * 2;

    const nodes: SAMGraphNode[] = [];
    for (let i = 0; i < numStates; i++) {
      const st = sam.states[i];
      const x =
        padX + (totalLeaves > 1 ? (columns[i] / (totalLeaves - 1)) * usableWidth : usableWidth / 2);
      const y = padY + (maxDepth > 0 ? (depths[i] / maxDepth) * usableHeight : usableHeight / 2);

      nodes.push({
        id: i,
        x,
        y,
        len: st.len,
        link: st.link,
        isClone: st.isClone,
        isTerminal: st.len === sam.text.length,
        occurrences: occurrenceCounts[i] || 0,
        endpos: endposMap[i] || [],
        label: st.isClone ? `C${i}` : `S${i}`,
        layer: depths[i],
      });
    }

    const edges: SAMGraphEdge[] = [];
    for (let i = 1; i < numStates; i++) {
      const p = sam.states[i].link;
      if (p >= 0 && p < numStates) {
        edges.push({
          from: p,
          to: i,
          type: "tree_link",
        });
      }
    }

    return { nodes, edges, width, height };
  }

  // DAG Layout grouped by state.len (or topological layer)
  const maxLen = Math.max(...sam.states.map((s) => s.len), 1);
  const layers: number[][] = Array.from({ length: maxLen + 1 }, () => []);

  for (let i = 0; i < numStates; i++) {
    layers[sam.states[i].len].push(i);
  }

  const usableWidth = width - padX * 2;
  const usableHeight = height - padY * 2;
  const numLayers = layers.length;

  const nodes: SAMGraphNode[] = [];
  for (let l = 0; l < numLayers; l++) {
    const layerStates = layers[l];
    const x = padX + (numLayers > 1 ? (l / (numLayers - 1)) * usableWidth : usableWidth / 2);

    layerStates.forEach((stId, idx) => {
      const st = sam.states[stId];
      const totalInLayer = layerStates.length;
      const y =
        padY + (totalInLayer > 1 ? (idx / (totalInLayer - 1)) * usableHeight : usableHeight / 2);

      nodes.push({
        id: stId,
        x,
        y,
        len: st.len,
        link: st.link,
        isClone: st.isClone,
        isTerminal: st.len === sam.text.length,
        occurrences: occurrenceCounts[stId] || 0,
        endpos: endposMap[stId] || [],
        label: st.isClone ? `C${stId}` : `S${stId}`,
        layer: l,
      });
    });
  }

  nodes.sort((a, b) => a.id - b.id);

  const edges: SAMGraphEdge[] = [];
  for (let i = 0; i < numStates; i++) {
    const st = sam.states[i];
    // Outgoing transitions
    for (const [charKey, targetId] of Object.entries(st.next)) {
      edges.push({
        from: i,
        to: targetId,
        char: charKey,
        type: "transition",
        isCloneEdge: st.isClone,
      });
    }
    // Suffix links
    if (st.link >= 0 && st.link < numStates) {
      edges.push({
        from: i,
        to: st.link,
        type: "suffix_link",
      });
    }
  }

  return { nodes, edges, width, height };
}

// ============================================================================
// 4. MAIN REACT COMPONENT
// ============================================================================

export const SuffixAutomataStudio: React.FC<SuffixAutomataStudioProps> = ({
  initialText = "banana",
  initialModality = "suffix_automaton_online",
  initialPreset = "banana",
  standalone = false,
  title = "Suffix Automata & Suffix Array Studio",
  onPresetChange,
  onModalityChange,
}) => {
  // --- States ---
  const [selectedPreset, setSelectedPreset] = useState<SAMPresetId>(initialPreset);
  const [modality, setModality] = useState<SAMStudioModality>(initialModality);
  const [textInput, setTextInput] = useState<string>(initialText);
  const [patternInput, setPatternInput] = useState<string>("an");
  const [kthInput, setKthInput] = useState<number>(7);

  // Suffix Array RMQ query pair
  const [saQueryPair, setSaQueryPair] = useState<[number, number]>([1, 3]);

  // Online SAM Playback
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // View Options
  const [viewMode, setViewMode] = useState<"dag" | "link_tree">("dag");
  const [showSuffixLinks, setShowSuffixLinks] = useState<boolean>(true);
  const [showTransitions, setShowTransitions] = useState<boolean>(true);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

  // Measured Canvas Box
  const { ref: canvasRef, box } = useCanvasBox({ width: 720, height: 420 });

  // Handle Preset Change
  const handlePresetSelect = useCallback(
    (presetId: SAMPresetId) => {
      const preset = SAM_STUDIO_PRESETS[presetId];
      if (!preset) return;
      setSelectedPreset(presetId);
      setTextInput(preset.text);
      setPatternInput(preset.defaultPattern);
      setKthInput(preset.defaultK);
      setSaQueryPair([preset.defaultSuffixQuery[0], preset.defaultSuffixQuery[1]]);
      setCurrentStepIdx(0);
      setIsPlaying(false);
      onPresetChange?.(presetId);
    },
    [onPresetChange],
  );

  // Handle Modality Switch
  const handleModalitySwitch = useCallback(
    (newModality: SAMStudioModality) => {
      setModality(newModality);
      onModalityChange?.(newModality);
    },
    [onModalityChange],
  );

  // --- Computed Algorithmic Structures ---
  const fullSAM = useMemo(() => buildSuffixAutomaton(textInput), [textInput]);

  const stepTrace = useMemo(() => buildSuffixAutomatonStepByStep(textInput), [textInput]);

  const suffixArrayData = useMemo(() => buildSuffixArray(textInput), [textInput]);

  const kasaiData = useMemo(
    () => computeKasaiLCP(textInput, suffixArrayData.sa),
    [textInput, suffixArrayData],
  );

  const dagDPData = useMemo(() => computeDAGSubstringsDP(fullSAM), [fullSAM]);

  const kthResult = useMemo(() => findKthSubstring(fullSAM, kthInput), [fullSAM, kthInput]);

  const patternSearchResult = useMemo(
    () => searchPatternSAM(fullSAM, patternInput),
    [fullSAM, patternInput],
  );

  const rmqLCPResult = useMemo(() => {
    const n = textInput.length;
    if (n === 0) {
      return {
        suffixIndex1: 0,
        suffixIndex2: 0,
        rank1: 0,
        rank2: 0,
        lcpValue: 0,
        commonPrefix: "",
        minLCPRankIndex: 0,
      };
    }
    const idx1 = Math.max(0, Math.min(n - 1, saQueryPair[0]));
    const idx2 = Math.max(0, Math.min(n - 1, saQueryPair[1]));
    const r1 = suffixArrayData.rank[idx1] ?? 0;
    const r2 = suffixArrayData.rank[idx2] ?? 0;
    const res = queryLCPInterval(kasaiData.lcp, r1, r2);
    const s1 = textInput.slice(idx1);
    const s2 = textInput.slice(idx2);
    let common = "";
    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
      if (s1[i] === s2[i]) common += s1[i];
      else break;
    }
    return {
      ...res,
      suffixIndex1: idx1,
      suffixIndex2: idx2,
      commonPrefix: common,
    };
  }, [textInput, saQueryPair, suffixArrayData, kasaiData]);

  // Current SAM to display (either scrubbing snapshot or final SAM)
  const activeSAM = useMemo(() => {
    if (modality === "suffix_automaton_online" && stepTrace.length > 0) {
      const idx = Math.max(0, Math.min(stepTrace.length - 1, currentStepIdx));
      return stepTrace[idx].samSnapshot;
    }
    return fullSAM;
  }, [modality, stepTrace, currentStepIdx, fullSAM]);

  const currentStepInfo = useMemo(() => {
    if (stepTrace.length === 0) return null;
    const idx = Math.max(0, Math.min(stepTrace.length - 1, currentStepIdx));
    return stepTrace[idx];
  }, [stepTrace, currentStepIdx]);

  // Graph Layout
  const graphLayout = useMemo(
    () => layoutSAMGraph(activeSAM, box, viewMode),
    [activeSAM, box, viewMode],
  );

  // Playback Timer
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(150, 1000 / playbackSpeed);
    const timer = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= stepTrace.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, stepTrace.length]);

  // Active Highlight Elements
  const activeNodesSet = useMemo(() => {
    const set = new Set<number>();
    if (selectedNodeId !== null) set.add(selectedNodeId);

    if (modality === "suffix_automaton_online" && currentStepInfo) {
      if (currentStepInfo.activeStateId !== undefined) set.add(currentStepInfo.activeStateId);
      if (currentStepInfo.curStateId !== undefined) set.add(currentStepInfo.curStateId);
      if (currentStepInfo.cloneStateId !== undefined) set.add(currentStepInfo.cloneStateId);
      if (currentStepInfo.qStateId !== undefined) set.add(currentStepInfo.qStateId);
      if (currentStepInfo.pStateId !== undefined && currentStepInfo.pStateId >= 0)
        set.add(currentStepInfo.pStateId);
    } else if (modality === "pattern_search_occurrence_count") {
      for (const p of patternSearchResult.path) {
        set.add(p.from);
        set.add(p.to);
      }
    } else if (modality === "distinct_substrings_dag_dp" && kthResult.found) {
      for (const p of kthResult.path) {
        set.add(p.from);
        set.add(p.to);
      }
    }
    return set;
  }, [selectedNodeId, modality, currentStepInfo, patternSearchResult, kthResult]);

  const activeEdgesSet = useMemo(() => {
    const set = new Set<string>();
    if (modality === "pattern_search_occurrence_count") {
      for (const p of patternSearchResult.path) {
        set.add(`${p.from}->${p.to}:${p.char}`);
      }
    } else if (modality === "distinct_substrings_dag_dp" && kthResult.found) {
      for (const p of kthResult.path) {
        set.add(`${p.from}->${p.to}:${p.char}`);
      }
    }
    return set;
  }, [modality, patternSearchResult, kthResult]);

  return (
    <div
      className={`w-full flex flex-col gap-4 text-slate-800 dark:text-slate-100 ${
        standalone ? "p-4 max-w-7xl mx-auto min-h-screen bg-slate-50 dark:bg-slate-950" : ""
      }`}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              O(N) DAWG & Permutations
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            High-performance linear time Suffix Automata, Kasai Suffix Array LCP, DAG Path DP, and
            Pattern Occurrences
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Presets:</span>
          <select
            value={selectedPreset}
            onChange={(e) => handlePresetSelect(e.target.value as SAMPresetId)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Object.values(SAM_STUDIO_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MODALITY TABS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(
          [
            {
              id: "suffix_automaton_online",
              label: "1. Online SAM Construction",
              icon: Network,
              desc: "O(N) States & Clone Splits",
            },
            {
              id: "suffix_array_kasai_lcp",
              label: "2. Suffix Array & Kasai LCP",
              icon: Binary,
              desc: "h[i+1] >= h[i]-1 & RMQ",
            },
            {
              id: "distinct_substrings_dag_dp",
              label: "3. Distinct Substrings DP",
              icon: Hash,
              desc: "Sum Formula & K-th Query",
            },
            {
              id: "pattern_search_occurrence_count",
              label: "4. Pattern Search & Endpos",
              icon: Search,
              desc: "O(|P|) Walk & Tree Multiplicity",
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = modality === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleModalitySwitch(tab.id)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 shadow-sm"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}
                />
                <span>{tab.label}</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{tab.desc}</span>
            </button>
          );
        })}
      </div>

      {/* INPUT & CONTROL PANEL */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Text Input */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
              Input String S:
            </span>
            <input
              type="text"
              value={textInput}
              onChange={(e) => {
                const val = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "")
                  .slice(0, 32);
                setTextInput(val);
                setCurrentStepIdx(0);
              }}
              placeholder="e.g. banana"
              className="px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 max-w-xs"
            />
            <span className="px-2 py-1 text-[11px] font-mono rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
              |S| = {textInput.length}
            </span>
          </div>

          {/* Modality Specific Input Controls */}
          {modality === "pattern_search_occurrence_count" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Search Pattern P:
              </span>
              <input
                type="text"
                value={patternInput}
                onChange={(e) =>
                  setPatternInput(e.target.value.toLowerCase().slice(0, textInput.length))
                }
                placeholder="e.g. an"
                className="px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-28"
              />
            </div>
          )}

          {modality === "distinct_substrings_dag_dp" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Query k-th:
              </span>
              <input
                type="number"
                min={1}
                max={Math.max(1, dagDPData.totalDistinct)}
                value={kthInput}
                onChange={(e) => setKthInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="px-2 py-1.5 text-xs font-mono rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-20"
              />
              <span className="text-xs text-slate-500">/ {dagDPData.totalDistinct}</span>
            </div>
          )}

          {modality === "suffix_array_kasai_lcp" && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                RMQ Suffix Pair:
              </span>
              <select
                value={saQueryPair[0]}
                onChange={(e) => setSaQueryPair([parseInt(e.target.value, 10), saQueryPair[1]])}
                className="px-2 py-1 text-xs font-mono rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                {Array.from({ length: textInput.length }, (_, i) => (
                  <option key={i} value={i}>
                    Suffix[{i}]: "{textInput.slice(i)}"
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-400">vs</span>
              <select
                value={saQueryPair[1]}
                onChange={(e) => setSaQueryPair([saQueryPair[0], parseInt(e.target.value, 10)])}
                className="px-2 py-1 text-xs font-mono rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                {Array.from({ length: textInput.length }, (_, i) => (
                  <option key={i} value={i}>
                    Suffix[{i}]: "{textInput.slice(i)}"
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Playback Controls (Active during online SAM mode) */}
        {modality === "suffix_automaton_online" && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setCurrentStepIdx(0);
                  setIsPlaying(false);
                }}
                title="Reset to start"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentStepIdx((p) => Math.max(0, p - 1));
                  setIsPlaying(false);
                }}
                disabled={currentStepIdx === 0}
                title="Previous step"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-xs text-white ${
                  isPlaying
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>
              <button
                onClick={() => {
                  setCurrentStepIdx((p) => Math.min(stepTrace.length - 1, p + 1));
                  setIsPlaying(false);
                }}
                disabled={currentStepIdx >= stepTrace.length - 1}
                title="Next step"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1 ml-2">
                {[0.5, 1, 2, 4].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded border ${
                      playbackSpeed === speed
                        ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-bold"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Scrubber */}
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                Step {currentStepIdx + 1}/{stepTrace.length}
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(0, stepTrace.length - 1)}
                value={currentStepIdx}
                onChange={(e) => {
                  setCurrentStepIdx(parseInt(e.target.value, 10));
                  setIsPlaying(false);
                }}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* View Mode & Edge Toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs">
                <button
                  onClick={() => setViewMode("dag")}
                  className={`px-2 py-1 rounded font-medium ${
                    viewMode === "dag"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  DAG Layout
                </button>
                <button
                  onClick={() => setViewMode("link_tree")}
                  className={`px-2 py-1 rounded font-medium ${
                    viewMode === "link_tree"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Link Tree
                </button>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSuffixLinks}
                  onChange={(e) => setShowSuffixLinks(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>Suffix Links</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTransitions}
                  onChange={(e) => setShowTransitions(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>Transitions</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* STEP TRACE CALLOUT (Online SAM Mode) */}
      {modality === "suffix_automaton_online" && currentStepInfo && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/50 text-xs">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white mt-0.5">
            <GitCommit className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-indigo-900 dark:text-indigo-200">
                {currentStepInfo.title}
              </span>
              <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                Phase: {currentStepInfo.phase}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {currentStepInfo.description}
            </p>
          </div>
        </div>
      )}

      {/* MAIN VISUALIZATION AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Interactive Canvas / Graph / Tables */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* MODALITY 1 & 4 & 3: SAM SVG Graph Canvas */}
          {(modality === "suffix_automaton_online" ||
            modality === "pattern_search_occurrence_count" ||
            modality === "distinct_substrings_dag_dp") && (
            <div className="flex flex-col rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {viewMode === "dag"
                      ? "Suffix Automaton DAG Topology"
                      : "Suffix Link Tree (Parent Tree)"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                    <span>State</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    <span>Clone State</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-indigo-500 inline-block" />
                    <span>Transition</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-0.5 border-b border-dashed border-purple-500 inline-block" />
                    <span>Suffix Link</span>
                  </div>
                </div>
              </div>

              {/* SVG Canvas Container */}
              <div
                ref={canvasRef}
                className="w-full h-[400px] relative bg-slate-50/50 dark:bg-slate-950/40 rounded-lg border border-slate-100 dark:border-slate-800/80 overflow-hidden select-none"
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${graphLayout.width} ${graphLayout.height}`}
                  className="w-full h-full"
                >
                  <defs>
                    <marker
                      id="arrow-transition"
                      viewBox="0 0 10 10"
                      refX="18"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6366f1" />
                    </marker>
                    <marker
                      id="arrow-link"
                      viewBox="0 0 10 10"
                      refX="18"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 2 L 6 5 L 0 8 z" fill="#a855f7" />
                    </marker>
                    <marker
                      id="arrow-active"
                      viewBox="0 0 10 10"
                      refX="18"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#ef4444" />
                    </marker>
                  </defs>

                  {/* EDGES */}
                  {graphLayout.edges.map((edge, idx) => {
                    const fromNode = graphLayout.nodes[edge.from];
                    const toNode = graphLayout.nodes[edge.to];
                    if (!fromNode || !toNode) return null;

                    const isLink = edge.type === "suffix_link" || edge.type === "tree_link";
                    if (isLink && !showSuffixLinks) return null;
                    if (!isLink && !showTransitions) return null;

                    const edgeKeyStr = `${edge.from}->${edge.to}:${edge.char ?? ""}`;
                    const isActive = activeEdgesSet.has(edgeKeyStr);

                    // Compute curved arc for visibility
                    const dx = toNode.x - fromNode.x;
                    const dy = toNode.y - fromNode.y;
                    const dist = Math.hypot(dx, dy) || 1;
                    const midX = (fromNode.x + toNode.x) / 2;
                    const midY = (fromNode.y + toNode.y) / 2;

                    // Offset curvature
                    const curvature = isLink ? 28 : edge.from > edge.to ? 35 : 0;
                    const normX = -dy / dist;
                    const normY = dx / dist;
                    const cx = midX + normX * curvature;
                    const cy = midY + normY * curvature;

                    const pathData =
                      curvature === 0
                        ? `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`
                        : `M ${fromNode.x} ${fromNode.y} Q ${cx} ${cy} ${toNode.x} ${toNode.y}`;

                    return (
                      <g key={`edge-${idx}`}>
                        <path
                          d={pathData}
                          fill="none"
                          stroke={
                            isActive
                              ? "#ef4444"
                              : isLink
                                ? "#a855f7"
                                : edge.isCloneEdge
                                  ? "#f59e0b"
                                  : "#6366f1"
                          }
                          strokeWidth={isActive ? 2.5 : isLink ? 1.5 : 1.8}
                          strokeDasharray={isLink ? "4 3" : undefined}
                          strokeOpacity={isActive ? 1 : isLink ? 0.6 : 0.8}
                          markerEnd={
                            isActive
                              ? "url(#arrow-active)"
                              : isLink
                                ? "url(#arrow-link)"
                                : "url(#arrow-transition)"
                          }
                        />
                        {edge.char && (
                          <g transform={`translate(${cx}, ${cy})`}>
                            <rect
                              x="-9"
                              y="-8"
                              width="18"
                              height="16"
                              rx="4"
                              fill="#ffffff"
                              className="dark:fill-slate-900"
                              stroke={isActive ? "#ef4444" : "#cbd5e1"}
                              strokeWidth="1"
                            />
                            <text
                              x="0"
                              y="3"
                              textAnchor="middle"
                              className={`text-[10px] font-mono font-bold ${
                                isActive ? "fill-red-600" : "fill-slate-800 dark:fill-slate-200"
                              }`}
                            >
                              {edge.char}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* NODES */}
                  {graphLayout.nodes.map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    const isActive = activeNodesSet.has(node.id);
                    const isClone = node.isClone;
                    const isRoot = node.id === 0;

                    return (
                      <g
                        key={`node-${node.id}`}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() =>
                          setSelectedNodeId(node.id === selectedNodeId ? null : node.id)
                        }
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        {/* Glow ring if active */}
                        {(isActive || isSelected) && (
                          <circle
                            r="22"
                            fill="none"
                            stroke={isSelected ? "#3b82f6" : isActive ? "#ef4444" : "#6366f1"}
                            strokeWidth="3"
                            strokeOpacity="0.4"
                            className="animate-pulse"
                          />
                        )}

                        {/* Node Body */}
                        <circle
                          r="15"
                          fill={
                            isSelected
                              ? "#3b82f6"
                              : isRoot
                                ? "#10b981"
                                : isClone
                                  ? "#f59e0b"
                                  : isActive
                                    ? "#ef4444"
                                    : "#6366f1"
                          }
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="shadow-sm"
                        />

                        {/* Node Label */}
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#ffffff"
                          className="text-[10px] font-mono font-bold pointer-events-none select-none"
                        >
                          {node.label}
                        </text>

                        {/* Length Badge above node */}
                        <text
                          x="0"
                          y="-18"
                          textAnchor="middle"
                          className="text-[9px] font-mono fill-slate-500 dark:fill-slate-400 select-none"
                        >
                          len:{node.len}
                        </text>

                        {/* Link Badge below node */}
                        {node.link >= 0 && (
                          <text
                            x="0"
                            y="25"
                            textAnchor="middle"
                            className="text-[8px] font-mono fill-purple-600 dark:fill-purple-400 select-none"
                          >
                            link:{node.link}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* MODALITY 2: Suffix Array & Kasai LCP Visualizer */}
          {modality === "suffix_array_kasai_lcp" && (
            <div className="flex flex-col gap-4">
              {/* Suffix Array Table & RMQ Ribbon */}
              <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Binary className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Lexicographical Suffix Array & Kasai LCP Table
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    O(N) Kasai Invariant: h[i+1] &ge; h[i] - 1
                  </span>
                </div>

                {/* RMQ Query Card */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 mb-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200">
                      Interactive LCP Interval Query RMQ(Suffix[{rmqLCPResult.suffixIndex1}],
                      Suffix[{rmqLCPResult.suffixIndex2}])
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                      Rank[{rmqLCPResult.suffixIndex1}] = {rmqLCPResult.rank1} &harr; Rank[
                      {rmqLCPResult.suffixIndex2}] = {rmqLCPResult.rank2} | Common Prefix = "
                      {rmqLCPResult.commonPrefix}" (Length: {rmqLCPResult.lcpValue})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600 text-white font-mono text-xs font-bold">
                    <span>LCP = {rmqLCPResult.lcpValue}</span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2 px-3">Rank (k)</th>
                        <th className="py-2 px-3">SA[k]</th>
                        <th className="py-2 px-3">Suffix String S[SA[k]..N-1]</th>
                        <th className="py-2 px-3 text-center">LCP[k]</th>
                        <th className="py-2 px-3">LCP Bar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suffixArrayData.sa.map((saVal, rankIdx) => {
                        const lcpVal = kasaiData.lcp[rankIdx] ?? 0;
                        const isQueryRank1 = rmqLCPResult.rank1 === rankIdx;
                        const isQueryRank2 = rmqLCPResult.rank2 === rankIdx;
                        const isBetween =
                          rankIdx >= Math.min(rmqLCPResult.rank1, rmqLCPResult.rank2) &&
                          rankIdx <= Math.max(rmqLCPResult.rank1, rmqLCPResult.rank2);

                        return (
                          <tr
                            key={rankIdx}
                            className={`border-b border-slate-100 dark:border-slate-800/60 transition-colors ${
                              isQueryRank1 || isQueryRank2
                                ? "bg-indigo-100/70 dark:bg-indigo-950/60 font-bold"
                                : isBetween
                                  ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            }`}
                          >
                            <td className="py-2 px-3 text-slate-500">{rankIdx}</td>
                            <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400 font-bold">
                              {saVal}
                            </td>
                            <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                {textInput.slice(saVal, saVal + lcpVal)}
                              </span>
                              <span>{textInput.slice(saVal + lcpVal)}</span>
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                              {rankIdx < suffixArrayData.sa.length - 1 ? lcpVal : "-"}
                            </td>
                            <td className="py-2 px-3">
                              {rankIdx < suffixArrayData.sa.length - 1 && (
                                <div className="flex items-center gap-1.5 w-32">
                                  <div className="h-3 rounded bg-slate-200 dark:bg-slate-700 flex-1 overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-500 rounded"
                                      style={{
                                        width: `${(lcpVal / Math.max(kasaiData.maxLCP, 1)) * 100}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-slate-400 w-4">{lcpVal}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* OCCURRENCE HIGHLIGHTER (Mode 4) */}
          {modality === "pattern_search_occurrence_count" && (
            <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Pattern Match Occurrences in S
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  Total Matches: {patternSearchResult.occurrenceCount}
                </span>
              </div>

              {/* String Ribbon Highlighting Matches */}
              <div className="flex items-center gap-1 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-x-auto font-mono text-sm">
                {Array.from(textInput).map((ch, idx) => {
                  const isMatchChar = patternSearchResult.occurrences.some(
                    (st) => idx >= st && idx < st + patternInput.length,
                  );

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col items-center px-2 py-1 rounded border transition-all ${
                        isMatchChar
                          ? "bg-emerald-500 text-white border-emerald-600 font-bold shadow-xs scale-105"
                          : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <span>{ch}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {idx}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Search Diagnostics */}
              <div className="flex items-center gap-2 text-xs">
                {patternSearchResult.found ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Pattern "{patternInput}" found! Occurs {patternSearchResult.occurrenceCount}{" "}
                      times at starting indices [{patternSearchResult.occurrences.join(", ")}].
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-rose-500 font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      Pattern "{patternInput}" not found in string S. Mismatch at char index{" "}
                      {patternSearchResult.mismatchIndex} ('{patternSearchResult.mismatchChar}').
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* K-TH SUBSTRING TRAVERSAL PATH (Mode 3) */}
          {modality === "distinct_substrings_dag_dp" && (
            <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    k-th Lexicographical Substring Result (k = {kthInput})
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  Result: "{kthResult.substring}"
                </span>
              </div>

              {/* Path Steps */}
              <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700">
                  Root S0
                </span>
                {kthResult.path.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold">
                      <span>'{step.char}'</span>
                      <span className="text-[10px] text-slate-400">&rarr; S{step.to}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Telemetry, State Inspector & Educational Notes */}
        <div className="flex flex-col gap-4">
          {/* TELEMETRY HUD */}
          <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Automaton Telemetry HUD
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-500">States |V|</span>
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                  {activeSAM.states.length}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    (&le; {2 * textInput.length - 1 || 1})
                  </span>
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-500">Transitions |E|</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {activeSAM.totalTransitions}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    (&le; {Math.max(1, 3 * textInput.length - 4)})
                  </span>
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-500">Distinct Substrings</span>
                <span className="text-base font-bold text-purple-600 dark:text-purple-400">
                  {dagDPData.totalDistinct}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-500">Max LCP</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                  {kasaiData.maxLCP}
                </span>
              </div>
            </div>

            {/* Complexity Badges */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Online Construction:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  O(N) Time & Space
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Kasai LCP Construction:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  O(N) Time
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Pattern Search:</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  O(|P|) Time
                </span>
              </div>
            </div>
          </div>

          {/* STATE INSPECTOR PANEL */}
          <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm gap-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  State Inspector
                </span>
              </div>
              {selectedNodeId !== null && (
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {selectedNodeId !== null && activeSAM.states[selectedNodeId] ? (
              (() => {
                const st = activeSAM.states[selectedNodeId];
                const { endposMap, occurrenceCounts } = computeEndposOccurrences(
                  activeSAM,
                  textInput.length,
                );
                const endpos = endposMap[selectedNodeId] || [];
                const occ = occurrenceCounts[selectedNodeId] || 0;

                return (
                  <div className="flex flex-col gap-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        State ID: {st.id} {st.isClone ? "(Clone)" : ""}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 text-[10px]">
                        len = {st.len}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Suffix Link:</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {st.link >= 0 ? `S${st.link}` : "None (-1)"}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Occurrences:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {occ}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-1">
                        Outgoing Transitions:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {Object.entries(st.next).map(([c, tgt]) => (
                          <span
                            key={c}
                            className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px]"
                          >
                            '{c}' &rarr; S{tgt}
                          </span>
                        ))}
                        {Object.keys(st.next).length === 0 && (
                          <span className="text-slate-400 text-[10px]">None (Terminal)</span>
                        )}
                      </div>
                    </div>

                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-1">Endpos Set:</span>
                      <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                        &#123;{endpos.join(", ")}&#125;
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 text-xs">
                <Info className="w-5 h-5 mb-1 opacity-50" />
                <span>
                  Click any state node in the canvas above to inspect transitions, suffix links, and
                  endpos equivalence classes.
                </span>
              </div>
            )}
          </div>

          {/* THEORY & ALGORITHMIC INVARIANTS */}
          <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm gap-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Algorithmic Invariants
              </span>
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">&bull;</span>
                <span>
                  <strong>SAM State Bound:</strong> Number of states is at most <code>2N - 1</code>{" "}
                  and transitions at most <code>3N - 4</code>.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">&bull;</span>
                <span>
                  <strong>Kasai LCP Invariant:</strong> When moving from suffix <code>i</code> to{" "}
                  <code>i+1</code>, the LCP with its SA predecessor drops by at most 1:{" "}
                  <code>h &ge; h_prev - 1</code>.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">&bull;</span>
                <span>
                  <strong>Distinct Substring Equivalence:</strong> Formula{" "}
                  <code>&sum; (len[u] - len[link[u]])</code> exactly equals DAG DP{" "}
                  <code>dp[0] - 1</code> and SA formula <code>N(N+1)/2 - &sum; LCP</code>.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuffixAutomataStudio;
