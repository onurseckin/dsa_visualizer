import re
import os

with open('/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-07-29-curriculum-v5-patch/rounds/round-01/domain-04-05-tokenization-and-attention-v5.md', 'r') as f:
    content = f.read()

# 1. Topic 19 Sennrich BPE
content = content.replace(
    '- Example 1: `vocab = {"l o w </w>": 5, "l o w e s t </w>": 2, "n e w e r </w>": 6}`, `K = 2`. Output: `[("e", "r"), ("er", "</w>")]`',
    '- Example 1: `vocab = {"l o w </w>": 5, "l o w e s t </w>": 2, "n e w e r </w>": 6}`, `K = 2`. Output: `[("w", "e"), ("l", "o")]`'
)

# Update rung 3 source
content = content.replace(
    '3. **ML Bridge (Required):** Adjacent Pair Counting and Deterministic Selection\n   - **Difficulty:** Medium. Identify the most frequent pair deterministically.\n   - **Source:** Custom.',
    '3. **ML Bridge (Required):** Adjacent Pair Counting and Deterministic Selection\n   - **Difficulty:** Medium. Identify the most frequent pair deterministically.\n   - **Source:** Custom / `CONTRACT-TOPIC-19-PAIR-COUNT`.'
)

pair_count_contract = """#### Executable Problem Contract: Adjacent Pair Counting (CONTRACT-TOPIC-19-PAIR-COUNT)
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

"""

# Insert pair count contract before Sennrich Subword BPE
content = content.replace('#### Executable Problem Contract: Sennrich Subword BPE', pair_count_contract + '#### Executable Problem Contract: Sennrich Subword BPE')

# 2. Topic 21 XGBoost
old_xgboost = """#### Executable Problem Contract: XGBoost Exact Greedy Split Gain (CONTRACT-TOPIC-21-XGBOOST)
**Primary Reference:** [XGBoost Documentation](https://xgboost.readthedocs.io/en/stable/tutorials/model.html)
**Input:** Array of gradients `G` and Hessians `H` sorted by a feature's values, and `lambda_reg` regularization factor.
**Output:** The maximum split gain and the split index.
**Constraints:**
- Must calculate prefix and suffix sums of `G` and `H`.
- Formula: `Gain = 1/2 * (G_L^2 / (H_L + \lambda) + G_R^2 / (H_R + \lambda) - (G_L + G_R)^2 / (H_L + H_R + \lambda))`
**Canonical Python Implementation:**
```python
def xgboost_exact_greedy_gain(G: list, H: list, lambda_reg: float):
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
        
        score_L = (G_L ** 2) / (H_L + lambda_reg)
        score_R = (G_R ** 2) / (H_R + lambda_reg)
        score_base = (G_total ** 2) / (H_total + lambda_reg)
        
        gain = 0.5 * (score_L + score_R - score_base)
        if gain > max_gain:
            max_gain = gain
            best_split = i
            
    return max_gain, best_split
```"""

new_xgboost = """#### Executable Problem Contract: XGBoost Exact Greedy Split Gain (CONTRACT-TOPIC-21-XGBOOST)
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
```"""

content = content.replace(old_xgboost, new_xgboost)

# 3. Topic 22 Attention & Masking
content = content.replace(
    '3. **ML Bridge (Required):** Causal Lower-Triangular Masking\n   - **Difficulty:** Medium. Masking future tokens.\n   - **Source:** Custom.',
    '3. **ML Bridge (Required):** Causal Lower-Triangular Masking & Prefill Attention\n   - **Difficulty:** Medium. Masking future tokens.\n   - **Source:** Custom / `CONTRACT-TOPIC-22-PREFILL-MASK`.'
)

prefill_contract = """#### Executable Problem Contract: Causal Prefill Attention (CONTRACT-TOPIC-22-PREFILL-MASK)
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

"""

content = content.replace('#### Executable Problem Contract: SDPA & KV Cache Append', prefill_contract + '#### Executable Problem Contract: SDPA & KV Cache Append')

out_dir = '/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-07-29-curriculum-v6-patch/rounds/round-01'
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, 'domain-04-05-tokenization-and-attention-v6.md')

with open(out_path, 'w') as f:
    f.write(content)

print(f"Successfully wrote to {out_path}")
