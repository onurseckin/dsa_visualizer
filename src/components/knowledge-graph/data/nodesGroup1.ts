import type { TopicFamilyId } from "./topicFamilies";

export interface TopicRoadmapNode {
  id: string;
  title: string;
  categoryFolder: string;
  description: string;
  prerequisites: string[];
  algorithmCount: number;
  difficulty: "Easy" | "Medium" | "Hard";
  family: TopicFamilyId;
  x: number;
  y: number;
}

export const NODES_GROUP_1: TopicRoadmapNode[] = [
  {
    id: "arrays-and-hashing",
    title: "1. Arrays & Hashing",
    categoryFolder: "arrays_and_hashing",
    description: "Hash Maps, Frequency Counters, Prefix Sums, Subarray Sums",
    prerequisites: [],
    algorithmCount: 4,
    difficulty: "Easy",
    family: "foundations",
    x: 675,
    y: 60,
  },
  {
    id: "two-pointers",
    title: "2. Two Pointers",
    categoryFolder: "two_pointers",
    description: "Target Sum, Sorted Arrays, Container With Most Water",
    prerequisites: ["arrays-and-hashing"],
    algorithmCount: 3,
    difficulty: "Easy",
    family: "foundations",
    x: 155,
    y: 190,
  },
  {
    id: "stack-and-queue",
    title: "3. Stack & Queue",
    categoryFolder: "stack_and_queue",
    description: "LIFO Stack, Queue, Valid Parentheses, Monotonic Stack",
    prerequisites: ["arrays-and-hashing"],
    algorithmCount: 3,
    difficulty: "Easy",
    family: "linear-structures",
    x: 415,
    y: 190,
  },
  {
    id: "binary-search",
    title: "4. Binary Search",
    categoryFolder: "binary_search",
    description: "Binary Search, Search 2D Matrix, Monotonic Feasibility",
    prerequisites: ["arrays-and-hashing"],
    algorithmCount: 3,
    difficulty: "Easy",
    family: "searching",
    x: 675,
    y: 190,
  },
  {
    id: "sliding-window",
    title: "5. Sliding Window",
    categoryFolder: "sliding_window",
    description: "Contiguous Subarrays, Monotonic Queue Window Minimum",
    prerequisites: ["two-pointers"],
    algorithmCount: 3,
    difficulty: "Medium",
    family: "foundations",
    x: 155,
    y: 320,
  },
  {
    id: "linked-list",
    title: "6. Linked List",
    categoryFolder: "linked_list",
    description: "Node Pointers, Reversal, Merge Sorted, Cycle Detection",
    prerequisites: ["two-pointers"],
    algorithmCount: 3,
    difficulty: "Easy",
    family: "linear-structures",
    x: 415,
    y: 320,
  },
  {
    id: "tree-fundamentals",
    title: "7. Tree Fundamentals",
    categoryFolder: "tree_fundamentals",
    description: "Binary Trees, BSTs, Traversals, Lowest Common Ancestor",
    prerequisites: ["linked-list", "binary-search"],
    algorithmCount: 4,
    difficulty: "Medium",
    family: "trees-and-heaps",
    x: 675,
    y: 320,
  },
  {
    id: "tries-and-strings",
    title: "8. Tries & String Algs",
    categoryFolder: "tries_and_strings",
    description: "Prefix Trees, KMP String Match, Z-Algorithm, Hashing",
    prerequisites: ["tree-fundamentals"],
    algorithmCount: 4,
    difficulty: "Medium",
    family: "trees-and-heaps",
    x: 155,
    y: 450,
  },
  {
    id: "heap-and-priority-queue",
    title: "9. Heap / Priority Queue",
    categoryFolder: "heap_and_priority_queue",
    description: "Kth Largest Element, Min/Max Heap, Task Scheduler",
    prerequisites: ["tree-fundamentals"],
    algorithmCount: 3,
    difficulty: "Medium",
    family: "trees-and-heaps",
    x: 415,
    y: 450,
  },
  {
    id: "backtracking",
    title: "10. Backtracking",
    categoryFolder: "backtracking",
    description: "Subsets, Permutations, Combination Sum, N-Queens",
    prerequisites: ["tree-fundamentals"],
    algorithmCount: 4,
    difficulty: "Medium",
    family: "recursion",
    x: 675,
    y: 450,
  },
];
