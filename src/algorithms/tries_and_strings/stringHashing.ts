import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface StringHashingInput {
  text: string;
  pattern: string;
  p?: number;
  mod?: number;
}

export const PYTHON_STRING_HASHING_CODE = `def polynomial_string_hashing(s: str, p: int = 31, mod: int = 10**9 + 7) -> list[int]:
    n = len(s)
    hash_vals = [0] * (n + 1)
    pow_p = [1] * (n + 1)
    for i in range(n):
        hash_vals[i + 1] = (hash_vals[i] * p + (ord(s[i]) - ord('a') + 1)) % mod
        pow_p[i + 1] = (pow_p[i] * p) % mod
    return hash_vals

def query_substring_hash(hash_vals: list[int], pow_p: list[int], l: int, r: int, mod: int = 10**9 + 7) -> int:
    return (hash_vals[r + 1] - (hash_vals[l] * pow_p[r - l + 1]) % mod + mod) % mod`;

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
    const val = (hashVals[r + 1] - (hashVals[l] * powP[r - l + 1]) % mod + mod) % mod;
    return val;
  };

  const makeElements = (
    activeWindow?: { l: number; r: number },
    matchIndices: number[] = [],
  ): ArrayElement[] => {
    return text.split("").map((ch, idx) => {
      const isInWindow = activeWindow && idx >= activeWindow.l && idx <= activeWindow.r;
      const isMatched = matchIndices.some(mIdx => idx >= mIdx && idx < mIdx + m);

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
        "Text": text,
        "Pattern": pattern,
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
            "Window": `[${i}..${i + m - 1}] "${text.substring(i, i + m)}"`,
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
    "Polynomial Rolling Hashing maps strings to integer values such that equality of string substrings can be checked in O(1) time after O(N) prefix preprocessing.",
  sections: [
    {
      heading: "Polynomial Rolling Hash Formula",
      body: "The hash of string S[0..N-1] is H(S) = sum(S[i] * p^(N-1-i)) mod M. Prime base p (typically 31 or 53) and large prime mod M (like 10^9 + 7) minimize hash collisions.",
    },
    {
      heading: "O(1) Substring Hash Queries",
      body: "Given prefix hashes H[i], the hash of substring S[L..R] is computed as H(S[L..R]) = (H[R+1] - H[L] * p^(R-L+1)) mod M.",
    },
  ],
  keyTerms: [
    {
      term: "Prefix Hash",
      definition: "An array where H[i] stores the rolling hash of prefix string S[0..i-1].",
    },
    {
      term: "Rolling Property",
      definition: "Updating hash value when sliding a fixed-size window over text in constant time.",
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
  difficulty: "Medium",
  description:
    "Compute prefix hash values in O(N) to query substring hashes in O(1) time using polynomial rolling hash and modular arithmetic.",
  constraints: [
    "1 <= text.length <= 1000",
    "1 <= pattern.length <= text.length",
  ],
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
