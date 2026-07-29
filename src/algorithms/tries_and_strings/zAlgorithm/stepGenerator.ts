import type {
  AlgorithmStep,
  ArrayElement,
  ElementState,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

export interface ZAlgorithmInput {
  text: string;
  pattern: string;
}

export const DEFAULT_Z_ALGORITHM_INPUT: ZAlgorithmInput = {
  text: "ababaaba",
  pattern: "aba",
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Z-Algorithm computes string self-similarity to locate all occurrences of a pattern in a text in linear O(N + M) time.",
    primarySnapshot: {
      kind: "array",
      name: "S",
      mode: "box",
      elements: [
        { id: "s0", value: "a", label: "[0]", state: "default" },
        { id: "s1", value: "b", label: "[1]", state: "default" },
        { id: "s2", value: "a", label: "[2]", state: "default" },
        { id: "s3", value: "$", label: "[3]", state: "pivot" },
        { id: "s4", value: "a", label: "[4]", state: "default" },
        { id: "s5", value: "b", label: "[5]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Sentinel Concatenation: construct S = pattern + '$' + text using a unique separator '$' that appears in neither string, preventing prefix matches from spanning across boundaries.",
    primarySnapshot: {
      kind: "array",
      name: "S",
      mode: "box",
      elements: [
        { id: "s0", value: "a", label: "pat[0]", state: "compare" },
        { id: "s1", value: "b", label: "pat[1]", state: "compare" },
        { id: "s2", value: "a", label: "pat[2]", state: "compare" },
        { id: "s3", value: "$", label: "sentinel", state: "pivot" },
        { id: "s4", value: "a", label: "text[0]", state: "active" },
        { id: "s5", value: "b", label: "text[1]", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Z-Array Definition: Z[i] stores the length of the longest substring starting at index i that matches the exact prefix of S.",
    primarySnapshot: {
      kind: "array",
      name: "Z-Values",
      mode: "box",
      elements: [
        { id: "z0", value: 0, label: "Z[0]", state: "default" },
        { id: "z1", value: 0, label: "Z[1]", state: "default" },
        { id: "z2", value: 0, label: "Z[2]", state: "default" },
        { id: "z3", value: 0, label: "Z[3]", state: "default" },
        { id: "z4", value: 3, label: "Z[4]", state: "sorted" },
        { id: "z5", value: 0, label: "Z[5]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Pattern Match Condition: whenever Z[i] == M (pattern length) for any index i > M, a full pattern match occurs in text at index i - M - 1.",
    primarySnapshot: {
      kind: "array",
      name: "Matches",
      mode: "box",
      elements: [
        { id: "z4", value: 3, label: "Z[4]=M", state: "sorted", pointers: ["Match at text[0]"] },
        { id: "z6", value: 3, label: "Z[6]=M", state: "sorted", pointers: ["Match at text[2]"] },
        { id: "z9", value: 3, label: "Z[9]=M", state: "sorted", pointers: ["Match at text[5]"] },
      ],
    },
  },
  {
    narrative:
      "Z-Box Window [L, R]: we maintain [L, R], the rightmost interval S[L..R] that matches a prefix of S.",
    primarySnapshot: {
      kind: "array",
      name: "Z-Box Window",
      mode: "box",
      elements: [
        { id: "s4", value: "a", label: "[L=4]", state: "pivot" },
        { id: "s5", value: "b", label: "[5]", state: "visited" },
        { id: "s6", value: "a", label: "[R=6]", state: "pivot" },
        { id: "s7", value: "a", label: "[7]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Inner Window Reuse (i <= R): if current index i lies inside [L, R], set Z[i] = min(R - i + 1, Z[i - L]) to reuse previously computed prefix matches in O(1) time.",
    primarySnapshot: {
      kind: "array",
      name: "S",
      mode: "box",
      elements: [
        { id: "s0", value: "a", label: "pat[0]", state: "compare" },
        { id: "s4", value: "a", label: "L=4", state: "pivot" },
        { id: "s6", value: "a", label: "i=6", state: "active" },
        { id: "s6r", value: "a", label: "R=6", state: "pivot" },
      ],
    },
  },
  {
    narrative:
      "Window Extension: if character comparisons extend past R, we compare characters directly and advance R further right to grow the Z-box.",
    primarySnapshot: {
      kind: "array",
      name: "S",
      mode: "box",
      elements: [
        { id: "s4", value: "a", label: "L=4", state: "visited" },
        { id: "s6", value: "a", label: "i=6", state: "visited" },
        { id: "s8", value: "b", label: "new R=8", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Linear Bound: because the right boundary R moves strictly right and never retreats, the total number of character comparisons is bounded by |S|, delivering O(N + M) time and space.",
    primarySnapshot: {
      kind: "array",
      name: "Final Z-Array",
      mode: "box",
      elements: [
        { id: "z0", value: 0, label: "a", state: "default" },
        { id: "z1", value: 0, label: "b", state: "default" },
        { id: "z2", value: 0, label: "a", state: "default" },
        { id: "z3", value: 0, label: "$", state: "pivot" },
        { id: "z4", value: 3, label: "a", state: "sorted" },
        { id: "z5", value: 0, label: "b", state: "default" },
        { id: "z6", value: 3, label: "a", state: "sorted" },
        { id: "z7", value: 0, label: "b", state: "default" },
      ],
    },
  },
];

export const generateZAlgorithmSteps = (input: ZAlgorithmInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const text =
    typeof input?.text === "string"
      ? input.text
      : input?.text === undefined
        ? ""
        : DEFAULT_Z_ALGORITHM_INPUT.text;
  const pattern =
    typeof input?.pattern === "string"
      ? input.pattern
      : input?.pattern === undefined
        ? ""
        : DEFAULT_Z_ALGORITHM_INPUT.pattern;

  const m = pattern.length;
  const tLen = text.length;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (input.text === DEFAULT_Z_ALGORITHM_INPUT.text &&
      input.pattern === DEFAULT_Z_ALGORITHM_INPUT.pattern);

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  if (m === 0 || tLen === 0 || m > tLen) {
    addStep(
      "Empty input string or pattern longer than search text: returning 0 pattern matches immediately.",
      {
        kind: "array",
        name: "Z-Array",
        mode: "box",
        elements: [],
      },
    );
    return steps;
  }

  const s = `${pattern}$${text}`;
  const n = s.length;
  const z: number[] = new Array<number>(n).fill(0);
  const matches: number[] = [];
  let l = 0;
  let r = 0;

  const makeSnapshot = (
    currentI?: number,
    compareLeft?: number,
    compareRight?: number,
    currentL?: number,
    currentR?: number,
  ): PrimaryVisualSnapshot => {
    const elements: ArrayElement[] = s.split("").map((char, idx) => {
      let state: ElementState = "default";
      const ptrs: string[] = [char];

      if (idx === currentI) {
        state = "active";
        ptrs.push(`i=${idx}`);
      } else if (idx === compareLeft || idx === compareRight) {
        state = "compare";
        if (idx === compareLeft) ptrs.push("pat-prefix");
        if (idx === compareRight) ptrs.push("target");
      } else if (
        currentL !== undefined &&
        currentR !== undefined &&
        currentL <= idx &&
        idx <= currentR &&
        currentL !== currentR
      ) {
        state = "pivot";
        if (idx === currentL) ptrs.push("L");
        if (idx === currentR) ptrs.push("R");
      }

      matches.forEach((mIdx) => {
        const textStartInS = m + 1 + mIdx;
        if (idx >= textStartInS && idx < textStartInS + m) {
          state = "sorted";
        }
      });

      if (z[idx] > 0) ptrs.push(`Z=${z[idx]}`);

      return {
        id: `el-${idx}`,
        value: z[idx],
        state,
        pointers: ptrs,
      };
    });

    return {
      kind: "array",
      name: "S & Z-Array",
      mode: "box",
      elements,
    };
  };

  addStep(
    `Having established the mental model, let's now transition to concatenated string S = "${s}" searching pattern "${pattern}" in text "${text}".`,
    makeSnapshot(0),
  );

  for (let i = 1; i < n; i++) {
    addStep(
      `Inspect index i = ${i} (char '${s[i]}') with active Z-box [L=${l}, R=${r}].`,
      makeSnapshot(i, undefined, undefined, l, r),
    );

    if (i <= r) {
      const k = i - l;
      const rem = r - i + 1;
      z[i] = Math.min(rem, z[k]);

      addStep(
        `Index i=${i} is inside Z-box [${l}, ${r}]: reusing z[${k}] = ${z[k]} capped at remaining window length ${rem} -> initial Z[${i}] = ${z[i]}.`,
        makeSnapshot(i, k, i, l, r),
      );
    }

    let extended = false;
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) {
      extended = true;
      const patIdx = z[i];
      const matchIdx = i + z[i];

      addStep(
        `Character match: S[${patIdx}] ('${s[patIdx]}') == S[${matchIdx}] ('${s[matchIdx]}'). Incrementing Z[${i}] to ${z[i] + 1}.`,
        makeSnapshot(i, patIdx, matchIdx, l, r),
      );

      z[i]++;
    }

    if (extended && i + z[i] - 1 > r) {
      l = i;
      r = i + z[i] - 1;

      addStep(
        `Z-box right edge extended! Updating Z-box window boundaries to [L=${l}, R=${r}].`,
        makeSnapshot(i, undefined, undefined, l, r),
      );
    }

    if (i > m && z[i] === m) {
      const textMatchIdx = i - m - 1;
      matches.push(textMatchIdx);

      addStep(
        `Pattern match found! Z[${i}] == ${m} (pattern length); recording pattern match at text index ${textMatchIdx}.`,
        makeSnapshot(i, undefined, undefined, l, r),
      );
    }
  }

  addStep(
    `Z-Algorithm complete! Located ${matches.length} occurrence(s) of pattern "${pattern}" in text "${text}" at text indices: [${matches.join(", ")}].`,
    makeSnapshot(undefined, undefined, undefined, l, r),
  );

  return steps;
};

export default generateZAlgorithmSteps;
