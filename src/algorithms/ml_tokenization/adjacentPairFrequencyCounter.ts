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

  // Step 1: Init pair_counts dictionary (Line 2)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Initialize pair_counts map",
      why: `Start with an empty dictionary to accumulate symbol pair frequencies across ${wordEntries.length} corpus words.`,
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
        pairCounts: "{}",
        status: "Initialized pair_counts",
      },
    },
    variables: { totalWords: wordEntries.length },
  });

  const pairCounts: Record<string, number> = {};

  for (let wIdx = 0; wIdx < wordEntries.length; wIdx++) {
    const [wordStr, freq] = wordEntries[wIdx];

    // Step 2: Outer loop per word (Line 4)
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 4,
      explanation: {
        what: `Select corpus word "${wordStr}" (frequency: ${freq})`,
        why: `Processing word ${wIdx + 1} of ${wordEntries.length}. Each adjacent pair found in this word will receive +${freq} count.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: wordEntries.map(([w, f], idx) => ({
          id: `w-${idx}`,
          value: f,
          label: `"${w}" (freq: ${f})`,
          state:
            idx === wIdx
              ? ("active" as ElementState)
              : idx < wIdx
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === wIdx ? ["Current Word"] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          word_str: wordStr,
          freq: String(freq),
          uniquePairsSoFar: String(Object.keys(pairCounts).length),
          status: `Processing word ${wIdx + 1}/${wordEntries.length}`,
        },
      },
      variables: { word_str: wordStr, freq },
    });

    const symbols = wordStr.split(" ");

    // Step 3: Split symbols (Line 5)
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Split "${wordStr}" into ${symbols.length} symbols`,
        why: `Extracted symbol tokens: [${symbols.map((s) => `'${s}'`).join(", ")}].`,
      },
      primarySnapshot: {
        kind: "array",
        elements: symbols.map((sym, sIdx) => ({
          id: `sym-${sIdx}`,
          value: sym,
          label: `'${sym}'`,
          state: "default" as ElementState,
        })),
      },
      auxiliaryState: {
        customState: {
          word_str: wordStr,
          symbols: symbols.join(" | "),
          symbolCount: String(symbols.length),
          status: "Extracted symbols",
        },
      },
      variables: { word_str: wordStr, symbols: symbols.join(", ") },
    });

    for (let i = 0; i < symbols.length - 1; i++) {
      const sym1 = symbols[i];
      const sym2 = symbols[i + 1];
      const pairKey = `${sym1},${sym2}`;

      // Step 4: Extract pair (Line 7)
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 7,
        explanation: {
          what: `Extract adjacent pair ("${sym1}", "${sym2}") at symbol index ${i}`,
          why: `Pairing adjacent symbols '${sym1}' (idx ${i}) and '${sym2}' (idx ${i + 1}).`,
        },
        primarySnapshot: {
          kind: "array",
          elements: symbols.map((sym, sIdx) => ({
            id: `sym-${sIdx}`,
            value: sym,
            label: `'${sym}'`,
            state:
              sIdx === i || sIdx === i + 1
                ? ("active" as ElementState)
                : ("default" as ElementState),
            pointers: sIdx === i ? ["pair[0]"] : sIdx === i + 1 ? ["pair[1]"] : [],
          })),
        },
        auxiliaryState: {
          customState: {
            activeWord: wordStr,
            pair: `("${sym1}", "${sym2}")`,
            pairIndex: `${i}, ${i + 1}`,
            status: "Formed adjacent pair",
          },
        },
        variables: { symbol_index: i, pair: `("${sym1}", "${sym2}")` },
      });

      const prevCount = pairCounts[pairKey] || 0;
      pairCounts[pairKey] = prevCount + freq;
      const newCount = pairCounts[pairKey];

      // Step 5: Update pair counts (Line 8)
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 8,
        explanation: {
          what: `Update pair_counts[("${sym1}", "${sym2}")] = ${prevCount} + ${freq} = ${newCount}`,
          why: `Word "${wordStr}" occurs ${freq} times, adding ${freq} frequency weight to pair ("${sym1}", "${sym2}").`,
        },
        primarySnapshot: {
          kind: "array",
          elements: symbols.map((sym, sIdx) => ({
            id: `sym-${sIdx}`,
            value: sym,
            label: `'${sym}'`,
            state:
              sIdx === i || sIdx === i + 1
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          })),
        },
        auxiliaryState: {
          customState: {
            pair: `("${sym1}", "${sym2}")`,
            prevCount: String(prevCount),
            addedFreq: `+${freq}`,
            newCount: String(newCount),
            totalUniquePairs: String(Object.keys(pairCounts).length),
            status: "Updated pair_counts",
          },
        },
        variables: {
          pair: `("${sym1}", "${sym2}")`,
          prevCount,
          addedFreq: freq,
          newCount,
        },
      });
    }
  }

  // Step 6: Identify Most Frequent Pair (Line 10)
  const pairEntries = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]);
  const bestPair = pairEntries[0] ? pairEntries[0][0].split(",") : ["", ""];
  const bestFreq = pairEntries[0] ? pairEntries[0][1] : 0;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `Identify Most Frequent Pair: ("${bestPair[0]}", "${bestPair[1]}") with count ${bestFreq}`,
      why: `Evaluated ${pairEntries.length} unique symbol pairs. Pair ("${bestPair[0]}", "${bestPair[1]}") has highest count (${bestFreq}) and is selected for BPE merge rule.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: pairEntries.map(([pKey, count], rank) => ({
        id: `pair-${rank}`,
        value: count,
        label: `("${pKey.replace(",", '", "')}") : ${count}`,
        state: rank === 0 ? ("sorted" as ElementState) : ("default" as ElementState),
        pointers: rank === 0 ? ["Most Frequent Pair"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        most_frequent_pair: `("${bestPair[0]}", "${bestPair[1]}")`,
        frequency: String(bestFreq),
        totalUniquePairs: String(pairEntries.length),
        status: "Found max pair",
      },
    },
    variables: {
      most_frequent_pair: `("${bestPair[0]}", "${bestPair[1]}")`,
      bestFreq,
    },
  });

  // Step 7: Return Result (Line 11)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: `Return (pair_counts, most_frequent_pair)`,
      why: `Finished counting adjacent symbol pair frequencies for BPE tokenization step 1.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: pairEntries.map(([pKey, count], rank) => ({
        id: `pair-${rank}`,
        value: count,
        label: `("${pKey.replace(",", '", "')}") : ${count}`,
        state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        most_frequent_pair: `("${bestPair[0]}", "${bestPair[1]}")`,
        frequency: String(bestFreq),
        totalUniquePairs: String(pairEntries.length),
        status: "Completed",
      },
    },
    variables: {
      most_frequent_pair: `("${bestPair[0]}", "${bestPair[1]}")`,
      totalUniquePairs: pairEntries.length,
    },
  });

  return steps;
};

export const adjacentPairFrequencyCounter: AlgorithmDefinition<AdjacentPairFrequencyCounterInput> =
  {
    id: "adjacent-pair-frequency-counter",
    title: "BPE Adjacent Pair Frequency Counter",
    topicIds: ["ml_tokenization", "tries_and_strings"],
    difficulty: "Easy",
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
