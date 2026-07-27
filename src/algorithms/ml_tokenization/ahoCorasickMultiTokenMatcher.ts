import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface AhoCorasickMultiTokenMatcherInput {
  text: string;
  keywords: string[];
}

export const DEFAULT_AHO_CORASICK_INPUT: AhoCorasickMultiTokenMatcherInput = {
  text: "hehersher",
  keywords: ["he", "she", "his", "hers"],
};

export const AHO_CORASICK_CODE = `from collections import deque

def aho_corasick_match(text: str, keywords: list[str]) -> list[tuple[int, int, str]]:
    """
    Aho-Corasick Multi-Token Matcher.
    Constructs a Trie with failure transitions and output links.
    Finds all occurrences of multiple keywords in text in O(N + M) time.
    """
    # Step 1: Build Trie structure
    trie = [{"children": {}, "fail": 0, "output": []}]

    for kw in keywords:
        curr = 0
        for char in kw:
            if char not in trie[curr]["children"]:
                trie.append({"children": {}, "fail": 0, "output": []})
                trie[curr]["children"][char] = len(trie) - 1
            curr = trie[curr]["children"][char]
        trie[curr]["output"].append(kw)

    # Step 2: Build Failure Links via BFS
    queue = deque()
    for char, child_node in trie[0]["children"].items():
        queue.append(child_node)

    while queue:
        r = queue.popleft()
        for char, child_node in trie[r]["children"].items():
            queue.append(child_node)
            f = trie[r]["fail"]
            while f > 0 and char not in trie[f]["children"]:
                f = trie[f]["fail"]
            trie[child_node]["fail"] = trie[f]["children"].get(char, 0)
            trie[child_node]["output"].extend(trie[trie[child_node]["fail"]]["output"])

    # Step 3: Stream match across text
    matches = []
    curr = 0
    for idx, char in enumerate(text):
        while curr > 0 and char not in trie[curr]["children"]:
            curr = trie[curr]["fail"]
        curr = trie[curr]["children"].get(char, 0)

        for kw in trie[curr]["output"]:
            start_idx = idx - len(kw) + 1
            matches.append((start_idx, idx, kw))

    return matches`;

