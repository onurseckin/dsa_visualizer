import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
} from '../../types/dsa';

export interface ZAlgorithmInput {
  text: string;
  pattern: string;
}

export const Z_ALGORITHM_CODE = `def z_algorithm(text: str, pattern: str) -> list[int]:
    s = pattern + "$" + text
    n, m = len(s), len(pattern)
    z = [0] * n
    l, r = 0, 0
    matches = []

    for i in range(1, n):
        if i <= r:
            z[i] = min(r - i + 1, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] - 1 > r:
            l = i
            r = i + z[i] - 1
        if i > m and z[i] == m:
            matches.append(i - m - 1)
    return matches`;

export const DEFAULT_Z_ALGORITHM_INPUT: ZAlgorithmInput = {
  text: 'ababaaba',
  pattern: 'aba',
};

export const generateZAlgorithmSteps = (input: ZAlgorithmInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const text = input.text || '';
  const pattern = input.pattern || '';
  const m = pattern.length;
  const tLen = text.length;

  if (m === 0 || tLen === 0 || m > tLen) {
    steps.push({
      stepIndex: 0,
      codeLine: 1,
      explanation: {
        what: 'Initialize Z-Algorithm Search',
        why: 'Invalid or empty input text/pattern provided. Search complete with 0 matches.',
      },
      primarySnapshot: {
        kind: 'array',
        elements: [],
      },
      auxiliaryState: {
        customState: {
          text,
          pattern,
          matches: 'None',
        },
      },
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
    currentMatches: number[] = []
  ): ArrayElement[] => {
    return s.split('').map((char, idx) => {
      let state: ElementState = 'default';
      const pointers: string[] = [char];

      if (idx === currentI) {
        state = 'active';
        pointers.push(`i=${idx}`);
      } else if (idx === compareLeft || idx === compareRight) {
        state = 'compare';
        if (idx === compareLeft) pointers.push('pat-prefix');
        if (idx === compareRight) pointers.push('target');
      } else if (l <= idx && idx <= r && l !== r) {
        state = 'pivot';
        if (idx === l) pointers.push('L');
        if (idx === r) pointers.push('R');
      }

      currentMatches.forEach((mIdx) => {
        const textStartInS = m + 1 + mIdx;
        if (idx >= textStartInS && idx < textStartInS + m) {
          state = 'sorted';
        }
      });

      if (z[idx] > 0) {
        pointers.push(`Z=${z[idx]}`);
      }

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
    for (let k = 0; k < n; k++) {
      zMap[`Z[${k}] ('${s[k]}')`] = z[k];
    }
    return {
      hashMap: zMap,
      customState: {
        stage,
        concatenated: s,
        window: `[L=${l}, R=${r}]`,
        zArray: z.join(', '),
        matches: currentMatches.length > 0 ? currentMatches.join(', ') : 'None',
      },
      visited: currentMatches.map((idx) => `Match at text index ${idx}`),
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    stage: string = 'Matching',
    currentI?: number,
    compareLeft?: number,
    compareRight?: number
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'array',
        elements: getElements(currentI, compareLeft, compareRight, matches),
      },
      auxiliaryState: getAuxiliaryState(stage, matches),
      variables,
    });
  };

  addStep(
    2,
    'Construct concatenated string S = pattern + "$" + text',
    `Created string S = "${s}" of total length ${n} (Pattern length m = ${m}). The delimiter '$' prevents matches from extending across string boundaries.`,
    { s, n, m, text, pattern },
    'Initialization'
  );

  addStep(
    5,
    'Initialize Z-array and window pointers L = 0, R = 0',
    'Z[i] stores the length of the longest common prefix between S and the suffix of S starting at index i. Window [L, R] tracks the rightmost matched interval.',
    { l: 0, r: 0, n },
    'Initialization'
  );

  for (let i = 1; i < n; i++) {
    addStep(
      8,
      `Start processing index i = ${i} ('${s[i]}')`,
      `Evaluate Z[${i}] value for suffix starting at S[${i}].`,
      { i, char: s[i], l, r },
      'Looping',
      i
    );

    if (i <= r) {
      const k = i - l;
      const rem = r - i + 1;
      z[i] = Math.min(rem, z[k]);
      addStep(
        9,
        `Index i = ${i} is inside window [L=${l}, R=${r}]`,
        `Use previously computed Z[${k}] = ${z[k]}. Initialize Z[${i}] = min(R - i + 1, Z[i - L]) = ${z[i]} to avoid redundant comparisons.`,
        { i, l, r, k, 'Z[k]': z[k], remaining: rem, 'Z[i]': z[i] },
        'Window Optimization',
        i
      );
    }

    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) {
      addStep(
        11,
        `Compare S[${z[i]}] ('${s[z[i]]}') with S[${i + z[i]}] ('${s[i + z[i]]}')`,
        `Characters match! Increment Z[${i}] from ${z[i]} to ${z[i] + 1}.`,
        { i, zI: z[i], matchChar: s[z[i]], targetChar: s[i + z[i]] },
        'Character Comparison',
        i,
        z[i],
        i + z[i]
      );
      z[i]++;
    }

    if (i + z[i] < n) {
      addStep(
        11,
        `Mismatch at S[${z[i]}] ('${s[z[i]]}') vs S[${i + z[i]}] ('${s[i + z[i]]}')`,
        `Comparison stopped. Final Z[${i}] = ${z[i]}.`,
        { i, finalZI: z[i] },
        'Character Comparison',
        i,
        z[i],
        i + z[i]
      );
    }

    if (i + z[i] - 1 > r) {
      const oldL = l;
      const oldR = r;
      l = i;
      r = i + z[i] - 1;
      addStep(
        13,
        `Update window [L, R] to [${l}, ${r}]`,
        `Expanded rightmost matched interval beyond old R = ${oldR} to new R = ${r}.`,
        { i, oldL, oldR, newL: l, newR: r },
        'Window Update',
        i
      );
    }

    if (i > m && z[i] === m) {
      const textMatchIdx = i - m - 1;
      matches.push(textMatchIdx);
      addStep(
        17,
        `Pattern match found at text index ${textMatchIdx}!`,
        `Z[${i}] = ${m} equals pattern length ${m}. Matched text substring "${text.substring(textMatchIdx, textMatchIdx + m)}".`,
        { i, textMatchIdx, pattern, matchCount: matches.length },
        'Pattern Match Found',
        i
      );
    }
  }

  addStep(
    18,
    'Z-Algorithm search complete',
    `Found ${matches.length} pattern match(es) in text at index(es): ${matches.length > 0 ? matches.join(', ') : 'None'}.`,
    { totalMatches: matches.length, matches: matches.join(', ') },
    'Complete'
  );

  return steps;
};

export const zAlgorithm: AlgorithmDefinition<ZAlgorithmInput> = {
  id: 'z-algorithm',
  title: 'Z-Algorithm String Matching',
  category: 'tries_and_strings',
  difficulty: 'Hard',
  description:
    'The Z-algorithm computes the Z-array for a string S = pattern$text in linear O(N + M) time. Z[i] is the length of the longest substring starting at S[i] that matches the prefix of S. A pattern match occurs whenever Z[i] equals the pattern length M.',
  constraints: [
    '1 <= text.length <= 10^5',
    '1 <= pattern.length <= 10^4',
    'Strings consist of printable ASCII characters',
  ],
  examples: [
    {
      input: 'text = "ababaaba", pattern = "aba"',
      output: 'Matches at text indices 0 and 5',
      explanation: 'Concatenated string "aba$ababaaba" generates Z-values equal to 3 at indices 4 and 9.',
    },
  ],
  code: Z_ALGORITHM_CODE,
  timeComplexity: {
    best: 'O(n + m)',
    average: 'O(n + m)',
    worst: 'O(n + m)',
  },
  spaceComplexity: 'O(n + m)',
  defaultInput: DEFAULT_Z_ALGORITHM_INPUT,
  generateSteps: generateZAlgorithmSteps,
};
