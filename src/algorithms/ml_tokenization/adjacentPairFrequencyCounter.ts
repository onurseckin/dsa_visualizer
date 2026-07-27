import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface AdjacentPairFrequencyCounterInput {
  words: Record<string, number>; // word string -> frequency count
}

export const DEFAULT_ADJACENT_PAIR_FREQUENCY_INPUT: AdjacentPairFrequencyCounterInput = {
  words: {
    "l o w </w>": 5,
    "l o w e r </w>": 2,
    "n e w e s t </w>": 6,
    "w i d e s t </w>": 3,
  },
};

export const ADJACENT_PAIR_FREQUENCY_CODE = `def count_adjacent_pair_frequencies(words: dict[str, int]) -> tuple[dict[tuple[str, str], int], tuple[str, str]]:
    """
    BPE tokenization training step 1:
    Counts frequencies of all adjacent symbol pairs across word corpus frequencies.
    Returns pair frequency map and the most frequent pair.
    """
    pair_counts = {}

    for word_str, freq in words.items():
        symbols = word_str.split()
        for i in range(len(symbols) - 1):
            pair = (symbols[i], symbols[i + 1])
            pair_counts[pair] = pair_counts.get(pair, 0) + freq

    most_frequent_pair = max(pair_counts.items(), key=lambda x: x[1])[0] if pair_counts else ("", "")
    return pair_counts, most_frequent_pair`;

export const generateAdjacentPairFrequencySteps = (
  input: AdjacentPairFrequencyCounterInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { words } = input;
  let stepIndex = 0;

  const wordEntries = Object.entries(words);

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize BPE Adjacent Pair Frequency Counter",
      why: `Counting adjacent token symbol pairs across ${wordEntries.length} corpus words with frequencies.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: wordEntries.map(([wStr, freq], idx) => ({
        id: `w-${idx}`,
        value: freq,
        label: `"${wStr}" (freq: ${freq})`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        totalWords: String(wordEntries.length),
        status: "Initialized",
      },
    },
    variables: { totalWords: wordEntries.length },
  });

  const pairCounts: Record<string, number> = {};

  for (let wIdx = 0; wIdx < wordEntries.length; wIdx++) {
    const [wordStr, freq] = wordEntries[wIdx];
    const symbols = wordStr.split(" ");
    const wordPairs: string[] = [];

    for (let i = 0; i < symbols.length - 1; i++) {
      const pairKey = `${symbols[i]},${symbols[i + 1]}`;
      pairCounts[pairKey] = (pairCounts[pairKey] || 0) + freq;
      wordPairs.push(`(${symbols[i]}, ${symbols[i + 1]})`);
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Process Word "${wordStr}" (freq = ${freq})`,
        why: `Extracted ${wordPairs.length} adjacent pairs: [${wordPairs.join(
          ", ",
        )}]. Added frequency weight ${freq} to pair counts.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: wordEntries.map(([w, f], idx) => ({
          id: `w-${idx}`,
          value: f,
          label: `"${w}" (${f})`,
          state:
            idx === wIdx
              ? ("active" as ElementState)
              : idx < wIdx
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === wIdx ? [`Processing ${wordPairs.length} pairs`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          activeWord: wordStr,
          pairsInWord: wordPairs.join("; "),
          uniquePairsSoFar: String(Object.keys(pairCounts).length),
        },
      },
      variables: { wIdx, wordStr, freq },
    });
  }

  // Step 2: Identify Most Frequent Pair
  const pairEntries = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]);
  const bestPair = pairEntries[0] ? pairEntries[0][0].split(",") : ["", ""];
  const bestFreq = pairEntries[0] ? pairEntries[0][1] : 0;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: `Identify Most Frequent Symbol Pair: ("${bestPair[0]}", "${bestPair[1]}") with count ${bestFreq}`,
      why: `Pair ("${bestPair[0]}", "${bestPair[1]}") occurs ${bestFreq} times across corpus. Selected as next candidate for BPE merge rule addition.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: pairEntries.map(([pKey, count], rank) => ({
        id: `pair-${rank}`,
        value: count,
        label: `("${pKey.replace(",", `", "`)}") : ${count}`,
        state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
        pointers: rank === 0 ? ["Most Frequent Pair"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        mostFrequentPair: `("${bestPair[0]}", "${bestPair[1]}")`,
        frequency: String(bestFreq),
        totalUniquePairs: String(pairEntries.length),
        status: "Completed",
      },
    },
    variables: { bestPair: `${bestPair[0]}+${bestPair[1]}`, bestFreq, complete: true },
  });

  return steps;
};

