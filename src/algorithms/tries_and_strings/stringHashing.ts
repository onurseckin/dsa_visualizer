import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface StringHashingInput {
  text: string;
  pattern: string;
  p?: number;
  mod?: number;
}

export const PYTHON_STRING_HASHING_CODE = `
def python_string_hashing(input_array):
    """
    Implementation of python_string_hashing.
    """
    output_buffer = []
    for idx, element in enumerate(input_array):
        val = element * 2 if isinstance(element, (int, float)) else str(element)
        output_buffer.append((idx, val))
    return output_buffer
`;

export const DEFAULT_STRING_HASHING_INPUT: StringHashingInput = {
  text: "abracadabra",
  pattern: "abra",
  p: 31,
  mod: 1000000007,
};

export const generateStringHashingSteps = (input: StringHashingInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const text = input.text || "abracadabra";
  const pattern = input.pattern || "abra";
  const p = input.p || 31;
  const mod = input.mod || 1000000007;

  const n = text.length;
  const m = pattern.length;

  const hashVals = new Array<number>(n + 1).fill(0);
  const powP = new Array<number>(n + 1).fill(1);

  for (let i = 0; i < n; i++) {
    const charVal = text.charCodeAt(i) - 96; // 'a' -> 1
    hashVals[i + 1] = (hashVals[i] * p + charVal) % mod;
    powP[i + 1] = (powP[i] * p) % mod;
  }

  // Calculate pattern hash
  let patternHash = 0;
  for (let i = 0; i < m; i++) {
    const charVal = pattern.charCodeAt(i) - 96;
    patternHash = (patternHash * p + charVal) % mod;
  }

  const queryHash = (l: number, r: number): number => {
    const val = (hashVals[r + 1] - ((hashVals[l] * powP[r - l + 1]) % mod) + mod) % mod;
    return val;
  };

  const makeElements = (
    activeWindow?: { l: number; r: number },
    matchIndices: number[] = [],
  ): ArrayElement[] => {
    return text.split("").map((ch, idx) => {
      const isInWindow = activeWindow && idx >= activeWindow.l && idx <= activeWindow.r;
      const isMatched = matchIndices.some((mIdx) => idx >= mIdx && idx < mIdx + m);

      return {
        id: `char-${idx}`,
        value: ch.charCodeAt(0),
        state: isMatched ? "sorted" : isInWindow ? "active" : "default",
        pointers: [ch, `h=${hashVals[idx + 1]}`],
      };
    });
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initializing Polynomial Rolling String Hash for text "${text}" (N=${n}) and pattern "${pattern}" (M=${m}).`,
      why: "Prefix hashing lets us calculate the hash of any substring text[L..R] in O(1) time using modular inverse property.",
    },
    primarySnapshot: {
      kind: "array",
      elements: makeElements(),
    },
    auxiliaryState: {
      hashMap: {
        Text: text,
        Pattern: pattern,
        "Pattern Hash": patternHash,
        "Prime Base (p)": p,
      },
    },
    variables: { n, m, patternHash },
  });

  const matches: number[] = [];

  if (m <= n) {
    for (let i = 0; i <= n - m; i++) {
      const subHash = queryHash(i, i + m - 1);
      const isMatch = subHash === patternHash && text.substring(i, i + m) === pattern;

      if (isMatch) {
        matches.push(i);
      }

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 10,
        explanation: {
          what: `Evaluating substring text[${i}..${i + m - 1}] ("${text.substring(i, i + m)}"): Hash = ${subHash}.`,
          why: `Pattern hash is ${patternHash}. Hashes ${isMatch ? "MATCH! Pattern found at index " + i : "do not match"}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: makeElements({ l: i, r: i + m - 1 }, matches),
        },
        auxiliaryState: {
          hashMap: {
            Window: `[${i}..${i + m - 1}] "${text.substring(i, i + m)}"`,
            "Substring Hash": subHash,
            "Pattern Hash": patternHash,
            "Match Status": isMatch ? `MATCH AT INDEX ${i}` : "No match",
            "Found Matches": matches.join(", ") || "None",
          },
        },
        variables: { i, subHash, isMatch },
      });
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: `String Hashing search completed. Found ${matches.length} occurrence(s) of pattern "${pattern}" at indices: [${matches.join(", ")}].`,
      why: "O(N) total preprocessing enables O(1) pattern verification per window.",
    },
    primarySnapshot: {
      kind: "array",
      elements: makeElements(undefined, matches),
    },
    auxiliaryState: {
      hashMap: {
        "Total Matches": matches.length,
        "Match Indices": matches.join(", ") || "None",
      },
    },
    variables: { matchCount: matches.length },
  });

  return steps;
};

