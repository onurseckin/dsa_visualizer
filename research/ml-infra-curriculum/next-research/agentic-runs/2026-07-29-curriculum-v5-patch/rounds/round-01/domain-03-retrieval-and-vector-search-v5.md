# Domain 3: Retrieval and Vector Search

This document contains the repaired curriculum for Domain 3 (Topics 14-17b), focusing on vector search, spatial indexes, approximate nearest neighbors (HNSW), inverted file indexes (IVF), product quantization (PQ), and locality-sensitive hashing (LSH).

## Topic 14: Exact Vector Search: Similarity Metrics, Top-k Retrieval & Bounded Heaps

**Learning Outcome:**
Implement exact vector search using bounded heaps and various similarity metrics (L1, L2, Cosine) to establish the $O(N \cdot D \log K)$ brute-force baseline for all approximate retrieval mechanisms.

**Prerequisites:**
- Topic 03: Dense & Sparse Matrix Multiplication (Dot products)
- Topic 04: Floating-Point Representation (Numerical distance bounds)

**Decision Rationale (V3 Evaluation Corrections):**
- Removed LeetCode 1458 (Max Dot Product of Two Subsequences) as it is sequence dynamic programming, not exact vector search.
- Added explicit URLs, difficulty rationale, and transfer rationale for all rungs.

### The 5-Rung Ladder

