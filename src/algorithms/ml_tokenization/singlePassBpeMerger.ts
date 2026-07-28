import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface SinglePassBpeMergerInput {
  tokens: string[];
  pairToMerge: [string, string];
}

export const DEFAULT_SINGLE_PASS_BPE_MERGER_INPUT: SinglePassBpeMergerInput = {
  tokens: ["n", "e", "w", "e", "s", "t"],
  pairToMerge: ["e", "s"],
};

export const SINGLE_PASS_BPE_MERGER_CODE = `def single_pass_bpe_merge(tokens: list[str], pair_to_merge: tuple[str, str]) -> list[str]:
    p1, p2 = pair_to_merge
    merged_tokens = []
    i = 0

    while i < len(tokens):
        if i < len(tokens) - 1 and tokens[i] == p1 and tokens[i + 1] == p2:
            merged_tokens.append(p1 + p2)
            i += 2
        else:
            merged_tokens.append(tokens[i])
            i += 1

    return merged_tokens`;

export const generateSinglePassBpeMergerSteps = (
  input: SinglePassBpeMergerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { tokens, pairToMerge } = input;
  let stepIndex = 0;

  const [p1, p2] = pairToMerge;
  const targetPairStr = `("${p1}", "${p2}")`;
  const mergedSymbol = `${p1}${p2}`;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Initialize Single-Pass BPE Merger for Pair ${targetPairStr}`,
      why: `Scanning ${tokens.length} tokens [${tokens.map((t) => `"${t}"`).join(", ")}] to merge occurrences of adjacent pair ${targetPairStr} into "${mergedSymbol}".`,
    },
    primarySnapshot: {
      kind: "array",
      elements: tokens.map((tok, idx) => ({
        id: `tok-${idx}`,
        value: idx,
        label: `"${tok}"`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        pairToMerge: targetPairStr,
        targetMergedSymbol: `"${mergedSymbol}"`,
        tokenCount: String(tokens.length),
        status: "Initialized",
      },
    },
    variables: { p1, p2, tokenCount: tokens.length },
  });

  const mergedTokens: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    if (i < tokens.length - 1 && tokens[i] === p1 && tokens[i + 1] === p2) {
      mergedTokens.push(mergedSymbol);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 8,
        explanation: {
          what: `Match & Merge Pair at Index ${i} and ${i + 1}: ("${tokens[i]}", "${tokens[i + 1]}") -> "${mergedSymbol}"`,
          why: `Found target pair ${targetPairStr} at positions [${i}, ${i + 1}]. Replaced with combined token "${mergedSymbol}".`,
        },
        primarySnapshot: {
          kind: "array",
          elements: tokens.map((tok, idx) => ({
            id: `tok-${idx}`,
            value: idx,
            label: `"${tok}"`,
            state:
              idx === i || idx === i + 1
                ? ("active" as ElementState)
                : idx < i
                  ? ("visited" as ElementState)
                  : ("default" as ElementState),
            pointers: idx === i ? [`Merged into "${mergedSymbol}"`] : [],
          })),
        },
        auxiliaryState: {
          customState: {
            mergedPair: targetPairStr,
            newSymbol: `"${mergedSymbol}"`,
            outputSoFar: mergedTokens.map((t) => `"${t}"`).join(", "),
          },
        },
        variables: { i, mergedSymbol },
      });

      i += 2;
    } else {
      mergedTokens.push(tokens[i]);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 11,
        explanation: {
          what: `Pass Token at Index ${i}: "${tokens[i]}"`,
          why:
            i < tokens.length - 1
              ? `Adjacent pair ("${tokens[i]}", "${tokens[i + 1]}") does not match ${targetPairStr}. Passing token through unchanged.`
              : `Single token "${tokens[i]}" at index ${i} has no adjacent pair to merge. Passing token through unchanged.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: tokens.map((tok, idx) => ({
            id: `tok-${idx}`,
            value: idx,
            label: `"${tok}"`,
            state:
              idx === i
                ? ("compare" as ElementState)
                : idx < i
                  ? ("visited" as ElementState)
                  : ("default" as ElementState),
          })),
        },
        auxiliaryState: {
          customState: {
            passedToken: `"${tokens[i]}"`,
            outputSoFar: mergedTokens.map((t) => `"${t}"`).join(", "),
          },
        },
        variables: { i, token: tokens[i] },
      });

      i += 1;
    }
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 14,
    explanation: {
      what: `Single-Pass BPE Merge Complete: Result [${mergedTokens.map((t) => `"${t}"`).join(", ")}]`,
      why: `Reduced token sequence from ${tokens.length} to ${mergedTokens.length} tokens.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: mergedTokens.map((tok, rank) => ({
        id: `res-${rank}`,
        value: rank,
        label: `"${tok}"`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        mergedOutput: mergedTokens.map((t) => `"${t}"`).join(" + "),
        originalCount: String(tokens.length),
        mergedCount: String(mergedTokens.length),
        status: "Completed",
      },
    },
    variables: { initialCount: tokens.length, finalCount: mergedTokens.length, complete: true },
  });

  return steps;
};

export const singlePassBpeMerger: AlgorithmDefinition<SinglePassBpeMergerInput> = {
  id: "single-pass-bpe-merger",
  title: "Single-Pass BPE Token Merger",
  topicIds: ["ml_tokenization"],
  difficulty: "Easy",
  description:
    "Executes a single-pass BPE pair substitution pass over a token sequence. Replaces all non-overlapping occurrences of adjacent token symbol pair (A, B) with combined subword token 'AB' in linear O(N) time.\n\nInput Format:\n- tokens: Array of initial token strings.\n- pairToMerge: Tuple [p1, p2] representing target adjacent pair.\n\nOutput Format:\n- Returns array of merged token strings.\n\nEdge Cases & Constraints:\n- Overlapping triplets (A, A, A) with pair (A, A): Left-to-right non-overlapping merge produces ('AA', 'A').",
  constraints: ["tokens.length >= 1."],
  examples: [
    {
      kind: "basic",
      title: "Merge ('e', 's') in 'newest'",
      inputDisplay: "tokens = ['n', 'e', 'w', 'e', 's', 't'], pair = ['e', 's']",
      outputDisplay: "Result: ['n', 'e', 'w', 'es', 't']",
      input: DEFAULT_SINGLE_PASS_BPE_MERGER_INPUT,
      output: "['n', 'e', 'w', 'es', 't']",
      explanation: "Replaces adjacent 'e' and 's' at indices 3 and 4 with merged token 'es'.",
    },
    {
      kind: "complex",
      title: "Multiple Non-Overlapping Matches",
      inputDisplay: "tokens = ['a', 'b', 'x', 'a', 'b'], pair = ['a', 'b']",
      outputDisplay: "Result: ['ab', 'x', 'ab']",
      input: {
        tokens: ["a", "b", "x", "a", "b"],
        pairToMerge: ["a", "b"],
      },
      output: "['ab', 'x', 'ab']",
      explanation: "Merges both occurrences of ('a', 'b') in single pass.",
    },
    {
      kind: "negative",
      title: "No Match Present",
      inputDisplay: "tokens = ['a', 'b'], pair = ['x', 'y']",
      outputDisplay: "Result: ['a', 'b']",
      input: {
        tokens: ["a", "b"],
        pairToMerge: ["x", "y"],
      },
      output: "['a', 'b']",
      explanation: "Returns original tokens unmodified.",
    },
  ],
  defaultInput: DEFAULT_SINGLE_PASS_BPE_MERGER_INPUT,
  code: SINGLE_PASS_BPE_MERGER_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N) linear time scan across N tokens.",
    space: "O(N) auxiliary space to construct merged token output list.",
  },
  topicGuide: {
    overview:
      "Single-pass pair merging is the inner loop primitive executed during both BPE vocabulary training and classical BPE inference tokenization (Sennrich 2016).",
    sections: [
      {
        heading: "Core Concept & Non-Overlapping Semantics",
        body: "Scans left to right. When adjacent tokens match pairToMerge [p1, p2], they are replaced by p1+p2 and index pointer advances by 2 to prevent overlapping re-merging.",
      },
      {
        heading: "Systems & In-Place Linked List Implementations",
        body: "In production C++ tokenizers, words are represented as doubly-linked lists of symbols so pair merges take O(1) pointer updates.",
      },
      {
        heading: "BPE Training Loop Integration",
        body: "BPE vocabulary trainers execute single-pass merges for the top pair at each iteration step.",
      },
    ],
    keyTerms: [
      {
        term: "BPE Merge Pass",
        definition:
          "Single linear scan substituting occurrences of a specific symbol pair with a unified token.",
      },
      {
        term: "Non-Overlapping Merge",
        definition:
          "Ensuring merged tokens do not consume overlapping characters in a single pass.",
      },
      {
        term: "Doubly-Linked Symbol Chain",
        definition: "Data structure enabling O(1) symbol deletion and insertion during BPE merges.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "BPE Subword Merging (Sennrich 2016)" }],
  generateSteps: generateSinglePassBpeMergerSteps,
};
