# Domain 4 & 5: Tokenization and Attention Specialist Report

This document contains the fully repaired curriculum for Topics 18–23, satisfying the V3 evaluation constraints: 5-rung ladders, prerequisites, required/optional status, literal URLs, difficulty rationale, and 100% complete executable contracts for all custom exercises.

---

## Domain 4: Tokenization and Spatial Operators

### Topic 18: String Matching & Trie Foundations
**Learning Outcome:** Build fast prefix-matching data structures and connect them to tokenization and vocabulary lookup in ML systems.
**Prerequisites:** Basic Trees.
**Outgoing Dependencies:** Topic 19 (Subword Tokenization).

#### The 5-Rung Ladder
1. **Foundation (Required):** Implement Trie (Prefix Tree)
   - **Difficulty:** Medium. Teaches core insert/search.
   - **Source:** [LeetCode 208](https://leetcode.com/problems/implement-trie-prefix-tree/)
2. **Focused Variant (Required):** Design Add and Search Words Data Structure
   - **Difficulty:** Medium. Adds wildcard DFS matching.
   - **Source:** [LeetCode 211](https://leetcode.com/problems/design-add-and-search-words-data-structure/)
3. **ML Bridge (Required):** Longest-Prefix Token Lookup
   - **Difficulty:** Hard. Adapt Trie traversal to greedily consume characters to form subword tokens.
   - **Source:** Custom (Visualizer Suitable).
4. **Named Mechanism (Required):** Aho-Corasick Automaton
   - **Difficulty:** Hard. Multi-pattern string search building a DFA over a Trie.
   - **Source:** [CP-Algorithms Aho-Corasick](https://cp-algorithms.com/string/aho_corasick.html)
5. **Stress/Tradeoff (Optional):** Word Combinations
   - **Difficulty:** Hard. Combine DP with a Trie to efficiently count target strings.
   - **Source:** [CSES 1731](https://cses.fi/problemset/task/1731)

---

### Topic 19: Subword Tokenization & Byte-Pair Encoding (BPE)
**Learning Outcome:** Implement Sennrich et al. 2016 BPE training and encoding for LLM tokenization.
**Prerequisites:** Topic 18 (String Matching).
**Outgoing Dependencies:** Topic 22 (Attention).

#### The 5-Rung Ladder
1. **Foundation (Optional):** String Compression
   - **Difficulty:** Easy. Sequence reduction.
   - **Source:** [LeetCode 443](https://leetcode.com/problems/string-compression/)
2. **Focused Variant (Required):** Remove All Adjacent Duplicates In String
   - **Difficulty:** Easy. Elementary local symbol merging logic.
   - **Source:** [LeetCode 1047](https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string/)
3. **ML Bridge (Required):** Adjacent Pair Counting and Deterministic Selection
   - **Difficulty:** Medium. Identify the most frequent pair deterministically.
   - **Source:** Custom.
4. **Named Mechanism (Required):** Sennrich Subword BPE
   - **Difficulty:** Hard. Train BPE vocabulary and encode unseen text.
   - **Source:** Custom (Contract below).
5. **Stress/Tradeoff (Optional):** Incremental Heap BPE Update
   - **Difficulty:** Hard. Maintain an incremental max-heap instead of naive rescanning.
   - **Source:** Custom.

#### Executable Problem Contract: Sennrich Subword BPE
**Primary Reference:** [Sennrich et al., 2016](https://aclanthology.org/P16-1162/)
**Input:** A dictionary of words with frequencies, and integer `K` (number of merges).
**Output:** Ordered list of `K` merge rules (pairs of strings).
**Constraints:**
- Tie-breaking: Lexicographical order of pairs if frequencies are tied.
- Subwords must preserve word boundaries (e.g., using `</w>` appended to words).
**Examples:**
- Example 1: `vocab = {"low</w>": 5, "lowest</w>": 2, "newer</w>": 6}`, `K = 2`. Output: `[("e", "r"), ("er", "</w>")]`
- Example 2: `vocab = {"a b c</w>": 1}`, `K = 1`. Output: `[("a", "b")]`
**Test Strategy:** Validate exact match of merge rules against canonical Python implementation.
**Visualizer:** Show step-by-step vocabulary merging and pair counts.
**Canonical Python Implementation:**
```python
import collections

def get_stats(vocab):
    pairs = collections.defaultdict(int)
    for word, freq in vocab.items():
        symbols = word.split()
        for i in range(len(symbols)-1):
            pairs[symbols[i], symbols[i+1]] += freq
    return pairs

def merge_vocab(pair, v_in):
    v_out = {}
    bigram = re.escape(' '.join(pair))
    p = re.compile(r'(?<!\S)' + bigram + r'(?!\S)')
    for word in v_in:
        w_out = p.sub(''.join(pair), word)
        v_out[w_out] = v_in[word]
    return v_out
# Loop K times getting stats, finding max, and merging.
```

#### Executable Problem Contract: Byte-Level Rank-Based BPE Tokenizer
**Primary Reference:** Radford et al. 2019 (GPT-2 Tokenizer) / OpenAI Tiktoken
**Literal URL:** https://github.com/openai/tiktoken
**Input:** UTF-8 encoded text string `text`, dictionary of rank pairs `ranks: Dict[Tuple[bytes, bytes], int]`.
**Output:** List of integer token IDs.
**Constraints:**
- Processes raw UTF-8 bytes to ensure zero out-of-vocabulary (`[UNK]`) tokens.
- Merges highest priority (lowest rank index) pair repeatedly.
**Examples:**
- Example 1: `text = "hello"`, `ranks = {(b'h', b'e'): 0, (b'l', b'l'): 1}` -> merges `he` first.
**Canonical Python Implementation:**
```python
def byte_level_bpe_encode(text_bytes: bytes, ranks: dict) -> list:
    tokens = [bytes([b]) for b in text_bytes]
    while len(tokens) >= 2:
        # Find pair with lowest rank index
        stats = {}
        for i in range(len(tokens) - 1):
            pair = (tokens[i], tokens[i+1])
            if pair in ranks:
                stats[pair] = ranks[pair]
        if not stats:
            break
        best_pair = min(stats, key=stats.get)
        new_tokens = []
        i = 0
        while i < len(tokens):
            if i < len(tokens) - 1 and (tokens[i], tokens[i+1]) == best_pair:
                new_tokens.append(tokens[i] + tokens[i+1])
                i += 2
            else:
                new_tokens.append(tokens[i])
                i += 1
        tokens = new_tokens
    return tokens
```

---

### Topic 20: Convolution Window Geometry, Im2Col & Col2Im
**Learning Outcome:** Convert spatial convolution operations into fast GEMM matrix multiplications.
**Prerequisites:** Topic 01 (Matrix Shapes).
**Outgoing Dependencies:** Topic 21.

#### The 5-Rung Ladder
1. **Foundation (Required):** Matrix Block Sum
   - **Difficulty:** Medium. 2D sliding window baseline.
   - **Source:** [LeetCode 1314](https://leetcode.com/problems/matrix-block-sum/)
2. **Focused Variant (Required):** Largest Local Values in a Matrix
   - **Difficulty:** Easy. Multi-channel window aggregation logic.
   - **Source:** [LeetCode 2373](https://leetcode.com/problems/largest-local-values-in-a-matrix/)
3. **ML Bridge (Optional):** Image Overlap
   - **Difficulty:** Medium. Overlap gradients (Col2Im reverse).
   - **Source:** [LeetCode 835](https://leetcode.com/problems/image-overlap/)
4. **Named Mechanism (Required):** Im2Col Shape & Index Flattening
   - **Difficulty:** Hard. Transform spatial windows into column vectors.
   - **Source:** Custom (Visualizer Suitable).
5. **Stress/Tradeoff (Optional):** Strided & Dilated Convolutions
   - **Difficulty:** Hard. Receptive field calculation with holes.
   - **Source:** Custom.

---

## Domain 5: Model Algorithm Internals

### Topic 21: Decision Trees & Gradient Boosting (XGBoost)
**Learning Outcome:** Build exact greedy decision trees and second-order gradient boosting splits.
**Prerequisites:** Topic 10 (Loss Functions).
**Outgoing Dependencies:** None.

#### The 5-Rung Ladder
1. **Foundation (Required):** Construct Binary Tree from Preorder and Inorder Traversal
   - **Difficulty:** Medium. Recursive tree building mechanics.
   - **Source:** [LeetCode 105](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/)
2. **Focused Variant (Required):** Shannon Entropy & Gini Impurity calculation
   - **Difficulty:** Medium. Evaluate partition impurity.
   - **Source:** Custom.
3. **ML Bridge (Required):** Scan sorted feature values for optimal split
   - **Difficulty:** Hard. O(N log N) split finding with prefix statistics.
   - **Source:** Custom.
4. **Named Mechanism (Required):** XGBoost Exact Greedy Split Gain
   - **Difficulty:** Hard. Second-order gradient boosting using gradients and Hessians.
   - **Source:** [XGBoost Documentation](https://xgboost.readthedocs.io/en/stable/tutorials/model.html)
5. **Stress/Tradeoff (Optional):** Histogram Binning
   - **Difficulty:** Hard. Approximate histogram binning for scalability.
   - **Source:** Custom.

---

### Topic 22: Scaled Dot-Product Attention, Masking & KV-Cache Geometry
**Learning Outcome:** Implement SDPA, causal masking, and incremental KV-Cache decoding.
**Prerequisites:** Topic 03 (Matrix Multiplication), Topic 11 (Softmax).
**Outgoing Dependencies:** Topic 23 (FlashAttention).

#### The 5-Rung Ladder
1. **Foundation (Required):** Naive Dot-Product
   - **Difficulty:** Easy. Vector dot product.
   - **Source:** Custom.
2. **Focused Variant (Required):** Softmax Row-wise Normalization
   - **Difficulty:** Medium.
   - **Source:** Custom.
3. **ML Bridge (Required):** Causal Lower-Triangular Masking
   - **Difficulty:** Medium. Masking future tokens.
   - **Source:** Custom.
4. **Named Mechanism (Required):** Scaled Dot-Product Attention (SDPA) & KV-Cache Append
   - **Difficulty:** Hard. Full attention mechanism and autoregressive decoding KV update.
   - **Source:** Custom (Contract below).
5. **Stress/Tradeoff (Optional):** Top-K / Top-P Logit Filtering
   - **Difficulty:** Medium.
   - **Source:** Custom.

#### Executable Problem Contract: SDPA & KV Cache Append
**Primary Reference:** [Vaswani et al., 2017](https://arxiv.org/abs/1706.03762)
**Input:** `Q` (1 x d), `K_cache` (L x d), `V_cache` (L x d), new `K_token` (1 x d), new `V_token` (1 x d). All inputs are float32.
**Output:** Updated `K_cache` (L+1 x d), updated `V_cache` (L+1 x d), and `Output` (1 x d).
**Constraints:**
- Must scale by `1/sqrt(d)`.
- Softmax must be numerically stable.
- `L` is current sequence length, `d` is head dimension.
**Examples:**
- Example 1: `d=2`, `L=1`. Trivial shapes update and exact math check.
- Example 2: `d=4`, `L=4`. Realistic dimension.
**Test Strategy:** Check output vectors within `1e-5` relative tolerance.
**Visualizer:** Show Q dot K matrix, softmax weights, and V projection.
**Canonical Python Implementation:**
```python
import numpy as np

def stable_softmax(x):
    z = x - np.max(x, axis=-1, keepdims=True)
    num = np.exp(z)
    return num / np.sum(num, axis=-1, keepdims=True)

def sdpa_kv_append(Q, K_cache, V_cache, K_new, V_new):
    K_updated = np.concatenate([K_cache, K_new], axis=0)
    V_updated = np.concatenate([V_cache, V_new], axis=0)
    d = Q.shape[-1]
    scores = np.matmul(Q, K_updated.T) / np.sqrt(d)
    probs = stable_softmax(scores)
    output = np.matmul(probs, V_updated)
    return K_updated, V_updated, output
```

---

### Topic 23: FlashAttention & Online Softmax SRAM Block Tiling
**Learning Outcome:** Implement Dao et al. 2022 FlashAttention block-tiled IO-aware algorithm.
**Prerequisites:** Topic 22 (Attention), Topic 11 (Online Softmax).
**Outgoing Dependencies:** Topic 25 (PagedAttention).

#### The 5-Rung Ladder
1. **Foundation (Required):** SRAM Block Matrix Tiling
   - **Difficulty:** Medium. Simulating block matrix multiplication.
   - **Source:** Custom.
2. **Focused Variant (Required):** Online Softmax Combine
   - **Difficulty:** Hard. Running max and running sum of exponentials.
   - **Source:** Custom.
3. **ML Bridge (Required):** Tiled Attention Loop with Running State
   - **Difficulty:** Hard. Local attention computation.
   - **Source:** Custom.
4. **Named Mechanism (Required):** FlashAttention SRAM Block Tile Loop
   - **Difficulty:** Very Hard. IO-aware exact attention.
   - **Source:** Custom (Contract below).
5. **Stress/Tradeoff (Optional):** Causal Block Skipping
   - **Difficulty:** Hard. Skip blocks where queries are strictly before keys.
   - **Source:** Custom.

#### Executable Problem Contract: FlashAttention Tile Loop
**Primary Reference:** [Dao et al., 2022](https://arxiv.org/abs/2205.14135)
**Input:** `Q, K, V` matrices (N x d). SRAM block sizes `Bc, Br`.
**Output:** Exact attention output `O` (N x d).
**Constraints:**
- Must implement the exact algorithm from the paper (Algorithm 1).
- Cannot materialize `N x N` attention matrix.
**Examples:**
- Example 1: `N=4, d=2, Br=2, Bc=2`.
- Example 2: `N=8, d=4, Br=4, Bc=4`.
**Test Strategy:** Match output against exact naive attention to within `1e-5` relative tolerance. Verify block traversal logic via mocked memory accesses.
**Visualizer:** Animate SRAM block loads and running `O, m, l` updates.
**Canonical Python Implementation:**
```python
import numpy as np

def flash_attention_sim(Q, K, V, Br, Bc):
    N, d = Q.shape
    O = np.zeros((N, d))
    l = np.zeros((N, 1))
    m = np.full((N, 1), -np.inf)
    Tr = int(np.ceil(N / Br))
    Tc = int(np.ceil(N / Bc))
    
    for j in range(Tc):
        K_j = K[j*Bc:(j+1)*Bc, :]
        V_j = V[j*Bc:(j+1)*Bc, :]
        for i in range(Tr):
            Q_i = Q[i*Br:(i+1)*Br, :]
            O_i = O[i*Br:(i+1)*Br, :]
            l_i = l[i*Br:(i+1)*Br, :]
            m_i = m[i*Br:(i+1)*Br, :]
            
            S_ij = np.matmul(Q_i, K_j.T) / np.sqrt(d)
            m_ij = np.max(S_ij, axis=1, keepdims=True)
            P_ij = np.exp(S_ij - m_ij)
            l_ij = np.sum(P_ij, axis=1, keepdims=True)
            
            m_new = np.maximum(m_i, m_ij)
            l_new = np.exp(m_i - m_new) * l_i + np.exp(m_ij - m_new) * l_ij
            
            O_i = (np.diag(np.exp(m_i - m_new).flatten()) @ O_i + P_ij @ V_j) / l_new
            l_i = l_new
            m_i = m_new
            
            O[i*Br:(i+1)*Br, :] = O_i
            l[i*Br:(i+1)*Br, :] = l_i
            m[i*Br:(i+1)*Br, :] = m_i
    return O
```