**1. Foundation:**
- **Exact Title:** Kth Largest Element in an Array
- **Source Type:** Online Judge
- **Direct URL:** [https://leetcode.com/problems/kth-largest-element-in-an-array/](https://leetcode.com/problems/kth-largest-element-in-an-array/)
- **Required/Optional:** Required
- **Difficulty Rationale:** Medium. Teaches the core mechanics of maintaining a bounded heap (min-heap of size K for top-K elements) to achieve $O(N \log K)$ instead of full $O(N \log N)$ sorting.
- **Transfer Rationale:** The fundamental operation at the end of every vector search is selecting the top $K$ results from a candidate pool.

**2. Focused Variant:**
- **Exact Title:** K Closest Points to Origin
- **Source Type:** Online Judge
- **Direct URL:** [https://leetcode.com/problems/k-closest-points-to-origin/](https://leetcode.com/problems/k-closest-points-to-origin/)
- **Required/Optional:** Required
- **Difficulty Rationale:** Medium. Introduces geometric proximity calculation (squared Euclidean distance) combined with a bounded heap.
- **Transfer Rationale:** Directly models exact vector search in 2D space, forming the template for $D$-dimensional search.

**3. ML Bridge:**
- **Exact Title:** Dot Product of Two Sparse Vectors
- **Source Type:** Online Judge
- **Direct URL:** [https://leetcode.com/problems/dot-product-of-two-sparse-vectors/](https://leetcode.com/problems/dot-product-of-two-sparse-vectors/)
- **Required/Optional:** Required
- **Difficulty Rationale:** Medium. Introduces efficient representation and dot-product calculations for sparse vectors.
- **Transfer Rationale:** ML retrieval often uses sparse representations (e.g., TF-IDF). The dot product is mathematically equivalent to cosine similarity for normalized vectors.

**4. Named Mechanism:**
- **Exact Title:** Exact Vector Search Engine
- **Source Type:** Custom Problem Contract (See below)
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Required
- **Difficulty Rationale:** Hard. Requires fusing vector distance calculations (L2, Cosine) across batched queries with stable tie-breaking and bounded heap extraction.
- **Transfer Rationale:** This is the brute-force exact baseline ($O(ND + N \log K)$) that all approximate nearest neighbor (ANN) indexes attempt to optimize and evaluate against.

**5. Stress/Tradeoff:**
- **Exact Title:** Kth Largest Element in a Stream
- **Source Type:** Online Judge
- **Direct URL:** [https://leetcode.com/problems/kth-largest-element-in-a-stream/](https://leetcode.com/problems/kth-largest-element-in-a-stream/)
- **Required/Optional:** Optional
- **Difficulty Rationale:** Easy. Extends the bounded heap concept to a continuous, infinite stream.
- **Transfer Rationale:** Models online query endpoints where the pool of indexed vectors may grow over time while handling live searches.

### Custom Problem Contract: Exact Vector Search Engine

**Contract ID:** `CONTRACT-TOPIC-14-EXACT-TOPK`

**Objective:** Implement a batch-query exact search engine over $N$ $D$-dimensional vectors using Cosine and L2 similarity, returning the Top-$K$ IDs using a bounded heap with deterministic tie-breaking.

**Inputs:**
- `database`: `float32[N, D]` matrix of database vectors.
- `queries`: `float32[Q, D]` matrix of query vectors.
- `k`: Integer, number of nearest neighbors to retrieve.
- `metric`: String, either `"L2"` or `"cosine"`.

**Outputs:**
- `top_k_indices`: `int32[Q, K]` matrix of the nearest neighbor row indices from the database, sorted from most similar to least similar.

**Constraints:**
- $1 \le N \le 10,000$
- $1 \le Q \le 100$
- $1 \le D \le 256$
- $1 \le K \le \min(100, N)$
- **Tie-breaking:** If two vectors have identical distances (within `1e-6`), select the one with the smaller row index.

**Python Reference Implementation:**
```python
import numpy as np
import heapq

def exact_vector_search(database: np.ndarray, queries: np.ndarray, k: int, metric: str) -> np.ndarray:
    N, D = database.shape
    Q, _ = queries.shape
    results = np.zeros((Q, k), dtype=np.int32)
    
    for q_idx in range(Q):
        query = queries[q_idx]
        heap = [] # Store (-similarity/distance, index) for max-heap behavior
        
        for i in range(N):
            db_vec = database[i]
            if metric == "L2":
                dist = np.sum((query - db_vec)**2)
                score = dist # Min-heap based on distance
            elif metric == "cosine":
                dot = np.sum(query * db_vec)
                norm_q = np.linalg.norm(query)
                norm_db = np.linalg.norm(db_vec)
                if norm_q == 0 or norm_db == 0:
                    sim = 0.0
                else:
                    sim = dot / (norm_q * norm_db)
                score = -sim # Min-heap based on negative similarity
                
            heapq.heappush(heap, (-score, -i)) # negate index for tie-breaking
            if len(heap) > k:
                heapq.heappop(heap)
                
        # Extract and sort
        sorted_results = []
        while heap:
            score, neg_idx = heapq.heappop(heap)
            sorted_results.append(-neg_idx)
            
        results[q_idx] = sorted_results[::-1] # Reverse to get most similar first
        
    return results
```

**Worked Examples:**
1. `database = [[1, 0], [0, 1], [1, 1]]`, `queries = [[1, 0.1]]`, `k = 2`, `metric = "L2"` -> `[[0, 2]]`
2. `database = [[1, 2], [2, 4], [-1, -2]]`, `queries = [[1, 2]]`, `k = 2`, `metric = "cosine"` -> `[[0, 1]]` (0 and 1 have same cosine sim, tie-break picks smaller index).

## Topic 15: Exact Spatial Indexes: K-D Trees, QuadTrees & Ball Trees

**Learning Outcome:**
Build hierarchical spatial indexes (K-D Tree) to accelerate exact search from $O(N)$ to expected $O(\log N)$ by partitioning the search space, and analyze their degradation in high dimensions.

**Prerequisites:**
- Topic 14: Exact Vector Search
- Topic 06: Topological Ordering & Trees

**Decision Rationale (V3 Evaluation Corrections):**
- Restored learning ladders and exact online judge mapping.
- Formalized the spatial bounding and branch-and-bound pruning operations.

### The 5-Rung Ladder

**1. Foundation:**
- **Exact Title:** Construct Quad Tree
- **Source Type:** Online Judge
- **Direct URL:** [https://leetcode.com/problems/construct-quad-tree/](https://leetcode.com/problems/construct-quad-tree/)
- **Required/Optional:** Required
- **Difficulty Rationale:** Medium. Teaches exact spatial grid partitioning in 2D.
- **Transfer Rationale:** QuadTrees introduce recursive spatial subdivision, the core requirement for accelerating spatial search.

**2. Focused Variant:**
- **Exact Title:** Logical OR of Two Quad Trees
- **Source Type:** Online Judge
- **Direct URL:** [https://leetcode.com/problems/logical-or-of-two-quad-trees/](https://leetcode.com/problems/logical-or-of-two-quad-trees/)
- **Required/Optional:** Optional
- **Difficulty Rationale:** Medium. Teaches tree merging and traversal on subdivided spaces.
- **Transfer Rationale:** Strengthens structural manipulation of spatial partitions.

**3. ML Bridge:**
- **Exact Title:** K-D Tree Median-Selection Construction
- **Source Type:** Custom Problem Contract
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Required
- **Difficulty Rationale:** Hard. Requires $O(N \log N)$ building of a K-D tree using alternating axis splitting ($d \bmod K$) and exact median finding.
- **Transfer Rationale:** K-D trees generalize binary spatial partitioning to $D$ dimensions, acting as the primary index for low-dimensional exact search.

**4. Named Mechanism:**
- **Exact Title:** K-D Tree KNN Branch-and-Bound
- **Source Type:** Custom Problem Contract (See below)
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Required
- **Difficulty Rationale:** Hard. Requires implementing a bounded max-heap and pruning tree traversal branches if the bounding-box lower bound exceeds the worst distance in the heap.
- **Transfer Rationale:** This is the exact mechanism that achieves $O(\log N)$ expected search time in low dimensions.

**5. Stress/Tradeoff:**
- **Exact Title:** Curse of Dimensionality K-D Tree Degradation
- **Source Type:** Custom Problem Contract
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Required
- **Difficulty Rationale:** Medium. Requires tracking the number of nodes visited during a K-D tree search as dimension $D$ increases from 2 to 64.
- **Transfer Rationale:** Demonstrates mathematically that as $D$ grows, exact spatial indexes devolve to $O(N)$ brute-force search, necessitating Approximate Nearest Neighbors (ANN) like HNSW.

### Custom Problem Contract: K-D Tree KNN Branch-and-Bound

**Contract ID:** `CONTRACT-TOPIC-15-KD-TREE`

**Objective:** Implement a K-D tree search that finds the $K$ nearest neighbors to a query point using branch-and-bound pruning to avoid visiting unnecessary subtrees.

**Inputs:**
- `points`: `float32[N, D]` matrix of database points.
- `query`: `float32[D]` query point.
- `k`: Integer, number of nearest neighbors.

**Outputs:**
- `top_k_indices`: `int32[K]` array of the row indices of the nearest neighbors.
- `nodes_visited`: Integer, the number of K-D tree nodes explicitly visited during the search.

**Constraints:**
- $1 \le N \le 10,000$
- $1 \le D \le 20$
- $1 \le K \le 100$
- Deterministic tie-breaking for equal distances (prefer smaller index).

**Python Reference Implementation:**
```python
import numpy as np
import heapq

class KDNode:
    def __init__(self, point_idx, left=None, right=None, axis=0):
        self.point_idx = point_idx
        self.left = left
        self.right = right
        self.axis = axis

def build_kd_tree(points, indices, depth=0):
    if not indices:
        return None
    k_dim = points.shape[1]
    axis = depth % k_dim
    indices = sorted(indices, key=lambda x: points[x][axis])
    median_idx = len(indices) // 2
    
    return KDNode(
        point_idx=indices[median_idx],
        left=build_kd_tree(points, indices[:median_idx], depth + 1),
        right=build_kd_tree(points, indices[median_idx + 1:], depth + 1),
        axis=axis
    )

def knn_search(tree, points, query, k):
    heap = [] # Max-heap for the k closest distances: (-dist, -index)
    visited_count = 0
    
    def search(node):
        nonlocal visited_count
        if node is None:
            return
        visited_count += 1
        
        db_point = points[node.point_idx]
        dist = np.sum((query - db_point)**2)
        
        if len(heap) < k:
            heapq.heappush(heap, (-dist, -node.point_idx))
        elif dist < -heap[0][0] or (dist == -heap[0][0] and node.point_idx < -heap[0][1]):
            heapq.heappushpop(heap, (-dist, -node.point_idx))
            
        axis = node.axis
        diff = query[axis] - db_point[axis]
        
        # Decide which branch to search first
        close, away = (node.left, node.right) if diff < 0 else (node.right, node.left)
        
        search(close)
        
        # Check if we need to search the other branch
        if len(heap) < k or diff**2 < -heap[0][0]:
            search(away)
            
    search(tree)
    
    results = sorted([(-idx, -d) for d, idx in heap], key=lambda x: (x[1], x[0]))
    return [x[0] for x in results], visited_count
```

**Worked Examples:**
1. `points = [[2,3], [5,4], [9,6], [4,7], [8,1], [7,2]]`, `query = [9, 2]`, `k = 1`. Build tree, search, result `[4]` (point `[8,1]`), visited `< N`.
2. `points = [[0,0], [1,1], [2,2]]`, `query = [1.1, 1.1]`, `k = 1`. Result `[1]`.

## Topic 16: Graph-Based Approximate Nearest Neighbor Search: NSW & HNSW

**Learning Outcome:**
Implement the Malkov & Yashunin `SEARCH-LAYER` algorithm with candidate queues, visited sets, and bounding to achieve sub-linear Approximate Nearest Neighbor (ANN) retrieval in high dimensions.

**Prerequisites:**
- Topic 14: Exact Vector Search (Priority Queues)
- Topic 26: Weighted Graphs (Dijkstra/Greedy Search)

**Decision Rationale (V3 Evaluation Corrections):**
- Strictly aligned with Malkov & Yashunin 2016 `SEARCH-LAYER` logic.
- Included exact candidate queue `C`, result set `W`, and stop conditions.
- Removed unrelated graph/DP problems (Cheapest Flights, etc.).

### The 5-Rung Ladder

**1. Foundation:**
- **Exact Title:** Design Skiplist
- **Source Type:** Online Judge
- **Direct URL:** [https://leetcode.com/problems/design-skiplist/](https://leetcode.com/problems/design-skiplist/)
- **Required/Optional:** Optional
- **Difficulty Rationale:** Hard. Teaches randomized hierarchical levels, serving as an analogy to HNSW's layer assignment.
- **Transfer Rationale:** HNSW behaves as a probabilistic multi-dimensional Skiplist for sparse upper levels and coarse-to-fine navigation.

**2. Focused Variant:**
- **Exact Title:** Greedy Proximity Graph Search
- **Source Type:** Custom Problem Contract
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Required
- **Difficulty Rationale:** Medium. Implements standard greedy routing on a flat graph to find the local minimum.
- **Transfer Rationale:** The fundamental building block of Navigable Small World (NSW) graphs.

**3. ML Bridge:**
- **Exact Title:** HNSW SEARCH-LAYER (Layer-0 Beam Expansion)
- **Source Type:** Custom Problem Contract (See below)
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Required
- **Difficulty Rationale:** Hard. Implements the exact `efSearch` beam expansion with a candidate queue, visited set, and dynamic result set.
- **Transfer Rationale:** This algorithm powers the most widely used vector database indexing mechanism (e.g., Faiss HNSW, Milvus).

**4. Named Mechanism:**
- **Exact Title:** HNSW Heuristic Neighbor Selection
- **Source Type:** Custom Problem Contract
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Required
- **Difficulty Rationale:** Hard. Implement the edge pruning heuristic that preserves graph navigability and limits node degree ($M$).
- **Transfer Rationale:** Prevents dense clusters and ensures long-range edges exist, critical for $O(\log N)$ search latency.

**5. Stress/Tradeoff:**
- **Exact Title:** HNSW Recall vs Visited Nodes Benchmark
- **Source Type:** Custom Problem Contract
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Optional
- **Difficulty Rationale:** Medium. Analyzes the impact of `efSearch` parameter on recall accuracy and latency.
- **Transfer Rationale:** Vector DB engineers constantly tune `efSearch` to trade off between IO/Compute limits and search quality.

### Custom Problem Contract: HNSW SEARCH-LAYER

**Contract ID:** `CONTRACT-TOPIC-16-HNSW`
**Primary Source:** [Malkov & Yashunin, Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs](https://arxiv.org/abs/1603.09320)

**Objective:** Implement the Malkov & Yashunin 2016 `SEARCH-LAYER` algorithm on a single layer graph. Maintain a visited set, a candidate queue `C`, a bounded result set `W` (size `efSearch`), and terminate when the closest candidate is further than the furthest result.

**Inputs:**
- `points`: `float32[N, D]` matrix of database points.
- `graph`: List of Lists `[[neighbor_indices...], ...]`, representing adjacency list of the graph.
- `query`: `float32[D]` query point.
- `enter_point`: Integer, index of the starting node.
- `efSearch`: Integer, candidate set bound.

**Outputs:**
- `top_k_indices`: `int32[K]` array of nearest neighbors found, up to `efSearch`.

**Constraints:**
- $1 \le N \le 10,000$
- $1 \le \text{efSearch} \le 100$
- Deterministic tie-breaking for equal distances (prefer smaller index).

**Python Reference Implementation:**
```python
import numpy as np
import heapq

def hnsw_search_layer(points, graph, query, enter_point, efSearch):
    visited = {enter_point}
    
    # C is min-heap of candidates to evaluate: (dist, index)
    dist_ep = np.sum((query - points[enter_point])**2)
    C = [(dist_ep, enter_point)]
    
    # W is max-heap of best results found: (-dist, -index) for tie-breaking
    # Python heapq is a min-heap, so negated values give us a max-heap.
    # On tie in distance, max-heap pops the most negative ID (largest positive ID).
    W = [(-dist_ep, -enter_point)]
    
    while C:
        dist_c, c = heapq.heappop(C)
        
        # Stop condition: candidate is further than the furthest result in W
        if W and dist_c > -W[0][0]:
            break
            
        for e in graph[c]:
            if e not in visited:
                visited.add(e)
                dist_e = np.sum((query - points[e])**2)
                
                # If W is not full, or e is closer than the furthest result,
                # or e is equidistant but has a smaller ID
                if len(W) < efSearch or dist_e < -W[0][0] or (dist_e == -W[0][0] and e < -W[0][1]):
                    heapq.heappush(C, (dist_e, e))
                    heapq.heappush(W, (-dist_e, -e))
                    
                    if len(W) > efSearch:
                        heapq.heappop(W)
                        
    # Extract and sort W
    results = sorted([(-idx, -d) for d, idx in W], key=lambda x: (x[1], x[0]))
    return [x[0] for x in results]
```

**Worked Examples:**
1. `points = [[0,0], [1,0], [2,0], [0,1]]`, `graph = [[1, 3], [0, 2], [1], [0]]`, `query = [2.1, 0]`, `enter_point = 0`, `efSearch = 2`. Process visits 0, then 1 and 3. W updates. Then visits 2 from 1. Result: `[2, 1]`.
2. `efSearch = 1`. Enter 0. C=[0]. Pop 0, add 1, 3 to C and W. W drops 0 (keeps 1). Pop 1, add 2. W drops 1 (keeps 2). Result: `[2]`.

## Topic 17a: Inverted File Index (IVF), Product Quantization (PQ) & Asymmetric Distance Computation (ADC)

**Learning Outcome:**
Implement Faiss-style vector compression and indexing using K-Means clustering (IVF), sub-space decomposition (PQ), and lookup-based querying (ADC) to achieve massive memory reductions.

**Prerequisites:**
- Topic 14: Exact Vector Search
- Topic 05: Quantization & Integer Math

**Decision Rationale (V3 Evaluation Corrections):**
- Explicitly split Topic 17 into 17a (Faiss/IVF/PQ) and 17b (LSH).
- Provided standalone learning ladders for the compression-based retrieval mechanisms.

### The 5-Rung Ladder

**1. Foundation:**
- **Exact Title:** K-Means Voronoi Centroid Assignment
- **Source Type:** Custom Problem Contract (See below)
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Required
- **Difficulty Rationale:** Medium. Core clustering logic to map vectors to their nearest centroid.
- **Transfer Rationale:** Forms the coarse quantizer for IVF partitioning.

**2. Focused Variant:**
- **Exact Title:** Inverted File Index (IVF) Posting Lists
- **Source Type:** Custom Problem Contract (See below)
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Required
- **Difficulty Rationale:** Medium. Constructs the dictionary mapping centroids to lists of vector IDs.
- **Transfer Rationale:** The fundamental inverted index structure that avoids exhaustive search via `nprobe` lookups.

**3. ML Bridge:**
- **Exact Title:** Product Quantization (PQ) Encoding
- **Source Type:** Custom Problem Contract
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Required
- **Difficulty Rationale:** Hard. Splits a $D$-dimensional vector into $M$ sub-vectors, maps each to a sub-centroid ID, compressing the vector to $M$ bytes.
- **Transfer Rationale:** PQ is the industry standard for compressing vector databases to fit entirely in memory.

**4. Named Mechanism:**
- **Exact Title:** Asymmetric Distance Computation (ADC)
- **Source Type:** Custom Problem Contract (See below)
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Required
- **Difficulty Rationale:** Hard. Precomputes a distance lookup table for the query against PQ sub-centroids, evaluating distances via $O(1)$ lookups.
- **Transfer Rationale:** ADC allows extremely fast approximate querying while maintaining high recall because the query vector is NOT quantized (asymmetric).

**5. Stress/Tradeoff:**
- **Exact Title:** Vector Residuals (IVF-PQ)
- **Source Type:** Custom Problem Contract
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Optional
- **Difficulty Rationale:** Medium. PQ is applied to the residual $r = x - c$ instead of the raw vector $x$.
- **Transfer Rationale:** IVF-PQ combines both mechanisms to maximize both accuracy and compression.

### Custom Problem Contract: K-Means Voronoi Centroid Assignment

**Contract ID:** `CONTRACT-TOPIC-17A-CENTROID`

**Objective:** Map vectors to their nearest centroid to establish the coarse quantizer partitions.

**Inputs:**
- `vectors`: `float32[N, D]` matrix of database vectors.
- `centroids`: `float32[K, D]` matrix of trained centroids.

**Outputs:**
- `assignments`: `int32[N]` array of centroid indices for each vector.

**Constraints:**
- Deterministic tie-breaking for equal distances (prefer smaller centroid index).

**Python Reference Implementation:**
```python
import numpy as np

def assign_centroids(vectors, centroids):
    N = vectors.shape[0]
    K = centroids.shape[0]
    assignments = np.zeros(N, dtype=np.int32)
    
    for i in range(N):
        best_k = -1
        min_dist = float('inf')
        for k in range(K):
            dist = np.sum((vectors[i] - centroids[k])**2)
            if dist < min_dist or (dist == min_dist and k < best_k):
                min_dist = dist
                best_k = k
        assignments[i] = best_k
        
    return assignments
```

**Worked Examples:**
1. `vectors=[[0,0], [1,1]]`, `centroids=[[1,1], [0,0]]`. Result: `[1, 0]`.

### Custom Problem Contract: Inverted File Index (IVF) Posting Lists

**Contract ID:** `CONTRACT-TOPIC-17A-IVF`

**Objective:** Traverse centroid distances for a query and gather candidate vector IDs from the nearest `nprobe` inverted lists.

**Inputs:**
- `query`: `float32[D]` query vector.
- `centroids`: `float32[K, D]` matrix of centroids.
- `ivf_lists`: List of $K$ lists containing database vector indices mapped to each centroid.
- `nprobe`: Integer, number of nearest centroids to probe.

**Outputs:**
- `candidate_ids`: `int32[C]` array of candidate vector IDs to evaluate further.

**Python Reference Implementation:**
```python
import numpy as np

def ivf_lookup(query, centroids, ivf_lists, nprobe):
    K = centroids.shape[0]
    
    # Compute distances to all centroids
    dists = []
    for k in range(K):
        d = np.sum((query - centroids[k])**2)
        dists.append((d, k))
        
    # Sort and pick top nprobe centroids
    dists.sort(key=lambda x: (x[0], x[1]))
    
    candidate_ids = []
    for i in range(nprobe):
        k = dists[i][1]
        candidate_ids.extend(ivf_lists[k])
        
    return sorted(candidate_ids)
```

**Worked Examples:**
1. `query=[0.1, 0.1]`, `centroids=[[0,0], [1,1], [2,2]]`, `ivf_lists=[[0, 3], [1], [2]]`, `nprobe=2`. Closest centroids are 0 and 1. Candidate IDs: `[0, 1, 3]`.

### Custom Problem Contract: Asymmetric Distance Computation (ADC)

**Contract ID:** `CONTRACT-TOPIC-17A-ADC`
**Primary Source:** [Jegou et al., Product Quantization for Nearest Neighbor Search](https://hal.inria.fr/inria-00514462/document)

**Objective:** Compute the approximate distances between a query vector and a database of PQ-encoded vectors by building a precomputed lookup table.

**Inputs:**
- `query`: `float32[D]` uncompressed query vector.
- `pq_codes`: `int32[N, M]` matrix of PQ encoded database vectors (each containing $M$ sub-centroid IDs).
- `centroids`: `float32[M, K, D/M]` codebook of $K$ centroids for each of the $M$ sub-spaces.

**Outputs:**
- `distances`: `float32[N]` array of approximate L2 distances.

**Constraints:**
- $D$ is divisible by $M$.
- $1 \le N \le 10,000$
- $M \le D \le 256$

**Python Reference Implementation:**
```python
import numpy as np

def adc_distance(query, pq_codes, centroids):
    N, M = pq_codes.shape
    K, sub_D = centroids.shape[1], centroids.shape[2]
    
    # 1. Precompute lookup table: shape (M, K)
    # distance from query sub-vector to each centroid in that sub-space
    lut = np.zeros((M, K), dtype=np.float32)
    
    for m in range(M):
        q_sub = query[m * sub_D : (m + 1) * sub_D]
        for k in range(K):
            lut[m, k] = np.sum((q_sub - centroids[m, k])**2)
            
    # 2. Compute approximate distances via lookups
    distances = np.zeros(N, dtype=np.float32)
    for i in range(N):
        dist = 0.0
        for m in range(M):
            code = pq_codes[i, m]
            dist += lut[m, code]
        distances[i] = dist
        
    return distances
```

**Worked Examples:**
1. `D=4, M=2, K=2`. `query=[1, 1, 2, 2]`. `centroids` for m=0: `[[0,0], [1,1]]`, m=1: `[[0,0], [2,2]]`. `pq_codes = [[1, 1], [0, 0]]`. LUT for m=0: `[2, 0]`. LUT for m=1: `[8, 0]`. Distances: `[0+0=0, 2+8=10]`.
2. `D=2, M=1, K=2`. `query=[0.5, 0.5]`. `centroids` for m=0: `[[0,0], [1,1]]`. `pq_codes = [[0], [1]]`. LUT for m=0: `[0.5, 0.5]`. Distances: `[0.5, 0.5]`.

## Topic 17b: Locality-Sensitive Hashing (LSH)

**Learning Outcome:**
Implement bitwise LSH using random hyperplane projections to achieve extremely low-latency, low-memory Hamming-distance approximate nearest neighbor search.

**Prerequisites:**
- Topic 14: Exact Vector Search
- Topic 05: Integer Arithmetic & Quantization

**Decision Rationale (V3 Evaluation Corrections):**
- Split into a separate topic to isolate Hamming space and projection algorithms from quantization techniques.

### The 5-Rung Ladder

**1. Foundation:**
- **Exact Title:** Hamming Distance Calculation
- **Source Type:** Online Judge
- **Direct URL:** [https://leetcode.com/problems/hamming-distance/](https://leetcode.com/problems/hamming-distance/)
- **Required/Optional:** Required
- **Difficulty Rationale:** Easy. Teaches XOR and bit counting.
- **Transfer Rationale:** The distance metric for LSH binary codes.

**2. Focused Variant:**
- **Exact Title:** Random Hyperplane Projection
- **Source Type:** Custom Problem Contract
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Required
- **Difficulty Rationale:** Medium. Projecting a vector onto a normal vector and taking the sign.
- **Transfer Rationale:** The core hashing function for Cosine LSH.

**3. ML Bridge:**
- **Exact Title:** Cosine LSH Bit Engine
- **Source Type:** Custom Problem Contract (See below)
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Required
- **Difficulty Rationale:** Medium. Generates multi-bit signatures using $B$ random hyperplanes.
- **Transfer Rationale:** Maps continuous high-dimensional space into compact integer bit-signatures.

**4. Named Mechanism:**
- **Exact Title:** LSH Hash Bucket Retrieval
- **Source Type:** Custom Problem Contract (See below)
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Required
- **Difficulty Rationale:** Hard. Using multiple hash tables to increase recall by returning union of collisions.
- **Transfer Rationale:** Standard LSH retrieval index mechanism to avoid scanning the entire database.

**5. Stress/Tradeoff:**
- **Exact Title:** LSH High-Dimensional Recall Fade
- **Source Type:** Custom Problem Contract
- **Direct URL:** N/A (Custom)
- **Required/Optional:** Optional
- **Difficulty Rationale:** Medium. Benchmarking LSH accuracy as $D$ grows vs IVF-PQ.
- **Transfer Rationale:** Proves why modern systems use IVF-PQ or HNSW over LSH for high-accuracy applications.

### Custom Problem Contract: Cosine LSH Bit Engine

**Contract ID:** `CONTRACT-TOPIC-17B-LSH`
**Primary Source:** [Charikar, Similarity Estimation Techniques from Rounding Algorithms](https://www.cs.princeton.edu/courses/archive/spring04/cos598B/bib/CharikarEstim.pdf)

**Objective:** Project a set of vectors using $B$ random hyperplanes and generate a $B$-bit integer signature for each vector where the $i$-th bit is 1 if the dot product with the $i$-th hyperplane is $\ge 0$, and 0 otherwise.

**Inputs:**
- `vectors`: `float32[N, D]` matrix of database vectors.
- `hyperplanes`: `float32[B, D]` matrix of normal vectors for hyperplanes.

**Outputs:**
- `signatures`: `int32[N]` array of binary signatures represented as integers.

**Constraints:**
- $1 \le B \le 31$
- $1 \le D \le 256$
- $1 \le N \le 10,000$

**Python Reference Implementation:**
```python
import numpy as np

def cosine_lsh(vectors, hyperplanes):
    N, D = vectors.shape
    B, _ = hyperplanes.shape
    signatures = np.zeros(N, dtype=np.int32)
    
    # Compute dot products: shape (N, B)
    projections = np.dot(vectors, hyperplanes.T)
    
    for i in range(N):
        sig = 0
        for b in range(B):
            if projections[i, b] >= 0:
                sig |= (1 << b)
        signatures[i] = sig
        
    return signatures
```

**Worked Examples:**
1. `vectors = [[1.0, 0.5]]`, `hyperplanes = [[1.0, 0.0], [0.0, -1.0]]`. Projections: `[1.0, -0.5]`. Bits: 1 (for first hp) and 0 (for second hp). Signature: `01` in binary -> `1`.
2. `vectors = [[-1.0, -1.0]]`, `hyperplanes = [[1.0, 1.0], [-1.0, 1.0]]`. Projections: `[-2.0, 0.0]`. Bits: 0 and 1. Signature: `10` in binary -> `2`.

### Custom Problem Contract: LSH Hash Bucket Retrieval

**Contract ID:** `CONTRACT-TOPIC-17B-LSH-RETRIEVAL`

**Objective:** Retrieve candidate vector IDs by taking the union of hash bucket collisions across multiple independent LSH tables.

**Inputs:**
- `query_signatures`: `int32[T]` array of LSH signatures for the query, one for each table.
- `hash_tables`: List of $T$ dictionaries, where `hash_tables[t]` maps an integer signature to a list of integer vector IDs.

**Outputs:**
- `candidates`: `int32[C]` array of unique candidate vector IDs, sorted ascending.

**Python Reference Implementation:**
```python
def lsh_retrieval(query_signatures, hash_tables):
    T = len(query_signatures)
    candidates = set()
    
    for t in range(T):
        sig = query_signatures[t]
        if sig in hash_tables[t]:
            for vec_id in hash_tables[t][sig]:
                candidates.add(vec_id)
                
    return sorted(list(candidates))
```

**Worked Examples:**
1. `query_signatures = [5, 10]`, `hash_tables = [{5: [1, 2], 6: [3]}, {10: [2, 4], 11: [5]}]`. Table 0 hits signature 5 (IDs `[1, 2]`), Table 1 hits signature 10 (IDs `[2, 4]`). Candidates union: `[1, 2, 4]`.
