import { CategoryType } from '../types/dsa';

export const CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: 'arrays_and_hashing', label: '1. Arrays & Hashing' },
  { id: 'two_pointers', label: '2. Two Pointers' },
  { id: 'stack_and_queue', label: '3. Stack & Queue' },
  { id: 'binary_search', label: '4. Binary Search' },
  { id: 'sliding_window', label: '5. Sliding Window' },
  { id: 'linked_list', label: '6. Linked List' },
  { id: 'tree_fundamentals', label: '7. Tree Fundamentals' },
  { id: 'tree_queries_and_diameter', label: '8. Tree Queries & Diameter' },
  { id: 'tries_and_strings', label: '9. Tries & Strings' },
  { id: 'heap_and_priority_queue', label: '10. Heap / Priority Queue' },
  { id: 'backtracking', label: '11. Backtracking' },
  { id: 'graph_traversal', label: '12. Graph Traversal' },
  { id: 'graph_shortest_paths', label: '13. Graph Shortest Paths' },
  { id: 'graph_spanning_trees', label: '14. Graph Spanning Trees' },
  { id: 'graph_directed_and_scc', label: '15. Graph Directed & SCC' },
  { id: 'graph_flows_and_cuts', label: '16. Graph Flows & Cuts' },
  { id: 'dp_1d', label: '17. 1-D Dynamic Programming' },
  { id: 'dp_2d', label: '18. 2-D Dynamic Programming' },
  { id: 'intervals', label: '19. Intervals' },
  { id: 'greedy_algorithms', label: '20. Greedy Algorithms' },
  { id: 'bit_manipulation', label: '21. Bit Manipulation' },
  { id: 'math_and_number_theory', label: '22. Math & Number Theory' },
  { id: 'game_theory', label: '23. Game Theory' },
  { id: 'advanced_range_queries', label: '24. Advanced Range Queries' },
  { id: 'geometry_and_sweep_line', label: '25. Geometry & Sweep Line' },
];

const CATEGORY_ID_SET = new Set<string>(CATEGORIES.map((category) => category.id));

/* Narrowing guard for URL search params: only the canonical category ids above
   count — the legacy CategoryType aliases are not valid routeable filters. */
export function isCategoryType(
  value: string | number | boolean | null | undefined | object
): value is CategoryType {
  return typeof value === 'string' && CATEGORY_ID_SET.has(value);
}
