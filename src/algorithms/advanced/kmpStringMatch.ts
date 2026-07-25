import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface KmpInput {
  text: string;
  pattern: string;
}

export const KMP_CODE = `function kmpSearch(text, pattern) {
  const n = text.length, m = pattern.length;
  if (m === 0 || n === 0 || m > n) return [];
  const lps = new Array(m).fill(0);
  let len = 0, i = 1;
  while (i < m) {
    if (pattern[i] === pattern[len]) {
      len++; lps[i] = len; i++;
    } else if (len !== 0) {
      len = lps[len - 1];
    } else {
      lps[i] = 0; i++;
    }
  }
  let pIdx = 0, tIdx = 0;
  const matches = [];
  while (tIdx < n) {
    if (pattern[pIdx] === text[tIdx]) {
      pIdx++; tIdx++;
    }
    if (pIdx === m) {
      matches.push(tIdx - pIdx);
      pIdx = lps[pIdx - 1];
    } else if (tIdx < n && pattern[pIdx] !== text[tIdx]) {
      if (pIdx !== 0) pIdx = lps[pIdx - 1];
      else tIdx++;
    }
  }
  return matches;
}`;

export const DEFAULT_KMP_INPUT: KmpInput = {
  text: 'ABABDABACDABABCABAB',
  pattern: 'ABABCABAB',
};

