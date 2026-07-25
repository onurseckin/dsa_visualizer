import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface KmpInput {
  text: string;
  pattern: string;
}

export const KMP_CODE = `def kmp_search(text: str, pattern: str) -> list[int]:
    n, m = len(text), len(pattern)
    if m == 0 or n == 0 or m > n:
        return []
    lps = [0] * m
    length = 0
    i = 1
    while i < m:
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length != 0:
            length = lps[length - 1]
        else:
            lps[i] = 0
            i += 1
    p_idx, t_idx = 0, 0
    matches = []
    while t_idx < n:
        if pattern[p_idx] == text[t_idx]:
            p_idx += 1
            t_idx += 1
        if p_idx == m:
            matches.append(t_idx - p_idx)
            p_idx = lps[p_idx - 1]
        elif t_idx < n and pattern[p_idx] != text[t_idx]:
            if p_idx != 0:
                p_idx = lps[p_idx - 1]
            else:
                t_idx += 1
    return matches`;

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
    'Set up the search',
    `We're looking for "${pattern}" (length ${m}) inside "${text}" (length ${n}). KMP will do it in a single pass over the text by first learning the pattern's internal structure.`,
    { n, m, pattern, text },
    'Preprocessing'
  );

  if (m === 0 || n === 0 || m > n) {
    addStep(
      3,
      'Search complete — nothing to match',
      'The pattern is empty, the text is empty, or the pattern is longer than the text, so a match is impossible and we return an empty result.',
      { n, m, matchesCount: 0 },
      'Complete'
    );
    return steps;
  }

  // Preprocessing Phase: Build LPS (Longest Prefix Suffix) table
  let len = 0;
  let i = 1;

  addStep(
    5,
    'Prepare the LPS table',
    `Before touching the text, we teach ourselves the pattern: LPS[i] will say how much of the pattern's own beginning repeats just before position i. That's exactly what tells us how far we can safely shift after a mismatch.`,
    { len, i, 'lps[0]': 0 },
    'Building LPS'
  );

  while (i < m) {
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      addStep(
        9,
        `Extend the prefix match to ${len}`,
        `pattern[${i}] ('${pattern[i]}') equals pattern[${len - 1}] ('${pattern[len - 1]}'), so the copy of the pattern's start that echoes here grows by one — we record LPS[${i}] = ${len} and move on.`,
        { i, len, 'pattern[i]': pattern[i], 'LPS[i]': len },
        'Building LPS'
      );
      i++;
    } else if (len !== 0) {
      const prevLen = len;
      len = lps[len - 1];
      addStep(
        14,
        `Fall back to length ${len}`,
        `pattern[${i}] ('${pattern[i]}') broke the run against pattern[${prevLen}] ('${pattern[prevLen]}'), but a shorter prefix might still fit — so we drop back to lps[${prevLen - 1}] = ${len} and retry without moving i.`,
        { i, len, 'pattern[i]': pattern[i] },
        'Building LPS'
      );
    } else {
      lps[i] = 0;
      addStep(
        16,
        `Record LPS[${i}] = 0`,
        `Nothing before position ${i} echoes the pattern's start ('${pattern[i]}' doesn't even match '${pattern[0]}'), so a mismatch here will send us all the way back to the beginning.`,
        { i, len: 0, 'LPS[i]': 0 },
        'Building LPS'
      );
      i++;
    }
  }

  addStep(
    18,
    'LPS table complete',
    `The table reads [${lps.join(', ')}]. Now we scan the text once — on any mismatch this table tells us exactly where to resume in the pattern, so the text pointer never has to rewind.`,
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
      21,
      `Compare text[${tIdx}] with pattern[${pIdx}]`,
      charT === charP
        ? `'${charT}' matches '${charP}', so we advance both pointers and keep the streak going.`
        : `'${charT}' and '${charP}' disagree, so we'll consult the LPS table to shift the pattern instead of backing up in the text.`,
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
        25,
        `Match found at index ${matchStart}`,
        `The whole pattern "${pattern}" lined up from index ${matchStart} to ${matchStart + m - 1}. We don't start over — resetting the pattern pointer to LPS[${pIdx - 1}] = ${lps[pIdx - 1]} lets us catch overlapping matches too.`,
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
          29,
          `Shift the pattern index to ${pIdx}`,
          `The LPS table says the last ${pIdx} matched characters are also a pattern prefix, so we resume from there — skipping ${oldPIdx - pIdx} comparisons while the text pointer stays put at ${tIdx}.`,
          { tIdx, oldPIdx, newPIdx: pIdx },
          'Matching',
          matches
        );
      } else {
        const oldTIdx = tIdx;
        tIdx++;
        addStep(
          31,
          `Advance the text pointer to ${tIdx}`,
          `We mismatched on the pattern's very first character at text[${oldTIdx}], so there's nothing to fall back on — we simply try the next text position.`,
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
    32,
    'Search complete',
    `We found ${matches.length} match(es) at index(es): ${matches.length > 0 ? matches.join(', ') : 'None'}. One pass to learn the pattern plus one pass over the text is what makes KMP run in O(n + m).`,
    { matchesCount: matches.length, matches: matches.join(', ') },
    'Complete',
    matches
  );

  return steps;
};

export const kmpStringMatch: AlgorithmDefinition<KmpInput> = {
  id: 'kmp-string-match',
  title: 'KMP String Matching',
  category: 'tries_and_strings',
  difficulty: 'Hard',
  description:
    'Knuth-Morris-Pratt (KMP) finds a pattern in a text in linear O(n + m) time. It first preprocesses the pattern into a Longest Prefix Suffix (LPS) table, which records how the pattern overlaps with itself; on a mismatch, that table says exactly where to resume — so the text pointer never moves backwards and no comparison is repeated.',
  constraints: [
    '1 <= text.length <= 10^5',
    '1 <= pattern.length <= 10^4',
    'Strings consist of printable ASCII characters',
  ],
  examples: [
    {
      input: 'text = "ABABDABACDABABCABAB", pattern = "ABABCABAB"',
      output: 'Match at index 10',
      explanation: 'Precomputed LPS table allows skipping backward text comparisons during partial mismatches.',
    },
  ],
  code: KMP_CODE,
  timeComplexity: {
    best: 'O(n + m)',
    average: 'O(n + m)',
    worst: 'O(n + m)',
  },
  spaceComplexity: 'O(m)',
  complexityAnalysis: {
    time: "There are two linear phases. Building the LPS table scans the pattern once — the fallback step can only give back match length that earlier steps built up, so it totals O(m). The matching phase never moves the text pointer backwards: every comparison either advances it or shrinks the pattern pointer, which only ever grew alongside it, so that phase is O(n). Together that's O(n + m), even in the worst case.",
    space: 'The only extra structure is the LPS table, one integer per pattern character — O(m). The text itself needs no bookkeeping at all.',
  },
  defaultInput: DEFAULT_KMP_INPUT,
  generateSteps: generateKmpSteps,
};
