import type { AlgorithmStep, ArrayElement } from "../../../types/dsa";

export interface KmpInput {
  text: string;
  pattern: string;
}

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

  const text = input.text || "";
  const pattern = input.pattern || "";
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
    "Enter kmp_search",
    `We're looking for "${pattern}" (length ${m}) inside "${text}" (length ${n}). KMP will do it in a single pass over the text by first learning the pattern's internal structure.`,
    { n, m, pattern, text },
    "Preprocessing",
  );

  // Python line 2: n, m = len(text), len(pattern)
  addStep(
    2,
    "Measure the inputs",
    `n = ${n} (text length) and m = ${m} (pattern length). These two sizes drive every bound check and LPS allocation that follows.`,
    { n, m },
    "Preprocessing",
  );

  if (m === 0 || n === 0 || m > n) {
    // Python line 3: if m == 0 or n == 0 or m > n
    addStep(
      3,
      "Early-exit condition is true",
      "The pattern is empty, the text is empty, or the pattern is longer than the text — a match is impossible.",
      { n, m },
      "Complete",
    );
    // Python line 4: return []
    addStep(
      4,
      "Return an empty list",
      "No matches can exist, so we hand back [] immediately.",
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
    "Allocate the LPS table",
    `We create an array of ${m} zeros — one slot per pattern character. LPS[i] will record how much of the pattern's own beginning echoes just before position i.`,
    { m, lps: lps.join(", ") },
    "Building LPS",
  );

  // Python line 6: length = 0
  addStep(
    6,
    "Initialise length = 0",
    "length tracks how many leading pattern characters the current suffix matches. We start at zero because no prefix has been confirmed yet.",
    { length: len },
    "Building LPS",
  );

  // Python line 7: i = 1
  addStep(
    7,
    "Initialise i = 1",
    "LPS[0] is always 0 by definition, so we start filling from index 1.",
    { i },
    "Building LPS",
  );

  // Python line 8: while i < m
  addStep(
    8,
    `Enter LPS build loop (i=${i}, m=${m})`,
    "We iterate while i < m, computing every LPS entry in a single linear pass.",
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
        `Extend the prefix match: length → ${len}`,
        `pattern[${i}] ('${pattern[i]}') equals pattern[${len - 1}] ('${pattern[len - 1]}'), so the copy of the pattern's start grows by one.`,
        { i, len, "pattern[i]": pattern[i] },
        "Building LPS",
      );
      // Python line 11: lps[i] = length
      addStep(
        11,
        `Record LPS[${i}] = ${len}`,
        `The matching prefix now reaches ${len} characters, so we write that into LPS[${i}].`,
        { i, "LPS[i]": len },
        "Building LPS",
      );
      // Python line 12: i += 1
      addStep(
        12,
        `Advance i to ${i + 1}`,
        "The current position is fully resolved; move on to the next pattern character.",
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
        `pattern[${i}] ('${pattern[i]}') broke the run against pattern[${prevLen}] ('${pattern[prevLen]}'), but a shorter prefix might still fit — so we drop back to lps[${prevLen - 1}] = ${len} and retry without moving i.`,
        { i, len, "pattern[i]": pattern[i] },
        "Building LPS",
      );
    } else {
      lps[i] = 0;
      // Python line 16: lps[i] = 0
      addStep(
        16,
        `Record LPS[${i}] = 0`,
        `Nothing before position ${i} echoes the pattern's start ('${pattern[i]}' doesn't even match '${pattern[0]}'), so a mismatch here will send us all the way back to the beginning.`,
        { i, len: 0, "LPS[i]": 0 },
        "Building LPS",
      );
      i++;
    }
  }

  // LPS build complete — summary step (spec asserts on "LPS table complete")
  addStep(
    18,
    "LPS table complete",
    `The table reads [${lps.join(", ")}]. Now we scan the text once — on any mismatch this table tells us exactly where to resume in the pattern, so the text pointer never has to rewind.`,
    { lps: lps.join(", ") },
    "Matching",
  );

  // Python line 18: p_idx, t_idx = 0, 0
  addStep(
    18,
    "Initialise search pointers",
    `We set p_idx = 0 and t_idx = 0 to begin the single text scan.`,
    { p_idx: 0, t_idx: 0 },
    "Matching",
  );

  // Python line 19: matches = []
  addStep(
    19,
    "Create the matches list",
    "An empty list to accumulate every starting index where the pattern is found.",
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
      `Compare text[${tIdx}] with pattern[${pIdx}]`,
      charT === charP
        ? `'${charT}' matches '${charP}', so we advance both pointers and keep the streak going.`
        : `'${charT}' and '${charP}' disagree, so we'll consult the LPS table to shift the pattern instead of backing up in the text.`,
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
        `Match found at index ${matchStart}`,
        `The whole pattern "${pattern}" lined up from index ${matchStart} to ${matchStart + m - 1}. We don't start over — resetting the pattern pointer to LPS[${pIdx - 1}] = ${lps[pIdx - 1]} lets us catch overlapping matches too.`,
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
          `Shift the pattern index to ${pIdx}`,
          `The LPS table says the last ${pIdx} matched characters are also a pattern prefix, so we resume from there — skipping ${oldPIdx - pIdx} comparisons while the text pointer stays put at ${tIdx}.`,
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
          `Advance the text pointer to ${tIdx}`,
          `We mismatched on the pattern's very first character at text[${oldTIdx}], so there's nothing to fall back on — we simply try the next text position.`,
          { tIdx },
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
    `We found ${matches.length} match(es) at index(es): ${matches.length > 0 ? matches.join(", ") : "None"}. One pass to learn the pattern plus one pass over the text is what makes KMP run in O(n + m).`,
    { matchesCount: matches.length, matches: matches.join(", ") },
    "Complete",
    matches,
  );

  return steps;
};
