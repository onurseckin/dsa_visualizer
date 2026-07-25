# AGENTS.md - Developer & AI Agent Integration Guide

Welcome, AI Agent or Developer! This document explains the architecture, design principles, data structures, and step-by-step procedures for contributing new algorithms, data structures, visualizers, or LeetCode solutions to the **DSA Visualizer** repository.

---

## 1. High-Level Architecture Overview

The repository is structured to separate design tokens, the reusable UI library, visual rendering primitives, step generator engines, algorithm definitions, and test specifications.

```
src/
├── types/dsa.ts                  # Core Master TypeScript Interfaces & Union Types
├── engine/soundEngine.ts         # Web Audio API Sound Generator
├── styles/
│   ├── theme.css                 # Design Tokens — the ONLY place color/spacing/type values live
│   ├── ui.css                    # UI Library Class Styles (`ui-` prefix, BEM-ish)
│   └── index.css                 # Global Resets & App-Level Layout Styles
├── ui/                           # Reusable UI Component Library (barrel: ui/index.ts)
│   ├── Button.tsx / IconButton.tsx / Badge.tsx / Card.tsx / Input.tsx
│   ├── Slider.tsx / Segmented.tsx / Collapsible.tsx / Drawer.tsx / Kbd.tsx
│   └── specs/                    # Vitest Specs for Every UI Component
├── components/
│   ├── KnowledgeGraph.tsx        # Interactive SVG Prerequisite Roadmap
│   ├── MainLayout.tsx            # Main Shell Layout (Header, Visualizer, Code Panel)
│   ├── Navbar.tsx                # Top Navigation (View Switchers, Toggles, Search Trigger)
│   ├── SearchTrigger.tsx         # Input-Lookalike Button That Opens the Search Drawer
│   ├── QuickAccessDrawer.tsx     # Drawer-Based Algorithm Search & Category Browser
│   ├── ControlPanel.tsx          # Playback Controls (Play/Pause, Step, Speed, Size)
│   ├── ComplexityCard.tsx        # Big-O Chips + Plain-English Complexity Prose
│   ├── ResizableLayout.tsx       # Draggable Visualizer/Code Split
│   ├── ProblemList.tsx           # Flat Problem Listing View
│   └── primitives/               # Shared Reusable Visual Primitives
│       ├── ArrayVisualizer.tsx   # 1D Array & Pointer Render Engine
│       ├── GridVisualizer.tsx    # 2D Grid & Pathfinding Render Engine
│       ├── GraphVisualizer.tsx   # SVG Graph Nodes & Weighted Edges Render Engine
│       ├── TreeVisualizer.tsx    # SVG Binary Tree Render Engine
│       ├── AuxiliaryPanel.tsx    # Side Panel (Stack, Queue, Visited Set, Hash Map)
│       ├── TutorialCard.tsx      # Step Pedagogical Explanation Card ("WHAT" / "WHY")
│       ├── CodeBlockViewer.tsx   # Python Code Viewer with Line Highlights & Variables
│       └── ProblemHeader.tsx     # Difficulty Badge, Description & Constraints
└── algorithms/                   # 25 Granular Topic Subdirectories (40 algorithms)
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
  complexityAnalysis: ComplexityAnalysis;       // REQUIRED plain-English complexity prose
  defaultInput: TInput;                         // Initial default input object
  generateSteps: (input: TInput) => AlgorithmStep[]; // Pure generator function
}
```

### The `ComplexityAnalysis` Field (Required)

```typescript
export interface ComplexityAnalysis {
  time: string;  // 2–4 plain-English sentences: WHY the time complexity is what it is
  space: string; // 1–3 sentences: what memory grows and why
}
```

The `ComplexityCard` renders the Big-O chips plus these paragraphs, so the prose must
explain the *reason* behind the bound, not restate it. Example (Two Sum):

- `time`: `We walk the array once, and each hash-map lookup and insert costs O(1) on average, so the total work grows linearly with the number of elements — O(n). Even in the worst case, where no pair exists, we still make just a single pass.`
- `space`: `The hash map stores up to one entry per element before a pair is found, so extra memory grows linearly with the input — O(n).`

### The `AlgorithmStep` Structure

An `AlgorithmStep` is an immutable snapshot generated for each step of execution:

```typescript
export interface AlgorithmStep {
  stepIndex: number;
  codeLine: number;                              // 1-indexed Python code line to highlight
  explanation: {
    what: string;                                // Short present-tense action label (≤ 8 words)
    why: string;                                 // The teacher's sentence(s) — see contract below
  };
  primarySnapshot: PrimaryVisualSnapshot;        // Array, Grid, Graph, or Tree visual state
  auxiliaryState: AuxiliaryState;                // Call stack, Queue, Visited Set, Hash Map, Distance Table
  variables: Record<string, string | number | boolean>; // Live variable watch table
}
```

### Teacher-Voice Explanation Contract

Every step explanation must read like a teacher talking, not a log line:

- **`what`**: short present-tense action label, at most ~8 words (e.g. `Compute the complement`, `Look up 7 in the map`).
- **`why`**: 1–2 conversational sentences explaining why this step happens and what it means, with the **actual runtime values interpolated** into the string. Address the learner as "we". No headers, no bullet lists, no exclamation spam, no robotic `Equation:`-style prefixes, and no Big-O lectures mid-step (a brief complexity note at the final step is fine).