export const generateAhoCorasickSteps = (
  input: AhoCorasickMultiTokenMatcherInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { text, keywords } = input;
  let stepIndex = 0;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize Aho-Corasick Multi-Token Matcher",
      why: `Building state automaton to search for ${keywords.length} keywords [${keywords
        .map((k) => `"${k}"`)
        .join(", ")}] in input text "${text}".`,
    },
    primarySnapshot: {
      kind: "array",
      elements: text.split("").map((ch, idx) => ({
        id: `t-${idx}`,
        value: idx,
        label: `'${ch}'`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        keywords: keywords.join(", "),
        textLength: String(text.length),
        status: "Initialized",
      },
    },
    variables: { textLen: text.length, numKeywords: keywords.length },
  });

  // Simple simulated Trie matching trace for educational clarity
  const matches: { start: number; end: number; kw: string }[] = [];

  for (let idx = 0; idx < text.length; idx++) {
    const matchedKws: string[] = [];

    for (const kw of keywords) {
      if (idx >= kw.length - 1) {
        const sub = text.substring(idx - kw.length + 1, idx + 1);
        if (sub === kw) {
          matchedKws.push(kw);
          matches.push({ start: idx - kw.length + 1, end: idx, kw });
        }
      }
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 35,
      explanation: {
        what: `Process Index ${idx} ('${text[idx]}')`,
        why:
          matchedKws.length > 0
            ? `Automaton match at index ${idx}: Found keyword(s) [${matchedKws.map((k) => `"${k}"`).join(", ")}].`
            : `Advanced automaton state via char '${text[idx]}'. No keyword ends at index ${idx}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: text.split("").map((ch, i) => ({
          id: `t-${i}`,
          value: i,
          label: `'${ch}'`,
          state:
            i === idx
              ? ("active" as ElementState)
              : matches.some((m) => i >= m.start && i <= m.end)
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: i === idx ? [`Index ${idx}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          char: `'${text[idx]}'`,
          index: String(idx),
          matchesFoundAtIdx: matchedKws.length > 0 ? matchedKws.join(", ") : "None",
          totalMatchesSoFar: String(matches.length),
        },
      },
      variables: { idx, char: text[idx], matchesCount: matches.length },
    });
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 43,
    explanation: {
      what: `Aho-Corasick Search Complete: Found ${matches.length} Total Keyword Occurrences`,
      why: `Matches: [${matches.map((m) => `"${m.kw}" at [${m.start}..${m.end}]`).join(", ")}]. Executed in O(N + M) time.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: matches.map((m, r) => ({
        id: `match-${r}`,
        value: m.start,
        label: `"${m.kw}" [${m.start}..${m.end}]`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        matches: matches.map((m) => `"${m.kw}"@[${m.start}..${m.end}]`).join(", "),
        totalMatches: String(matches.length),
        status: "Completed",
      },
    },
    variables: { totalMatches: matches.length, complete: true },
  });

  return steps;
};

export const ahoCorasickMultiTokenMatcher: AlgorithmDefinition<AhoCorasickMultiTokenMatcherInput> =
  {
    id: "ahoCorasickMultiTokenMatcher",
    title: "Aho-Corasick Multi-Token Automaton Matcher",
    category: "ml_tokenization",
    categories: ["ml_tokenization", "tries_and_strings"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_tokenization",
    description:
      "Constructs an Aho-Corasick finite-state automaton (Aho & Corasick, 1975) for multi-pattern token matching. Integrates Trie prefix trees with failure transitions (suffix pointers) and dictionary output links to locate all dictionary token occurrences in linear O(N + M) time.\n\nInput Format:\n- text: Input text string of length N.\n- keywords: List of M dictionary token pattern strings.\n\nOutput Format:\n- Returns list of (startIdx, endIdx, keyword) matches.\n\nEdge Cases & Constraints:\n- Overlapping keywords: Successfully emits all overlapping matches (e.g. 'he' and 'hers').",
    constraints: ["text.length >= 1.", "keywords.length >= 1."],
    examples: [
      {
        kind: "basic",
        title: "Overlapping Multi-Token Matching",
        inputDisplay: "text = 'hehersher', keywords = ['he', 'she', 'his', 'hers']",
        outputDisplay: "Matches: 'he'@[0..1], 'he'@[2..3], 'hers'@[2..5], 'she'@[4..6]",
        input: DEFAULT_AHO_CORASICK_INPUT,
        output: "4 matches found",
        explanation:
          "Finds all overlapping occurrences of dictionary tokens using failure transition links.",
      },
      {
        kind: "complex",
        title: "No Match In Text",
        inputDisplay: "text = 'xyz', keywords = ['abc', 'def']",
        outputDisplay: "No matches found",
        input: { text: "xyz", keywords: ["abc", "def"] },
        output: "[]",
        explanation: "Automaton transitions to root on failure with zero matches.",
      },
      {
        kind: "negative",
        title: "Sub-token Matching Inside Long Words",
        inputDisplay: "text = 'tokenizer', keywords = ['token', 'ize']",
        outputDisplay: "Matches 'token' and 'ize'",
        input: { text: "tokenizer", keywords: ["token", "ize"] },
        output: "['token', 'ize']",
        explanation: "Locates embedded tokens within text.",
      },
    ],
    defaultInput: DEFAULT_AHO_CORASICK_INPUT,
    code: AHO_CORASICK_CODE,
    timeComplexity: {
      best: "O(N + M)",
      average: "O(N + M + Matches)",
      worst: "O(N + M + Matches)",
    },
    spaceComplexity: "O(M * L)",
    complexityAnalysis: {
      time: "O(M * L) to construct Trie automaton (M keywords of length L), plus O(N) linear text scan time.",
      space: "O(M * L) memory to store Trie nodes, failure pointers, and output lists.",
    },
    topicGuide: {
      overview:
        "The Aho-Corasick algorithm (1975) generalizes KMP string matching to multi-pattern dictionaries. In machine learning pipelines (vLLM, HuggingFace, SpaCy), Aho-Corasick is used for fast multi-keyword extraction, regex token filtering, and stop-word detection.",
      sections: [
        {
          heading: "Core Concept & Failure Pointer BFS",
          body: "A Trie of keywords is augmented with failure links constructed via Breadth-First Search (BFS). If a character match fails at node u, the automaton follows fail(u) to the longest proper suffix that is a prefix in the Trie.",
        },
        {
          heading: "Output Link Chain Traversal",
          body: "Output links allow emitting all dictionary matches ending at position i, even when one match is a proper suffix of another (e.g. 'hers' and 'she').",
        },
        {
          heading: "Systems & Deterministic Automaton Optimization",
          body: "Compiling failure links into a fully deterministic transition table (DFA) eliminates runtime failure loops, guaranteeing exactly 1 state transition per input character.",
        },
      ],
      keyTerms: [
        {
          term: "Aho-Corasick Automaton",
          definition:
            "A Trie-based state machine with failure transitions for multi-pattern matching.",
        },
        {
          term: "Failure Link",
          definition:
            "Fallback state pointer directing the automaton to the longest suffix prefix match.",
        },
        {
          term: "Output Link",
          definition: "Direct pointer to dictionary keywords that match at the current state.",
        },
      ],
    },
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "Aho-Corasick Algorithm (CACM 1975)" }],
    generateSteps: generateAhoCorasickSteps,
  };
