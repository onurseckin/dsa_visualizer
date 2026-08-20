# Domain 6: Tokenization and Retrieval

## Topic 24: Trie-based Vocabulary

### Part A: Problem Solving
- [LeetCode 208: Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/)
- [LeetCode 211: Design Add and Search Words Data Structure](https://leetcode.com/problems/design-add-and-search-words-data-structure/)
- [LeetCode 212: Word Search II](https://leetcode.com/problems/word-search-ii/)

### Part B: Mathematical Proofs
1. Prove the time complexity of searching and inserting a word of length L in a Trie.
2. Prove the space complexity of a Trie storing N words of maximum length L.

### Part C: ML Systems Questions
1. How does a Trie structure improve vocabulary search efficiency in tokenizers?
2. What are the memory overheads of a standard Trie compared to a Directed Acyclic Word Graph (DAWG)?

### Part D: Edge Cases / Stress Tests
1. Inserting identical words multiple times.
2. Searching for a prefix of an inserted word that is not a complete word.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-24`
```python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False

class TrieVocab:
    def __init__(self):
        self.root = TrieNode()
        
    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_of_word = True
        
    def search(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end_of_word
```

## Topic 25: Byte Pair Encoding (BPE)

### Part A: Problem Solving
- [LeetCode 3: Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/)
- [LeetCode 14: Longest Common Prefix](https://leetcode.com/problems/longest-common-prefix/)
- [LeetCode 443: String Compression](https://leetcode.com/problems/string-compression/)

### Part B: Mathematical Proofs
1. Show that BPE guarantees a finite, monotonically decreasing maximum sequence length on the training corpus.
2. Prove that BPE does not create out-of-vocabulary (OOV) tokens for any string if initialized with byte-level characters.

### Part C: ML Systems Questions
1. Why is BPE the standard tokenization method for LLMs like GPT and LLaMA?
2. How can BPE merging be parallelized efficiently across large corpora?

### Part D: Edge Cases / Stress Tests
1. Words with heavily repeating character sequences (e.g., "aaaaa").
2. Merging when no pair occurs more than once.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-25`
```python
from collections import Counter, defaultdict

def get_stats(vocab):
    pairs = defaultdict(int)
    for word, freq in vocab.items():
        symbols = word.split()
        for i in range(len(symbols)-1):
            pairs[symbols[i], symbols[i+1]] += freq
    return pairs

def merge_vocab(pair, v_in):
    v_out = {}
    bigram = " ".join(pair)
    replacement = "".join(pair)
    for word in v_in:
        w_out = word.replace(bigram, replacement)
        v_out[w_out] = v_in[word]
    return v_out

def bpe_train_step(vocab, num_merges):
    # vocab is a dict of {"l o w </w>": 5, "l o w e r </w>": 2, ...}
    for i in range(num_merges):
        pairs = get_stats(vocab)
        if not pairs:
            break
        best = max(pairs, key=pairs.get)
        vocab = merge_vocab(best, vocab)
    return vocab
```

## Topic 26: KD-Tree for Retrieval

### Part A: Problem Solving
- [LeetCode 973: K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/)
- [LeetCode 215: Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/)
- [LeetCode 347: Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/)

### Part B: Mathematical Proofs
1. Prove the $O(N \log N)$ expected time complexity of constructing a balanced KD-Tree.
2. Explain mathematically the "curse of dimensionality" and why KD-Trees become inefficient in high dimensions (D > 20).

### Part C: ML Systems Questions
1. Why do vector databases prefer approximate nearest neighbor (ANN) algorithms over exact KD-Trees for dense embeddings?
2. How can KD-Trees be used for efficient spatial querying in geographical recommendation systems?

### Part D: Edge Cases / Stress Tests
1. Collinear or exactly overlapping points.
2. Querying in spaces with very high dimensionality.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-26`
```python
import math

class KDNode:
    def __init__(self, point, axis, left=None, right=None):
        self.point = point
        self.axis = axis
        self.left = left
        self.right = right

class KDTree:
    def __init__(self, points):
        self.k = len(points[0]) if points else 0
        self.root = self._build_tree(points, depth=0)
        
    def _build_tree(self, points, depth):
        if not points:
            return None
        axis = depth % self.k
        points.sort(key=lambda x: x[axis])
        median = len(points) // 2
        return KDNode(
            points[median],
            axis,
            self._build_tree(points[:median], depth + 1),
            self._build_tree(points[median + 1:], depth + 1)
        )
        
    def nearest(self, query):
        best = None
        best_dist = float('inf')
        
        def _search(node):
            nonlocal best, best_dist
            if node is None:
                return
            
            d = sum((a - b) ** 2 for a, b in zip(node.point, query))
            if d < best_dist:
                best_dist = d
                best = node.point
                
            axis = node.axis
            diff = query[axis] - node.point[axis]
            
            close, away = (node.left, node.right) if diff < 0 else (node.right, node.left)
            _search(close)
            if diff ** 2 < best_dist:
                _search(away)
                
        _search(self.root)
        return best
```

## Topic 27: Simplified HNSW

### Part A: Problem Solving
- [LeetCode 146: LRU Cache](https://leetcode.com/problems/lru-cache/)
- [LeetCode 295: Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/)
- [LeetCode 1202: Smallest String With Swaps](https://leetcode.com/problems/smallest-string-with-swaps/)

### Part B: Mathematical Proofs
1. Prove that Navigable Small World graphs exhibit the "six degrees of separation" property for connectivity.
2. Demonstrate why adding layers in HNSW strictly reduces the expected path length compared to a flat NSW graph.

### Part C: ML Systems Questions
1. How does HNSW balance search speed and recall during inference in retrieval-augmented generation (RAG)?
2. What are the memory access patterns of HNSW, and how do they impact CPU cache utilization?

### Part D: Edge Cases / Stress Tests
1. Graph becoming disconnected (should be impossible by construction, but needs testing).
2. All points having extremely similar embeddings.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-27`
```python
import math
import random

class SimplifiedHNSW:
    def __init__(self, max_elements, M=16, ef_construction=100):
        self.M = M
        self.ef_construction = ef_construction
        self.graph = {}
        self.points = {}
        self.entry_point = None
        
    def _distance(self, p1, p2):
        return sum((a - b) ** 2 for a, b in zip(p1, p2))
        
    def add_point(self, point_id, vector):
        self.points[point_id] = vector
        self.graph[point_id] = []
        
        if self.entry_point is None:
            self.entry_point = point_id
            return
            
        # Simplified: Just find neighbors using a basic greedy search
        neighbors = self._search_layer(vector, self.entry_point, self.ef_construction)
        neighbors = sorted(neighbors, key=lambda x: x[1])[:self.M]
        
        for n_id, dist in neighbors:
            self.graph[point_id].append(n_id)
            self.graph[n_id].append(point_id)
            if len(self.graph[n_id]) > self.M:
                # Keep top M neighbors
                self.graph[n_id] = sorted(self.graph[n_id], key=lambda x: self._distance(self.points[x], self.points[n_id]))[:self.M]
                
    def _search_layer(self, query, ep, ef):
        candidates = [(ep, self._distance(query, self.points[ep]))]
        visited = {ep}
        results = [(ep, self._distance(query, self.points[ep]))]
        
        while candidates:
            candidates.sort(key=lambda x: x[1])
            curr, curr_dist = candidates.pop(0)
            
            results.sort(key=lambda x: x[1])
            if curr_dist > results[-1][1] and len(results) >= ef:
                break
                
            for neighbor in self.graph[curr]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    dist = self._distance(query, self.points[neighbor])
                    if len(results) < ef or dist < results[-1][1]:
                        candidates.append((neighbor, dist))
                        results.append((neighbor, dist))
                        results.sort(key=lambda x: x[1])
                        if len(results) > ef:
                            results.pop()
                            
        return results
        
    def search(self, query, k=1):
        if self.entry_point is None:
            return []
        res = self._search_layer(query, self.entry_point, max(k, self.M))
        return [r[0] for r in sorted(res, key=lambda x: x[1])[:k]]
```