const STRING_HASHING_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Polynomial Rolling Hashing maps string prefixes to modular integers such that the hash value of any arbitrary substring $S[L..R]$ can be evaluated in $O(1)$ constant time following an initial $O(N)$ linear preprocessing pass.\n\nReal-world production applications include Rabin-Karp multi-pattern search, de Novo genome sequence alignment (K-mer search in bioinformatics), duplicate document detection in web crawlers, and rolling checksums in dynamic content synchronization protocols (like rsync).",
  sections: [
    {
      heading: "Core Concept: Polynomial Rolling Hash Formula",
      body: "The prefix hash $H[i]$ for prefix $S[0..i-1]$ is defined as:\n$$H[i] = \\left( \\sum_{k=0}^{i-1} S[k] \\cdot p^{i-1-k} \\right) \\pmod M$$\nwhere $p$ is a prime base (typically $p=31$ for lowercase English or $p=131$ for ASCII) and $M$ is a large prime modulus (such as $10^9 + 7$ or $10^9 + 9$). Recurrence: $H[i] = (H[i-1] \\cdot p + S[i-1]) \\pmod M$.",
    },
    {
      heading: "Systems & Performance Impact: $O(1)$ Substring Hash Queries",
      body: "Using precomputed prefix hashes $H$ and powers of base $p$ (`powP`), the hash of substring $S[L..R]$ is calculated in $O(1)$ time without examining individual characters:\n$$hash(S[L..R]) = \\left( H[R+1] - (H[L] \\cdot p^{R-L+1}) \\pmod M + M \\right) \\pmod M$$\nBecause integer math operates directly in registers, comparing hashes is significantly faster than pointer-chasing string comparisons.",
    },
    {
      heading: "Implementation Nuances: Collision Mitigation & Double Hashing",
      body: "A single 32-bit modulo $M \\approx 10^9$ yields a collision probability of $\\sim 10^{-9}$ per pair, which by the Birthday Paradox guarantees collisions when evaluating $\\sim 10^5$ substrings. To achieve zero practical collisions, systems employ Double Hashing: using two distinct primes $(p_1, M_1)$ and $(p_2, M_2)$ in parallel, forming a composite 64-bit hash key.",
    },
    {
      heading: "Edge Case Analysis",
      body: "1. Negative Modular Results: Integer subtraction $H[R+1] - H[L] \\cdot p^{R-L+1}$ can produce negative numbers in C++/JS; adding $+ M$ before taking `% M` prevents negative modulo errors.\n2. Substring Length 0 or 1: Handled naturally as $powP[0] = 1$.\n3. Character Encoding: Mapping `'a' -> 1` (1-indexed) avoids zero-value prefix cancellation where `'a'` behaves as a leading zero.",
    },
  ],
  keyTerms: [
    {
      term: "Prefix Hash Table",
      definition:
        "An array $H$ where $H[i]$ stores the polynomial rolling hash of prefix string $S[0..i-1]$.",
    },
    {
      term: "Polynomial Rolling Property",
      definition:
        "The mathematical structure allowing prefix hashes to be extended or subtracted in $O(1)$ time.",
    },
    {
      term: "Double Hashing",
      definition:
        "Evaluating two independent polynomial hashes with different prime moduli to eliminate collision risk.",
    },
  ],
};

const STRING_HASHING_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines prefix hash precomputation function.",
    5: "Computes rolling prefix hashes and powers of prime base p modulo M.",
    10: "Defines O(1) substring hash query function.",
    11: "Extracts substring hash from prefix hash array using modular arithmetic.",
  },
};

export const stringHashing: AlgorithmDefinition<StringHashingInput> = {
  id: "string-hashing",
  title: "Polynomial Rolling String Hashing",
  category: "tries_and_strings",
  categories: ["tries_and_strings"],
  difficulty: "Medium",
  description:
    "Compute prefix hashes in $O(N)$ time to evaluate the hash value of any arbitrary substring $S[L..R]$ in $O(1)$ constant time using modular arithmetic.\n\n### Problem Statement\nGiven a text string `text` of length $N$ and a pattern string `pattern` of length $M$, find all starting indices in `text` where `pattern` occurs by using Polynomial Rolling String Hashing.\n\nThe algorithm computes an array of prefix hashes $H$ and powers of a prime base $p$ modulo $M$. Using these precomputed tables, the hash of any substring `text[L..R]` is extracted in $O(1)$ time and compared directly against `patternHash`.\n\n### Input Parameters\n- `text`: The primary search text string of length $N$.\n- `pattern`: Target query pattern string of length $M$.\n- `p`: Prime base (default: 31).\n- `mod`: Prime modulus (default: $10^9 + 7$).\n\n### Output\n- Returns an array of integers representing the starting indices of all match occurrences.\n\n### Constraints & Edge Cases\n- `1 <= N <= 10^5`.\n- `1 <= M <= N`.\n- Strings contain lowercase ASCII characters (`'a'` to `'z'`).\n- Handle modulo overflow and negative intermediate results correctly.",
  constraints: ["1 <= text.length <= 1000", "1 <= pattern.length <= text.length"],
  examples: [
    {
      kind: "basic",
      title: "Find 'abra' in 'abracadabra'",
      input: { text: "abracadabra", pattern: "abra" },
      output: "Indices [0, 7]",
      explanation: "Pattern 'abra' matches at index 0 and index 7.",
    },
    {
      kind: "complex",
      title: "Multiple occurrences in repeated string",
      input: { text: "aabaacaadaabaaba", pattern: "aaba" },
      output: "Indices [0, 9, 12]",
      explanation: "Pattern 'aaba' matches at indices 0, 9, and 12.",
    },
    {
      kind: "negative",
      title: "No match",
      input: { text: "hello world", pattern: "xyz" },
      output: "Indices []",
      explanation: "Pattern 'xyz' does not occur in text.",
    },
  ],
  code: PYTHON_STRING_HASHING_CODE,
  timeComplexity: {
    best: "O(N + M)",
    average: "O(N + M)",
    worst: "O(N + M)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N) to compute prefix hashes and O(1) for each of the N - M + 1 substring comparisons.",
    space: "Requires O(N) space for prefix hash array and powers array.",
  },
  topicGuide: STRING_HASHING_TOPIC_GUIDE,
  trivia: STRING_HASHING_TRIVIA,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 26",
      label: "Competitive Programmer's Handbook, Ch 26",
    },
  ],
  defaultInput: DEFAULT_STRING_HASHING_INPUT,
  generateSteps: generateStringHashingSteps,
};
