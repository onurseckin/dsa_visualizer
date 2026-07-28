import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface CharacterFrequencyNgramCounterInput {
  text: string;
  n: number;
}

export const DEFAULT_NGRAM_COUNTER_INPUT: CharacterFrequencyNgramCounterInput = {
  text: "banana",
  n: 2,
};

export const CHARACTER_FREQUENCY_NGRAM_CODE = `def count_character_ngrams(text: str, n: int) -> tuple[dict[str, int], list[tuple[str, int]]]:
    ngram_counts = {}
    for i in range(len(text) - n + 1):
        ngram = text[i : i + n]
        ngram_counts[ngram] = ngram_counts.get(ngram, 0) + 1

    sorted_ngrams = sorted(ngram_counts.items(), key=lambda x: x[1], reverse=True)
    return ngram_counts, sorted_ngrams`;

export const generateCharacterNgramSteps = (
  input: CharacterFrequencyNgramCounterInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { text, n } = input;
  let stepIndex = 0;

  // Line 2: Initialize ngram_counts dictionary
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Initialize Character-Level ${n}-Gram Counter`,
      why: `Preparing empty dictionary 'ngram_counts' to tally frequency of size N = ${n} sliding windows across input text "${text}" (length ${text.length}).`,
    },
    primarySnapshot: {
      kind: "array",
      elements: text.split("").map((ch, idx) => ({
        id: `c-${idx}`,
        value: idx,
        label: `'${ch}'`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        text: `"${text}"`,
        n: String(n),
        maxNgramsPossible: String(Math.max(0, text.length - n + 1)),
        status: "Initialized",
      },
    },
    variables: { n, textLen: text.length, counts: {} },
  });

  const counts: Record<string, number> = {};

  for (let i = 0; i <= text.length - n; i++) {
    const ngram = text.substring(i, i + n);

    // Line 4: Extract sliding window N-gram
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 4,
      explanation: {
        what: `Extract ${n}-Gram Substring at Index ${i}`,
        why: `Sliding window spanning indices ${i}..${i + n - 1} yields candidate ${n}-gram "${ngram}".`,
      },
      primarySnapshot: {
        kind: "array",
        elements: text.split("").map((ch, idx) => ({
          id: `c-${idx}`,
          value: idx,
          label: `'${ch}'`,
          state:
            idx >= i && idx < i + n
              ? ("active" as ElementState)
              : idx < i
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === i ? [`"${ngram}"`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          currentNgram: `"${ngram}"`,
          currentCount: String(counts[ngram] || 0),
          uniqueNgramsSoFar: String(Object.keys(counts).length),
        },
      },
      variables: { i, ngram, currentCount: counts[ngram] || 0 },
    });

    counts[ngram] = (counts[ngram] || 0) + 1;

    // Line 5: Tally count in hash table
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Update Frequency Tally for "${ngram}"`,
        why: `Incremented count of N-gram "${ngram}" to ${counts[ngram]}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: text.split("").map((ch, idx) => ({
          id: `c-${idx}`,
          value: idx,
          label: `'${ch}'`,
          state:
            idx >= i && idx < i + n
              ? ("active" as ElementState)
              : idx < i
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === i ? [`Count: ${counts[ngram]}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          currentNgram: `"${ngram}"`,
          updatedCount: String(counts[ngram]),
          uniqueNgramsSoFar: String(Object.keys(counts).length),
        },
      },
      variables: { i, ngram, updatedCount: counts[ngram] },
    });
  }

  // Line 7: Sort N-grams by frequency descending
  const sortedNgrams = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `Sort N-Grams by Frequency`,
      why: `Sorting ${sortedNgrams.length} unique N-gram entries in descending order of frequency.`,
    },
    primarySnapshot: {
      kind: "array",
      elements:
        sortedNgrams.length > 0
          ? sortedNgrams.map(([ng, cnt], rank) => ({
              id: `ng-${rank}`,
              value: cnt,
              label: `"${ng}": ${cnt}`,
              state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
              pointers: rank === 0 ? ["Top N-gram"] : [],
            }))
          : [
              {
                id: "empty",
                value: 0,
                label: "No N-grams (n > text length)",
                state: "default" as ElementState,
              },
            ],
    },
    auxiliaryState: {
      customState: {
        totalUniqueNgrams: String(sortedNgrams.length),
        status: "Sorting Complete",
      },
    },
    variables: { totalUnique: sortedNgrams.length },
  });

  // Line 8: Return ngram_counts and sorted_ngrams
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: `${n}-Gram Frequency Counting Complete: ${sortedNgrams.length} Unique N-Grams Identified`,
      why:
        sortedNgrams.length > 0
          ? `Top N-gram is "${sortedNgrams[0][0]}" with frequency ${sortedNgrams[0][1]}.`
          : `Window size n=${n} exceeded input text length ${text.length}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements:
        sortedNgrams.length > 0
          ? sortedNgrams.map(([ng, cnt], rank) => ({
              id: `ng-${rank}`,
              value: cnt,
              label: `"${ng}": ${cnt}`,
              state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
              pointers: rank === 0 ? ["Top N-gram"] : [],
            }))
          : [
              {
                id: "empty",
                value: 0,
                label: "No N-grams",
                state: "default" as ElementState,
              },
            ],
    },
    auxiliaryState: {
      customState: {
        topNgram:
          sortedNgrams.length > 0 ? `"${sortedNgrams[0][0]}" (${sortedNgrams[0][1]})` : "None",
        totalUniqueNgrams: String(sortedNgrams.length),
        status: "Completed",
      },
    },
    variables: {
      topNgram: sortedNgrams[0]?.[0] ?? null,
      topCount: sortedNgrams[0]?.[1] ?? 0,
      complete: true,
    },
  });

  return steps;
};

export const characterFrequencyNgramCounter: AlgorithmDefinition<CharacterFrequencyNgramCounterInput> =
  {
    id: "character-frequency-ngram-counter",
    title: "Character Frequency & N-Gram Counter",
    topicIds: ["ml_tokenization", "tries_and_strings"],
    difficulty: "Easy",
    description:
      "Extracts sliding character N-gram frequencies across text corpora. Computes character frequency distributions used for seed vocabulary generation in Unigram LM and WordPiece tokenization trainers.\n\nInput Format:\n- text: Input text string.\n- n: N-gram sliding window size.\n\nOutput Format:\n- Returns tuple (ngramCountsMap, sortedNgramsList).\n\nEdge Cases & Constraints:\n- n > text.length: Returns empty N-gram frequency dictionary.",
    constraints: ["1 <= n <= 10."],
    examples: [
      {
        kind: "basic",
        title: "2-Gram (Bigram) Frequency Counter",
        inputDisplay: "text = 'banana', n = 2",
        outputDisplay: "'an': 2, 'na': 2, 'ba': 1",
        input: DEFAULT_NGRAM_COUNTER_INPUT,
        output: "'an': 2, 'na': 2",
        explanation:
          "Extracts 2-grams 'ba', 'an', 'na', 'an', 'na'. Counts 'an' and 'na' twice each.",
      },
      {
        kind: "complex",
        title: "3-Gram (Trigram) Frequency Counter",
        inputDisplay: "text = 'banana', n = 3",
        outputDisplay: "'ana': 2, 'ban': 1, 'nan': 1",
        input: { text: "banana", n: 3 },
        output: "'ana': 2",
        explanation: "'ana' occurs twice at positions 1 and 3.",
      },
      {
        kind: "negative",
        title: "Window Size Exceeding Text Length",
        inputDisplay: "text = 'hi', n = 5",
        outputDisplay: "Empty N-gram counts",
        input: { text: "hi", n: 5 },
        output: "{}",
        explanation: "No 5-grams can be extracted from a 2-character string.",
      },
    ],
    defaultInput: DEFAULT_NGRAM_COUNTER_INPUT,
    code: CHARACTER_FREQUENCY_NGRAM_CODE,
    timeComplexity: {
      best: "O(N * n)",
      average: "O(N * n)",
      worst: "O(N * n)",
    },
    spaceComplexity: "O(U * n)",
    complexityAnalysis: {
      time: "O(N * n) sliding window scan where N is text length and n is N-gram size.",
      space: "O(U * n) space to store U unique N-gram string keys in dictionary.",
    },
    topicGuide: {
      overview:
        "Character N-gram language models (Jelinek & Mercer 1980) serve as the foundation for token candidate generation in subword tokenizers (Unigram LM, Kudo 2018). Counting character N-gram frequencies enables statistical identification of common prefixes, suffixes, and root morphemes.",
      sections: [
        {
          heading: "Core Concept & Sliding Window Extraction",
          body: "A sliding window of fixed width N moves across string text[i..i+N-1], inserting each substring into a hash table frequency map.",
        },
        {
          heading: "Role in Seed Vocabulary Construction",
          body: "Unigram LM tokenization begins by collecting all frequent character N-grams (N = 1 to 16) to form an initial over-complete seed vocabulary V_0 before EM pruning.",
        },
        {
          heading: "Systems & Memory Performance",
          body: "In production, string hashing (`std::string_view`) avoids copying substring memory during window sliding.",
        },
      ],
      keyTerms: [
        {
          term: "N-Gram",
          definition:
            "A contiguous sequence of N items (characters or words) from a given text sample.",
        },
        {
          term: "Seed Vocabulary",
          definition:
            "The initial over-complete candidate set of subword tokens collected before pruning.",
        },
        {
          term: "Sliding Window",
          definition: "A fixed-size sub-array frame that steps sequentially across input data.",
        },
      ],
    },
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label: "NLP N-Gram Modeling & Tokenization Primitives",
      },
    ],
    generateSteps: generateCharacterNgramSteps,
  };
