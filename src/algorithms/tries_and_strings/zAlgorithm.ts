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
        what: 'Handle an empty or invalid input',
        why: 'The pattern is empty, longer than the text, or the text is empty — no match is possible, so we finish immediately with zero matches.',
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
    'Build S = pattern + "$" + text',
    `We glue the pattern and text into one string S = "${s}" (length ${n}) so a single prefix-matching pass can find every occurrence. The '$' separator can never match a real character, so matches can't leak across the boundary.`,
    { s, n, m, text, pattern },
    'Initialization'
  );

  addStep(
    5,
    'Set up the Z-array and window',
    `Z[i] will record how many characters starting at position i match the very start of S, and the window [L, R] remembers the rightmost stretch we've already matched — so we never compare the same characters twice.`,
    { l: 0, r: 0, n },
    'Initialization'
  );

  for (let i = 1; i < n; i++) {
    addStep(
      8,
      `Move to index ${i} ('${s[i]}')`,
      `We want Z[${i}]: how long a copy of S's own prefix starts right here at position ${i}.`,
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
        `Reuse work from the window`,
        `Position ${i} sits inside [L=${l}, R=${r}], a stretch we already know mirrors the prefix, so we copy Z[${k}] = ${z[k]} from the mirrored position — capped at the ${rem} characters left in the window — and start Z[${i}] at ${z[i]} for free.`,
        { i, l, r, k, 'Z[k]': z[k], remaining: rem, 'Z[i]': z[i] },
        'Window Optimization',
        i
      );
    }

    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) {
      addStep(
        11,
        `Compare '${s[z[i]]}' with '${s[i + z[i]]}'`,
        `S[${z[i]}] and S[${i + z[i]}] match, so the prefix copy keeps going — we extend Z[${i}] from ${z[i]} to ${z[i] + 1} and try the next pair.`,
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
        `Stop at a mismatch`,
        `S[${z[i]}] ('${s[z[i]]}') and S[${i + z[i]}] ('${s[i + z[i]]}') disagree, so the match ends here and Z[${i}] settles at ${z[i]}.`,
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
        `Slide the window to [${l}, ${r}]`,
        `Our new match reaches past the old R = ${oldR}, so we record it as the rightmost known match — later positions that fall inside it can reuse this work instead of comparing again.`,
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
        `Pattern match found at text index ${textMatchIdx}`,
        `Z[${i}] = ${m}, the full pattern length — the pattern appears verbatim here, as the substring "${text.substring(textMatchIdx, textMatchIdx + m)}" starting at text index ${textMatchIdx}.`,
        { i, textMatchIdx, pattern, matchCount: matches.length },
        'Pattern Match Found',
        i
      );
    }
  }

  addStep(
    18,
    'Finish the scan',
    `Every position now has its Z-value, and we found ${matches.length} match(es) at text index(es): ${matches.length > 0 ? matches.join(', ') : 'None'}. Because the window's right edge only ever moves forward, the whole scan stayed linear — O(n + m).`,
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
    'The Z-algorithm scans S = pattern + "$" + text once and computes the Z-array: Z[i] is how long a copy of S\'s own prefix starts at position i. Whenever Z[i] equals the pattern length, the pattern occurs there — so one linear O(n + m) pass finds every match.',
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
  complexityAnalysis: {
    time: "The inner while loop looks like it could blow up, but every character comparison it makes either pushes the window's right edge R further right or ends the loop — and R never moves backwards. So the total number of comparisons across the entire run is bounded by the length of S = pattern + '$' + text, making the algorithm O(n + m). There is no bad case: even highly repetitive strings cannot force R to retreat.",
    space: 'We store the concatenated string S and its Z-array, each about n + m characters long, so extra memory grows linearly with the combined input size — O(n + m).',
  },
  topicGuide: {
    overview:
      'The Z-algorithm computes, for every position of a string, how far the string agrees with itself when you slide a copy of it to that position. That single table, the Z-array, turns out to answer a surprising range of questions, and pattern matching is only the most famous one: glue the pattern in front of the text and any position whose Z-value equals the pattern length is an occurrence. What makes it worth learning is the reuse trick at its heart, where already-computed answers let you skip comparisons instead of redoing them. Once you can read a Z-array you have a general-purpose tool for periodicity, repeated substrings, and self-similarity.',
    sections: [
      {
        heading: 'The core idea: measure how a string matches itself',
        body: 'Z[i] is defined as the length of the longest substring starting at position i that is also a prefix of the whole string. For "aabxaab" the value at index 4 is 3, because "aab" starts there and "aab" is also the beginning of the string. Position 0 is a degenerate case since the whole string trivially matches its own prefix, so it is left as zero and skipped. The reason this definition is powerful is that a prefix match is exactly what a pattern search is looking for, provided the pattern is the prefix. So the algorithm never mentions patterns or texts internally; it only ever compares a string against its own front.',
      },
      {
        heading: 'The concatenation trick with a separator',
        body: 'To search for a pattern you build S = pattern + "$" + text, which makes the pattern the prefix of S and puts the text where the Z-array can be read off. Every index i beyond the separator whose Z-value equals the pattern length marks a full occurrence, and subtracting the pattern length plus one for the separator converts that index back into a text index. The separator must be a character that appears in neither the pattern nor the text, and that requirement is not cosmetic: without it a match could run past the end of the pattern into the text, producing Z-values larger than the pattern length and blurring where matches start. With "aba" and "ababaaba" the combined string is "aba$ababaaba" and the Z-values reach 3 at combined indices 4 and 9, which map to text indices 0 and 5.',
      },
      {
        heading: 'How the mechanism works: the Z-box',
        body: 'The algorithm carries a window written as l and r, the interval of the most recently discovered match with the prefix, often called the Z-box. When the next index i lies inside that window, the characters from i to r are known to be a copy of characters from i - l onward in the prefix, so the previously computed Z[i - l] already describes what happens there and can be copied instead of recomputed. That copy is capped at r - i + 1 because beyond r nothing has been verified yet, and only that unverified tail is explored with an explicit character-by-character while loop. When i falls outside the window there is nothing to reuse, so the comparison starts from scratch at zero. Whenever the extension reaches further right than r, the window slides forward to the new match, keeping l and r as the freshest evidence available.',
      },
      {
        heading: 'Why it is correct: the window is a verified copy',
        body: 'The invariant is that the segment from l to r has already been confirmed equal to the prefix of the same length, so anything you deduce inside the window is a statement about the prefix restated in a different place. Copying Z[i - l] is therefore sound rather than a guess, because the inner substring and its mirror in the prefix are literally the same characters. The cap at r - i + 1 keeps you honest: past r nothing has been verified, so the algorithm never claims a match it has not either seen or inherited, and the while loop resumes real comparisons exactly at the first uncertain character. The second half of the invariant is that r only ever moves right, which is why the algorithm never revisits a character it has already consumed while extending. That combination, verified copies inside the window and fresh comparisons only past its edge, is what makes the single pass both correct and non-redundant.',
      },
      {
        heading: 'When to use it, and how it compares to KMP',
        body: 'Reach for the Z-algorithm when you want a general self-similarity table, when you find its case analysis easier to remember than the failure-function recurrence, or when the same table will answer several questions about one string. KMP solves the same matching problem in the same linear time and uses less memory because it never builds the concatenated string, so for plain single-pattern search in a huge text KMP or a language built-in is usually the better engineering choice. If you need to match many patterns at once, neither one is right and you should build an Aho-Corasick automaton; if you want randomized simplicity, rolling hashes are shorter to write but carry a collision risk. The Z-array shines when the question is about the string itself rather than about a search.',
      },
      {
        heading: 'Pitfalls and how it generalizes',
        body: 'The mistakes cluster in a few places: forgetting the separator, choosing a separator that occurs in the input, starting the loop at 0 instead of 1, and writing the window update as an assignment to r without the guard that only extends it rightward. Another subtle one is reporting matches without checking that the index sits past the pattern portion of S, which lets self-matches inside the pattern masquerade as text matches. Once you are comfortable, the same table answers much more. Running the Z-algorithm on a string and its reverse gives you the tools for longest palindromic prefix questions, the value pattern reveals the smallest period of a string, and Z-values combined across concatenations count distinct substrings or find the longest common prefix between suffixes. Every one of these reuses a single idea: a table of self-agreements can substitute for a great many direct comparisons.',
      },
    ],
    keyTerms: [
      {
        term: 'Z-array',
        definition:
          'The table where Z[i] is the length of the longest substring starting at index i that also matches the beginning of the string. It is the only output the core algorithm produces; matches are read off it afterwards.',
      },
      {
        term: 'Z-box',
        definition:
          'The interval from l to r that is currently known to be a copy of the string prefix. It is the memory that lets the algorithm reuse earlier answers instead of comparing characters again.',
      },
      {
        term: 'Separator character',
        definition:
          'A sentinel such as "$" placed between the pattern and the text so no match can straddle the boundary. It must not appear in either input or the match detection breaks.',
      },
      {
        term: 'Prefix match',
        definition:
          'An agreement between a substring and the front of the same string. The Z-algorithm turns pattern searching into prefix matching by making the pattern the front of the combined string.',
      },
      {
        term: 'Period of a string',
        definition:
          'The smallest shift that maps a string onto itself, for example 2 in "ababab". Reading the Z-array reveals it directly, which is why the table is useful well beyond searching.',
      },
    ],
  },
  defaultInput: DEFAULT_Z_ALGORITHM_INPUT,
  generateSteps: generateZAlgorithmSteps,
};
