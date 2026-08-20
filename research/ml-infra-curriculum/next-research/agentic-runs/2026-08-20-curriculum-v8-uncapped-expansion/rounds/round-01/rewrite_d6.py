import re

with open('/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-08-20-curriculum-v8-uncapped-expansion/rounds/round-01/domain-06-tokenization-and-retrieval.md', 'r') as f:
    content = f.read()

def replacer(match):
    topic_num = match.group(1)
    
    if topic_num == '24':
        bank = r"""### 5. Comprehensive Problem & Question Bank

**Part A: Foundational DSA & Coding Problems**
- [Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/): Basic node insertion, search, and prefix matching.
- [Design Add and Search Words Data Structure](https://leetcode.com/problems/design-add-and-search-words-data-structure/): Wildcard pattern traversal across trie branches.
- [Word Search II](https://leetcode.com/problems/word-search-ii/): Optimized matrix search using Trie.
- [Wikipedia: Aho-Corasick algorithm](https://en.wikipedia.org/wiki/Aho%E2%80%93Corasick_algorithm): Building failure transitions for O(N + M) simultaneous dictionary matching.

**Part B: Mathematical Proofs & Analytical Derivations**
- **Aho-Corasick Complexity**: Prove that constructing the failure links in an Aho-Corasick automaton takes linear time with respect to the sum of lengths of all patterns.
- **Trie Memory Bounds**: Derive the upper and lower bounds for the memory footprint of a Trie holding $N$ strings of length $L$ over an alphabet of size $K$.
- **Double-Array Trie Formulation**: Explain mathematically how a Double-Array Trie (Darts) compresses the node transitions into two parallel arrays (base and check).

**Part C: Real-World ML Systems & Engineering Questions**
- **Tokenizer Engines**: How does the Rust implementation of HuggingFace Tokenizers utilize Trie-based matching for its pre-tokenization phase to achieve GB/s throughput?
- **Failure Link Caching**: In a high-concurrency text processing pipeline, explain the hardware cache-miss implications of traversing Aho-Corasick failure links versus contiguous arrays.

**Part D: Edge Cases, Numerical Stability & Stress Tests**
- **Aho-Corasick Failure Cycle Prevention**: Construct a degenerate dictionary that maximizes the number of failure link traversals required for a single character input.
- **Sparse Node Memory Fragmentation**: Demonstrate how naively allocating Trie nodes as separate Python objects causes severe heap fragmentation and garbage collection pauses.
"""
    elif topic_num == '25':
        bank = r"""### 5. Comprehensive Problem & Question Bank

**Part A: Foundational DSA & Coding Problems**
- [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/): Priority queue frequency sorting.
- [Encode and Decode Strings](https://leetcode.com/problems/encode-and-decode-strings/): String chunk serialization without ambiguity.
- [Number of Matching Subsequences](https://leetcode.com/problems/number-of-matching-subsequences/): Subsequence tracking.
- [Neural Machine Translation of Rare Words with Subword Units](https://aclanthology.org/P16-1162/) (Sennrich et al., 2016): Iterative statistical pair merging.

**Part B: Mathematical Proofs & Analytical Derivations**
- **BPE Entropy Reduction**: Prove that iteratively applying the BPE merge step strictly decreases or maintains the length of the encoded sequence, compressing the token stream.
- **Vocabulary Size vs Sequence Length**: Formulate the mathematical tradeoff between increasing the vocabulary size $V$ and the resulting average token sequence length $L$.
- **Unigram Language Model Objective**: Derive the log-likelihood objective maximized by the Unigram tokenization algorithm (as used in SentencePiece) compared to the greedy BPE approach.

**Part C: Real-World ML Systems & Engineering Questions**
- **Byte Fallback in OpenAI tiktoken**: Analyze how tiktoken maps arbitrary byte sequences to tokens, preventing the "Out Of Vocabulary" (OOV) problem completely.
- **Regex Pre-tokenization**: Explain the specific regular expression used in GPT-4's tokenizer to prevent merging characters across specific categories (e.g., keeping punctuation separate from alphanumeric strings).

**Part D: Edge Cases, Numerical Stability & Stress Tests**
- **Adversarial Tokenization Breakage**: Construct a string that triggers a pathological worst-case $O(N^2)$ merge complexity in a naive BPE tokenizer implementation.
- **Emoji & Multi-byte Characters**: Trace how the Byte-level BPE handles a 4-byte UTF-8 emoji when the tokenizer has never seen the full character during training.
"""
    elif topic_num == '26':
        bank = r"""### 5. Comprehensive Problem & Question Bank

**Part A: Foundational DSA & Coding Problems**
- [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/): Max-heap bounded top-k selection.
- [K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/): Multidimensional distance calculation with bounded priority queue.
- [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/): Dynamic ordered statistics.
- [Wikipedia: K-d tree](https://en.wikipedia.org/wiki/K-d_tree): Recursive axis-aligned hyperplane splitting.

**Part B: Mathematical Proofs & Analytical Derivations**
- **K-D Tree Splitting Guarantees**: Prove that building a balanced K-D tree by always splitting at the median guarantees a maximum tree depth of $O(\log N)$.
- **Curse of Dimensionality**: Prove mathematically that as the number of dimensions $D \to \infty$, the ratio between the nearest and farthest neighbor distances approaches 1, rendering spatial partitioning ineffective.
- **Ball Tree Metric Space Requirements**: Explain the triangle inequality and derive why Ball Trees can prune metric spaces more effectively than K-D trees in higher dimensions (up to D=30).

**Part C: Real-World ML Systems & Engineering Questions**
- **K-D Tree Degradation in Embeddings**: Explain why standard K-D trees are never used for 1536-dimensional OpenAI embeddings, and quantify the dimension threshold where linear scan outperforms K-D tree traversal.
- **Geographic Queries**: Describe how PostGIS implements 2D spatial indexing for exact radius searches, and why R-Trees or K-D trees are preferred over grid hashing.

**Part D: Edge Cases, Numerical Stability & Stress Tests**
- **Collinear and Coplanar Points**: Stress test a K-D tree construction algorithm with 10,000 exact duplicate points and explain the necessary tie-breaking mechanisms to prevent infinite recursion.
- **Hypersphere Boundary Intersections**: Construct a query scenario in a 5D K-D tree where the nearest neighbor hypersphere intersects every single bounding box, forcing an $O(N)$ exhaustive search.
"""
    elif topic_num == '27':
        bank = r"""### 5. Comprehensive Problem & Question Bank

**Part A: Foundational DSA & Coding Problems**
- [Shortest Path in Binary Matrix](https://leetcode.com/problems/shortest-path-in-binary-matrix/): Greedy beam search and priority queue frontier expansion.
- [Clone Graph](https://leetcode.com/problems/clone-graph/): Navigating adjacency lists with visited sets.
- [Word Ladder II](https://leetcode.com/problems/word-ladder-ii/): Shortest path in dense state space graph.
- [HNSW Paper](https://arxiv.org/abs/1603.09320) (Malkov & Yashunin, 2016): Navigable Small World graphs.

**Part B: Mathematical Proofs & Analytical Derivations**
- **HNSW Small World Navigability Proof**: Prove the theoretical bound that greedy routing in a Kleinberg small-world network achieves $O(\log N)$ search steps.
- **IVF-PQ Quantization Error**: Formulate the mean squared error introduced by Product Quantization (PQ) when splitting a $D$-dimensional vector into $m$ sub-vectors encoded with $k$-centroids each.
- **LSH Collision Probability**: Derive the probability that two vectors with cosine similarity $\theta$ collide in a Random Projection Locality-Sensitive Hashing (LSH) scheme.

**Part C: Real-World ML Systems & Engineering Questions**
- **FAISS IVF-PQ Index Quantization Memory**: Calculate the exact memory footprint of 1 billion 768-dimensional float32 embeddings compressed using IVF1048576, PQ64.
- **HNSW Memory vs Latency Tradeoff**: In Pinecone's vector database, how does increasing the maximum graph degree $M$ and the beam search size $efConstruction$ alter the indexing time and the steady-state RAM requirement?

**Part D: Edge Cases, Numerical Stability & Stress Tests**
- **HNSW Disconnected Components**: Construct a pathological insertion sequence in an HNSW graph that creates isolated components, preventing the greedy search from ever reaching the global nearest neighbor.
- **Hubness Problem in High Dimensions**: Demonstrate how the "hubness" phenomenon in high-dimensional vector spaces causes certain nodes in an HNSW graph to exceed their maximum degree $M$, and how the edge-selection heuristic mitigates this.
"""

    return f"## Topic {topic_num}:{match.group(2)}\n{bank}\n### 6. Executable Problem Contract"

pattern = r"## Topic (\d+):(.*?)### 5\. Pedagogical Ascent & Mental Model.*?### 6\. Executable Problem Contract"
new_content = re.sub(pattern, replacer, content, flags=re.DOTALL)

with open('/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-08-20-curriculum-v8-uncapped-expansion/rounds/round-01/domain-06-tokenization-and-retrieval.md', 'w') as f:
    f.write(new_content)

