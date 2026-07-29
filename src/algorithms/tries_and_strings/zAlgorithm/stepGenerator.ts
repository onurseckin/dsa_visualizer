import type { AlgorithmStep, ArrayElement, ElementState } from "../../../types/dsa";

export interface ZAlgorithmInput {
  text: string;
  pattern: string;
}

export const DEFAULT_Z_ALGORITHM_INPUT: ZAlgorithmInput = {
  text: "ababaaba",
  pattern: "aba",
};

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

  // Python line 1: def z_algorithm(text, pattern)
  const addEmptyStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: { kind: "array", elements: [] },
      auxiliaryState: { customState: { text, pattern, matches: "None" } },
      variables,
    });
  };

  addEmptyStep(
    1,
    "Initialize Z-Algorithm string matching",
    `Preparing to search pattern "${pattern}" (length ${m}) inside text "${text}" (length ${tLen}) via sentinel concatenation and Z-array self-similarity computation.`,
    { text, pattern, tLen, m },
  );

  if (m === 0 || tLen === 0 || m > tLen) {
    addEmptyStep(
      2,
      "Validate input bounds",
      "Empty input or pattern longer than search text. Terminating immediately with zero matches.",
      { text, pattern, matchesCount: 0 },
    );
    return steps;
  }

  const s = `${pattern}$${text}`;
  const n = s.length;
  const z: number[] = new Array<number>(n).fill(0);
  const matches: number[] = [];
  let l = 0;
  let r = 0;

  const getElements = (
    currentI?: number,
    compareLeft?: number,
    compareRight?: number,
    currentMatches: number[] = [],
  ): ArrayElement[] => {
    return s.split("").map((char, idx) => {
      let state: ElementState = "default";
      const pointers: string[] = [char];

      if (idx === currentI) {
        state = "active";
        pointers.push(`i=${idx}`);
      } else if (idx === compareLeft || idx === compareRight) {
        state = "compare";
        if (idx === compareLeft) pointers.push("pat-prefix");
        if (idx === compareRight) pointers.push("target");
      } else if (l <= idx && idx <= r && l !== r) {
        state = "pivot";
        if (idx === l) pointers.push("L");
        if (idx === r) pointers.push("R");
      }

      currentMatches.forEach((mIdx) => {
        const textStartInS = m + 1 + mIdx;
        if (idx >= textStartInS && idx < textStartInS + m) state = "sorted";
      });

      if (z[idx] > 0) pointers.push(`Z=${z[idx]}`);

      return {
        id: `el-${idx}`,
        value: z[idx],
        state,
        pointers,
      };
    });
  };

  const getAuxiliaryState = (stage: string, currentMatches: number[]) => {
    const zMap: Record<string, number> = {};
    for (let k = 0; k < n; k++) zMap[`Z[${k}] ('${s[k]}')`] = z[k];
    return {
      hashMap: zMap,
      customState: {
        stage,
        concatenated: s,
        window: `[L=${l}, R=${r}]`,
        zArray: z.join(", "),
        matches: currentMatches.length > 0 ? currentMatches.join(", ") : "None",
      },
      visited: currentMatches.map((idx) => `Match at text index ${idx}`),
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    stage: string = "Matching",
    currentI?: number,
    compareLeft?: number,
    compareRight?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: getElements(currentI, compareLeft, compareRight, matches),
      },
      auxiliaryState: getAuxiliaryState(stage, matches),
      variables,
    });
  };

  // Python line 2: s = pattern + "$" + text
  addStep(
    2,
    "Construct combined string S = pattern + '$' + text",
    `Concatenating pattern and text into S = "${s}" (length ${n}) enables converting pattern matching into a prefix self-similarity computation. Sentinel '$' prevents matches from crossing string boundaries.`,
    { s, n, m, text, pattern },
    "Initialization",
  );

  // Python line 5: l, r = 0, 0
  addStep(
    5,
    "Initialize Z-array and Z-box window [L, R]",
    "Z[i] stores the length of the longest prefix match starting at index i. The Z-box window [L, R] maintains the rightmost verified match interval to avoid repeating comparisons.",
    { l: 0, r: 0, n },
    "Initialization",
  );

  // Python line 8: for i in range(1, n)
  for (let i = 1; i < n; i++) {
    addStep(
      8,
      `Evaluate position i = ${i} ('${s[i]}')`,
      `Calculating Z[${i}] to measure the longest prefix match starting at index ${i}.`,
      { i, char: s[i], l, r },
      "Looping",
      i,
    );

    // Python line 9-10: if i <= r: z[i] = min(r - i + 1, z[i - l])
    if (i <= r) {
      const k = i - l;
      const rem = r - i + 1;
      z[i] = Math.min(rem, z[k]);
      addStep(
        10,
        `Reuse Z-box prefix match inside window [L=${l}, R=${r}]`,
        `Position ${i} falls inside [L=${l}, R=${r}]. Reusing mirrored value Z[${k}] = ${z[k]} (capped at remaining window length ${rem}) to initialize Z[${i}] = ${z[i]} in O(1) time.`,
        { i, l, r, k, "Z[k]": z[k], remaining: rem, "Z[i]": z[i] },
        "Window Optimization",
        i,
      );
    }

    // Python line 11: while i + z[i] < n and s[z[i]] == s[i + z[i]]
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) {
      addStep(
        11,
        `Compare characters S[${z[i]}] ('${s[z[i]]}') and S[${i + z[i]}] ('${s[i + z[i]]}')`,
        `Characters match. Extending prefix match length Z[${i}] from ${z[i]} to ${z[i] + 1}.`,
        { i, zI: z[i], matchChar: s[z[i]], targetChar: s[i + z[i]] },
        "Character Comparison",
        i,
        z[i],
        i + z[i],
      );
      z[i]++;
    }

    if (i + z[i] < n) {
      addStep(
        11,
        `Mismatch detected between S[${z[i]}] ('${s[z[i]]}') and S[${i + z[i]}] ('${s[i + z[i]]}')`,
        `Character mismatch terminates prefix extension for index ${i}. Final Z[${i}] = ${z[i]}.`,
        { i, finalZI: z[i] },
        "Character Comparison",
        i,
        z[i],
        i + z[i],
      );
    }

    // Python line 13: if i + z[i] - 1 > r
    if (i + z[i] - 1 > r) {
      const oldL = l;
      const oldR = r;
      l = i;
      r = i + z[i] - 1;
      addStep(
        13,
        `Advance Z-box window to [L=${l}, R=${r}]`,
        `Prefix match extends past previous right boundary (old R = ${oldR}). Updating window [L, R] to preserve maximum rightward coverage for future positions.`,
        { i, oldL, oldR, newL: l, newR: r },
        "Window Update",
        i,
      );
    }

    // Python line 17: matches.append(i - m - 1)
    if (i > m && z[i] === m) {
      const textMatchIdx = i - m - 1;
      matches.push(textMatchIdx);
      addStep(
        17,
        `Pattern match found at text index ${textMatchIdx}`,
        `Z[${i}] equals pattern length ${m}. The entire pattern occurs starting at 0-based text index ${textMatchIdx}.`,
        { i, textMatchIdx, pattern, matchCount: matches.length },
        "Pattern Match Found",
        i,
      );
    }
  }

  // Python line 18: return matches
  addStep(
    18,
    "Return all pattern match indices",
    `Completed single pass Z-array computation in linear O(N + M) total time, finding ${matches.length} pattern match(es) at text index(es): ${matches.length > 0 ? matches.join(", ") : "None"}.`,
    { totalMatches: matches.length, matches: matches.join(", ") },
    "Complete",
  );

  return steps;
};