export const generateKmpSteps = (input: KmpInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const text = input.text || '';
  const pattern = input.pattern || '';
  const n = text.length;
  const m = pattern.length;

  const elements: ArrayElement[] = text.split('').map((char, idx) => ({
    id: `el-${idx}`,
    value: char.charCodeAt(0),
    state: 'default',
    pointers: [char],
  }));

  const lps: number[] = new Array(m).fill(0);

  const getAuxiliaryState = (
    currentLps: number[],
    stage: string,
    matches: number[]
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
        lps: currentLps.join(', '),
        matches: matches.length > 0 ? matches.join(', ') : 'None',
      },
      visited: matches.map((idx) => `Match at index ${idx}`),
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    stage: string = 'Matching',
    matches: number[] = []
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'array',
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: getAuxiliaryState(lps, stage, matches),
      variables,
    });
  };

  addStep(
    1,
    'Initialize KMP Algorithm',
    `Searching for pattern "${pattern}" (length ${m}) inside text "${text}" (length ${n}).`,
    { n, m, pattern, text },
    'Preprocessing'
  );

  if (m === 0 || n === 0 || m > n) {
    addStep(
      3,
      'KMP Search complete (Invalid or empty input)',
      'Pattern cannot be matched because pattern or text length is invalid.',
      { n, m, matchesCount: 0 },
      'Complete'
    );
    return steps;
  }

  // Preprocessing Phase: Build LPS (Longest Prefix Suffix) table
  let len = 0;
  let i = 1;

  addStep(
    4,
    'Initialize LPS / Prefix Table',
    `LPS table initialized with 0s for pattern length ${m}.`,
    { len, i, 'lps[0]': 0 },
    'Building LPS'
  );

  while (i < m) {
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      addStep(
        7,
        `LPS match found: pattern[${i}] ('${pattern[i]}') === pattern[${len - 1}] ('${pattern[len - 1]}')`,
        `Extending prefix-suffix match length to ${len}. Set LPS[${i}] = ${len}.`,
        { i, len, 'pattern[i]': pattern[i], 'LPS[i]': len },
        'Building LPS'
      );
      i++;
    } else if (len !== 0) {
      const prevLen = len;
      len = lps[len - 1];
      addStep(
        10,
        `LPS mismatch: pattern[${i}] ('${pattern[i]}') !== pattern[${prevLen}] ('${pattern[prevLen]}')`,
        `Fall back length from ${prevLen} to lps[${prevLen - 1}] = ${len}.`,
        { i, len, 'pattern[i]': pattern[i] },
        'Building LPS'
      );
    } else {
      lps[i] = 0;
      addStep(
        12,
        `LPS no match: pattern[${i}] ('${pattern[i]}') !== pattern[0] ('${pattern[0]}')`,
        `No prefix match possible. Set LPS[${i}] = 0.`,
        { i, len: 0, 'LPS[i]': 0 },
        'Building LPS'
      );
      i++;
    }
  }

  addStep(
    14,
    'LPS / Prefix Table complete',
    `LPS table built: [${lps.join(', ')}]. Now starting pattern matching loop in text.`,
    { lps: lps.join(', ') },
    'Matching'
  );

  // Matching Phase
  let pIdx = 0;
  let tIdx = 0;
  const matches: number[] = [];

  while (tIdx < n) {
    const charT = text[tIdx];
    const charP = pattern[pIdx];

    elements[tIdx].state = 'compare';
    elements[tIdx].pointers = [charT, `i=${tIdx}`, `pat[${pIdx}]=${charP}`];

    addStep(
      16,
      `Compare text[${tIdx}] ('${charT}') with pattern[${pIdx}] ('${charP}')`,
      charT === charP
        ? `Characters match! Advance text and pattern pointers.`
        : `Characters differ! Use LPS table to skip redundant comparisons.`,
      { tIdx, pIdx, 'text[tIdx]': charT, 'pattern[pIdx]': charP },
      'Matching',
      matches
    );

    if (charP === charT) {
      pIdx++;
      tIdx++;
    }

    if (pIdx === m) {
      const matchStart = tIdx - pIdx;
      matches.push(matchStart);

      for (let k = matchStart; k < matchStart + m; k++) {
        elements[k].state = 'sorted';
        elements[k].pointers = [text[k], 'match'];
      }

      addStep(
        19,
        `Pattern match found at index ${matchStart}!`,
        `Pattern "${pattern}" matched text from index ${matchStart} to ${matchStart + m - 1}. Reset pattern pointer via LPS[${pIdx - 1}] = ${lps[pIdx - 1]}.`,
        { matchStart, matchCount: matches.length, nextPIdx: lps[pIdx - 1] },
        'Matching',
        matches
      );

      pIdx = lps[pIdx - 1];
    } else if (tIdx < n && pattern[pIdx] !== text[tIdx]) {
      elements[tIdx].state = 'default';
      elements[tIdx].pointers = [charT];

      if (pIdx !== 0) {
        const oldPIdx = pIdx;
        pIdx = lps[pIdx - 1];
        addStep(
          22,
          `Mismatch at text[${tIdx}]: reset pattern index from ${oldPIdx} to LPS[${oldPIdx - 1}] = ${pIdx}`,
          `Skip ${oldPIdx - pIdx} comparisons without rewinding text pointer i (${tIdx}).`,
          { tIdx, oldPIdx, newPIdx: pIdx },
          'Matching',
          matches
        );
      } else {
        const oldTIdx = tIdx;
        tIdx++;
        addStep(
          23,
          `Mismatch at text[${oldTIdx}] with pattern[0]: advance text pointer to ${tIdx}`,
          `Pattern index is 0, cannot fall back further. Advance text index.`,
          { tIdx },
          'Matching',
          matches
        );
      }
    } else if (tIdx < n && charP === charT) {
      elements[tIdx - 1].state = 'visited';
      elements[tIdx - 1].pointers = [text[tIdx - 1]];
    }
  }

  // Mark all matched elements
  matches.forEach((mIdx) => {
    for (let k = mIdx; k < mIdx + m; k++) {
      if (elements[k]) elements[k].state = 'sorted';
    }
  });

  addStep(
    25,
    'KMP Search complete',
    `Found ${matches.length} match(es) at index(es): ${matches.length > 0 ? matches.join(', ') : 'None'}.`,
    { matchesCount: matches.length, matches: matches.join(', ') },
    'Complete',
    matches
  );

  return steps;
};

export const kmpStringMatch: AlgorithmDefinition<KmpInput> = {
  id: 'kmp-string-match',
  title: 'KMP String Matching',
  category: 'advanced',
  difficulty: 'Hard',
  description:
    'Knuth-Morris-Pratt (KMP) string searching algorithm matches a pattern in a text using a Longest Prefix Suffix (LPS) table to avoid redundant character comparisons.',
  code: KMP_CODE,
  timeComplexity: {
    best: 'O(n + m)',
    average: 'O(n + m)',
    worst: 'O(n + m)',
  },
  spaceComplexity: 'O(m)',
  defaultInput: DEFAULT_KMP_INPUT,
  generateSteps: generateKmpSteps,
};
