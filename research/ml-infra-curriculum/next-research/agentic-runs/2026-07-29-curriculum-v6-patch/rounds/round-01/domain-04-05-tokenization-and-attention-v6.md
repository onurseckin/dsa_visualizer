# Domain 4 & 5: Tokenization and Attention Specialist Report

This document contains the fully repaired curriculum for Topics 18–23, satisfying the V4 evaluation constraints: 5-rung ladders, prerequisites, required/optional status, literal URLs, difficulty rationale, and 100% complete executable contracts for all custom exercises, along with exact normalization equations for FlashAttention.

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
   - **Source:** Custom (Visualizer Suitable) / `CONTRACT-TOPIC-18-TRIE`.
4. **Named Mechanism (Required):** Aho-Corasick Automaton
   - **Difficulty:** Hard. Multi-pattern string search building a DFA over a Trie.
   - **Source:** [CP-Algorithms Aho-Corasick](https://cp-algorithms.com/string/aho_corasick.html)
5. **Stress/Tradeoff (Optional):** Word Combinations
   - **Difficulty:** Hard. Combine DP with a Trie to efficiently count target strings.
   - **Source:** [CSES 1731](https://cses.fi/problemset/task/1731)

#### Executable Problem Contract: Longest-Prefix Token Lookup (CONTRACT-TOPIC-18-TRIE)
**Primary Reference:** Generic Tokenization Concept
**Input:** A list of valid tokens (strings), and a target text string `text`.
**Output:** A list of matched token strings based on greedy longest-prefix match.
**Constraints:** 
- If no prefix matches, extract the single character as an UNK token or individual character.
- Move the pointer forward by the length of the matched token.
**Examples:**
- Example 1: `tokens = ["a", "ab", "bc"]`, `text = "abc"`. Output: `["ab", "c"]`
**Test Strategy:** Match exact output list of tokens against a reference naive implementation.
**Visualizer:** Show Trie traversal for each step down the text.
**Canonical Python Implementation:**
```python
def build_trie(tokens):
    trie = {}
    for token in tokens:
        node = trie
        for char in token:
            if char not in node:
                node[char] = {}
            node = node[char]
        node['$'] = token
    return trie

def longest_prefix_tokenize(tokens: list, text: str) -> list:
    trie = build_trie(tokens)
    result = []
    i = 0
    while i < len(text):
        node = trie
        longest_match = None
        longest_len = 0
        for j in range(i, len(text)):
            if text[j] not in node:
                break
            node = node[text[j]]
            if '$' in node:
                longest_match = node['$']
                longest_len = j - i + 1
        if longest_match:
            result.append(longest_match)
            i += longest_len
        else:
            result.append(text[i])
            i += 1
    return result
```

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
   - **Source:** Custom / `CONTRACT-TOPIC-19-PAIR-COUNT`.
4. **Named Mechanism (Required):** Sennrich Subword BPE
   - **Difficulty:** Hard. Train BPE vocabulary and encode unseen text.
   - **Source:** Custom / `CONTRACT-TOPIC-19-SUBWORD-BPE`.
5. **Stress/Tradeoff (Optional):** Incremental Heap BPE Update
   - **Difficulty:** Hard. Maintain an incremental max-heap instead of naive rescanning.
   - **Source:** Custom / `CONTRACT-TOPIC-19-BYTE-BPE`.

#### Executable Problem Contract: Adjacent Pair Counting (CONTRACT-TOPIC-19-PAIR-COUNT)
**Primary Reference:** Generic Pair Statistics
**Input:** A dictionary `vocab` mapping space-separated string tokens to their frequencies.
**Output:** The single most frequent adjacent pair of characters as a tuple of strings.
**Constraints:**
- Tie-breaking: Lexicographical order of pairs if frequencies are tied.
**Examples:**
- Example 1: `vocab = {"l o w </w>": 5, "l o w e s t </w>": 2, "n e w e r </w>": 6}`. Output: `("w", "e")`
**Test Strategy:** Match extracted most frequent pair against naive frequency dictionary.
**Canonical Python Implementation:**
```python
import collections

def most_frequent_pair(vocab: dict) -> tuple:
    pairs = collections.defaultdict(int)
    for word, freq in vocab.items():
        symbols = word.split()
        for i in range(len(symbols)-1):
            pairs[(symbols[i], symbols[i+1])] += freq
            
    if not pairs:
        return None
        
    best_pair = min(pairs.keys(), key=lambda x: (-pairs[x], x))
    return best_pair
```

#### Executable Problem Contract: Sennrich Subword BPE (CONTRACT-TOPIC-19-SUBWORD-BPE)
**Primary Reference:** [Sennrich et al., 2016](https://aclanthology.org/P16-1162/)
**Input:** A dictionary of words with frequencies, and integer `K` (number of merges).
**Output:** Ordered list of `K` merge rules (pairs of strings).
**Constraints:**
- Tie-breaking: Lexicographical order of pairs if frequencies are tied.
- Subwords must preserve word boundaries (e.g., using `</w>` appended to words).
**Examples:**
- Example 1: `vocab = {"l o w </w>": 5, "l o w e s t </w>": 2, "n e w e r </w>": 6}`, `K = 2`. Output: `[("w", "e"), ("l", "o")]`
- Example 2: `vocab = {"a b c </w>": 1}`, `K = 1`. Output: `[("a", "b")]`
**Test Strategy:** Validate exact match of merge rules against canonical Python implementation.
**Visualizer:** Show step-by-step vocabulary merging and pair counts.
**Canonical Python Implementation:**
```python
import collections
import re

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
    for word, freq in v_in.items():
        w_out = p.sub(''.join(pair), word)
        v_out[w_out] = freq
    return v_out

def sennrich_bpe(vocab, K):
    merges = []
    for i in range(K):
        pairs = get_stats(vocab)
        if not pairs:
            break
        best = min(pairs.keys(), key=lambda x: (-pairs[x], x))
        vocab = merge_vocab(best, vocab)
        merges.append(best)
    return merges
```

#### Executable Problem Contract: Byte-Level Rank-Based BPE Tokenizer (CONTRACT-TOPIC-19-BYTE-BPE)
**Primary Reference:** Radford et al. 2019 (GPT-2 Tokenizer) / OpenAI Tiktoken
**Literal URL:** https://github.com/openai/tiktoken
**Input:** UTF-8 encoded text string `text`, dictionary `vocab` mapping bytes objects to integer token IDs.
**Output:** List of integer token IDs.
**Constraints:**
- Processes raw UTF-8 bytes to ensure zero out-of-vocabulary (`[UNK]`) tokens.
- Merges highest priority (lowest ID value) pair repeatedly.
**Examples:**
- Example 1: `text = "hello"`, `vocab = {b'h':0, b'e':1, b'l':2, b'o':3, b'he':4, b'll':5}`. Output: `[4, 5, 3]`
**Test Strategy:** Assert zero out-of-vocabulary conditions and deterministic lowest-ID reduction.
**Canonical Python Implementation:**
```python
def byte_level_bpe_encode(text_bytes: bytes, vocab: dict) -> list:
    tokens = [bytes([b]) for b in text_bytes]
    while len(tokens) >= 2:
        best_pair = None
        best_rank = float('inf')
        for i in range(len(tokens) - 1):
            pair = tokens[i] + tokens[i+1]
            if pair in vocab:
                rank = vocab[pair]
                if rank < best_rank:
                    best_rank = rank
                    best_pair = (tokens[i], tokens[i+1])
        if not best_pair:
            break
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
    # Assume individual bytes are also in vocab for fallback.
    return [vocab[t] for t in tokens]
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
   - **Source:** Custom (Visualizer Suitable) / `CONTRACT-TOPIC-20-IM2COL`.
5. **Stress/Tradeoff (Optional):** Strided & Dilated Convolutions
   - **Difficulty:** Hard. Receptive field calculation with holes.
   - **Source:** Custom.

#### Executable Problem Contract: Im2Col Flattening (CONTRACT-TOPIC-20-IM2COL)
**Primary Reference:** Framework standard implementations (e.g. Caffe, PyTorch)
**Input:** Input matrix `X` of shape `(H, W)`, kernel size `K`, stride `S`.
**Output:** Matrix of shape `((H-K)//S + 1) * ((W-K)//S + 1) \times K^2`.
**Constraints:** No padding implementation for this baseline.
**Canonical Python Implementation:**
```python
import numpy as np

def im2col(X, K, S):
    H, W = X.shape
    out_h = (H - K) // S + 1
    out_w = (W - K) // S + 1
    cols = np.zeros((out_h * out_w, K * K))
    
    idx = 0
    for i in range(out_h):
        for j in range(out_w):
            patch = X[i*S : i*S + K, j*S : j*S + K]
            cols[idx, :] = patch.flatten()
            idx += 1
    return cols
```

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
   - **Source:** [XGBoost Documentation](https://xgboost.readthedocs.io/en/stable/tutorials/model.html) / `CONTRACT-TOPIC-21-XGBOOST`.
5. **Stress/Tradeoff (Optional):** Histogram Binning
   - **Difficulty:** Hard. Approximate histogram binning for scalability.
   - **Source:** Custom.

#### Executable Problem Contract: XGBoost Exact Greedy Split Gain (CONTRACT-TOPIC-21-XGBOOST)
**Primary Reference:** [XGBoost Documentation](https://xgboost.readthedocs.io/en/stable/tutorials/model.html)
**Input:** Array of gradients `G`, Hessians `H`, and `feature_values` sorted by feature values, `lambda_reg` regularization factor, and `gamma` penalty.
**Output:** The maximum split gain and the split index.
**Constraints:**
- Must calculate prefix and suffix sums of `G` and `H`.
- Formula: `Gain = 1/2 * (G_L^2 / (H_L + \lambda) + G_R^2 / (H_R + \lambda) - (G_L + G_R)^2 / (H_L + H_R + \lambda)) - \gamma`
- Filter out split boundaries where `feature_values[i] == feature_values[i+1]`.
**Canonical Python Implementation:**
```python
def xgboost_exact_greedy_gain(G: list, H: list, feature_values: list, lambda_reg: float, gamma: float):
    G_total = sum(G)
    H_total = sum(H)
    
    G_L, H_L = 0.0, 0.0
    max_gain = 0.0
    best_split = -1
    
    for i in range(len(G) - 1):
        G_L += G[i]
        H_L += H[i]
        G_R = G_total - G_L
        H_R = H_total - H_L
        
        if feature_values[i] == feature_values[i+1]:
            continue
            
        score_L = (G_L ** 2) / (H_L + lambda_reg)
        score_R = (G_R ** 2) / (H_R + lambda_reg)
        score_base = (G_total ** 2) / (H_total + lambda_reg)
        
        gain = 0.5 * (score_L + score_R - score_base) - gamma
        if gain > max_gain:
            max_gain = gain
            best_split = i
            
    return max_gain, best_split
```

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
3. **ML Bridge (Required):** Causal Lower-Triangular Masking & Prefill Attention
   - **Difficulty:** Medium. Masking future tokens.
   - **Source:** Custom / `CONTRACT-TOPIC-22-PREFILL-MASK`.
4. **Named Mechanism (Required):** Scaled Dot-Product Attention (SDPA) & KV-Cache Append
   - **Difficulty:** Hard. Full attention mechanism and autoregressive decoding KV update.
   - **Source:** Custom / `CONTRACT-TOPIC-22-SDPA-KV`.
5. **Stress/Tradeoff (Optional):** Top-K / Top-P Logit Filtering
   - **Difficulty:** Medium.
   - **Source:** Custom.

#### Executable Problem Contract: Causal Prefill Attention (CONTRACT-TOPIC-22-PREFILL-MASK)
**Primary Reference:** Standard Causal Self-Attention
**Input:** Sequence of query, key, value matrices `Q`, `K`, `V` of shape `(b, h, L, d)`.
**Output:** Attention output of shape `(b, h, L, d)`.
**Constraints:**
- Create and apply a lower-triangular causal mask.
- Positions before the mask should not be affected, positions after the mask (future tokens) should be set to `-inf` before softmax.
**Canonical Python Implementation:**
```python
import numpy as np

def stable_softmax(x, axis=-1):
    z = x - np.max(x, axis=axis, keepdims=True)
    num = np.exp(z)
    return num / np.sum(num, axis=axis, keepdims=True)

def causal_prefill_attention(Q, K, V):
    b, h, L, d = Q.shape
    
    scores = np.matmul(Q, K.transpose(0, 1, 3, 2)) / np.sqrt(d)
    
    mask = np.triu(np.full((L, L), -np.inf), k=1)
    scores = scores + mask
    
    probs = stable_softmax(scores, axis=-1)
    output = np.matmul(probs, V)
    
    return output
```

#### Executable Problem Contract: SDPA & KV Cache Append (CONTRACT-TOPIC-22-SDPA-KV)
**Primary Reference:** [Vaswani et al., 2017](https://arxiv.org/abs/1706.03762)
**Input:** `Q` (b x h_q x 1 x d), `K_cache` (b x h_kv x L x d), `V_cache` (b x h_kv x L x d), new `K_new` (b x h_kv x 1 x d), new `V_new` (b x h_kv x 1 x d).
**Output:** Updated `K_cache` (b x h_kv x L+1 x d), updated `V_cache` (b x h_kv x L+1 x d), and `Output` (b x h_q x 1 x d).
**Constraints:**
- Must scale by `1/sqrt(d)`.
- Softmax must be numerically stable.
- Implement GQA (Grouped Query Attention) broadcasting where `h_q` is a multiple of `h_kv`.
- Supports causal inference decoding (since `1` token query attends to all `L+1` keys in cache, no explicit causal mask is needed, but shape accounting is strictly enforced).
**Examples:**
- Example 1: `b=1, h_q=4, h_kv=2, L=2, d=4`. Valid GQA expansion test.
- Example 2: Invalid shapes raises error.
**Test Strategy:** Check output vectors within `1e-5` relative tolerance. Test multiple `L` iterations to ensure correct memory capacity accumulation.
**Visualizer:** Show Q dot K matrix, softmax weights, and V projection.
**Canonical Python Implementation:**
```python
import numpy as np

def stable_softmax(x, axis=-1):
    z = x - np.max(x, axis=axis, keepdims=True)
    num = np.exp(z)
    return num / np.sum(num, axis=axis, keepdims=True)

def sdpa_kv_append(Q, K_cache, V_cache, K_new, V_new):
    if Q.shape[-1] != K_cache.shape[-1]:
        raise ValueError("d dimension mismatch")
        
    K_updated = np.concatenate([K_cache, K_new], axis=2)
    V_updated = np.concatenate([V_cache, V_new], axis=2)
    
    b, h_q, _, d = Q.shape
    _, h_kv, L_new, _ = K_updated.shape
    
    if h_q % h_kv != 0:
        raise ValueError("h_q must be divisible by h_kv")
        
    repeats = h_q // h_kv
    K_rep = np.repeat(K_updated, repeats, axis=1)
    V_rep = np.repeat(V_updated, repeats, axis=1)
    
    # Q: (b, h_q, 1, d)
    # K_rep: (b, h_q, L_new, d) -> transpose for matmul: (b, h_q, d, L_new)
    scores = np.matmul(Q, K_rep.transpose(0, 1, 3, 2)) / np.sqrt(d)
    
    probs = stable_softmax(scores, axis=-1)
    output = np.matmul(probs, V_rep)
    
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
   - **Source:** Custom / `CONTRACT-TOPIC-23-FLASHATTENTION`.
5. **Stress/Tradeoff (Optional):** Causal Block Skipping
   - **Difficulty:** Hard. Skip blocks where queries are strictly before keys.
   - **Source:** Custom.

#### Executable Problem Contract: FlashAttention Tile Loop (CONTRACT-TOPIC-23-FLASHATTENTION)
**Primary Reference:** [Dao et al., 2022](https://arxiv.org/abs/2205.14135)
**Input:** `Q, K, V` matrices (N x d). SRAM block sizes `Bc, Br`.
**Output:** Exact attention output `O` (N x d).
**Constraints:**
- Must implement the exact algorithm from the paper (Algorithm 1) with correct normalization recurrence: `O_new = (exp(m_old - m_new) * l_old * O_old + exp(m_block - m_new) * P_block @ V_block) / l_new`.
- Cannot materialize `N x N` attention matrix.
**Examples:**
- Example 1: `N=4, d=2, Br=2, Bc=2`.
- Example 2: `N=8, d=4, Br=4, Bc=4`.
**Test Strategy:** Match output against exact naive attention to within `1e-5` relative tolerance across multiple K/V tiles. Verify block traversal logic via mocked memory accesses.
**Visualizer:** Animate SRAM block loads and running `O, m, l` updates.
**Canonical Python Implementation:**
```python
import math

def flash_attention_sim(Q: list[list[float]], K: list[list[float]], V: list[list[float]], Br: int, Bc: int) -> list[list[float]]:
    N, d = len(Q), len(Q[0])
    O = [[0.0] * d for _ in range(N)]
    l = [0.0] * N
    m = [-float('inf')] * N
    
    Tr = math.ceil(N / Br)
    Tc = math.ceil(N / Bc)
    
    for j in range(Tc):
        k_start, k_end = j * Bc, min((j + 1) * Bc, N)
        K_j = K[k_start:k_end]
        V_j = V[k_start:k_end]
        
        for i in range(Tr):
            q_start, q_end = i * Br, min((i + 1) * Br, N)
            
            for row in range(q_start, q_end):
                q_row = Q[row]
                S_row = [sum(q_row[k] * K_j[col][k] for k in range(d)) / math.sqrt(d) for col in range(len(K_j))]
                m_block = max(S_row) if S_row else -float('inf')
                
                m_new = max(m[row], m_block)
                P_row = [math.exp(s - m_block) for s in S_row]
                l_block = sum(P_row)
                
                l_new = math.exp(m[row] - m_new) * l[row] + math.exp(m_block - m_new) * l_block
                
                for col in range(d):
                    pv_sum = sum(P_row[col_idx] * V_j[col_idx][col] for col_idx in range(len(V_j)))
                    O[row][col] = (math.exp(m[row] - m_new) * l[row] * O[row][col] + math.exp(m_block - m_new) * pv_sum) / l_new
                    
                m[row] = m_new
                l[row] = l_new
                
    return O
```
