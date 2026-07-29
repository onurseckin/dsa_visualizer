import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface StringHashingInput {
  text: string;
  pattern: string;
  p?: number;
  mod?: number;
}

export const PYTHON_STRING_HASHING_CODE = `def string_hashing_search(text: str, pattern: str, p: int = 31, mod: int = 1000000007) -> list[int]:
    n, m = len(text), len(pattern)
    if m > n or m == 0:
        return []

    h = [0] * (n + 1)
    pow_p = [1] * (n + 1)
    for i in range(n):
        char_val = ord(text[i]) - ord('a') + 1
        h[i + 1] = (h[i] * p + char_val) % mod
        pow_p[i + 1] = (pow_p[i] * p) % mod

    pattern_hash = 0
    for ch in pattern:
        char_val = ord(ch) - ord('a') + 1
        pattern_hash = (pattern_hash * p + char_val) % mod

    def query_hash(l: int, r: int) -> int:
        return (h[r + 1] - (h[l] * pow_p[r - l + 1]) % mod + mod) % mod

    matches = []
    for i in range(n - m + 1):
        if query_hash(i, i + m - 1) == pattern_hash:
            if text[i : i + m] == pattern:
                matches.append(i)

    return matches
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

  const text =
    input && typeof input.text === "string" && input.text.length > 0
      ? input.text
      : DEFAULT_STRING_HASHING_INPUT.text;
  const pattern =
    input && typeof input.pattern === "string" && input.pattern.length > 0
      ? input.pattern
      : DEFAULT_STRING_HASHING_INPUT.pattern;
  const p =
    input && typeof input.p === "number" && input.p > 0 ? input.p : DEFAULT_STRING_HASHING_INPUT.p!;
  const mod =
    input && typeof input.mod === "number" && input.mod > 0
      ? input.mod
      : DEFAULT_STRING_HASHING_INPUT.mod!;

  const n = text.length;
  const m = pattern.length;

  const hashVals = new Array<number>(n + 1).fill(0);
  const powP = new Array<number>(n + 1).fill(1);

  const makeElements = (
    activeWindow?: { l: number; r: number },
    matchIndices: number[] = [],
    highlightIdx?: number,
  ): ArrayElement[] => {
    return text.split("").map((ch, idx) => {
      let state: ElementState = "default";
      const isMatched = matchIndices.some((mIdx) => idx >= mIdx && idx < mIdx + m);
      const isInWindow = activeWindow && idx >= activeWindow.l && idx <= activeWindow.r;

      if (isMatched) {
        state = "sorted";
      } else if (idx === highlightIdx) {
        state = "active";
      } else if (isInWindow) {
        state = "compare";
      }

      return {
        id: `char-${idx}`,
        value: ch.charCodeAt(0),
        state,
        pointers: [ch, `h=${hashVals[idx + 1]}`],
      };
    });
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initialize Polynomial Rolling String Hash for text "${text}" (N = ${n}) and query pattern "${pattern}" (M = ${m}).`,
      why: "Polynomial rolling hash precomputes prefix hash values in O(N) time so that any substring hash query text[L..R] can be extracted in O(1) time.",
    },
    primarySnapshot: {
      kind: "array",
      elements: makeElements(),
    },
    auxiliaryState: {
      hashMap: {
        Text: text,
        Pattern: pattern,
        "Prime Base (p)": p,
        Modulus: mod,
      },
    },
    variables: { n, m, p, mod },
  });

  // L2: unpack lengths
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Extract string lengths: Text length N = ${n}, Pattern length M = ${m}.`,
      why: "Determines bounds for prefix polynomial precomputation and sliding search window limits.",
    },
    primarySnapshot: { kind: "array", elements: makeElements() },
    auxiliaryState: { hashMap: { n, m } },
    variables: { n, m },
  });

  // L3: guard condition
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Check invalid window condition (M > N or M == 0): ${m > n || m === 0 ? "True (abort search)" : "False (proceed)"}.`,
      why: "If the pattern is longer than the text or empty, no valid match window exists.",
    },
    primarySnapshot: { kind: "array", elements: makeElements() },
    auxiliaryState: { hashMap: { n, m, guard: m > n || m === 0 } },
    variables: { n, m, guard: m > n || m === 0 },
  });

  if (m > n || m === 0) {
    // L4: early return branch
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 4,
      explanation: {
        what: "Return empty match array [].",
        why: "Short-circuiting prevents unnecessary memory allocation when no matches can possibly occur.",
      },
      primarySnapshot: { kind: "array", elements: makeElements() },
      auxiliaryState: { hashMap: { result: "[]" } },
      variables: { matchCount: 0 },
    });
    return steps;
  }

  // L6: allocate h array
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Allocate prefix hash array h of size N + 1 = ${n + 1}.`,
      why: "h[i] will store the polynomial rolling hash of prefix string text[0..i-1] modulo M.",
    },
    primarySnapshot: {
      kind: "array",
      elements: makeElements(),
    },
    auxiliaryState: { hashMap: { "Prefix Hash Size": n + 1 } },
    variables: { n, hashSize: n + 1 },
  });

  // L7: allocate pow_p array
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `Allocate prime powers array pow_p of size N + 1 = ${n + 1}.`,
      why: "pow_p[k] stores (p^k) mod M to align base powers during O(1) substring hash extraction.",
    },
    primarySnapshot: { kind: "array", elements: makeElements() },
    auxiliaryState: { hashMap: { "Powers Array Size": n + 1 } },
    variables: { n, powSize: n + 1 },
  });

  // Precompute text prefix hashes and powers of p
  for (let i = 0; i < n; i++) {
    const charVal = text.charCodeAt(i) - 96;
    const prevH = hashVals[i];
    const newH = (prevH * p + charVal) % mod;
    hashVals[i + 1] = newH;

    const prevPow = powP[i];
    const newPow = (prevPow * p) % mod;
    powP[i + 1] = newPow;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Compute prefix hash h[${i + 1}] for text[0..${i}] ("${text.slice(0, i + 1)}"): (${prevH} × ${p} + ${charVal}) mod ${mod} = ${newH}.`,
        why: "Extending the prefix rolling hash incorporates character val = ord(c) - ord('a') + 1 in linear time.",
      },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(undefined, [], i),
      },
      auxiliaryState: {
        hashMap: {
          "Current Char": `'${text[i]}'`,
          "Char Val": charVal,
          [`h[${i + 1}]`]: newH,
          [`pow_p[${i + 1}]`]: newPow,
        },
      },
      variables: { i, charVal, hash: newH, powP: newPow },
    });
  }

  // Calculate target pattern hash
  let patternHash = 0;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: "Initialize target pattern_hash accumulator to 0.",
      why: "The target pattern hash will be computed using the exact same polynomial rolling formula.",
    },
    primarySnapshot: { kind: "array", elements: makeElements() },
    auxiliaryState: { hashMap: { patternHash: 0 } },
    variables: { patternHash: 0 },
  });

  for (let j = 0; j < pattern.length; j++) {
    const ch = pattern[j];
    const charVal = ch.charCodeAt(0) - 96;
    patternHash = (patternHash * p + charVal) % mod;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 16,
      explanation: {
        what: `Update pattern_hash for character '${ch}' (val = ${charVal}): pattern_hash = ${patternHash}.`,
        why: "Rolling pattern characters into a single scalar integer hash value for instant comparisons.",
      },
      primarySnapshot: { kind: "array", elements: makeElements() },
      auxiliaryState: {
        hashMap: {
          "Pattern Char": `'${ch}'`,
          "Char Val": charVal,
          "Pattern Hash": patternHash,
        },
      },
      variables: { j, charVal, patternHash },
    });
  }

  const queryHash = (l: number, r: number): number => {
    const raw = (hashVals[r + 1] - ((hashVals[l] * powP[r - l + 1]) % mod) + mod) % mod;
    return raw;
  };

  const matches: number[] = [];
  const totalWindows = n - m + 1;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 21,
    explanation: {
      what: `Begin sliding window hash search over ${totalWindows} possible window alignments (range i = 0 to ${n - m}).`,
      why: "Each window of size M extracts its substring hash in O(1) time and compares it with patternHash.",
    },
    primarySnapshot: { kind: "array", elements: makeElements() },
    auxiliaryState: {
      hashMap: {
        "Total Windows": totalWindows,
        "Target Pattern Hash": patternHash,
      },
    },
    variables: { totalWindows, patternHash },
  });

  for (let i = 0; i <= n - m; i++) {
    const windowHash = queryHash(i, i + m - 1);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 23,
      explanation: {
        what: `Query O(1) hash for window text[${i}..${i + m - 1}] ("${text.slice(i, i + m)}"): hash = ${windowHash}. Target pattern hash = ${patternHash}.`,
        why: "Extracting substring hash via formula (h[r+1] - h[l]*pow_p[len]) mod M eliminates character-by-character loops.",
      },
      primarySnapshot: {
        kind: "array",
        elements: makeElements({ l: i, r: i + m - 1 }, matches),
      },
      auxiliaryState: {
        hashMap: {
          "Window Index": i,
          "Window Text": `"${text.slice(i, i + m)}"`,
          "Window Hash": windowHash,
          "Target Hash": patternHash,
          "Hash Match": windowHash === patternHash ? "YES" : "NO",
        },
      },
      variables: { i, windowHash, patternHash },
    });

    if (windowHash === patternHash) {
      const subStr = text.slice(i, i + m);
      const isExactMatch = subStr === pattern;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 24,
        explanation: {
          what: `Hash match found at index ${i}! Verify string equality: "${subStr}" == "${pattern}" -> ${isExactMatch ? "MATCH" : "COLLISION"}.`,
          why: "Explicit character verification guards against rare hash collisions under modular arithmetic.",
        },
        primarySnapshot: {
          kind: "array",
          elements: makeElements({ l: i, r: i + m - 1 }, matches),
        },
        auxiliaryState: {
          hashMap: {
            "Match Index": i,
            Substring: `"${subStr}"`,
            Verified: isExactMatch ? "Verified Match" : "Hash Collision",
          },
        },
        variables: { i, subStr, isExactMatch },
      });

      if (isExactMatch) {
        matches.push(i);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 25,
          explanation: {
            what: `Record verified match starting index ${i}. Total matches found so far: ${matches.length}.`,
            why: "Appending validated starting position to result matches list.",
          },
          primarySnapshot: {
            kind: "array",
            elements: makeElements({ l: i, r: i + m - 1 }, matches),
          },
          auxiliaryState: {
            hashMap: {
              "New Match": i,
              "All Matches": matches.join(", "),
            },
          },
          variables: { i, matches: [...matches] },
        });
      }
    }
  }

  // L27: return matches
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 27,
    explanation: {
      what: `Polynomial Rolling Hash search complete. Found ${matches.length} occurrence(s) at indices: [${matches.join(", ")}].`,
      why: "O(N) prefix hash precomputation enabled O(1) substring queries for all sliding windows.",
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
    "<p><strong>Polynomial Rolling Hashing</strong> maps string prefixes to modular integers such that the hash value of any arbitrary substring <code>S[L..R]</code> can be evaluated in <code>O(1)</code> constant time following an initial <code>O(N)</code> linear preprocessing pass. Production engineering applications include Rabin-Karp multi-pattern search, de Novo genome sequence alignment in bioinformatics, duplicate document detection in web crawlers, rolling checksums in rsync synchronization, and prompt prefix caching in LLM serving (such as vLLM chunked prefix hash keys).</p>",
  sections: [
    {
      heading: "Why It Exists & Problem Solved",
      body: "<p>Comparing two strings of length <code>M</code> character-by-character takes <code>O(M)</code> operations. When searching for a pattern across <code>N</code> text positions, naive comparisons take <code>O(N × M)</code> time. Polynomial Rolling Hash precomputes prefix hashes in <code>O(N)</code> time so that any substring hash comparison takes <code>O(1)</code> time, reducing overall search complexity to <code>O(N + M)</code>.</p>",
    },
    {
      heading: "Core Concept: Polynomial Rolling Hash Formula",
      body: "<p>The prefix hash H[i] for prefix S[0..i-1] is defined as <code>H[i] = ∑ S[k] × p^(i-1-k) mod M</code> where p is a prime base (typically p=31 for lowercase English or p=131 for ASCII) and M is a large prime modulus (such as 10⁹ + 7). Recurrence: <code>H[i] = (H[i-1] × p + S[i-1]) mod M</code>.</p>",
    },
    {
      heading: "Systems & Performance Impact: O(1) Substring Hash Queries",
      body: "<p>Using precomputed prefix hashes H and powers of base p (pow_p), the hash of substring S[L..R] is calculated in <code>O(1)</code> time without examining individual characters: <code>hash(S[L..R]) = (H[R+1] - (H[L] × p^(R-L+1)) mod M + M) mod M</code>. Because integer math operates directly in registers, comparing hashes is significantly faster than pointer-chasing string comparisons.</p>",
    },
    {
      heading: "Implementation Nuances: Collision Mitigation & Double Hashing",
      body: "<p>A single 32-bit modulo M ≈ 10⁹ yields a collision probability of ~10⁻⁹ per pair, which by the Birthday Paradox guarantees collisions when evaluating ~10⁵ substrings. To achieve zero practical collisions, production systems employ Double Hashing: using two distinct prime bases and moduli in parallel to form a composite 64-bit hash key.</p>",
    },
    {
      heading: "Edge Case & Boundary Analysis",
      body: "<p>1. Negative Modular Results: Subtraction H[R+1] - H[L] × p^(R-L+1) can produce negative numbers in C++/JS; adding + M before taking % M prevents negative modulo errors.</p><p>2. Substring Length 0 or 1: Handled naturally as pow_p[0] = 1.</p><p>3. Character Encoding: Mapping 'a' -&gt; 1 (1-indexed) avoids zero-value prefix cancellation where 'a' behaves as a leading zero.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Prefix Hash Table",
      definition:
        "An array H where H[i] stores the polynomial rolling hash of prefix string S[0..i-1].",
    },
    {
      term: "Polynomial Rolling Property",
      definition:
        "The mathematical structure allowing prefix hashes to be extended or subtracted in O(1) time.",
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
    1: "Defines function string_hashing_search using Polynomial Rolling Hash for O(N + M) pattern search.",
    2: "Extracts string lengths n (text) and m (pattern).",
    3: "Guards against invalid inputs: pattern longer than text or empty pattern.",
    4: "Returns empty list immediately when no match is possible.",
    5: "Blank line before prefix hash precomputation arrays.",
    6: "Allocates prefix hash table h of size n + 1 initialized to zeros.",
    7: "Allocates prime power table pow_p of size n + 1 initialized to ones.",
    8: "Iterates through each character index i of text string.",
    9: "Converts character text[i] to 1-indexed value (a=1, b=2, ...).",
    10: "Updates prefix hash h[i+1] = (h[i] * p + char_val) % mod.",
    11: "Updates prime power table pow_p[i+1] = (pow_p[i] * p) % mod.",
    12: "Blank line before pattern hash computation.",
    13: "Initializes pattern_hash accumulator to 0.",
    14: "Loops through each character ch in pattern string.",
    15: "Converts pattern character ch to 1-indexed value char_val.",
    16: "Updates pattern_hash accumulator using rolling polynomial formula.",
    17: "Blank line before O(1) query helper definition.",
    18: "Defines helper function query_hash(l, r) for O(1) substring hash queries.",
    19: "Computes (h[r+1] - h[l]*pow_p[r-l+1]) % mod with positive modulo correction.",
    20: "Blank line before sliding window search loop.",
    21: "Initializes matches list to store 0-based starting indices.",
    22: "Iterates through all possible starting window indices i from 0 to n - m.",
    23: "Compares O(1) query_hash(i, i + m - 1) against target pattern_hash.",
    24: "Verifies substring text[i : i + m] == pattern to guard against modulo collisions.",
    25: "Appends valid starting match index i to matches list.",
    26: "Blank line before return statement.",
    27: "Returns list of all verified starting match indices.",
  },
};

export const stringHashing: AlgorithmDefinition<StringHashingInput> = {
  id: "string-hashing",
  title: "Polynomial Rolling String Hashing",
  topicIds: ["tries_and_strings"],
  difficulty: "Medium",
  description:
    "<p>Compute prefix hashes in <code>O(N)</code> time to evaluate the hash value of any arbitrary substring <code>S[L..R]</code> in <code>O(1)</code> constant time using modular arithmetic.</p><h3>Problem Statement</h3><p>Given a text string <code>text</code> of length <code>N</code> and a pattern string <code>pattern</code> of length <code>M</code>, find all starting indices in <code>text</code> where <code>pattern</code> occurs by using Polynomial Rolling String Hashing.</p><p>The algorithm computes an array of prefix hashes <code>H</code> and powers of a prime base <code>p</code> modulo <code>M</code>. Using these precomputed tables, the hash of any substring <code>text[L..R]</code> is extracted in <code>O(1)</code> time and compared directly against <code>patternHash</code>.</p><h3>Input Parameters</h3><ul><li><code>text</code>: The primary search text string of length N.</li><li><code>pattern</code>: Target query pattern string of length M.</li><li><code>p</code>: Prime base (default: 31).</li><li><code>mod</code>: Prime modulus (default: 10⁹ + 7).</li></ul><h3>Output</h3><ul><li>Returns an array of integers representing the starting indices of all match occurrences.</li></ul><h3>Constraints &amp; Edge Cases</h3><ul><li><code>1 &lt;= N &lt;= 10⁵</code>.</li><li><code>1 &lt;= M &lt;= N</code>.</li><li>Strings contain lowercase ASCII characters (<code>'a'</code> to <code>'z'</code>).</li><li>Handle modulo overflow and negative intermediate results correctly.</li></ul>",
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
