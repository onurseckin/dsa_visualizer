import type { AlgorithmStep, ArrayElement } from "../../../types/dsa";

export interface KmpInput {
  text: string;
  pattern: string;
}

export const DEFAULT_KMP_INPUT: KmpInput = {
  text: "ABABDABACDABABCABAB",
  pattern: "ABABCABAB",
};

const getAuxiliaryState = (
  pattern: string,
  text: string,
  m: number,
  currentLps: number[],
  stage: string,
  matches: number[],
) => {
  const lpsMap: Record<string, number> = {};
  for (let k = 0; k < m; k++) {
    lpsMap[`LPS[${k}] ('${pattern[k]}')`] = currentLps[k];
  }
  return {
    hashMap: lpsMap,
    customState: {
      stage,
      pattern,
      text,
      lps: currentLps.join(", "),
      matches: matches.length > 0 ? matches.join(", ") : "None",
    },
    visited: matches.map((idx) => `Match at index ${idx}`),
  };
};

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

  const elements: ArrayElement[] = text.split("").map((char, idx) => ({
    id: `el-${idx}`,
    value: char.charCodeAt(0),
    state: "default",
    pointers: [char],
  }));

  const lps: number[] = new Array(m).fill(0);

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    stage: string = "Matching",
    matches: number[] = [],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el) => ({
          ...el,
          pointers: [...(el.pointers ?? [])],
        })),
      },
      auxiliaryState: getAuxiliaryState(pattern, text, m, lps, stage, matches),
      variables,
    });
  };

  // Python line 1: def kmp_search(text, pattern)
  addStep(
    1,
    "Initialize KMP String Search",
    `Searching for pattern "${pattern}" (length ${m}) inside text "${text}" (length ${n}). KMP precomputes the Longest Prefix Suffix (LPS) table to eliminate text pointer backtracking.`,
    { n, m, pattern, text },
    "Preprocessing",
  );

  // Python line 2: n, m = len(text), len(pattern)
  addStep(
    2,
    "Inspect input lengths",
    `text length N = ${n}, pattern length M = ${m}. Validating search constraints.`,
    { n, m },
    "Preprocessing",
  );

  if (m === 0 || n === 0 || m > n) {
    // Python line 3: if m == 0 or n == 0 or m > n
    addStep(
      3,
      "Validate input bounds",
      "Empty input or pattern longer than text. Terminating search immediately with zero matches.",
      { n, m },
      "Complete",
    );
    // Python line 4: return []
    addStep(
      4,
      "Return empty match results",
      "No matches are possible for given input dimensions. Returning [].",
      { matchesCount: 0 },
      "Complete",
    );
    return steps;
  }

  let len = 0;
  let i = 1;

  // Python line 5: lps = [0] * m
  addStep(
    5,
    "Allocate LPS table",
    `Allocating an LPS table of ${m} entries. LPS[i] stores the length of the longest proper prefix of pattern[0..i] that is also a suffix of pattern[0..i].`,
    { m, lps: lps.join(", ") },
    "Building LPS",
  );

  // Python line 6: length = 0
  addStep(
    6,
    "Initialize prefix-suffix tracking pointer",
    "Setting running prefix-suffix length pointer to 0. No self-overlap verified yet.",
    { length: len },
    "Building LPS",
  );

  // Python line 7: i = 1
  addStep(
    7,
    "Initialize pattern evaluation index i = 1",
    "LPS[0] is strictly 0 because a single character cannot have a proper prefix equal to itself. Preprocessing starts at index 1.",
    { i },
    "Building LPS",
  );

  // Python line 8: while i < m
  addStep(
    8,
    `Begin LPS table construction loop (i=${i}, m=${m})`,
    "Iterating through pattern characters to compute longest proper prefix-suffix lengths.",
    { i, m },
    "Building LPS",
  );

  while (i < m) {
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      // Python line 10: length += 1
      addStep(
        10,
        `Extend prefix-suffix match length: len -> ${len}`,
        `Character pattern[${i}] ('${pattern[i]}') matches pattern[${len - 1}]. Incrementing proper prefix-suffix match length.`,
        { i, len, "pattern[i]": pattern[i] },
        "Building LPS",
      );
      // Python line 11: lps[i] = length
      addStep(
        11,
        `Record LPS[${i}] = ${len}`,
        `Pattern prefix of length ${len} matches suffix ending at index ${i}. Updating LPS[${i}] = ${len}.`,
        { i, "LPS[i]": len },
        "Building LPS",
      );
      // Python line 12: i += 1
      addStep(
        12,
        `Advance pattern index i to ${i + 1}`,
        "LPS value for current position resolved. Moving to evaluate next pattern position.",
        { i: i + 1 },
        "Building LPS",
      );
      i++;
    } else if (len !== 0) {
      const prevLen = len;
      len = lps[len - 1];
      // Python line 14: length = lps[length - 1]
      addStep(
        14,
        `Fall back to length ${len}`,
        `Mismatch between pattern[${i}] ('${pattern[i]}') and pattern[${prevLen}]. Falling back to previous LPS value LPS[${prevLen - 1}] = ${len} without advancing index i.`,
        { i, len, "pattern[i]": pattern[i] },
        "Building LPS",
      );
    } else {
      lps[i] = 0;
      // Python line 16: lps[i] = 0
      addStep(
        16,
        `Record LPS[${i}] = 0`,
        `No self-overlap exists for suffix ending at index ${i}. Setting LPS[${i}] = 0 and advancing index i.`,
        { i, len: 0, "LPS[i]": 0 },
        "Building LPS",
      );
      i++;
    }
  }

  // LPS build complete — summary step
  addStep(
    18,
    "LPS table complete",
    `LPS table successfully constructed: [${lps.join(", ")}]. Prepared for non-backtracking text scanning.`,
    { lps: lps.join(", ") },
    "Matching",
  );

  // Python line 18: p_idx, t_idx = 0, 0
  addStep(
    18,
    "Initialize search pointers (p_idx=0, t_idx=0)",
    "Setting text pointer t_idx = 0 and pattern pointer p_idx = 0 to launch single-pass text scan.",
    { p_idx: 0, t_idx: 0 },
    "Matching",
  );

  // Python line 19: matches = []
  addStep(
    19,
    "Initialize match index collector",
    "Preparing list to store starting indices of all pattern occurrences.",
    { matchesCount: 0 },
    "Matching",
  );

  let pIdx = 0;
  let tIdx = 0;
  const matches: number[] = [];

  while (tIdx < n) {
    const charT = text[tIdx];
    const charP = pattern[pIdx];

    elements[tIdx].state = "compare";
    elements[tIdx].pointers = [charT, `i=${tIdx}`, `pat[${pIdx}]=${charP}`];

    // Python line 21: if pattern[p_idx] == text[t_idx]
    addStep(
      21,
      `Compare text[${tIdx}] ('${charT}') with pattern[${pIdx}] ('${charP}')`,
      charT === charP
        ? `Characters match! Advancing both text pointer t_idx and pattern pointer p_idx.`
        : `Character mismatch detected. Utilizing LPS table to shift pattern alignment without rewinding text pointer t_idx.`,
      { tIdx, pIdx, "text[tIdx]": charT, "pattern[pIdx]": charP },
      "Matching",
      matches,
    );

    if (charP === charT) {
      pIdx++;
      tIdx++;
    }

    if (pIdx === m) {
      const matchStart = tIdx - pIdx;
      matches.push(matchStart);

      for (let k = matchStart; k < matchStart + m; k++) {
        elements[k].state = "sorted";
        elements[k].pointers = [text[k], "match"];
      }

      // Python line 25: matches.append(t_idx - p_idx)
      addStep(
        25,
        `Pattern match confirmed at text index ${matchStart}`,
        `Full pattern matched from text index ${matchStart} to ${matchStart + m - 1}. Falling back p_idx to LPS[${pIdx - 1}] = ${lps[pIdx - 1]} to enable detecting overlapping pattern occurrences.`,
        { matchStart, matchCount: matches.length, nextPIdx: lps[pIdx - 1] },
        "Matching",
        matches,
      );
      pIdx = lps[pIdx - 1];
    } else if (tIdx < n && pattern[pIdx] !== text[tIdx]) {
      elements[tIdx].state = "default";
      elements[tIdx].pointers = [charT];

      if (pIdx !== 0) {
        const oldPIdx = pIdx;
        pIdx = lps[pIdx - 1];
        // Python line 29: p_idx = lps[p_idx - 1]
        addStep(
          29,
          `Fallback pattern pointer p_idx to ${pIdx}`,
          `LPS table fallback: shifting pattern pointer from ${oldPIdx} to ${pIdx} (LPS[${oldPIdx - 1}]). Reusing ${pIdx} already-matched prefix characters while keeping text pointer fixed at t_idx = ${tIdx}.`,
          { tIdx, oldPIdx, newPIdx: pIdx },
          "Matching",
          matches,
        );
      } else {
        const oldTIdx = tIdx;
        tIdx++;
        // Python line 31: t_idx += 1
        addStep(
          31,
          `Advance text pointer to t_idx = ${tIdx}`,
          `Mismatch at initial pattern character (p_idx = 0). Advancing text pointer from ${oldTIdx} to evaluate next text position.`,
          { tIdx, oldTIdx },
          "Matching",
          matches,
        );
      }
    } else if (tIdx < n && charP === charT) {
      elements[tIdx - 1].state = "visited";
      elements[tIdx - 1].pointers = [text[tIdx - 1]];
    }
  }

  matches.forEach((mIdx) => {
    for (let k = mIdx; k < mIdx + m; k++) {
      if (elements[k]) elements[k].state = "sorted";
    }
  });

  // Python line 32: return matches
  addStep(
    32,
    "Search complete — return matches",
    `KMP search completed in linear O(N + M) time. Found ${matches.length} match(es) at starting text index(es): ${matches.length > 0 ? matches.join(", ") : "None"}.`,
    { matchesCount: matches.length, matches: matches.join(", ") },
    "Complete",
    matches,
  );

  return steps;
};
