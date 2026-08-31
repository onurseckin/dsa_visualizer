import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_kd_trees_top_k_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: High-Performance K-D Tree Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_kd_trees_top_k",
      title: "Implement K-D Tree with Max-Heap Top-K Backtracking Search",
      difficulty: "Hard",
      rationale:
        "Implement a balanced K-D Tree builder and $k$-NN query engine with recursive bounding-box branch pruning and max-heap neighbor tracking.",
      starterCode: `import numpy as np
import heapq
from typing import Dict, List, Any, Tuple, Optional

class Solution:
    """
    K-Dimensional Tree (K-D Tree) Top-K Exact Search Engine.
    Builds balanced spatial tree along alternating median axes and
    prunes subtrees using Euclidean distance boundary checks.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "points": np.ndarray of shape [N, D] (dataset points, float32)
                - "query": np.ndarray of shape [D] (query vector, float32)
                - "k": int (number of nearest neighbors to retrieve)
        Returns:
            Dictionary containing:
                - "top_k_indices": List[int] (indices of k closest points)
                - "top_k_distances": List[float] (Euclidean distances)
                - "nodes_visited_count": int (number of tree nodes evaluated)
                - "exact_match": bool (verified against brute-force scan)
        """
        points = inputs["points"].astype(np.float32)
        query = inputs["query"].astype(np.float32)
        k = int(inputs.get("k", 5))

        N, D = points.shape

        # Tree Node structure: [point_idx, axis, left_child, right_child]
        nodes = []

        def build_tree(indices: List[int], depth: int) -> Optional[int]:
            if not indices:
                return None
            axis = depth % D
            indices.sort(key=lambda idx: points[idx, axis])
            median = len(indices) // 2

            node_idx = len(nodes)
            nodes.append({
                "point_idx": indices[median],
                "axis": axis,
                "left": None,
                "right": None,
            })

            left_child = build_tree(indices[:median], depth + 1)
            right_child = build_tree(indices[median + 1:], depth + 1)

            nodes[node_idx]["left"] = left_child
            nodes[node_idx]["right"] = right_child
            return node_idx

        root = build_tree(list(range(N)), 0)

        # Max-heap: stores (-dist, point_idx)
        heap = []
        visited_count = 0

        def search_knn(curr_node_idx: Optional[int]):
            nonlocal visited_count
            if curr_node_idx is None:
                return

            visited_count += 1
            node = nodes[curr_node_idx]
            pt = points[node["point_idx"]]
            dist = float(np.sqrt(np.sum((query - pt) ** 2)))

            if len(heap) < k:
                heapq.heappush(heap, (-dist, node["point_idx"]))
            elif dist < -heap[0][0]:
                heapq.heapreplace(heap, (-dist, node["point_idx"]))

            axis = node["axis"]
            diff = query[axis] - pt[axis]

            near_child = node["left"] if diff < 0 else node["right"]
            far_child = node["right"] if diff < 0 else node["left"]

            # Explore near child first
            search_knn(near_child)

            # Check if far child needs exploring
            worst_dist = -heap[0][0] if len(heap) >= k else float("inf")
            if abs(diff) < worst_dist:
                search_knn(far_child)

        search_knn(root)

        # Extract sorted results
        sorted_heap = sorted([(-d, idx) for d, idx in heap], key=lambda x: x[0])
        top_indices = [idx for d, idx in sorted_heap]
        top_dists = [d for d, idx in sorted_heap]

        # Brute-force verification
        true_dists = np.sqrt(np.sum((points - query) ** 2, axis=1))
        true_top_k = np.argsort(true_dists)[:k]
        exact_match = np.allclose(top_dists, true_dists[true_top_k])

        return {
            "top_k_indices": top_indices,
            "top_k_distances": top_dists,
            "nodes_visited_count": visited_count,
            "exact_match": bool(exact_match),
        }`,
    },
  ],
};

export const page = page1;
export const page_01_dsa_foundations = page1;
