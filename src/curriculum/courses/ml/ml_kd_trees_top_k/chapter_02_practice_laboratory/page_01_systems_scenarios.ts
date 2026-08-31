import type { CoursePage } from "../../../../courseTypes";

export const page_01_systems_scenarios: CoursePage = {
  id: "ml_kd_trees_top_k_c2_p1_systems",
  pageNumber: 2,
  title: "Silicon Scenarios: Autonomous Robotics Lidar & 3D Spatial Partitioning",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title:
        "Production System Scenario: Autonomous Vehicle Real-Time 3D Lidar Point-Cloud Collision",
      content:
        "In self-driving vehicle stacks (e.g. Waymo, Tesla FSD), 64-beam Lidar sensors stream 1,300,000 3D spatial points $(x, y, z)$ every second (10 Hz sweep). For obstacle avoidance and ICP (Iterative Closest Point) trajectory registration, the perception stack must query the nearest neighbor for 100,000 trajectory points in real time. Because dimension $D = 3$ is strictly low-dimensional ($D \\ll \\log N$), a cache-aligned 3D K-D Tree completes all 100,000 queries in under 4.2 milliseconds, whereas brute-force distance matrix computation requires 150 milliseconds, exceeding the safety real-time control budget.",
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_kd_trees_radius_search",
      title: "Fixed-Radius Spatial Sphere Search Engine",
      difficulty: "Hard",
      rationale:
        "Implement a fixed-radius spatial range query that retrieves all points within Euclidean distance $R$ of a query point, pruning subtrees whose bounding boxes lie entirely outside distance $R$.",
      starterCode: `import numpy as np
from typing import List

def kd_tree_radius_search(points: np.ndarray, query: np.ndarray, radius: float) -> List[int]:
    """
    Finds all point indices with ||x - query|| <= radius.
    """
    # Execute pruned spatial range query
    return []`,
    },
  ],
};

export const page2 = page_01_systems_scenarios;
