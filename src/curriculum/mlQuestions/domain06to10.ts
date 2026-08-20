import { MLTopicQuestionBank } from "./types";

export const domain06to10: MLTopicQuestionBank[] = [
  {
    topicId: "24",
    title: "Trie-based Vocabulary",
    domain: "Domain 6: Tokenization and Retrieval",
    partA_dsaCoding: [
      {
        title: "LeetCode 208: Implement Trie (Prefix Tree)",
        url: "https://leetcode.com/problems/implement-trie-prefix-tree/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "LeetCode 211: Design Add and Search Words Data Structure",
        url: "https://leetcode.com/problems/design-add-and-search-words-data-structure/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "LeetCode 212: Word Search II",
        url: "https://leetcode.com/problems/word-search-ii/",
        rationale: "Core algorithmic primitive",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove the time complexity of searching and inserting a word of length L in a Trie.",
      },
      {
        title: "Mathematical Proof",
        prompt: "Prove the space complexity of a Trie storing N words of maximum length L.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt: "How does a Trie structure improve vocabulary search efficiency in tokenizers?",
      },
      {
        title: "Systems Engineering",
        prompt:
          "What are the memory overheads of a standard Trie compared to a Directed Acyclic Word Graph (DAWG)?",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario: "Inserting identical words multiple times.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario: "Searching for a prefix of an inserted word that is not a complete word.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-24",
      title: "Executable Contract for Trie-based Vocabulary",
      referenceUrl: "",
      prompt: "Implement the requested function or class.",
      inputSchema: "Standard Python primitives",
      outputSchema: "Standard Python primitives",
      constraints: ["No external libraries except math and random"],
      tolerances: "Floating point comparison to 1e-6",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end_of_word = False\n\nclass TrieVocab:\n    def __init__(self):\n        self.root = TrieNode()\n        \n    def insert(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                node.children[char] = TrieNode()\n            node = node.children[char]\n        node.is_end_of_word = True\n        \n    def search(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                return False\n            node = node.children[char]\n        return node.is_end_of_word",
    },
  },
  {
    topicId: "25",
    title: "Byte Pair Encoding (BPE)",
    domain: "Domain 6: Tokenization and Retrieval",
    partA_dsaCoding: [
      {
        title: "LeetCode 3: Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "LeetCode 14: Longest Common Prefix",
        url: "https://leetcode.com/problems/longest-common-prefix/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "LeetCode 443: String Compression",
        url: "https://leetcode.com/problems/string-compression/",
        rationale: "Core algorithmic primitive",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Show that BPE guarantees a finite, monotonically decreasing maximum sequence length on the training corpus.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that BPE does not create out-of-vocabulary (OOV) tokens for any string if initialized with byte-level characters.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt: "Why is BPE the standard tokenization method for LLMs like GPT and LLaMA?",
      },
      {
        title: "Systems Engineering",
        prompt: "How can BPE merging be parallelized efficiently across large corpora?",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario: 'Words with heavily repeating character sequences (e.g., "aaaaa").',
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario: "Merging when no pair occurs more than once.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-25",
      title: "Executable Contract for Byte Pair Encoding (BPE)",
      referenceUrl: "",
      prompt: "Implement the requested function or class.",
      inputSchema: "Standard Python primitives",
      outputSchema: "Standard Python primitives",
      constraints: ["No external libraries except math and random"],
      tolerances: "Floating point comparison to 1e-6",
      workedExamples: ["Provided in tests"],
      pythonCode:
        'from collections import Counter, defaultdict\n\ndef get_stats(vocab):\n    pairs = defaultdict(int)\n    for word, freq in vocab.items():\n        symbols = word.split()\n        for i in range(len(symbols)-1):\n            pairs[symbols[i], symbols[i+1]] += freq\n    return pairs\n\ndef merge_vocab(pair, v_in):\n    v_out = {}\n    bigram = " ".join(pair)\n    replacement = "".join(pair)\n    for word in v_in:\n        w_out = word.replace(bigram, replacement)\n        v_out[w_out] = v_in[word]\n    return v_out\n\ndef bpe_train_step(vocab, num_merges):\n    # vocab is a dict of {"l o w </w>": 5, "l o w e r </w>": 2, ...}\n    for i in range(num_merges):\n        pairs = get_stats(vocab)\n        if not pairs:\n            break\n        best = max(pairs, key=pairs.get)\n        vocab = merge_vocab(best, vocab)\n    return vocab',
    },
  },
  {
    topicId: "26",
    title: "KD-Tree for Retrieval",
    domain: "Domain 6: Tokenization and Retrieval",
    partA_dsaCoding: [
      {
        title: "LeetCode 973: K Closest Points to Origin",
        url: "https://leetcode.com/problems/k-closest-points-to-origin/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "LeetCode 215: Kth Largest Element in an Array",
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "LeetCode 347: Top K Frequent Elements",
        url: "https://leetcode.com/problems/top-k-frequent-elements/",
        rationale: "Core algorithmic primitive",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove the $O(N \\log N)$ expected time complexity of constructing a balanced KD-Tree.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          'Explain mathematically the "curse of dimensionality" and why KD-Trees become inefficient in high dimensions (D > 20).',
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "Why do vector databases prefer approximate nearest neighbor (ANN) algorithms over exact KD-Trees for dense embeddings?",
      },
      {
        title: "Systems Engineering",
        prompt:
          "How can KD-Trees be used for efficient spatial querying in geographical recommendation systems?",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario: "Collinear or exactly overlapping points.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario: "Querying in spaces with very high dimensionality.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-26",
      title: "Executable Contract for KD-Tree for Retrieval",
      referenceUrl: "",
      prompt: "Implement the requested function or class.",
      inputSchema: "Standard Python primitives",
      outputSchema: "Standard Python primitives",
      constraints: ["No external libraries except math and random"],
      tolerances: "Floating point comparison to 1e-6",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "import math\n\nclass KDNode:\n    def __init__(self, point, axis, left=None, right=None):\n        self.point = point\n        self.axis = axis\n        self.left = left\n        self.right = right\n\nclass KDTree:\n    def __init__(self, points):\n        self.k = len(points[0]) if points else 0\n        self.root = self._build_tree(points, depth=0)\n        \n    def _build_tree(self, points, depth):\n        if not points:\n            return None\n        axis = depth % self.k\n        points.sort(key=lambda x: x[axis])\n        median = len(points) // 2\n        return KDNode(\n            points[median],\n            axis,\n            self._build_tree(points[:median], depth + 1),\n            self._build_tree(points[median + 1:], depth + 1)\n        )\n        \n    def nearest(self, query):\n        best = None\n        best_dist = float('inf')\n        \n        def _search(node):\n            nonlocal best, best_dist\n            if node is None:\n                return\n            \n            d = sum((a - b) ** 2 for a, b in zip(node.point, query))\n            if d < best_dist:\n                best_dist = d\n                best = node.point\n                \n            axis = node.axis\n            diff = query[axis] - node.point[axis]\n            \n            close, away = (node.left, node.right) if diff < 0 else (node.right, node.left)\n            _search(close)\n            if diff ** 2 < best_dist:\n                _search(away)\n                \n        _search(self.root)\n        return best",
    },
  },
  {
    topicId: "27",
    title: "Simplified HNSW",
    domain: "Domain 6: Tokenization and Retrieval",
    partA_dsaCoding: [
      {
        title: "LeetCode 146: LRU Cache",
        url: "https://leetcode.com/problems/lru-cache/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "LeetCode 295: Find Median from Data Stream",
        url: "https://leetcode.com/problems/find-median-from-data-stream/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "LeetCode 1202: Smallest String With Swaps",
        url: "https://leetcode.com/problems/smallest-string-with-swaps/",
        rationale: "Core algorithmic primitive",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          'Prove that Navigable Small World graphs exhibit the "six degrees of separation" property for connectivity.',
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Demonstrate why adding layers in HNSW strictly reduces the expected path length compared to a flat NSW graph.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "How does HNSW balance search speed and recall during inference in retrieval-augmented generation (RAG)?",
      },
      {
        title: "Systems Engineering",
        prompt:
          "What are the memory access patterns of HNSW, and how do they impact CPU cache utilization?",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Graph becoming disconnected (should be impossible by construction, but needs testing).",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario: "All points having extremely similar embeddings.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-27",
      title: "Executable Contract for Simplified HNSW",
      referenceUrl: "",
      prompt: "Implement the requested function or class.",
      inputSchema: "Standard Python primitives",
      outputSchema: "Standard Python primitives",
      constraints: ["No external libraries except math and random"],
      tolerances: "Floating point comparison to 1e-6",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "import math\nimport random\n\nclass SimplifiedHNSW:\n    def __init__(self, max_elements, M=16, ef_construction=100):\n        self.M = M\n        self.ef_construction = ef_construction\n        self.graph = {}\n        self.points = {}\n        self.entry_point = None\n        \n    def _distance(self, p1, p2):\n        return sum((a - b) ** 2 for a, b in zip(p1, p2))\n        \n    def add_point(self, point_id, vector):\n        self.points[point_id] = vector\n        self.graph[point_id] = []\n        \n        if self.entry_point is None:\n            self.entry_point = point_id\n            return\n            \n        # Simplified: Just find neighbors using a basic greedy search\n        neighbors = self._search_layer(vector, self.entry_point, self.ef_construction)\n        neighbors = sorted(neighbors, key=lambda x: x[1])[:self.M]\n        \n        for n_id, dist in neighbors:\n            self.graph[point_id].append(n_id)\n            self.graph[n_id].append(point_id)\n            if len(self.graph[n_id]) > self.M:\n                # Keep top M neighbors\n                self.graph[n_id] = sorted(self.graph[n_id], key=lambda x: self._distance(self.points[x], self.points[n_id]))[:self.M]\n                \n    def _search_layer(self, query, ep, ef):\n        candidates = [(ep, self._distance(query, self.points[ep]))]\n        visited = {ep}\n        results = [(ep, self._distance(query, self.points[ep]))]\n        \n        while candidates:\n            candidates.sort(key=lambda x: x[1])\n            curr, curr_dist = candidates.pop(0)\n            \n            results.sort(key=lambda x: x[1])\n            if curr_dist > results[-1][1] and len(results) >= ef:\n                break\n                \n            for neighbor in self.graph[curr]:\n                if neighbor not in visited:\n                    visited.add(neighbor)\n                    dist = self._distance(query, self.points[neighbor])\n                    if len(results) < ef or dist < results[-1][1]:\n                        candidates.append((neighbor, dist))\n                        results.append((neighbor, dist))\n                        results.sort(key=lambda x: x[1])\n                        if len(results) > ef:\n                            results.pop()\n                            \n        return results\n        \n    def search(self, query, k=1):\n        if self.entry_point is None:\n            return []\n        res = self._search_layer(query, self.entry_point, max(k, self.M))\n        return [r[0] for r in sorted(res, key=lambda x: x[1])[:k]]",
    },
  },
  {
    topicId: "28",
    title: "Scaled Dot-Product Attention & Causal KV-Cache Masking",
    domain: "Domain 7: Attention Mechanisms & Transformer Architecture",
    partA_dsaCoding: [
      {
        title: "Matrix Block Sum",
        url: "https://leetcode.com/problems/matrix-block-sum/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Diagonal Traverse",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Attention Is All You Need",
        url: "https://arxiv.org/abs/1706.03762",
        rationale: "Vaswani et al., 2017",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that scaling by $1/\\sqrt{d_k}$ ensures the variance of the dot product of two independent zero-mean, unit-variance vectors remains 1.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Derive the memory footprint formula for the full $N \times N$ attention matrix and show it is bounded by $O(N^2)$.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Show mathematically how the $-\\infty$ mask enforces the autoregressive property in the softmax denominator.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "Llama 3 70B KV Cache: Calculate the VRAM required per token for a model with 80 layers and 64 heads.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Discuss the tradeoffs of recomputing attention vs caching when context lengths exceed 128k tokens.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "How does context window padding affect inference throughput in a batched decoding environment?",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Stress Test: What happens when the dot product exceeds FP16 `max_val` before the mask is applied?",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Causal Mask Overflow: Explain how replacing $-\\infty$ with `-1e4` causes probability leakage in very long sequences.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "How do we ensure numerical stability of softmax when sequence lengths scale to $10^6$?",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-28-SDPA-CAUSAL",
      title: "Causal Masked Scaled Dot-Product Attention",
      referenceUrl: "https://arxiv.org/abs/1706.03762",
      prompt:
        "Given query matrix $Q \\in \\mathbb{R}^{N \\times d}$, key matrix $K \\in \\mathbb{R}^{N \\times d}$, and value matrix $V \\in \\mathbb{R}^{N \\times d}$, compute the causal scaled dot-product attention output $O \\in \\mathbb{R}^{N \\times d}$. Mask out future positions ($j > i$) with $-\\infty$ before computing softmax along each row.",
      inputSchema: "`Q: list[list[float]], K: list[list[float]], V: list[list[float]]`",
      outputSchema: "`O: list[list[float]]`",
      constraints: ["$1 \\le N \\le 128$, $1 \\le d \\le 64$."],
      tolerances: "Absolute error < 1e-5.",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "import math\n\ndef scaled_dot_product_attention_causal(\n    Q: list[list[float]], \n    K: list[list[float]], \n    V: list[list[float]]\n) -> list[list[float]]:\n    N = len(Q)\n    d_k = len(Q[0])\n    scale = 1.0 / math.sqrt(d_k)\n    \n    # 1. Compute raw scores: S = Q * K^T * scale\n    # 2. Apply causal mask (set j > i to -inf)\n    # 3. Softmax along each row\n    # 4. Multiply by V\n    \n    O = [[0.0] * d_k for _ in range(N)]\n    \n    for i in range(N):\n        row_scores = []\n        for j in range(N):\n            if j > i:\n                row_scores.append(-float('inf'))\n            else:\n                dot = sum(Q[i][k] * K[j][k] for k in range(d_k))\n                row_scores.append(dot * scale)\n                \n        # Numerically stable softmax for row i\n        valid_scores = [s for s in row_scores[:i+1]]\n        max_score = max(valid_scores) if valid_scores else 0.0\n        exp_scores = [math.exp(s - max_score) for s in valid_scores]\n        sum_exp = sum(exp_scores)\n        probs = [e / sum_exp for e in exp_scores]\n        \n        # Multiply attention weights by V\n        for d in range(d_k):\n            O[i][d] = sum(probs[j] * V[j][d] for j in range(i + 1))\n            \n    return O",
    },
  },
  {
    topicId: "29",
    title: "Multi-Head, Grouped-Query Attention (GQA) & Positional Encodings (RoPE, ALiBi)",
    domain: "Domain 7: Attention Mechanisms & Transformer Architecture",
    partA_dsaCoding: [
      {
        title: "Complex Number Multiplication",
        url: "https://leetcode.com/problems/complex-number-multiplication/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Rotate List",
        url: "https://leetcode.com/problems/rotate-list/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "RoFormer: Enhanced Transformer with Rotary Position Embedding",
        url: "https://arxiv.org/abs/2104.09864",
        rationale: "Su et al., 2021",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "RoPE Inner Product: Prove that the inner product of two RoPE-encoded vectors only depends on their relative position distance $m - n$.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "2D Givens Rotation: Show that the Givens rotation matrix preserves the $L_2$ norm of the embedded vectors.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "GQA Memory Reduction: Derive the exact percentage memory savings of GQA vs MHA for a $64$-head model with a GQA group size of $8$.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "Analyze how RoPE frequency interpolation (NTK-aware scaling) enables context window extension without fine-tuning.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Explain the MQA vs GQA vs MHA tradeoffs in memory bandwidth vs model perplexity as seen in Mistral 8x7B.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "KV Cache Layouts: Should KV cache be stored as `[batch, heads, seq, head_dim]` or `[batch, seq, heads, head_dim]` for optimal FlashAttention access?",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Stress Test: Long-term RoPE drift when sequence length $N$ exceeds the base wavelength.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Extrapolation Failure: Why do models hallucinate instantly when sequence length exceeds training maximum despite RoPE?",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "What happens if RoPE angle generation suffers from floating point truncation in FP16?",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-29-ROPE-GQA",
      title: "Rotary Positional Embedding (RoPE) Transformation",
      referenceUrl: "https://arxiv.org/abs/2104.09864",
      prompt:
        "Given a 2D vector $x = [x_0, x_1, \\dots, x_{2k-1}]$ representing a feature channel pair for a token at sequence position $m$, apply the RoPE Givens rotation $R_{\\Theta, m} x = [x_{2i} \\cos(m \\theta_i) - x_{2i+1} \\sin(m \\theta_i), x_{2i} \\sin(m \\theta_i) + x_{2i+1} \\cos(m \\theta_i)]$ where $\\theta_i = 10000^{-2i/d}$.",
      inputSchema: "`x: list[float], pos: int, base: float`",
      outputSchema: "`x_rotated: list[float]`",
      constraints: ["`len(x)` is even ($d$). `pos >= 0`. `base = 10000.0`."],
      tolerances: "Absolute error < 1e-5.",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "import math\n\ndef apply_rope_2d(x: list[float], pos: int, base: float = 10000.0) -> list[float]:\n    d = len(x)\n    out = [0.0] * d\n    \n    for i in range(0, d, 2):\n        theta = base ** (-i / d)\n        angle = pos * theta\n        cos_val = math.cos(angle)\n        sin_val = math.sin(angle)\n        \n        x0 = x[i]\n        x1 = x[i + 1]\n        \n        out[i] = x0 * cos_val - x1 * sin_val\n        out[i + 1] = x0 * sin_val + x1 * cos_val\n        \n    return out",
    },
  },
  {
    topicId: "30",
    title: "IO-Aware Attention: FlashAttention SRAM Tile Loop",
    domain: "Domain 7: Attention Mechanisms & Transformer Architecture",
    partA_dsaCoding: [
      {
        title: "Range Sum Query 2D - Immutable",
        url: "https://leetcode.com/problems/range-sum-query-2d-immutable/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Block Tile Matrix Traversal",
        url: "https://leetcode.com/problems/matrix-diagonal-sum/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness",
        url: "https://arxiv.org/abs/2205.14135",
        rationale: "Dao et al., 2022",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "IO Complexity: Prove that FlashAttention requires $O(N^2 d^2 / M)$ HBM accesses, where $M$ is SRAM size.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Online Softmax Correctness: Derive the algebraic equivalence between standard softmax and the three-pass online max-scaling algorithm.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "FlashAttention Backward: Derive the memory IO reduction in the backward pass of FlashAttention by avoiding the $N \times N$ dropout mask materialization.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "Thread Block Sizing: How do you choose $B_c$ and $B_r$ based on register pressure and shared memory limits on H100s?",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Compare the latency of FlashAttention vs standard attention at $N=4096$, explaining where memory bandwidth bottlenecks shift to compute bounds.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "How does PyTorch's `F.scaled_dot_product_attention` choose between FlashAttention, memory-efficient attention, and math backends?",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "SRAM Overflow: What happens when the block size causes shared memory overallocation?",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Tile dimension quantization padding: How do we handle sequence lengths that aren't multiples of $B_c$?",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario: "Precision loss in the running normalizer $l$ over extremely long sequences.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-30-FLASHATTENTION",
      title: "FlashAttention SRAM Block Tile Loop",
      referenceUrl: "https://arxiv.org/abs/2205.14135",
      prompt:
        "Implement the multi-tile forward pass of FlashAttention. Given query $Q$, key $K$, value $V$ matrices and block tile size $B_c$, compute the attention output $O$ by streaming $K, V$ blocks into SRAM and updating running max $m$ and running normalizer $l$ via the Dao et al. (2022) online recurrence.",
      inputSchema:
        "`Q: list[list[float]], K: list[list[float]], V: list[list[float]], block_size: int`",
      outputSchema: "`O: list[list[float]]`",
      constraints: ["Pure Python with `math`. $N \\le 64$, $d \\le 32$."],
      tolerances: "Absolute error < 1e-5 compared to standard full attention.",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "import math\n\ndef flash_attention_forward_tiled(\n    Q: list[list[float]], \n    K: list[list[float]], \n    V: list[list[float]], \n    Br: int = 2,\n    Bc: int = 2\n) -> list[list[float]]:\n    N = len(Q)\n    d = len(Q[0])\n    scale = 1.0 / math.sqrt(d)\n    \n    O = [[0.0] * d for _ in range(N)]\n    m = [-float('inf')] * N\n    l = [0.0] * N\n    \n    num_kv_blocks = (N + Bc - 1) // Bc\n    num_q_blocks = (N + Br - 1) // Br\n    \n    for b_kv in range(num_kv_blocks):\n        k_start = b_kv * Bc\n        k_end = min(N, (b_kv + 1) * Bc)\n        K_block = K[k_start:k_end]\n        V_block = V[k_start:k_end]\n        \n        for b_q in range(num_q_blocks):\n            q_start = b_q * Br\n            q_end = min(N, (b_q + 1) * Br)\n            \n            for i in range(q_start, q_end):\n                s_block = [sum(Q[i][k] * K_block[j][k] for k in range(d)) * scale for j in range(len(K_block))]\n                \n                m_block = max(s_block)\n                m_new = max(m[i], m_block)\n                \n                p_block = [math.exp(val - m_new) for val in s_block]\n                l_new = math.exp(m[i] - m_new) * l[i] + sum(p_block)\n                \n                alpha = math.exp(m[i] - m_new) * l[i]\n                for col in range(d):\n                    v_sum = sum(p_block[j] * V_block[j][col] for j in range(len(V_block)))\n                    O[i][col] = (alpha * O[i][col] + v_sum) / l_new\n                    \n                m[i] = m_new\n                l[i] = l_new\n                \n    return O",
    },
  },
  {
    topicId: "31",
    title: "Iteration-Level Continuous Batching (Orca Scheduler)",
    domain: "Domain 8: Inference Serving & Memory Systems",
    partA_dsaCoding: [
      {
        title: "Task Scheduler",
        url: "https://leetcode.com/problems/task-scheduler/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Design Hit Counter",
        url: "https://leetcode.com/problems/design-hit-counter/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Orca: A Distributed Serving System for Transformer-Based Generative Models",
        url: "https://www.usenix.org/conference/osdi22/presentation/yu",
        rationale: "Yu et al., OSDI 2022",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that continuous iteration-level batching provides strict upper bounds on GPU idle time compared to static batching.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Derive the expected throughput increase of Orca over static batching given a Poisson distribution of sequence lengths.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Calculate the maximum theoretical batch size before Time-Per-Output-Token (TPOT) exceeds human reading speed (e.g., 50 ms/token).",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "Prefill vs Decode Interleaving: Analyze the tradeoffs of chunked prefill (vLLM) on TTFT vs decode tail latency.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "How does the Orca scheduler handle out-of-memory (OOM) preemptions and recomputations?",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Compare the request latency distributions in vLLM vs TGI under heavy burst traffic.",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Deadlock in scheduling: Head-of-line blocking when a massive prefill request starves existing decodes.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Thrashing: Constant swapping of KV cache when the active batch size exceeds physical VRAM.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Token generation limits: Handling adversarial infinite-generation loops in the scheduler.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-31-ORCA-SCHEDULER",
      title: "Orca Continuous Batching Iteration Scheduler",
      referenceUrl: "https://www.usenix.org/conference/osdi22/presentation/yu",
      prompt:
        "Implement a continuous batching scheduler that maintains active decoding requests and admits waiting prefill requests up to a maximum batch size `max_batch_size`. At each iteration `schedule_step()`, advance active requests by 1 token, evict finished requests (where generated tokens reach target length), and admit new requests into available batch slots.",
      inputSchema: "Sequence of request arrivals with prompt and generation lengths.",
      outputSchema: "List of active request IDs executed at each scheduling step.",
      constraints: ["Pure Python with collections."],
      tolerances: "Exact deterministic step schedule match.",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "from collections import deque\n\nclass Request:\n    def __init__(self, req_id: str, prompt_len: int, max_tokens: int):\n        self.req_id = req_id\n        self.prompt_len = prompt_len\n        self.max_tokens = max_tokens\n        self.tokens_generated = 0\n\n    @property\n    def is_finished(self) -> bool:\n        return self.tokens_generated >= self.max_tokens\n\nclass OrcaContinuousBatchingScheduler:\n    def __init__(self, max_batch_size: int):\n        self.max_batch_size = max_batch_size\n        self.waiting_queue = deque()\n        self.running_batch = []\n\n    def add_request(self, req_id: str, prompt_len: int, max_tokens: int) -> None:\n        self.waiting_queue.append(Request(req_id, prompt_len, max_tokens))\n\n    def schedule_step(self) -> list[str]:\n        # 1. Evict finished requests\n        self.running_batch = [r for r in self.running_batch if not r.is_finished]\n        \n        # 2. Admit new requests from waiting queue if slots available\n        while len(self.running_batch) < self.max_batch_size and self.waiting_queue:\n            self.running_batch.append(self.waiting_queue.popleft())\n            \n        # 3. Advance each running request by 1 token\n        executed_ids = []\n        for req in self.running_batch:\n            req.tokens_generated += 1\n            executed_ids.append(req.req_id)\n            \n        return executed_ids",
    },
  },
  {
    topicId: "32",
    title: "Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM)",
    domain: "Domain 8: Inference Serving & Memory Systems",
    partA_dsaCoding: [
      {
        title: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Design Memory Allocator",
        url: "https://leetcode.com/problems/design-memory-allocator/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Efficient Memory Management for Large Language Model Serving with PagedAttention",
        url: "https://arxiv.org/abs/2309.06180",
        rationale: "Kwon et al., SOSP 2023",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "PagedAttention Fragmentation: Derive the formula for average internal fragmentation per sequence as a function of block size $B$.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Prove that external fragmentation is mathematically $0$ in PagedAttention due to fixed-size blocks.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Compute the memory capacity improvements for beam search width $k$ using Copy-on-Write vs naive duplication.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "Block Size Tuning: Why does vLLM default to a block size of 16 tokens instead of 1 or 64? Discuss kernel pointer-chasing overhead.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "How does PagedAttention integrate with Triton kernels where contiguous memory layouts are traditionally expected?",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Discuss the system impact of moving the KV-cache swap space from VRAM to host CPU RAM over PCIe.",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Out of Memory: Graceful degradation and sequence preemption when physical blocks are exhausted mid-generation.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario: "Ref-count overflow or leaks leading to zombie blocks in long-running servers.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Race conditions in asynchronous Copy-on-Write operations during parallel sampling.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-32-PAGEDATTN-COW",
      title: "PagedAttention Block Table and Copy-on-Write",
      referenceUrl: "https://arxiv.org/abs/2309.06180",
      prompt:
        "Implement a Paged KV-Cache Manager. Maintain a pool of physical block IDs (each holding `block_size` tokens). Implement `allocate_request(req_id, num_tokens)` to map logical tokens to physical blocks, `append_token(req_id)` to dynamically allocate new blocks as needed, and `fork_request(parent_id, child_id)` with Copy-on-Write reference counting.",
      inputSchema: "Requests allocation, token append, and fork operations.",
      outputSchema: "Sequence of mapped physical block IDs and block reference count states.",
      constraints: ["Pure Python. Physical pool capacity $M \\le 1000$."],
      tolerances: "Exact block allocation and ref-count match.",
      workedExamples: ["Provided in tests"],
      pythonCode:
        'class PagedAttentionBlockManager:\n    def __init__(self, block_size: int, total_blocks: int):\n        self.block_size = block_size\n        self.free_blocks = list(range(total_blocks - 1, -1, -1))\n        self.ref_counts = {i: 0 for i in range(total_blocks)}\n        self.block_tables = {}  # req_id -> list of physical block IDs\n        self.num_tokens = {}    # req_id -> int\n\n    def allocate_request(self, req_id: str, num_tokens: int) -> list[int]:\n        num_blocks = (num_tokens + self.block_size - 1) // self.block_size\n        blocks = []\n        for _ in range(num_blocks):\n            if not self.free_blocks:\n                raise MemoryError("Out of physical blocks")\n            blk = self.free_blocks.pop()\n            self.ref_counts[blk] = 1\n            blocks.append(blk)\n        self.block_tables[req_id] = blocks\n        self.num_tokens[req_id] = num_tokens\n        return blocks\n\n    def append_token(self, req_id: str) -> int:\n        cur_tokens = self.num_tokens[req_id]\n        blocks = self.block_tables[req_id]\n        \n        # Check if new token requires new block\n        if cur_tokens % self.block_size == 0:\n            if not self.free_blocks:\n                raise MemoryError("Out of physical blocks")\n            new_blk = self.free_blocks.pop()\n            self.ref_counts[new_blk] = 1\n            blocks.append(new_blk)\n        else:\n            # Check Copy-on-Write if last block is shared\n            last_blk = blocks[-1]\n            if self.ref_counts[last_blk] > 1:\n                if not self.free_blocks:\n                    raise MemoryError("Out of physical blocks")\n                self.ref_counts[last_blk] -= 1\n                new_blk = self.free_blocks.pop()\n                self.ref_counts[new_blk] = 1\n                blocks[-1] = new_blk\n                \n        self.num_tokens[req_id] += 1\n        return blocks[-1]\n\n    def read_kv(self, req_id: str) -> list[int]:\n        return list(self.block_tables.get(req_id, []))',
    },
  },
  {
    topicId: "33",
    title: "Speculative Decoding & Prefix Caching Algorithms",
    domain: "Domain 8: Inference Serving & Memory Systems",
    partA_dsaCoding: [
      {
        title: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Longest Common Prefix",
        url: "https://leetcode.com/problems/longest-common-prefix/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Fast Inference from Transformers via Speculative Decoding",
        url: "https://arxiv.org/abs/2211.17192",
        rationale: "Leviathan et al., 2023",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Acceptance Rate: Prove that the expected number of accepted tokens is exactly identical to sampling directly from the target distribution.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Rejection Resampling: Prove that $\\max(0, p - q)$ yields a valid probability distribution after normalization.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Speedup Bounds: Formulate the theoretical wall-clock speedup given draft model latency $t_d$, target latency $t_t$, and acceptance rate $\\alpha$.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "Draft Model Sizing: Discuss the FLOPs vs Acceptance Rate tradeoff when picking a 1.5B draft model for a 70B target model.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Analyze Medusa / Eagle multi-head speculative architectures vs standalone draft models.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "How does vLLM prefix caching reduce the Time-To-First-Token (TTFT) for multi-turn chat applications?",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Degraded Acceptance: Stress-testing speculative decoding on high-entropy tasks (e.g., base64 string generation) where acceptance drops to zero.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Floating point rounding errors in the rejection resampling distribution causing negative probabilities.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario: "Draft model alignment collapse causing systematic rejection cascades.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-33-SPECULATIVE-DECODE",
      title: "Speculative Decoding Verification Step",
      referenceUrl: "https://arxiv.org/abs/2211.17192",
      prompt:
        "Given draft proposed tokens $[x_1, \\dots, x_\\gamma]$, draft model probabilities $q_i(x_i)$, and target model probabilities $p_i(x_i)$, implement the speculative acceptance step: accept token $x_i$ if uniform random draw $u_i \\le \\min(1, p_i(x_i) / q_i(x_i))$. If rejected at token $k$, sample a replacement token from $\\max(0, p_k(x) - q_k(x))$ normalized, and discard all subsequent draft tokens.",
      inputSchema:
        "`draft_tokens: list[int], draft_probs: list[list[float]], target_probs: list[list[float]], uniform_draws: list[float]`",
      outputSchema: "`accepted_tokens: list[int]`",
      constraints: ["Pure Python. Vocabulary size $V \\le 1000$."],
      tolerances: "Exact distribution recovery match.",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "def speculative_rejection_sampler(\n    draft_tokens: list[int],\n    draft_probs: list[list[float]],\n    target_probs: list[list[float]],\n    uniform_draws: list[float] = None\n) -> tuple[list[int], int]:\n    accepted = []\n    gamma = len(draft_tokens)\n    if uniform_draws is None:\n        uniform_draws = [0.0] * gamma\n        \n    for i in range(gamma):\n        token = draft_tokens[i]\n        q_val = draft_probs[i][token]\n        p_val = target_probs[i][token]\n        \n        # Acceptance ratio\n        ratio = p_val / (q_val + 1e-12)\n        u = uniform_draws[i] if i < len(uniform_draws) else 0.0\n        \n        if u <= min(1.0, ratio):\n            accepted.append(token)\n        else:\n            # Rejected at position i: resample from max(0, p - q)\n            resample_dist = [max(0.0, target_probs[i][v] - draft_probs[i][v]) for v in range(len(target_probs[i]))]\n            sum_resample = sum(resample_dist)\n            if sum_resample > 0:\n                bonus_token = max(range(len(resample_dist)), key=lambda v: resample_dist[v])\n            else:\n                bonus_token = max(range(len(target_probs[i])), key=lambda v: target_probs[i][v])\n            accepted.append(bonus_token)\n            break\n            \n    return accepted, len(accepted)",
    },
  },
  {
    topicId: "34",
    title: "Floating-Point Formats (FP32/FP16/BF16/FP8) & Kahan Summation",
    domain: "Domain 9: Numerical Precision, Quantization & Accelerator Kernels",
    partA_dsaCoding: [
      {
        title: "Single Number II",
        url: "https://leetcode.com/problems/single-number-ii/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Add Binary",
        url: "https://leetcode.com/problems/add-binary/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Wikipedia: Kahan summation algorithm",
        url: "https://en.wikipedia.org/wiki/Kahan_summation_algorithm",
        rationale: "Core algorithmic primitive",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Kahan Error Bound: Prove that Kahan summation reduces the worst-case error bound from $O(N\\epsilon)$ to $O(\\epsilon)$ independent of $N$.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Dynamic Range: Calculate the exact representable bounds and minimum positive values for FP16, BF16, and FP8 (E4M3 and E5M2).",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Prove why BF16 prevents underflow in deep network gradients compared to FP16, despite having fewer mantissa bits.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "FP8 Training: Why do H100s use E4M3 for forward passes and E5M2 for backward passes?",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Analyze the overhead of maintaining FP32 master weights while doing gradient updates in mixed-precision training.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Discuss the impact of catastrophic cancellation in layer normalization and why it's usually computed in FP32.",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "All-Reduce Precision Loss: Stress test distributed sums across 1024 GPUs causing massive precision degradation.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Overflow in FP16 attention dot products before the softmax scaling factor is applied.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario: "NaN propagation through Kahan summation compensation variables.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-34-KAHAN-PRECISION",
      title: "Kahan Compensated Float Summation",
      referenceUrl: "https://en.wikipedia.org/wiki/Kahan_summation_algorithm",
      prompt:
        "Implement the Kahan summation algorithm to accurately sum an array of floating-point numbers while maintaining a running compensation term `c` for lost low-order bits.",
      inputSchema: "`values: list[float]`",
      outputSchema: "`total_sum: float`",
      constraints: ["Pure Python with `math`. Array length up to 10^5."],
      tolerances: "Exact IEEE-754 double precision match.",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "def kahan_compensated_sum(floats: list[float]) -> float:\n    values = floats\n    total = 0.0\n    c = 0.0  # Running compensation for lost low-order bits\n    \n    for v in values:\n        y = v - c\n        t = total + y\n        c = (t - total) - y\n        total = t\n        \n    return total",
    },
  },
  {
    topicId: "35",
    title: "Scale & Zero-Point Quantization (Affine Int8 / Weight-Only vs KV Quant)",
    domain: "Domain 9: Numerical Precision, Quantization & Accelerator Kernels",
    partA_dsaCoding: [
      {
        title: "Reverse Integer",
        url: "https://leetcode.com/problems/reverse-integer/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Encode Number",
        url: "https://leetcode.com/problems/encode-number/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "A White Paper on Neural Network Quantization",
        url: "https://arxiv.org/abs/2106.08295",
        rationale: "Nagel et al., 2021",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Quantization Error: Derive the maximum quantization error bound $\\le S/2$ for uniform affine quantization.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Zero-Point Algebra: Prove mathematically how the zero-point $Z$ allows exact representation of the real value $0.0$, avoiding asymmetric bias in padded convolutions.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "SmoothQuant: Formulate the mathematical transformation of migrating activation variance into weights via a smoothing factor $s$.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "Outlier Channels: Explain why activation outliers in LLMs (e.g., at 6.7B parameters) destroy standard token-wise INT8 quantization and necessitate AWQ/GPTQ.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Discuss the memory bandwidth advantages of Weight-Only quantization (INT4/INT8 weights, FP16 activations) over full quantization during batch-size=1 inference.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "How do bitsandbytes `nf4` (Normal Float 4) data types optimize scale factors for normally distributed neural network weights?",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Stress Test: Extreme activation spikes causing the scale factor to explode, squashing all other values to 0.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Zero-point clamping errors when intermediate calculations fall outside the representable $0-255$ range.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario: "Dequantization accumulation overflow in low-precision Tensor Cores.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-35-AFFINE-QUANT",
      title: "Affine Scale & Zero-Point Quantization",
      referenceUrl: "https://arxiv.org/abs/2106.08295",
      prompt:
        "Given a continuous float array `x` and target bit width (default 8, values in $[0, 255]$), compute the scale factor $S = (\\max(x) - \\min(x)) / (2^b - 1)$ and integer zero-point $Z = \\text{round}(-\\min(x) / S)$, and return the quantized integer array $q = \\text{clamp}(\\text{round}(x / S + Z), 0, 2^b - 1)$ alongside $(S, Z)$.",
      inputSchema: "`x: list[float], bits: int`",
      outputSchema: "`tuple[float, int, list[int]]` (Scale S, ZeroPoint Z, Quantized q)",
      constraints: ["Bits $b=8$. Array length $N \\le 10^4$."],
      tolerances: "Absolute scale error < 1e-6, exact integer zero-point and quantized codes.",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "def quantize_affine_int8(x: list[float]) -> tuple[float, int, list[int]]:\n    bits = 8\n    min_val = min(x)\n    max_val = max(x)\n    \n    qmin = 0\n    qmax = (1 << bits) - 1\n    \n    if max_val == min_val:\n        return 1.0, 0, [0] * len(x)\n        \n    scale = (max_val - min_val) / float(qmax - qmin)\n    zero_point = int(round(-min_val / scale))\n    zero_point = max(qmin, min(qmax, zero_point))\n    \n    q = []\n    for val in x:\n        q_val = int(round(val / scale + zero_point))\n        q_val = max(qmin, min(qmax, q_val))\n        q.append(q_val)\n        \n    return scale, zero_point, q",
    },
  },
  {
    topicId: "36",
    title: "Dense GEMM & SRAM L1 Block Tiling",
    domain: "Domain 9: Numerical Precision, Quantization & Accelerator Kernels",
    partA_dsaCoding: [
      {
        title: "Matrix Multiplication",
        url: "https://leetcode.com/problems/sparse-matrix-multiplication/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Block Matrix Traversal",
        url: "https://leetcode.com/problems/determine-whether-matrix-can-be-obtained-by-rotation/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Anatomy of High-Performance Matrix Multiplication",
        url: "https://www.cs.utexas.edu/~flame/pubs/GotoTOMS_revision.pdf",
        rationale: "Goto & van de Geijn",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Cache Complexity: Prove that 2D tiling reduces HBM memory access complexity from $O(N^3)$ to $O(N^3 / B)$ where $B$ is the tile size.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Arithmetic Intensity: Derive the FLOPs-to-Bytes ratio for a GEMM operation and show how it scales with matrix dimension $N$.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Compute the optimal SRAM tile dimensions for an architecture with $128$ KB of shared memory per SM and $256$ registers per thread.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "Matrix Shapes: Why are LLM linear layers typically sized in multiples of 128 or 256 for NVIDIA Tensor Cores?",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Compare CuBLAS batched GEMM vs grouped GEMM for routing tokens in MoE architectures.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "How does Triton compile Python-like nested loops into PTX assembly that orchestrates cooperative thread block loading?",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Bank Conflicts: Explain how unaligned shared memory accesses stall warp execution during tile loading.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Register Spilling: What happens to performance when the tile size demands more local variables than the SM register file can hold?",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario: "Edge padding inefficiencies when dimensions are prime numbers (e.g., $N=1013$).",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-36-GEMM-TILED",
      title: "2D SRAM Tiled GEMM",
      referenceUrl: "https://arxiv.org/abs/2205.14135",
      prompt:
        "Implement a 2D tiled matrix multiplication $C = A \\times B$ where $A \\in \\mathbb{R}^{M \\times K}$ and $B \\in \\mathbb{R}^{K \\times N}$. Divide matrices into square tiles of size $B_s$, simulate loading tiles into SRAM, and accumulate outer-product tile updates into $C$. Return $C$ and the sequence of tile step coordinates processed.",
      inputSchema: "`A: list[list[float]], B: list[list[float]], tile_size: int`",
      outputSchema:
        "`tuple[list[list[float]], list[tuple[int, int, int]]]` (Result matrix C, Tile execution trace)",
      constraints: [
        "$M, K, N \\le 128$. `tile_size` divides dimensions evenly or bounds are handled.",
      ],
      tolerances: "Absolute error < 1e-5.",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "def tiled_gemm_2d(\n    A: list[list[float]], \n    B: list[list[float]], \n    BM: int, BN: int, BK: int\n) -> tuple[list[list[float]], list[tuple[int, int, int]]]:\n    M = len(A)\n    K = len(A[0])\n    N = len(B[0])\n    \n    C = [[0.0] * N for _ in range(M)]\n    trace = []\n    \n    for ti in range(0, M, BM):\n        for tj in range(0, N, BN):\n            for tk in range(0, K, BK):\n                trace.append((ti, tj, tk))\n                i_end = min(M, ti + BM)\n                j_end = min(N, tj + BN)\n                k_end = min(K, tk + BK)\n                \n                for i in range(ti, i_end):\n                    for k in range(tk, k_end):\n                        a_ik = A[i][k]\n                        for j in range(tj, j_end):\n                            C[i][j] += a_ik * B[k][j]\n                            \n    return C, trace",
    },
  },
  {
    topicId: "37",
    title: "Interconnect Topologies & Network Path Cost ($\\alpha$-$\\beta$ Model)",
    domain: "Domain 10: Distributed Training, Parallelism & Compiler Planning",
    partA_dsaCoding: [
      {
        title: "Network Delay Time",
        url: "https://leetcode.com/problems/network-delay-time/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Cheapest Flights Within K Stops",
        url: "https://leetcode.com/problems/cheapest-flights-within-k-stops/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Analytical Modeling of GPU Interconnects",
        url: "https://en.wikipedia.org/wiki/Network_topology",
        rationale: "Core algorithmic primitive",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Hockney Model: Prove the crossover point where bandwidth $\\beta$ dominates latency $\\alpha$ for message size $S$.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Derive the total communication time for a Tree-AllReduce broadcast on a balanced binary tree of $P$ nodes.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Compute the bisection bandwidth of a non-blocking Clos network topology connecting 1024 GPUs.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "InfiniBand vs Ethernet: Contrast the latency overhead of RoCE (RDMA over Converged Ethernet) vs native InfiniBand for 100GB/s ML workloads.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "How does NVLink 4.0's 900 GB/s bandwidth alter the optimal parallelization strategy (TP inside node, DP/PP across nodes)?",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Discuss the impact of network jitter and packet loss on synchronous training steps at cluster scales > 10,000 GPUs.",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Straggler Effects: Stress test a synchronous AllReduce where one node experiences a $100\\mu s$ latency spike.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Link Saturation: Deadlocks and tail latency explosion when network topology is oversubscribed (e.g., 3:1 blocking ratio).",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario: "Asymmetric routing paths causing out-of-order packet delivery overheads.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-37-NETWORK-ALPHA-BETA",
      title: "Interconnect Alpha-Beta Transfer Cost Model",
      referenceUrl: "https://en.wikipedia.org/wiki/LogP_machine",
      prompt:
        "Given payload message size $S$ (in bytes), link latency $\\alpha$ (in seconds), link bandwidth $\\beta$ (in bytes/sec), and number of transfer hops $H$, compute the total communication transfer time $T = H \\cdot \\alpha + S / \\beta$.",
      inputSchema: "`size_bytes: int, alpha: float, beta: float, hops: int`",
      outputSchema: "`transfer_time: float`",
      constraints: ["`size_bytes >= 0`, `alpha >= 0`, `beta > 0`, `hops >= 1`."],
      tolerances: "Absolute error < 1e-9.",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "def alpha_beta_transfer_time(msg_bytes: int, alpha: float, beta: float, hops: int = 1) -> float:\n    size_bytes = msg_bytes\n    return hops * alpha + (size_bytes / beta)",
    },
  },
  {
    topicId: "38",
    title: "Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce)",
    domain: "Domain 10: Distributed Training, Parallelism & Compiler Planning",
    partA_dsaCoding: [
      {
        title: "Circular Array Loop",
        url: "https://leetcode.com/problems/circular-array-loop/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Rotating the Box",
        url: "https://leetcode.com/problems/rotating-the-box/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "NCCL Collective Operations Guide",
        url: "https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html",
        rationale: "Core algorithmic primitive",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Ring-AllReduce Bandwidth: Prove that the data transferred per node in Ring-AllReduce is $2 \\frac{P-1}{P} S$, approaching $2S$ as $P \to \\infty$.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Tree vs Ring: Derive the mathematical threshold of message size $S$ where Tree-AllReduce (lower latency) outperforms Ring-AllReduce (higher bandwidth).",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Show why a naive central parameter server model bottlenecks at $O(P \\cdot S)$ bandwidth for the master node.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "NCCL Collectives: Explain how NCCL dynamically segments giant gradient tensors to pipeline transfers through the ring.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Describe how PyTorch DDP overlaps gradient computation with Ring-AllReduce communication via backward hooks.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "What is the role of InfiniBand SHARP (Scalable Hierarchical Aggregation and Reduction Protocol) in offloading collectives to switch hardware?",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Precision Loss: How does the order of summation in Ring-AllReduce affect final float parity across different nodes?",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Node Failures: Simulating ring collapse and timeout when rank 5 crashes midway through the scatter-reduce phase.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario: "Network contention causing uneven chunk arrival times and idle blocking.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-38-RING-ALLREDUCE",
      title: "Ring-AllReduce Simulation",
      referenceUrl: "https://docs.nvidia.com/deeplearning/nccl/",
      prompt:
        "Simulate the complete Ring-AllReduce algorithm on $P$ worker ranks, each starting with an array of $P$ numbers. Perform $P-1$ steps of Scatter-Reduce followed by $P-1$ steps of All-Gather along a logical ring. Return the synchronized array on each rank (where each element contains the exact sum across all ranks).",
      inputSchema: "`ranks_data: list[list[float]]` (shape $P \\times P$)",
      outputSchema: "`synchronized_data: list[list[float]]` (shape $P \\times P$)",
      constraints: ["Number of ranks $P \\ge 2$. Array size on each rank equals $P$."],
      tolerances: "Absolute error < 1e-5.",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "def ring_allreduce_simulation(node_buffers: list[list[float]]) -> list[list[list[float]]]:\n    initial_state = node_buffers\n    P = len(node_buffers)\n    import copy\n    state = copy.deepcopy(initial_state)\n    trace = []\n    \n    # Phase 1: Scatter-Reduce (P-1 steps)\n    for step in range(P - 1):\n        next_state = copy.deepcopy(state)\n        for n in range(P):\n            send_to = (n + 1) % P\n            chunk_idx = (n - step) % P\n            next_state[send_to][chunk_idx] += state[n][chunk_idx]\n        state = next_state\n        trace.append(copy.deepcopy(state))\n        \n    # Phase 2: All-Gather (P-1 steps)\n    for step in range(P - 1):\n        next_state = copy.deepcopy(state)\n        for n in range(P):\n            send_to = (n + 1) % P\n            chunk_idx = (n + 1 - step) % P\n            next_state[send_to][chunk_idx] = state[n][chunk_idx]\n        state = next_state\n        trace.append(copy.deepcopy(state))\n        \n    return trace",
    },
  },
  {
    topicId: "39",
    title: "Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP)",
    domain: "Domain 10: Distributed Training, Parallelism & Compiler Planning",
    partA_dsaCoding: [
      {
        title: "Partition Labels",
        url: "https://leetcode.com/problems/partition-labels/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Split Array Largest Sum",
        url: "https://leetcode.com/problems/split-array-largest-sum/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "ZeRO: Memory Optimizations Toward Training Trillion Parameter Models",
        url: "https://arxiv.org/abs/1910.02054",
        rationale: "Rajbhandari et al., SC 2020",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "ZeRO Memory States: Derive the exact per-GPU memory footprint reduction for Optimizer States, Gradients, and Parameters for a $\\Psi$ parameter model on $P$ GPUs.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Communication Overhead: Prove that ZeRO-3 increases total communication volume by $1.5\times$ compared to standard Data Parallelism.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Show mathematically how ZeRO-Offload computes gradient updates on the CPU while preventing PCIe bandwidth from bottlenecking the training step.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "Prefetching: How does PyTorch FSDP schedule `AllGather` operations for layer $L+1$ while layer $L$ is computing?",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Compare Megatron Tensor Parallelism (TP) vs ZeRO-3. When is TP strictly required over ZeRO-3 due to communication boundaries?",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Discuss the difficulties of serving LLM inference directly from ZeRO-3 sharded weights.",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Unbalanced Shards: What happens when parameter count is highly prime and shards mismatch in size, causing collective hangs?",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "OOM during AllGather: Stress test where rebuilding the full layer parameter exceeds the remaining active VRAM.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Gradient synchronization bugs where sharded optimizers apply inconsistent weight decay.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-39-ZERO3-SHARDING",
      title: "ZeRO-3 Parameter Sharding & Reconstruction",
      referenceUrl: "https://deepspeed.readthedocs.io/en/stable/zero3.html",
      prompt:
        "Given a flattened model parameter vector $W$ of length $N$ and cluster world size $P$, partition $W$ into $P$ disjoint rank shards with zero padding. Implement `shard(W, rank)` and `allgather_reconstruct(shards)` returning the restored original parameter tensor.",
      inputSchema: "`weights: list[float], world_size: int`",
      outputSchema: "`shards: list[list[float]]`",
      constraints: ["$N \\le 10^5$, $P \\le 64$."],
      tolerances: "Exact float equality.",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "def zero3_parameter_shard_and_allgather(param_weights: list[float], world_size: int, rank: int) -> tuple[list[float], list[float]]:\n    N = len(param_weights)\n    chunk_size = (N + world_size - 1) // world_size\n    padded_len = chunk_size * world_size\n    \n    padded_weights = param_weights + [0.0] * (padded_len - N)\n    \n    start = rank * chunk_size\n    end = start + chunk_size\n    shard = padded_weights[start:end]\n    \n    # Allgather simulate\n    reconstructed = []\n    for r in range(world_size):\n        r_start = r * chunk_size\n        r_end = r_start + chunk_size\n        reconstructed.extend(padded_weights[r_start:r_end])\n        \n    return shard, reconstructed[:N]",
    },
  },
  {
    topicId: "40",
    title: "Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton)",
    domain: "Domain 10: Distributed Training, Parallelism & Compiler Planning",
    partA_dsaCoding: [
      {
        title: "Meeting Rooms II",
        url: "https://leetcode.com/problems/meeting-rooms-ii/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Non-overlapping Intervals",
        url: "https://leetcode.com/problems/non-overlapping-intervals/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "TVM: An End-to-End Compiler Stack for Deep Learning",
        url: "https://arxiv.org/abs/1802.04799",
        rationale: "Chen et al., OSDI 2018",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Peak Memory Bounds: Prove the worst-case peak memory complexity for a sequential vs a branching neural network graph.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Operator Fusion FLOPs: Derive the HBM read/write volume saved by fusing `Linear -> Gelu -> Dropout` into a single Triton kernel.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Show how Common Subexpression Elimination (CSE) alters the topological sort constraints of an autograd DAG.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "PyTorch Inductor: Explain how `torch.compile` traces the graph and offloads subgraph compilation to OpenAI Triton.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "Contrast static shape ahead-of-time (AOT) compilation in XLA/TPUs vs dynamic shape JIT compilation.",
      },
      {
        title: "Systems Engineering",
        prompt:
          "How do compilers handle horizontal fusion (batching multiple independent matrix multiplications into a single Batched GEMM)?",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Fragmentation: Arena memory fragmentation when dynamic shapes continuously request varying block sizes.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Autograd Liveness: Why do tensors required for the backward pass destroy memory reuse opportunities in the forward pass arena?",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Compilation Timeouts: Graph tracing loops blowing up to exponential complexity on massive MoE architectures.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-40-IR-FUSION-LIVENESS",
      title: "Compiler Tensor Liveness Arena Planner",
      referenceUrl: "https://tvm.apache.org/",
      prompt:
        "Given a dictionary of tensor intermediate lifespans mapping tensor name to `(birth_step, death_step, size_bytes)`, compute the maximum peak memory required in an arena allocator by finding the maximum concurrent memory overlap at any execution step.",
      inputSchema:
        "`liveness: dict[str, tuple[int, int, int]]` (tensor_name -> (start, end, bytes))",
      outputSchema: "`peak_memory_bytes: int`",
      constraints: ["$1 \\le \\text{lifespans} \\le 10^4$. Execution steps $0 \\le t \\le 10^5$."],
      tolerances: "Exact integer byte match.",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "def greedy_buffer_liveness_allocator(intervals: dict[str, tuple[int, int, int]]) -> int:\n    liveness = intervals\n    events = []\n    for tensor_name, (start, end, size) in liveness.items():\n        events.append((start, size))    # Allocation event\n        events.append((end, -size))    # Free event\n        \n    # Sort events by timestep. If equal, free before allocate\n    events.sort(key=lambda x: (x[0], x[1]))\n    \n    current_mem = 0\n    peak_mem = 0\n    \n    for _, delta in events:\n        current_mem += delta\n        if current_mem > peak_mem:\n            peak_mem = current_mem\n            \n    return peak_mem",
    },
  },
  {
    topicId: "41",
    title: "3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing",
    domain: "Domain 10: Distributed Training, Parallelism & Compiler Planning",
    partA_dsaCoding: [
      {
        title: "Top K Frequent Words",
        url: "https://leetcode.com/problems/top-k-frequent-words/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Capacity To Ship Packages Within D Days",
        url: "https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/",
        rationale: "Core algorithmic primitive",
      },
      {
        title: "Megatron-LM",
        url: "https://arxiv.org/abs/1909.08053",
        rationale: "Core algorithmic primitive",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Proof",
        prompt:
          "Bubble Ratio: Derive the pipeline bubble fraction $F = (P - 1) / (M + P - 1)$ for the 1F1B schedule.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "MoE FLOPs vs Memory: Prove that an $N$-expert MoE increases memory by $O(N)$ but keeps inference FLOPs constant relative to a dense model.",
      },
      {
        title: "Mathematical Proof",
        prompt:
          "Dropped Tokens: Formulate the probability of token dropping given a Poisson distribution of token expert preferences and strict capacity $C$.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Systems Engineering",
        prompt:
          "3D Parallelism: How are Data Parallelism (DP), Tensor Parallelism (TP), and Pipeline Parallelism (PP) mapped onto a cluster of 1024 GPUs across 128 nodes?",
      },
      {
        title: "Systems Engineering",
        prompt:
          'DeepSeek MoE: Explain the concept of "auxiliary-loss-free" load balancing via expert bias updates.',
      },
      {
        title: "Systems Engineering",
        prompt:
          "Discuss the communication bottlenecks when expert capacity routing requires an All-to-All collective across the InfiniBand network.",
      },
    ],
    partD_stressTests: [
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Pipeline Stalls: Deadlocks when microbatch gradients are synchronized out-of-order in PP schedules.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Expert Collapse: Stress testing MoE where all tokens route to Expert 0, maximizing the dropped token penalty.",
        failureMode: "Requires specific handling",
      },
      {
        title: "Edge Case & Stress Test",
        scenario:
          "Memory spikes during All-to-All token dispatch exceeding the pre-allocated communication buffers.",
        failureMode: "Requires specific handling",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-41-MOE-1F1B",
      title: "1F1B Pipeline Schedule Bubble Accounting & MoE Routing",
      referenceUrl: "https://arxiv.org/abs/2101.03961",
      prompt:
        "Implement two functions: (1) `calculate_1f1b_bubble_ratio(num_stages, num_microbatches)` computing the pipeline bubble fraction $F = (P - 1) / (M + P - 1)$, and (2) `moe_token_dispatch(gate_logits, num_experts, capacity)` assigning tokens to top-1 expert while enforcing maximum expert capacity (overflow tokens assigned to -1).",
      inputSchema:
        "`num_stages: int, num_microbatches: int` for bubble, `gate_logits: list[list[float]], num_experts: int, capacity: int` for MoE.",
      outputSchema: "Float bubble ratio for (1), List of assigned expert IDs for (2).",
      constraints: ["$P \\ge 1$, $M \\ge P$."],
      tolerances: "Absolute error < 1e-6.",
      workedExamples: ["Provided in tests"],
      pythonCode:
        "def calculate_1f1b_bubble_ratio(num_stages: int, num_microbatches: int) -> float:\n    P = num_stages\n    M = num_microbatches\n    if M + P - 1 == 0:\n        return 0.0\n    return float(P - 1) / float(M + P - 1)\n\ndef moe_topk_routing_with_capacity(\n    gate_logits: list[list[float]], \n    top_k: int, \n    capacity_limit: int\n) -> list[list[int]]:\n    num_experts = len(gate_logits[0]) if gate_logits else 0\n    expert_counts = {e: 0 for e in range(num_experts)}\n    assignments = []\n    \n    for token_logits in gate_logits:\n        indexed_logits = list(enumerate(token_logits))\n        indexed_logits.sort(key=lambda x: x[1], reverse=True)\n        top_experts = [idx for idx, _ in indexed_logits[:top_k]]\n        \n        token_assignments = []\n        for expert in top_experts:\n            if expert_counts[expert] < capacity_limit:\n                expert_counts[expert] += 1\n                token_assignments.append(expert)\n            else:\n                token_assignments.append(-1)\n        assignments.append(token_assignments)\n            \n    return assignments",
    },
  },
];