export const adjacentPairFrequencyCounter: AlgorithmDefinition<AdjacentPairFrequencyCounterInput> =
  {
    id: "adjacentPairFrequencyCounter",
    title: "BPE Adjacent Pair Frequency Counter",
    category: "ml_tokenization",
    categories: ["ml_tokenization", "tries_and_strings"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_tokenization",
    description:
      "Executes Step 1 of Byte-Pair Encoding (BPE) subword vocabulary training (Sennrich et al., 2016). Scans tokenized corpus words, tallies frequencies of all adjacent symbol pairs weighted by word frequencies, and identifies the most frequent adjacent pair to merge.\n\nInput Format:\n- words: Dictionary mapping space-separated symbol word strings to corpus frequency counts.\n\nOutput Format:\n- Returns tuple (pairCountsMap, mostFrequentPair).\n\nEdge Cases & Constraints:\n- Single symbol words: Produce no adjacent pairs.",
    constraints: ["Word symbols must be space-separated."],
    examples: [
      {
        kind: "basic",
        title: "Corpus Adjacent Pair Counting",
        inputDisplay: "4 words with frequencies (e.g. 'e s t </w>': 9)",
        outputDisplay: "Most Frequent Pair: ('e', 's') with count 9",
        input: DEFAULT_ADJACENT_PAIR_FREQUENCY_INPUT,
        output: "('e', 's'): 9",
        explanation:
          "'e s' appears in 'n e w e s t' (6) and 'w i d e s t' (3), giving total frequency 9.",
      },
      {
        kind: "complex",
        title: "End-of-Word Symbol Pair",
        inputDisplay: "'s t </w>': 9",
        outputDisplay: "Most Frequent Pair: ('s', 't')",
        input: DEFAULT_ADJACENT_PAIR_FREQUENCY_INPUT,
        output: "('s', 't'): 9",
        explanation: "'s t' also appears 9 times across 'newest' and 'widest'.",
      },
      {
        kind: "negative",
        title: "Single Character Words",
        inputDisplay: "words = {'a </w>': 10}",
        outputDisplay: "No pairs generated",
        input: { words: { "a </w>": 10 } },
        output: "('a', '</w>'): 10",
        explanation: "Generates pair between character 'a' and end-of-word symbol '</w>'.",
      },
    ],
    defaultInput: DEFAULT_ADJACENT_PAIR_FREQUENCY_INPUT,
    code: ADJACENT_PAIR_FREQUENCY_CODE,
    timeComplexity: {
      best: "O(W * L)",
      average: "O(W * L)",
      worst: "O(W * L)",
    },
    spaceComplexity: "O(P)",
    complexityAnalysis: {
      time: "O(W * L) where W is number of unique words and L is average word symbol length.",
      space: "O(P) auxiliary memory where P is number of unique adjacent symbol pairs.",
    },
    topicGuide: {
      overview:
        "Byte-Pair Encoding (BPE, Gage 1994, Sennrich 2016) builds subword vocabularies by iteratively counting adjacent symbol pair frequencies and merging the most frequent pair. Used by GPT-2, GPT-4, LLaMA, and RoBERTa.",
      sections: [
        {
          heading: "Core Concept & Frequency Weighting",
          body: "Each word w occurs with corpus frequency f_w. The total count for adjacent pair (a, b) is sum_{w} f_w * count_in_w(a, b).",
        },
        {
          heading: "Systems & Memory Optimization",
          body: "In production trainers (HuggingFace tokenizers / Tiktoken), inverted index data structures maintain word location pointers per pair so frequency updates only re-evaluate affected words.",
        },
        {
          heading: "Special Tokens & Boundaries",
          body: "End-of-word markers (`</w>` or `Ġ`) prevent merges across word boundaries.",
        },
      ],
      keyTerms: [
        {
          term: "Byte-Pair Encoding (BPE)",
          definition:
            "Subword tokenization algorithm iteratively merging frequent adjacent character pairs.",
        },
        {
          term: "Merge Rule",
          definition:
            "A pair substitution rule (A, B) -> AB added to vocabulary during BPE training.",
        },
        {
          term: "Word Boundary Symbol",
          definition: "Special token marking word boundaries to preserve spacing semantics.",
        },
      ],
    },
    sources: [
      { type: "ml_infra", kind: "ml_infra", label: "BPE Tokenization (Sennrich et al. ACL 2016)" },
    ],
    generateSteps: generateAdjacentPairFrequencySteps,
  };
