import type { AlgorithmStep, ArrayElement, ElementState } from "../../../types/dsa";

export interface ZAlgorithmInput {
  text: string;
  pattern: string;
}

export const generateZAlgorithmSteps = (input: ZAlgorithmInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const text = input.text || "";
  const pattern = input.pattern || "";
  const m = pattern.length;
  const tLen = text.length;

  if (m === 0 || tLen === 0 || m > tLen) {
    steps.push({
      stepIndex: 0,
      codeLine: 1,
      explanation: {
        what: "Handle an empty or invalid input",
        why: "The pattern is empty, longer than the text, or the text is empty — no match is possible, so we finish immediately with zero matches.",
      },
      primarySnapshot: { kind: "array", elements: [] },
      auxiliaryState: { customState: { text, pattern, matches: "None" } },
      variables: { text, pattern, matchesCount: 0 },
    });
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
        value: z[idx] > 0 ? z[idx] : char.charCodeAt(0),
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

  addStep(
    2,
    'Build S = pattern + "$" + text',
    `We glue the pattern and text into one string S = "${s}" (length ${n}) so a single prefix-matching pass can find every occurrence. The '$' separator can never match a real character, so matches can't leak across the boundary.`,
    { s, n, m, text, pattern },
    "Initialization",
  );

  addStep(
    5,
    "Set up the Z-array and window",
    `Z[i] will record how many characters starting at position i match the very start of S, and the window [L, R] remembers the rightmost stretch we've already matched — so we never compare the same characters twice.`,
    { l: 0, r: 0, n },
    "Initialization",
  );

  for (let i = 1; i < n; i++) {
    addStep(
      8,
      `Move to index ${i} ('${s[i]}')`,
      `We want Z[${i}]: how long a copy of S's own prefix starts right here at position ${i}.`,
      { i, char: s[i], l, r },
      "Looping",
      i,
    );

    if (i <= r) {
      const k = i - l;
      const rem = r - i + 1;
      z[i] = Math.min(rem, z[k]);
      addStep(
        9,
        `Reuse work from the window`,
        `Position ${i} sits inside [L=${l}, R=${r}], a stretch we already know mirrors the prefix, so we copy Z[${k}] = ${z[k]} from the mirrored position — capped at the ${rem} characters left in the window — and start Z[${i}] at ${z[i]} for free.`,
        { i, l, r, k, "Z[k]": z[k], remaining: rem, "Z[i]": z[i] },
        "Window Optimization",
        i,
      );
    }

    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) {
      addStep(
        11,
        `Compare '${s[z[i]]}' with '${s[i + z[i]]}'`,
        `S[${z[i]}] and S[${i + z[i]}] match, so the prefix copy keeps going — we extend Z[${i}] from ${z[i]} to ${z[i] + 1} and try the next pair.`,
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
        `Stop at a mismatch`,
        `S[${z[i]}] ('${s[z[i]]}') and S[${i + z[i]}] ('${s[i + z[i]]}') disagree, so the match ends here and Z[${i}] settles at ${z[i]}.`,
        { i, finalZI: z[i] },
        "Character Comparison",
        i,
        z[i],
        i + z[i],
      );
    }

    if (i + z[i] - 1 > r) {
      const oldL = l;
      const oldR = r;
      l = i;
      r = i + z[i] - 1;
      addStep(
        13,
        `Slide the window to [${l}, ${r}]`,
        `Our new match reaches past the old R = ${oldR}, so we record it as the rightmost known match — later positions that fall inside it can reuse this work instead of comparing again.`,
        { i, oldL, oldR, newL: l, newR: r },
        "Window Update",
        i,
      );
    }

    if (i > m && z[i] === m) {
      const textMatchIdx = i - m - 1;
      matches.push(textMatchIdx);
      addStep(
        17,
        `Pattern match found at text index ${textMatchIdx}`,
        `Z[${i}] = ${m}, the full pattern length — the pattern appears verbatim here, as the substring "${text.substring(textMatchIdx, textMatchIdx + m)}" starting at text index ${textMatchIdx}.`,
        { i, textMatchIdx, pattern, matchCount: matches.length },
        "Pattern Match Found",
        i,
      );
    }
  }

  addStep(
    18,
    "Finish the scan",
    `Every position now has its Z-value, and we found ${matches.length} match(es) at text index(es): ${matches.length > 0 ? matches.join(", ") : "None"}. Because the window's right edge only ever moves forward, the whole scan stayed linear — O(n + m).`,
    { totalMatches: matches.length, matches: matches.join(", ") },
    "Complete",
  );

  return steps;
};
