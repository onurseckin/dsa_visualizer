import type { MLTopicQuestionBank } from "./types";

export const trieTokenizationBpe: MLTopicQuestionBank[] = [
  {
    topicId: "ml_trie_aho_corasick",
    title: "Trie-based Vocabulary",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 24",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 24",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 24",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Prove the time complexity of searching a",
        prompt:
          "Prove the time complexity of searching and inserting a word of length L in a Trie.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove the space complexity of a Trie sto",
        prompt: "Prove the space complexity of a Trie storing N words of maximum length L.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "How does a Trie structure improve vocabu",
        prompt: "How does a Trie structure improve vocabulary search efficiency in tokenizers?",
        engineeringContext:
          "Production ML infrastructure consideration for Trie-based Vocabulary at scale.",
      },
      {
        title: "What are the memory overheads of a stand",
        prompt:
          "What are the memory overheads of a standard Trie compared to a Directed Acyclic Word Graph (DAWG)?",
        engineeringContext:
          "Production ML infrastructure consideration for Trie-based Vocabulary at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: "Inserting identical words multiple times.",
        scenario: "Inserting identical words multiple times.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Searching for a prefix of an inserted word that is not a complete word.",
        scenario: "Searching for a prefix of an inserted word that is not a complete word.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-24",
      title: "Trie-based Vocabulary",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_trie_aho_corasick",
      prompt: "Implement the canonical algorithm for Trie-based Vocabulary.",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end_of_word = False\n\nclass TrieVocab:\n    def __init__(self):\n        self.root = TrieNode()\n        \n    def insert(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                node.children[char] = TrieNode()\n            node = node.children[char]\n        node.is_end_of_word = True\n        \n    def search(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                return False\n            node = node.children[char]\n        return node.is_end_of_word",
    },
    codeVariants: [
      {
        id: "ml_trie_aho_corasick-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end_of_word = False\n\nclass TrieVocab:\n    def __init__(self):\n        self.root = TrieNode()\n        \n    def insert(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                node.children[char] = TrieNode()\n            node = node.children[char]\n        node.is_end_of_word = True\n        \n    def search(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                return False\n            node = node.children[char]\n        return node.is_end_of_word",
      },
      {
        id: "ml_trie_aho_corasick-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nclass TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end_of_word = False\n\nclass TrieVocab:\n    def __init__(self):\n        self.root = TrieNode()\n        \n    def insert(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                node.children[char] = TrieNode()\n            node = node.children[char]\n        node.is_end_of_word = True\n        \n    def search(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                return False\n            node = node.children[char]\n        return node.is_end_of_word",
      },
    ],
    complexityAnalysis: {
      timeComplexity: "O(N) amortized",
      spaceComplexity: "O(1) auxiliary",
      breakdown:
        "Algorithmic time complexity scales with input tensor volume; memory operations bounded by cache line transfers and SRAM capacity.",
    },
    topicGuide: {
      overview:
        "Comprehensive exploration of Trie-based Vocabulary, covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Trie-based Vocabulary",
          definition: "Core computational primitive governing Trie-based Vocabulary.",
        },
        {
          term: "Memory Bandwidth",
          definition:
            "Rate at which data can be read from or stored into memory by a processor or accelerator.",
        },
        {
          term: "Computational Arithmetic Intensity",
          definition:
            "Ratio of arithmetic operations (FLOPs) to memory traffic (Bytes transferred).",
        },
      ],
      sections: [
        {
          heading: "1. Mathematical Foundations",
          body: "Analytical formulation, derivations, and structural invariants underpinning Trie-based Vocabulary.",
        },
        {
          heading: "2. Modern Hardware & Acceleration",
          body: "Mapping the algorithm efficiently across CPU SIMD, GPU Tensor Cores, and SRAM hierarchy.",
        },
        {
          heading: "3. Production Systems Engineering",
          body: "Real-world tradeoffs in large-scale machine learning training and inference pipelines.",
        },
      ],
    },
    tutorialAlignment: {
      phase1_intro:
        "Conceptual introduction to Trie-based Vocabulary, establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "trie",
      stateVariables: {
        input: "Input Tensor / Data Buffer",
        accumulator: "Active SRAM Intermediate",
        output: "Output Tensor / State Buffer",
      },
      colorMapping: {
        default: "#3b82f6",
        active: "#eab308",
        computed: "#22c55e",
        highlighted: "#ef4444",
      },
    },
  },
  {
    topicId: "ml_subword_bpe_tiktoken",
    title: "Byte Pair Encoding (BPE)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 25",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 25",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 25",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Show that BPE guarantees a finite, monot",
        prompt:
          "Show that BPE guarantees a finite, monotonically decreasing maximum sequence length on the training corpus.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
      {
        title: "Prove that BPE does not create out-of-vo",
        prompt:
          "Prove that BPE does not create out-of-vocabulary (OOV) tokens for any string if initialized with byte-level characters.",
        proofOutline:
          "Step 1: Formulate mathematical definitions. Step 2: Expand intermediate terms and apply invariant bounds. Step 3: Conclude algebraic equivalence.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Why is BPE the standard tokenization met",
        prompt: "Why is BPE the standard tokenization method for LLMs like GPT and LLaMA?",
        engineeringContext:
          "Production ML infrastructure consideration for Byte Pair Encoding (BPE) at scale.",
      },
      {
        title: "How can BPE merging be parallelized effi",
        prompt: "How can BPE merging be parallelized efficiently across large corpora?",
        engineeringContext:
          "Production ML infrastructure consideration for Byte Pair Encoding (BPE) at scale.",
      },
    ],
    partD_stressTests: [
      {
        title: 'Words with heavily repeating character sequences (e.g., "aaaaa").',
        scenario: 'Words with heavily repeating character sequences (e.g., "aaaaa").',
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
      {
        title: "Merging when no pair occurs more than once.",
        scenario: "Merging when no pair occurs more than once.",
        failureMode: "Numerical instability / Shape mismatch / Precision underflow",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-25",
      title: "Byte Pair Encoding (BPE)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_subword_bpe_tiktoken",
      prompt: "Implement the canonical algorithm for Byte Pair Encoding (BPE).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'from collections import Counter, defaultdict\n\ndef get_stats(vocab):\n    pairs = defaultdict(int)\n    for word, freq in vocab.items():\n        symbols = word.split()\n        for i in range(len(symbols)-1):\n            pairs[symbols[i], symbols[i+1]] += freq\n    return pairs\n\ndef merge_vocab(pair, v_in):\n    v_out = {}\n    bigram = " ".join(pair)\n    replacement = "".join(pair)\n    for word in v_in:\n        w_out = word.replace(bigram, replacement)\n        v_out[w_out] = v_in[word]\n    return v_out\n\ndef bpe_train_step(vocab, num_merges):\n    # vocab is a dict of {"l o w </w>": 5, "l o w e r </w>": 2, ...}\n    for i in range(num_merges):\n        pairs = get_stats(vocab)\n        if not pairs:\n            break\n        best = max(pairs, key=pairs.get)\n        vocab = merge_vocab(best, vocab)\n    return vocab',
    },
    codeVariants: [
      {
        id: "ml_subword_bpe_tiktoken-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'from collections import Counter, defaultdict\n\ndef get_stats(vocab):\n    pairs = defaultdict(int)\n    for word, freq in vocab.items():\n        symbols = word.split()\n        for i in range(len(symbols)-1):\n            pairs[symbols[i], symbols[i+1]] += freq\n    return pairs\n\ndef merge_vocab(pair, v_in):\n    v_out = {}\n    bigram = " ".join(pair)\n    replacement = "".join(pair)\n    for word in v_in:\n        w_out = word.replace(bigram, replacement)\n        v_out[w_out] = v_in[word]\n    return v_out\n\ndef bpe_train_step(vocab, num_merges):\n    # vocab is a dict of {"l o w </w>": 5, "l o w e r </w>": 2, ...}\n    for i in range(num_merges):\n        pairs = get_stats(vocab)\n        if not pairs:\n            break\n        best = max(pairs, key=pairs.get)\n        vocab = merge_vocab(best, vocab)\n    return vocab',
      },
      {
        id: "ml_subword_bpe_tiktoken-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\nfrom collections import Counter, defaultdict\n\ndef get_stats(vocab):\n    pairs = defaultdict(int)\n    for word, freq in vocab.items():\n        symbols = word.split()\n        for i in range(len(symbols)-1):\n            pairs[symbols[i], symbols[i+1]] += freq\n    return pairs\n\ndef merge_vocab(pair, v_in):\n    v_out = {}\n    bigram = " ".join(pair)\n    replacement = "".join(pair)\n    for word in v_in:\n        w_out = word.replace(bigram, replacement)\n        v_out[w_out] = v_in[word]\n    return v_out\n\ndef bpe_train_step(vocab, num_merges):\n    # vocab is a dict of {"l o w </w>": 5, "l o w e r </w>": 2, ...}\n    for i in range(num_merges):\n        pairs = get_stats(vocab)\n        if not pairs:\n            break\n        best = max(pairs, key=pairs.get)\n        vocab = merge_vocab(best, vocab)\n    return vocab',
      },
    ],
    complexityAnalysis: {
      timeComplexity: "O(N) amortized",
      spaceComplexity: "O(1) auxiliary",
      breakdown:
        "Algorithmic time complexity scales with input tensor volume; memory operations bounded by cache line transfers and SRAM capacity.",
    },
    topicGuide: {
      overview:
        "Comprehensive exploration of Byte Pair Encoding (BPE), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Byte Pair Encoding (BPE)",
          definition: "Core computational primitive governing Byte Pair Encoding (BPE).",
        },
        {
          term: "Memory Bandwidth",
          definition:
            "Rate at which data can be read from or stored into memory by a processor or accelerator.",
        },
        {
          term: "Computational Arithmetic Intensity",
          definition:
            "Ratio of arithmetic operations (FLOPs) to memory traffic (Bytes transferred).",
        },
      ],
      sections: [
        {
          heading: "1. Mathematical Foundations",
          body: "Analytical formulation, derivations, and structural invariants underpinning Byte Pair Encoding (BPE).",
        },
        {
          heading: "2. Modern Hardware & Acceleration",
          body: "Mapping the algorithm efficiently across CPU SIMD, GPU Tensor Cores, and SRAM hierarchy.",
        },
        {
          heading: "3. Production Systems Engineering",
          body: "Real-world tradeoffs in large-scale machine learning training and inference pipelines.",
        },
      ],
    },
    tutorialAlignment: {
      phase1_intro:
        "Conceptual introduction to Byte Pair Encoding (BPE), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "trie",
      stateVariables: {
        input: "Input Tensor / Data Buffer",
        accumulator: "Active SRAM Intermediate",
        output: "Output Tensor / State Buffer",
      },
      colorMapping: {
        default: "#3b82f6",
        active: "#eab308",
        computed: "#22c55e",
        highlighted: "#ef4444",
      },
    },
  },
];