Example (Two Sum, checking the map):

- `what`: `Look up 7 in the map`
- `why`: `We need a partner for 2 that reaches 9, so we check whether 7 has already been seen. It hasn't yet — so we remember 2 and keep walking.`

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

  // Step 1: Initial state — note the teacher voice with real values interpolated
  addStep(
    1,
    'Set up the walk',
    `We start with ${arr.length} elements and nothing examined yet, so we point at the first one and get ready to walk the array.`,
    { n: arr.length }
  );

  // Execution loop...
  return steps;
};
```

---

## 4. UI Library, Theming & Search Flow

### The `src/ui/` Component Library

All interactive chrome is built from the shared library in `src/ui/` (barrel export
`src/ui/index.ts`, class styles in `src/styles/ui.css` with the `ui-` prefix):

| Component | Purpose |
|---|---|
| `Button` | Variants `primary`/`secondary`/`ghost`/`danger`, sizes `sm`/`md`/`lg`, `selected`, `icon`, `fullWidth` |
| `IconButton` | Square icon-only button; `aria-label` required |
| `Badge` | Variants `neutral`/`accent`/`success`/`warning`/`danger`/`info`; helper `difficultyBadgeVariant(difficulty)` maps Easy→success, Medium→warning, Hard→danger |
| `Card` | Surface panel with optional `title`, `icon`, `actions`, `padding`, `inset` |
| `Input` | Text input with `leadingIcon` and `onClear` support |
| `Slider` | Labeled range input with `formatValue` |
| `Segmented` | Single-select toggle group (replaces hand-rolled toggles) |
| `Collapsible` | Header-button + chevron section with optional controlled `open` |
| `Drawer` | Right-side dialog with backdrop, ESC/backdrop close, `--z-drawer` |
| `Kbd` | Small keycap chip for shortcut hints (e.g. `/`) |

**Rule: every button, badge, card, input, and drawer in the app comes from `src/ui/` —
never hand-roll one-off equivalents in feature components.** Shared helper classes
`.ui-code-line` / `.ui-code-line--active` (code viewer rows) and `.ui-chip` (mono
key/value chips) also live in `ui.css`.

### Styling Only via Tokens

All colors, spacing, type sizes, radii, shadows, and z-indices come from the design
tokens in `src/styles/theme.css` (`--bg-*`, `--border-*`, `--accent*`, `--text-*`,
`--state-*`, `--space-*`, `--text-xs..2xl`, `--radius-*`, `--shadow-*`, `--z-*`).
**Never hardcode hex/rgba color values or ad-hoc pixel/rem sizes in components** —
reference tokens with `var(--token)`. Element visual states map 1:1 to the
`--state-<name>` / `--state-<name>-bg` token pairs for every `ElementState`.

### Search Flow (SearchTrigger → QuickAccessDrawer)

- The navbar renders `SearchTrigger`: a button styled to look like an input
  (`🔍 Search algorithms… ⟨/⟩` with a `Kbd` chip). Clicking it — or pressing `/`
  anywhere outside an input/textarea/select/contenteditable — opens the
  `QuickAccessDrawer`. ESC or backdrop click closes it.
- `QuickAccessDrawer` (built on `ui/Drawer`) contains an autofocused search `Input`
  at the top, then one `Collapsible` section per category with a per-category count
  `Badge`. The active algorithm's category starts open; others start collapsed. While
  searching, only categories with matches render and they are auto-expanded. The
  selected algorithm row uses the standard selected treatment plus a check icon, and
  every row shows its difficulty `Badge`.
- There is no dropdown-results search bar; the drawer owns all searching.

---

## 5. Step-by-step Procedure to Add a New Algorithm

Follow these 5 steps whenever adding a new algorithm, LeetCode problem, or data structure:

### Step 1: Create Algorithm File in the Appropriate Topic Directory
Create `src/algorithms/<category_folder>/<algorithm_name>.ts`.

- Choose the appropriate directory from the **25 Granular Modules** (e.g. `graph_shortest_paths`, `tries_and_strings`, `dp_1d`, `math_and_number_theory`).
- Provide clean **Python** code in `code: PYTHON_CODE_STRING`.
- Include the required `complexityAnalysis: { time, space }` prose (see section 2 guidelines).
- Write step explanations in the teacher voice (see section 2 contract).
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
Update the corresponding node in `TOPIC_ROADMAP_NODES` array (or increment `algorithmCount`).

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

## 6. Strict Code Quality Rules for AI Agents

1. **NO `any` or `unknown` casts**: Always use proper interfaces from `src/types/dsa.ts` or narrow types using type guards (`if (snapshot.kind === 'graph') { ... }`).
2. **NO Suppression Comments**: Never use `@ts-ignore`, `@ts-expect-error`, or `eslint-disable`.
3. **Python Code Representation Only**: All algorithm code strings displayed in the Code Block Viewer **MUST** be written in Python.
4. **UI From the Library, Colors From Tokens**: Buttons, badges, cards, inputs, and drawers come from `src/ui/`; all color/size values reference tokens in `src/styles/theme.css` — no hardcoded hex/rgba in components.
5. **Isolate Specs in `specs/`**: All Vitest test files must live inside the `specs/` subdirectory of their dedicated category folder.
6. **Conventional Commits**: Every git commit message must begin with an approved tag (e.g. `feat:`, `fix:`, `refactor:`, `test:`, `ci:`).
