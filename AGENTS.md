# AGENTS.md - Developer & AI Agent Integration Guide

Welcome, AI Agent or Developer! This document explains the architecture, design principles, data structures, and step-by-step procedures for contributing new algorithms, data structures, visualizers, or LeetCode solutions to the **DSA Visualizer** repository.

---

## 1. High-Level Architecture Overview

The repository is structured to separate visual rendering primitives, step generator engines, algorithm definitions, and test specifications.

```
src/
├── types/dsa.ts                  # Core Master TypeScript Interfaces & Union Types
├── engine/soundEngine.ts         # Web Audio API Sound Generator
├── components/
│   ├── KnowledgeGraph.tsx        # Interactive SVG Prerequisite Roadmap
│   ├── MainLayout.tsx            # Main Shell Layout (Header, Visualizer, Code Panel)
│   └── primitives/               # Shared Reusable Visual Primitives
│       ├── ArrayVisualizer.tsx   # 1D Array & Pointer Render Engine
│       ├── GridVisualizer.tsx    # 2D Grid & Pathfinding Render Engine
│       ├── GraphVisualizer.tsx   # SVG Graph Nodes & Weighted Edges Render Engine
│       ├── TreeVisualizer.tsx    # SVG Binary Tree Render Engine
│       ├── AuxiliaryPanel.tsx    # Side Panel (Stack, Queue, Visited Set, Hash Map)
│       ├── TutorialCard.tsx      # Step Pedagogical Explanation Card ("WHAT" / "WHY")
│       ├── CodeBlockViewer.tsx   # Python Code Viewer with Line Highlights & Variables
│       └── ProblemHeader.tsx     # Difficulty Badge, Description & Constraints
└── algorithms/                   # 21 Granular Topic Subdirectories
    ├── registry.ts               # Central ALGORITHM_REGISTRY Export
    ├── <category_folder>/        # Dedicated Topic Directory (e.g., graph_shortest_paths/)
    │   ├── <algorithm_name>.ts   # Algorithm Definition, Python Code & Step Generator
    │   └── specs/                # Dedicated Specs Subdirectory
    │       ├── <algorithm>.spec.ts   # Vitest Algorithm Logic Specs
    │       └── <algorithm>.spec.tsx  # Vitest React Component Render Specs
```

---

## 2. Core Data Contracts (`src/types/dsa.ts`)

Every algorithm in this codebase is defined via the `AlgorithmDefinition<TInput>` interface:

```typescript
export interface AlgorithmDefinition<TInput = unknown> {
  id: string;                                   // Unique URL slug (e.g. 'dijkstra-shortest-path')
  title: string;                                // Display title (e.g. "Dijkstra's Shortest Path Algorithm")
  category: CategoryType;                       // Module folder name (e.g. 'graph_shortest_paths')
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  description: string;
  constraints?: string[];
  examples?: ProblemExample[];
  code: string;                                 // Python code string representation
  timeComplexity: { best: string; average: string; worst: string };
  spaceComplexity: string;
  defaultInput: TInput;                         // Initial default input object
  generateSteps: (input: TInput) => AlgorithmStep[]; // Pure generator function
}
```

### The `AlgorithmStep` Structure

An `AlgorithmStep` is an immutable snapshot generated for each step of execution:

```typescript
export interface AlgorithmStep {
  stepIndex: number;
  codeLine: number;                              // 1-indexed Python code line to highlight
  explanation: {
    what: string;                                // Clear description of what happened in this step
    why: string;                                 // Pedagogical reason why this step was taken
  };
  primarySnapshot: PrimaryVisualSnapshot;        // Array, Grid, Graph, or Tree visual state
  auxiliaryState: AuxiliaryState;                // Call stack, Queue, Visited Set, Hash Map, Distance Table
  variables: Record<string, string | number | boolean>; // Live variable watch table
}
```

### Visual Snapshot Variants

1. **`ArrayVisualSnapshot`** (`kind: 'array'`): `ArrayElement[]` containing `id`, `value`, `state`, and optional `pointers: string[]`.
2. **`GridVisualSnapshot`** (`kind: 'grid'`): 2D matrix `GridCellNode[][]` containing `isStart`, `isEnd`, `isWall`, `isVisited`, `isPath`.
3. **`GraphVisualSnapshot`** (`kind: 'graph'`): `GraphNodeItem[]` and `GraphEdgeItem[]` containing `x`, `y`, `weight`, `isTraversed`, `isPath`.
4. **`TreeVisualSnapshot`** (`kind: 'tree'`): `TreeNodeItem[]` containing `val`, `leftId`, `rightId`, `state`, `x`, `y`.

---

## 3. Step Generator Pattern Guide

Step generators **MUST** be pure functions that run synchronously and return an array of `AlgorithmStep`.

### Example Generator Skeleton

