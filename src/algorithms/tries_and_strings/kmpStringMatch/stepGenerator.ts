import type {
  AlgorithmStep,
  ArrayElement,
  ElementState,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

export interface KmpInput {
  text: string;
  pattern: string;
}

export const DEFAULT_KMP_INPUT: KmpInput = {
  text: "ABABDABACDABABCABAB",
  pattern: "ABABCABAB",
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Knuth-Morris-Pratt (KMP) algorithm finds all starting index occurrences of a pattern string inside a text string in linear O(N + M) time.",
    primarySnapshot: {
      kind: "array",
      name: "Text & Pattern",
      mode: "box",
      elements: [
        { id: "t0", value: "A", label: "text[0]", state: "default" },
        { id: "t1", value: "B", label: "text[1]", state: "default" },
        { id: "t2", value: "A", label: "text[2]", state: "default" },
        { id: "t3", value: "B", label: "text[3]", state: "default" },
        { id: "t4", value: "C", label: "text[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Naive Bottleneck: naive string searching resets the text pointer backward on a mismatch, degrading worst-case performance to O(N * M). KMP never steps backward in text.",
    primarySnapshot: {
      kind: "array",
      name: "Text & Pattern",
      mode: "box",
      elements: [
        { id: "t0", value: "A", label: "text[0]", state: "visited" },
        { id: "t1", value: "B", label: "text[1]", state: "visited" },
        { id: "t2", value: "A", label: "text[2]", state: "active" },
        { id: "t3", value: "B", label: "text[3]", state: "compare" },
        { id: "t4", value: "D", label: "mismatch", state: "swap" },
      ],
    },
  },
  {
    narrative:
      "Longest Prefix Suffix (LPS) Table: lps[i] stores the length of the longest proper prefix of pattern[0..i] that is also a suffix of pattern[0..i].",
    primarySnapshot: {
      kind: "array",
      name: "LPS Table",
      mode: "box",
      elements: [
        { id: "p0", value: 0, label: "A", state: "default" },
        { id: "p1", value: 0, label: "B", state: "default" },
        { id: "p2", value: 1, label: "A", state: "sorted" },
        { id: "p3", value: 2, label: "B", state: "sorted" },
        { id: "p4", value: 0, label: "C", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Preprocessing Phase: build the LPS table in O(M) time using two pointers (len for matching prefix length, i for suffix index).",
    primarySnapshot: {
      kind: "array",
      name: "LPS Construction",
      mode: "box",
      elements: [
        { id: "p0", value: 0, label: "len=0", state: "compare" },
        { id: "p1", value: 0, label: "B", state: "default" },
        { id: "p2", value: 1, label: "i=2", state: "active" },
      ],
    },
  },
  {
    narrative:
      "LPS Fallback: when pattern[i] != pattern[len] during LPS building, set len = lps[len - 1] to fall back to a shorter candidate overlap without resetting i.",
    primarySnapshot: {
      kind: "array",
      name: "LPS Fallback",
      mode: "box",
      elements: [
        { id: "p0", value: 0, label: "A", state: "compare" },
        { id: "p1", value: 0, label: "B", state: "visited" },
        { id: "p4", value: 0, label: "C (mismatch)", state: "swap" },
      ],
    },
  },
  {
    narrative:
      "Matching Phase: scan text with index i and pattern with index j. When text[i] == pattern[j], advance both pointers forward.",
    primarySnapshot: {
      kind: "array",
      name: "Text Scan",
      mode: "box",
      elements: [
        { id: "t0", value: "A", label: "text[0]", state: "visited" },
        { id: "t1", value: "B", label: "text[1]", state: "visited" },
        { id: "t2", value: "A", label: "i=2", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Mismatch Fallback: on a mismatch text[i] != pattern[j] with j > 0, set j = lps[j - 1] to shift the pattern pointer to the next valid prefix alignment while holding text index i fixed.",
    primarySnapshot: {
      kind: "array",
      name: "KMP Shift",
      mode: "box",
      elements: [
        { id: "t4", value: "D", label: "text[4]", state: "active" },
        { id: "p4", value: "C", label: "j=4->lps[3]=2", state: "swap" },
      ],
    },
  },
  {
    narrative:
      "Full Match & Complexity: when j == M, record match at index i - M, set j = lps[j - 1], delivering optimal O(N + M) time and O(M) space complexity.",
    primarySnapshot: {
      kind: "array",
      name: "Pattern Match",
      mode: "box",
      elements: [
        { id: "m0", value: "A", label: "match[10]", state: "sorted" },
        { id: "m1", value: "B", label: "match[11]", state: "sorted" },
        { id: "m2", value: "A", label: "match[12]", state: "sorted" },
        { id: "m3", value: "B", label: "match[13]", state: "sorted" },
        { id: "m4", value: "C", label: "match[14]", state: "sorted" },
      ],
    },
  },
];

export const generateKmpSteps = (input: KmpInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const text =
    typeof input?.text === "string"
      ? input.text
      : input?.text === undefined
        ? ""
        : DEFAULT_KMP_INPUT.text;
  const pattern =
    typeof input?.pattern === "string"
      ? input.pattern
      : input?.pattern === undefined
        ? ""
        : DEFAULT_KMP_INPUT.pattern;

  const n = text.length;
  const m = pattern.length;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (input.text === DEFAULT_KMP_INPUT.text && input.pattern === DEFAULT_KMP_INPUT.pattern);

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  if (m === 0 || n === 0 || m > n) {
    addStep(
      "Empty input string or pattern longer than text: returning zero pattern matches immediately.",
      {
        kind: "array",
        name: "Text",
        mode: "box",
        elements: [],
      },
    );
    return steps;
  }

  const lps: number[] = new Array(m).fill(0);
  const matches: number[] = [];

  const makeSnapshot = (
    textIdx?: number,
    patIdx?: number,
    isMatch?: boolean,
    isMismatch?: boolean,
    completedMatches: number[] = [],
  ): PrimaryVisualSnapshot => {
    const elements: ArrayElement[] = text.split("").map((char, idx) => {
      let state: ElementState = "default";
      const ptrs: string[] = [char];

      completedMatches.forEach((mIdx) => {
        if (idx >= mIdx && idx < mIdx + m) {
          state = "sorted";
        }
      });

      if (idx === textIdx) {
        ptrs.push(`i=${idx}`);
        if (patIdx !== undefined) ptrs.push(`j=${patIdx}`);
        if (isMismatch) {
          state = "swap";
        } else if (isMatch) {
          state = "active";
        } else {
          state = "compare";
        }
      }

      return {
        id: `t-${idx}`,
        value: char,
        label: `[${idx}]`,
        state,
        pointers: ptrs,
      };
    });

    return {
      kind: "array",
      name: `Text (pat: "${pattern}" j=${patIdx ?? 0})`,
      mode: "box",
      elements,
    };
  };

  addStep(
    `Having established the mental model, let's now transition to searching pattern "${pattern}" (length ${m}) inside text "${text}" (length ${n}).`,
    makeSnapshot(0, 0),
  );

  // Build LPS Table
  let len = 0;
  let iLps = 1;
  while (iLps < m) {
    if (pattern[iLps] === pattern[len]) {
      len++;
      lps[iLps] = len;
      iLps++;
    } else {
      if (len !== 0) {
        len = lps[len - 1];
      } else {
        lps[iLps] = 0;
        iLps++;
      }
    }
  }

  addStep(
    `LPS preprocessing complete for pattern "${pattern}": computed LPS table [${lps.join(", ")}].`,
    makeSnapshot(undefined, 0),
  );

  // Match Phase
  let i = 0;
  let j = 0;

  while (i < n) {
    if (pattern[j] === text[i]) {
      addStep(
        `Character match at text[${i}] ('${text[i]}') == pattern[${j}] ('${pattern[j]}'): advancing text pointer i to ${i + 1} and pattern pointer j to ${j + 1}.`,
        makeSnapshot(i, j, true, false, matches),
      );

      i++;
      j++;
    }

    if (j === m) {
      const matchIdx = i - j;
      matches.push(matchIdx);

      addStep(
        `Full pattern match found! Matched entire pattern "${pattern}" starting at text index ${matchIdx}. Setting j = lps[${j - 1}] = ${lps[j - 1]} for next match.`,
        makeSnapshot(i - 1, j - 1, false, false, matches),
      );

      j = lps[j - 1];
    } else if (i < n && pattern[j] !== text[i]) {
      if (j !== 0) {
        const nextJ = lps[j - 1];
        addStep(
          `Mismatch at text[${i}] ('${text[i]}') != pattern[${j}] ('${pattern[j]}'): falling back pattern pointer j to lps[${j - 1}] = ${nextJ} without moving text index i.`,
          makeSnapshot(i, j, false, true, matches),
        );

        j = nextJ;
      } else {
        addStep(
          `Mismatch at text[${i}] ('${text[i]}') != pattern[0] ('${pattern[0]}') with j=0: advancing text index i to ${i + 1}.`,
          makeSnapshot(i, 0, false, true, matches),
        );

        i++;
      }
    }
  }

  addStep(
    `KMP String Search complete! Found ${matches.length} pattern occurrence(s) at text starting indices: [${matches.join(", ")}].`,
    makeSnapshot(undefined, undefined, false, false, matches),
  );

  return steps;
};

export default generateKmpSteps;
