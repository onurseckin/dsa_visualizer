# Interactive DSA Knowledge Graph & Visualizer

A high-performance, dark-themed **Data Structures and Algorithms (DSA) Knowledge Graph & Interactive Visualizer** built with **React**, **TypeScript**, **Vite**, and **Vanilla CSS**.

The project visualizes **40+ algorithms** mapped across **21 granular topological prerequisite modules** covering core technical interview problems and advanced competitive programming topics (*Competitive Programmer's Handbook*).

---

## Key Features

- 🕸️ **Topological Prerequisite Knowledge Graph**: Interactive SVG prerequisite roadmap mapping foundational data structures to advanced graph flows, range queries, and computational geometry.
- 🐍 **Python Algorithm Code Representation**: Clean, idiomatic Python algorithm listings with real-time active line highlights (`code-line-active`) and live variable watch tables.
- 🎨 **Multi-Kind Primary Visualizers**:
  - **Array Visualizer**: Glowing bars/boxes with pointer markers, comparisons, swaps, and sorted states.
  - **Grid Visualizer**: 2D matrix layout for pathfinding (start, end, walls, visited, path).
  - **Graph Visualizer**: Interactive SVG node-and-edge layout with weight labels and traversal paths.
  - **Tree Visualizer**: SVG binary tree node-and-link renderer.
- 💡 **Step Tutorial Cards**: Dynamic "WHAT IS HAPPENING" and "WHY THIS STEP" pedagogical explanation panels.
- 🔍 **Auxiliary State Inspection**: Real-time side panel inspecting Call Stack, Queue, Visited Set, Hash Map, and Distance Table states.
- 🔊 **Web Audio Sound Engine**: Interactive audio feedback for comparisons, swaps, stack pushes/pops, and algorithm completion.
- 🧪 **Comprehensive Vitest Spec Suite**: Over 250 passing unit and React component tests across 90+ `.spec.ts` and `.spec.tsx` files inside dedicated `specs/` directories.

---

## Topological Module Architecture

```
1. Arrays & Hashing (arrays_and_hashing/)
   ├── 2. Two Pointers (two_pointers/) ──> 5. Sliding Window (sliding_window/)
   │                                   └── 6. Linked List (linked_list/) ──> 7. Tree Fundamentals (tree_fundamentals/)
   ├── 3. Stack & Queue (stack_and_queue/)                                      ├── 8. Tries & String Algs (tries_and_strings/)
   └── 4. Binary Search (binary_search/) ───────────────────────────────────────┼── 9. Heap / Priority Queue (heap_and_priority_queue/)
                                                                               └── 10. Backtracking (backtracking/)
                                                                                        │
   ┌────────────────────────────────────────────────────────────────────────────────────┘
   ▼
11. Graph Traversal (graph_traversal/)
   ├── 12. Graph Shortest Paths (graph_shortest_paths/) ──> 15. Network Flows & Cuts (graph_flows_and_cuts/)
   ├── 13. Spanning Trees & DSU (graph_spanning_trees/)
   └── 14. Directed & SCC Graphs (graph_directed_and_scc/)

16. 1-D Dynamic Programming (dp_1d/) ──> 17. 2-D Dynamic Programming (dp_2d/) ──> 18. Advanced Range Queries (advanced_range_queries/)
19. Bit Manipulation (bit_manipulation/)
20. Math & Number Theory (math_and_number_theory/) ──> 21. Geometry & Sweep Line (geometry_and_sweep_line/)
```

---

## Quick Start & Installation

### Prerequisites

- [Bun](https://bun.sh/) (Recommended) or [Node.js](https://nodejs.org/) (v18+)

### 1. Clone the Repository

```bash
git clone git@github.com-personal:onurseckin/dsa_visualizer.git
cd dsa_visualizer
```

### 2. Install Dependencies

```bash
bun install
# or
npm install
```

### 3. Run Development Server

```bash
bun run dev
# or
npm run dev
```

Open `http://localhost:5173` in your browser to view the app.

---

## Scripts & Quality Control Gate

This repository enforces strict TypeScript and ESLint standards with **0 `any` or `unknown` casts** and **0 ESLint warnings/errors**.

| Command | Action |
|---|---|
| `bun run dev` | Starts Vite local development server |
| `bun run typecheck` | Runs TypeScript compiler verification (`tsc --noEmit`) |
| `bun run lint` | Runs ESLint (`eslint . --ext ts,tsx --max-warnings 0`) |
| `bun run test` | Runs complete Vitest test suite |
| `bun run build` | Builds production bundle into `dist/` |
| **`bun run check`** | **Master Quality Gate**: Runs `typecheck` → `lint` → `test` → `build` |

---

## License

MIT License.