```typescript
import type { AlgorithmDefinition, AlgorithmStep, ArrayVisualSnapshot } from '../../types/dsa';

export const PYTHON_EXAMPLE_CODE = `def example_algo(arr):
    n = len(arr)
    for i in range(n):
        # Step logic
        pass`;

export interface ExampleInput {
  array: number[];
}

export const generateExampleSteps = (input: ExampleInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const arr = [...input.array];
  let stepIdx = 0;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    vars: Record<string, string | number | boolean>,
    activeIndices?: number[]
  ) => {
    steps.push({
      stepIndex: stepIdx++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'array',
        elements: arr.map((val, idx) => ({
          id: `elem-${idx}`,
          value: val,
          state: activeIndices?.includes(idx) ? 'active' : 'default',
        })),
      },
      auxiliaryState: {
        customState: { currentStep: stepIdx },
      },
      variables: vars,
    });
  };

  // Step 1: Initial state
  addStep(1, 'Initialize algorithm', 'Set initial pointers and variables', { n: arr.length });

  // Execution loop...
  return steps;
};
```

---

## 4. Step-by-step Procedure to Add a New Algorithm

Follow these 5 steps whenever adding a new algorithm, LeetCode problem, or data structure:

### Step 1: Create Algorithm File in the Appropriate Topic Directory
Create `src/algorithms/<category_folder>/<algorithm_name>.ts`.

- Choose the appropriate directory from the **21 Granular Modules** (e.g. `graph_shortest_paths`, `tries_and_strings`, `dp_1d`, `math_and_number_theory`).
- Provide clean **Python** code in `code: PYTHON_CODE_STRING`.
- Enforce strict typing with **0 `any` or `unknown` casts**.

### Step 2: Create Spec Files in `specs/` Subdirectory
Inside `src/algorithms/<category_folder>/specs/`:

1. **Logic Spec** (`<algorithm_name>.spec.ts`):
   ```typescript
   import { describe, expect, it } from 'vitest';
   import { myAlgo, generateMyAlgoSteps, DEFAULT_INPUT } from '../myAlgo';

   describe('myAlgo algorithm logic spec', () => {
     it('should have correct metadata', () => {
       expect(myAlgo.id).toBe('my-algo');
       expect(myAlgo.category).toBe('my_category_folder');
     });

     it('should generate valid steps', () => {
       const steps = generateMyAlgoSteps(DEFAULT_INPUT);
       expect(steps.length).toBeGreaterThan(0);
     });
   });
   ```

2. **React Component Render Spec** (`<algorithm_name>.spec.tsx`):
   ```typescript
   import { render, screen } from '@testing-library/react';
   import { describe, expect, it, vi } from 'vitest';
   import { MainLayout } from '../../../components/MainLayout';
   import { myAlgo, generateMyAlgoSteps, DEFAULT_INPUT } from '../myAlgo';

   describe('myAlgo React Component Spec', () => {
     it('renders layout cleanly', () => {
       const steps = generateMyAlgoSteps(DEFAULT_INPUT);
       render(
         <MainLayout
           algorithm={myAlgo}
           currentStep={steps[0]}
           viewMode="split"
           showTutorial={true}
           showAuxiliary={true}
           onToggleTutorial={vi.fn()}
           onToggleAuxiliary={vi.fn()}
         />
       );
       expect(screen.getAllByText(/My Algo Title/i)[0]).toBeInTheDocument();
     });
   });
   ```

### Step 3: Register in `src/algorithms/registry.ts`
Import your algorithm and register it in `ALGORITHM_REGISTRY`:

```typescript
import { myAlgo } from './my_category_folder/myAlgo';

export const ALGORITHM_REGISTRY: Record<string, AlgorithmDefinition> = {
  // ...
  'my-algo': myAlgo as AlgorithmDefinition,
};
```

### Step 4: Update Knowledge Graph Node in `src/components/KnowledgeGraph.tsx`
Update the corresponding node in `NEETCODE_NODES` array (or increment `algorithmCount`).

### Step 5: Verify Master Quality Gate
Run the master quality gate command in your terminal:

```bash
bun run check
```

Ensure:
- `tsc --noEmit` returns **0 errors**.
- `eslint` returns **0 warnings and 0 errors**.
- `vitest run` passes **100% of test specs**.
- `vite build` builds production bundle cleanly.

---

## 5. Strict Code Quality Rules for AI Agents

1. **NO `any` or `unknown` casts**: Always use proper interfaces from `src/types/dsa.ts` or narrow types using type guards (`if (snapshot.kind === 'graph') { ... }`).
2. **NO Suppression Comments**: Never use `@ts-ignore`, `@ts-expect-error`, or `eslint-disable`.
3. **Python Code Representation Only**: All algorithm code strings displayed in the Code Block Viewer **MUST** be written in Python.
4. **Isolate Specs in `specs/`**: All Vitest test files must live inside the `specs/` subdirectory of their dedicated category folder.
5. **Conventional Commits**: Every git commit message must begin with an approved tag (e.g. `feat:`, `fix:`, `refactor:`, `test:`, `ci:`).
