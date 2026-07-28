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

  const text = input.text || "abracadabra";
  const pattern = input.pattern || "abra";
  const p = input.p || 31;
  const mod = input.mod || 1000000007;

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
      what: `Initialize Polynomial Rolling String Hash for text "${text}" (N=${n}) and pattern "${pattern}" (M=${m})`,
      why: "Polynomial rolling hash computes prefix hashes so any substring hash query text[L..R] executes in O(1) time.",
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
      what: `n, m = len(text), len(pattern)  →  n=${n}, m=${m}`,
      why: "Extract sequence lengths n and m to bound prefix precomputation and sliding window iteration.",
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
      what: `Guard: m > n or m == 0  →  ${m > n || m === 0 ? "true — early exit" : "false — proceed"}`,
      why: "If pattern is longer than text or empty no match is possible; skip all O(N) work.",
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
        what: "return []  — pattern cannot appear in text",
        why: "Short-circuit avoids allocating O(N) hash tables when no match is possible.",
      },
      primarySnapshot: { kind: "array", elements: makeElements() },
      auxiliaryState: { hashMap: { result: "[]" } },
      variables: { matchCount: 0 },
    });
    return steps;
  }

  // L6: allocate prefix hash table
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Allocate prefix hash table h of size ${n + 1}`,
      why: "h[i] stores the rolling hash of text prefix text[0..i-1].",
    },
    primarySnapshot: {
      kind: "array",
      elements: makeElements(),
    },
    auxiliaryState: {
      hashMap: {
        "h[0]": 0,
        "pow_p[0]": 1,
      },
    },
    variables: { n, m },
  });

  // L7: pow_p allocation
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `pow_p = [1] * (${n + 1})  — prime power table initialized to 1s`,
      why: "pow_p[i] stores p^i % mod so O(1) substring hash calculation can multiply by p^len without exponentiation.",
    },
    primarySnapshot: { kind: "array", elements: makeElements() },
    auxiliaryState: { hashMap: { "pow_p[0]": 1 } },
    variables: { n },
  });

  // L8: prefix hash loop header
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: `for i in range(${n}):  — iterate over every character index of text`,
      why: "Each iteration extends the prefix hash and prime power tables by one position.",
    },
    primarySnapshot: { kind: "array", elements: makeElements() },
    auxiliaryState: { hashMap: { "loop range": `0..${n - 1}` } },
    variables: { n },
  });

  // Precompute and step through text prefix hashes
  for (let i = 0; i < n; i++) {
    const charVal = text.charCodeAt(i) - 96;
    hashVals[i + 1] = (hashVals[i] * p + charVal) % mod;
    powP[i + 1] = (powP[i] * p) % mod;

    // L9: char_val computation
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 9,
      explanation: {
        what: `char_val = ord(text[${i}]) - ord('a') + 1  →  '${text[i]}' = ${charVal}`,
        why: "1-indexed mapping ('a'→1…'z'→26) avoids a leading-zero hash ambiguity.",
      },
      primarySnapshot: { kind: "array", elements: makeElements(undefined, [], i) },
      auxiliaryState: { hashMap: { i, char: text[i], charVal } },
      variables: { i, char: text[i], charVal },
    });

    // L10: h[i+1] update
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Precompute prefix hash h[${i + 1}] for text[0..${i}] ("${text.substring(0, i + 1)}"): char '${text[i]}' (${charVal}) → h = ${hashVals[i + 1]}`,
        why: `Formula: h[${i + 1}] = (h[${i}] * ${p} + ${charVal}) % ${mod} = ${hashVals[i + 1]}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(undefined, [], i),
      },
      auxiliaryState: {
        hashMap: {
          [`h[${i + 1}]`]: hashVals[i + 1],
          [`pow_p[${i + 1}]`]: powP[i + 1],
        },
      },
      variables: { i, char: text[i], charVal, "h[i+1]": hashVals[i + 1] },
    });

    // L11: pow_p[i+1] update
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `pow_p[${i + 1}] = (pow_p[${i}] * ${p}) % mod  →  ${powP[i + 1]}`,
        why: "Precomputing prime powers avoids recomputation in each O(1) substring hash query.",
      },
      primarySnapshot: { kind: "array", elements: makeElements(undefined, [], i) },
      auxiliaryState: { hashMap: { [`pow_p[${i + 1}]`]: powP[i + 1] } },
      variables: { i, "pow_p[i+1]": powP[i + 1] },
    });
  }

  // L13: pattern_hash init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: "pattern_hash = 0  — initialize accumulator before rolling over pattern characters",
      why: "Zeroing before the loop ensures no leftover value contaminates the first multiplication.",
    },
    primarySnapshot: { kind: "array", elements: makeElements() },
    auxiliaryState: { hashMap: { pattern_hash: 0 } },
    variables: { patternHash: 0 },
  });

  // L14: pattern hash loop header
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 14,
    explanation: {
      what: `for ch in pattern:  — iterate over each of the ${m} pattern characters`,
      why: "Builds the target hash value to compare against each text window.",
    },
    primarySnapshot: { kind: "array", elements: makeElements() },
    auxiliaryState: { hashMap: { pattern, m } },
    variables: { m },
  });

  // Precompute and step through pattern hash
  let patternHash = 0;
  for (let i = 0; i < m; i++) {
    const charVal = pattern.charCodeAt(i) - 96;
    patternHash = (patternHash * p + charVal) % mod;

    // L15: char_val for pattern character
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 15,
      explanation: {
        what: `char_val = ord('${pattern[i]}') - ord('a') + 1  →  ${charVal}`,
        why: "Same 1-indexed mapping as for text characters to keep hash formulas consistent.",
      },
      primarySnapshot: { kind: "array", elements: makeElements() },
      auxiliaryState: { hashMap: { ch: pattern[i], charVal } },
      variables: { i, char: pattern[i], charVal },
    });

    // L16: pattern_hash rolling update
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 16,
      explanation: {
        what: `Compute pattern hash prefix for pattern[0..${i}] ("${pattern.substring(0, i + 1)}"): char '${pattern[i]}' → hash = ${patternHash}`,
        why: `Rolling formula accumulates character values: pattern_hash = ${patternHash}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(),
      },
      auxiliaryState: {
        hashMap: {
          "Pattern Substring": pattern.substring(0, i + 1),
          "Accumulated Hash": patternHash,
        },
      },
      variables: { i, char: pattern[i], charVal, patternHash },
    });
  }

  const queryHash = (l: number, r: number): number => {
    const val = (hashVals[r + 1] - ((hashVals[l] * powP[r - l + 1]) % mod) + mod) % mod;
    return val;
  };

  // L18: define query_hash helper
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 18,
    explanation: {
      what: "def query_hash(l, r) → int:  — define O(1) substring hash helper",
      why: "Encapsulating the formula keeps the main loop readable and avoids repeated expression duplication.",
    },
    primarySnapshot: { kind: "array", elements: makeElements() },
    auxiliaryState: { hashMap: { helper: "query_hash(l, r)" } },
    variables: { n, m },
  });

  // L19: query_hash body
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: "return (h[r+1] - (h[l] * pow_p[r-l+1]) % mod + mod) % mod",
      why: "Adding mod before final % mod prevents negative results from subtraction in modular arithmetic.",
    },
    primarySnapshot: { kind: "array", elements: makeElements() },
    auxiliaryState: { hashMap: { formula: "(h[r+1] - h[l]*pow_p[r-l+1] + mod) % mod" } },
    variables: { n, m },
  });

  const matches: number[] = [];

  // L21: initialise matches list
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 21,
    explanation: {
      what: "matches = []  — initialize result list",
      why: "Collects every 0-based starting index where the pattern was found.",
    },
    primarySnapshot: { kind: "array", elements: makeElements() },
    auxiliaryState: { hashMap: { matches: "[]" } },
    variables: { matchCount: 0 },
  });

  // L22: main search loop header
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 22,
    explanation: {
      what: `for i in range(${n - m + 1}):  — slide window over ${n - m + 1} positions`,
      why: "Each window starting at i is evaluated with a single O(1) hash comparison.",
    },
    primarySnapshot: { kind: "array", elements: makeElements() },
    auxiliaryState: { hashMap: { windows: n - m + 1 } },
    variables: { n, m },
  });

  for (let i = 0; i <= n - m; i++) {
    const subHash = queryHash(i, i + m - 1);
    const hashMatches = subHash === patternHash;
    const isMatch = hashMatches && text.substring(i, i + m) === pattern;

    // L23: hash comparison
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 23,
      explanation: {
        what: `Evaluate window text[${i}..${i + m - 1}] ("${text.substring(i, i + m)}"): Substring Hash = ${subHash}`,
        why: `Comparing against patternHash (${patternHash}): ${hashMatches ? "hashes match — verify string" : "No match"}.`,
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
          "Hash Match": hashMatches ? "YES" : "NO",
          "Found Matches": matches.join(", ") || "None",
        },
      },
      variables: { i, subHash, hashMatches },
    });

    if (hashMatches) {
      // L24: collision check
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 24,
        explanation: {
          what: `if text[${i}:${i + m}] == pattern  →  "${text.substring(i, i + m)}" == "${pattern}"  →  ${isMatch}`,
          why: "String comparison guards against hash collisions; expected near-zero rate with a good modulus.",
        },
        primarySnapshot: {
          kind: "array",
          elements: makeElements({ l: i, r: i + m - 1 }, matches),
        },
        auxiliaryState: {
          hashMap: {
            Substring: text.substring(i, i + m),
            Pattern: pattern,
            Equal: isMatch ? "YES — match confirmed" : "NO — hash collision",
          },
        },
        variables: { i, isMatch },
      });

      if (isMatch) {
        matches.push(i);

        // L25: record match
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 25,
          explanation: {
            what: `matches.append(${i})  — confirmed match at index ${i}`,
            why: "Index appended only after the string comparison eliminates any collision risk.",
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
      what: `String Hashing search complete. Found ${matches.length} occurrence(s) at indices: [${matches.join(", ")}]`,
      why: "O(N) precomputation enabled O(1) substring hash queries for all N - M + 1 windows.",
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
    "Polynomial Rolling Hashing maps string prefixes to modular integers such that the hash value of any arbitrary substring $S[L..R]$ can be evaluated in $O(1)$ constant time following an initial $O(N)$ linear preprocessing pass. Production engineering applications include Rabin-Karp multi-pattern search, de Novo genome sequence alignment (K-mer search in bioinformatics), duplicate document detection in web crawlers, rolling checksums in rsync dynamic content synchronization, and prompt prefix caching in LLM serving (e.g. vLLM chunked prefix hash keys).",
  sections: [
    {
      heading: "Why It Exists & Problem Solved",
      body: "Comparing two strings of length $M$ character-by-character takes $O(M)$ operations. When searching for a pattern across $N$ text positions, naive comparisons take $O(N \\times M)$ time. Polynomial Rolling Hash precomputes prefix hashes in $O(N)$ time so that any substring hash comparison takes $O(1)$ time, reducing overall search complexity to $O(N + M)$.",
    },
    {
      heading: "Core Concept: Polynomial Rolling Hash Formula",
      body: "The prefix hash $H[i]$ for prefix $S[0..i-1]$ is defined as:\n$$H[i] = \\left( \\sum_{k=0}^{i-1} S[k] \\cdot p^{i-1-k} \\right) \\pmod M$$\nwhere $p$ is a prime base (typically $p=31$ for lowercase English or $p=131$ for ASCII) and $M$ is a large prime modulus (such as $10^9 + 7$ or $10^9 + 9$). Recurrence: $H[i] = (H[i-1] \\cdot p + S[i-1]) \\pmod M$.",
    },
    {
      heading: "Systems & Performance Impact: $O(1)$ Substring Hash Queries",
      body: "Using precomputed prefix hashes $H$ and powers of base $p$ (`pow_p`), the hash of substring $S[L..R]$ is calculated in $O(1)$ time without examining individual characters:\n$$\\text{hash}(S[L..R]) = \\left( H[R+1] - (H[L] \\cdot p^{R-L+1}) \\pmod M + M \\right) \\pmod M$$\nBecause integer math operates directly in registers, comparing hashes is significantly faster than pointer-chasing string comparisons.",
    },
    {
      heading: "Implementation Nuances: Collision Mitigation & Double Hashing",
      body: "A single 32-bit modulo $M \\approx 10^9$ yields a collision probability of $\\sim 10^{-9}$ per pair, which by the Birthday Paradox guarantees collisions when evaluating $\\sim 10^5$ substrings. To achieve zero practical collisions, production systems employ Double Hashing: using two distinct prime bases and moduli $(p_1, M_1)$ and $(p_2, M_2)$ in parallel, forming a composite 64-bit hash key.",
    },
    {
      heading: "Edge Case & Boundary Analysis",
      body: "1. Negative Modular Results: Subtraction $H[R+1] - H[L] \\cdot p^{R-L+1}$ can produce negative numbers in C++/JS; adding $+ M$ before taking `% M` prevents negative modulo errors.\n2. Substring Length 0 or 1: Handled naturally as $pow\\_p[0] = 1$.\n3. Character Encoding: Mapping `'a' -> 1` (1-indexed) avoids zero-value prefix cancellation where `'a'` behaves as a leading zero.",
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
