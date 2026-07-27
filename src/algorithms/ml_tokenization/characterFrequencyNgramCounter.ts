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
    """
    Computes character-level N-gram frequency counts for building subword tokenization vocabularies.
    Extracts sliding windows of length N across input text string.
    """
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

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initialize Character-Level ${n}-Gram Counter`,
      why: `Extracting sliding windows of size N = ${n} across input text "${text}" (length ${text.length}).`,
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
        totalNgrams: String(Math.max(0, text.length - n + 1)),
        status: "Initialized",
      },
    },
    variables: { n, textLen: text.length },
  });

  const counts: Record<string, number> = {};

  for (let i = 0; i <= text.length - n; i++) {
    const ngram = text.substring(i, i + n);
    counts[ngram] = (counts[ngram] || 0) + 1;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 8,
      explanation: {
        what: `Slide Window at Position ${i}: Extracted ${n}-Gram "${ngram}"`,
        why: `Tallying frequency count for "${ngram}". Updated count = ${counts[ngram]}.`,
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
          count: String(counts[ngram]),
          uniqueNgramsSoFar: String(Object.keys(counts).length),
        },
      },
      variables: { i, ngram, count: counts[ngram] },
    });
  }

  // Step Final: Complete
  const sortedNgrams = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: `${n}-Gram Frequency Counting Complete: Identified ${sortedNgrams.length} Unique ${n}-Grams`,
      why: `Top N-gram: "${sortedNgrams[0]?.[0]}" with frequency ${sortedNgrams[0]?.[1]}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: sortedNgrams.map(([ng, cnt], rank) => ({
        id: `ng-${rank}`,
        value: cnt,
        label: `"${ng}": ${cnt}`,
        state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
        pointers: rank === 0 ? ["Most Frequent"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        topNgram: `"${sortedNgrams[0]?.[0]}" (${sortedNgrams[0]?.[1]})`,
        totalUniqueNgrams: String(sortedNgrams.length),
        status: "Completed",
      },
    },
    variables: { topNgram: sortedNgrams[0]?.[0], topCount: sortedNgrams[0]?.[1], complete: true },
  });

  return steps;
};

export const characterFrequencyNgramCounter: AlgorithmDefinition<CharacterFrequencyNgramCounterInput> =
  {
    id: "characterFrequencyNgramCounter",
    title: "Character Frequency & N-Gram Counter",
    category: "ml_tokenization",
    categories: ["ml_tokenization", "tries_and_strings"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_tokenization",
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
