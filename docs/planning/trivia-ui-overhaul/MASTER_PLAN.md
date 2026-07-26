# DSA Visualizer: Master Engineering & Design System Plan

## Executive Overview

This document serves as the single authoritative master plan for the comprehensive design system overhaul, application-wide modularization, keyboard interactivity audit, and unit test coverage expansion for the DSA Visualizer codebase.

---

## Agent Task Streams

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   MASTER PLAN STREAMS                                  │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ Stream 1: Design & UI    │ Stream 2: Modularization │ Stream 3: Interactivity & Tests │
│ (ui_design_architect)    │ (code_modularizer)       │ (keyboard_auditor & coverage)    │
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

---

## Stream 1: Visual Design System, Design Tokens & UI Aesthetics (`ui_design_architect`)

### 1.1 Inverted Surface Token Architecture (`src/styles/theme.css`)

- **Page Base Layer**: Carbon dark `#17171b` (`--bg-page`).
- **Cards & Panels Layer**: Deep near-black `#0a0a0c` (`--bg-surface`).
- **Wells & Insets Layer**: Pitch black `#050506` (`--bg-inset`).
- **Raised Interactive Layer**: Step lighter `#1f1f24` (`--bg-raised`).
- **Border Tokens**:
  - Subdued border: `1px solid var(--border-subtle)` (`#222228`)
  - Default border: `1px solid var(--border-default)` (`#2e2e36`)
  - Accent border: `1px solid var(--border-accent)` (`#6366f1`)
- **Typography Scale**:
  - Display headers: `Inter`, `Outfit` (sans-serif)
  - Code & tokens: `JetBrains Mono`, `Fira Code` (monospace)

### 1.2 Spacing & Margin Utility Rules

- All cards, panels, and sections MUST enforce explicit margin and padding structures using CSS custom properties:
  - `padding: var(--space-4)` (16px) for compact cards
  - `padding: var(--space-5) var(--space-6)` (20px 24px) for page view containers
  - `gap: var(--space-3)` (12px) for toolbar buttons
  - `gap: var(--space-4)` (16px) for form inputs & rows

### 1.3 User Information & UX Flow Hierarchy

- **Session Construction**: Clear step-by-step guidance when choosing algorithm decks, difficulty floor/ceiling (`minBlanks`–`maxBlanks`), and distractor options.
- **Session Naming**: Automatic incremental naming (`Trivia 1`, `Trivia 2`...) with instant inline rename support.
- **Session Drilling**: Intuitive round progress bar, line level indicator, active algorithm header, and Mac-based shortcut badges (`<Kbd>`).
- **Session State**: Explicit status badges (`Active`, `Paused`, `Completed`) with immediate `localStorage` synchronization.

---

## Stream 2: Code Modularization & Architecture Refactoring (`code_modularizer`)

### 2.1 Component Decomposition Map

```
src/
├── components/
│   ├── trivia/
│   │   ├── TriviaHeaderCard.tsx        # Header strip & master controls
│   │   ├── TriviaSessionsManager.tsx   # Saved sessions bar & manager
│   │   ├── TriviaCompletionCard.tsx   # Celebration card on curriculum completion
│   │   ├── TriviaDeckBuilder.tsx      # Category deck selector with embedded Add All
│   │   ├── TriviaSettings.tsx         # Difficulty floor/ceiling & mode sliders
│   │   ├── TriviaSession.tsx          # Active drill controller & button flow
│   │   ├── CodePuzzle.tsx             # Python syntax highlighted board & slots
│   │   └── TileTray.tsx               # Shuffled choice mode drag/click tiles
│   ├── primitives/
│   │   ├── ArrayVisualizer.tsx        # kind: 'array' viz
│   │   ├── GridVisualizer.tsx         # kind: 'grid' viz
│   │   ├── GraphVisualizer.tsx        # kind: 'graph' viz with line rim trimming
│   │   ├── TreeVisualizer.tsx         # kind: 'tree' viz with line rim trimming
│   │   ├── CodeBlockViewer.tsx        # Shared Python syntax highlighting engine
│   │   ├── AuxiliaryPanel.tsx         # Working data chips
│   │   └── TutorialCard.tsx           # Step explanation header
```

### 2.2 Reusable Utilities & Hooks

- Extract shared helper functions into dedicated utility modules:
  - `src/trivia/triviaSessions.ts`: Session lifecycle, CRUD operations, incremental naming.
  - `src/trivia/triviaStorage.ts`: Defensive localStorage persistence, validation, schema versioning.
  - `src/trivia/triviaEngine.ts`: Pure step generator, Cloze deletion round picker, Leitner-weighted recall grading.

---

## Stream 3: Application-Wide Interactivity & Keyboard Audit (`keyboard_auditor`)

### 3.1 Keyboard Shortcut Matrix

| Shortcut            | Action                                | Scope                                      |
| ------------------- | ------------------------------------- | ------------------------------------------ |
| `Tab` / `Shift+Tab` | Cycle focus between blank input slots | `CodePuzzle`                               |
| `Enter`             | Submit round / advance to next round  | `TriviaSession`                            |
| `⌘+R` / `Ctrl+R`    | Retry current round                   | `TriviaSession`                            |
| `⌘+H` / `Ctrl+H`    | Toggle hint for focused line          | `CodePuzzle`                               |
| `⌘+E` / `Ctrl+E`    | Reveal answer for focused line        | `CodePuzzle`                               |
| `Esc`               | Clear tile selection / close modals   | `TriviaSession`, `Drawer`, `ConfirmDialog` |
| `⌘+K` or `/`        | Open quick access search drawer       | Global (`Navbar`)                          |
| `Space`             | Play/Pause visualizer execution       | `workspace`                                |
| `ArrowRight`        | Step forward                          | `workspace`                                |
| `ArrowLeft`         | Step backward                         | `workspace`                                |

### 3.2 Interactivity Guard Policy

- All interactive controls MUST be wrapped in `isTypingTarget` / `isDialogOpen` guards to prevent keystroke collisions when typing inside `<input>` or `<textarea>` elements.

---

## Stream 4: Unit Test Coverage Expansion & Bug Fixes (`coverage_orchestrator`)

### 4.1 Master Quality Gate Mandate

```bash
$ bun run typecheck  # 0 errors
$ bun run lint       # 0 warnings, 0 errors
$ bun run test       # 100% passing tests across all spec files
$ bun run build      # Production static bundle succeeds
```

### 4.2 Test File Inventory & Naming Law

- Component specs MUST end in `.render.spec.tsx`.
- Pure logic specs MUST end in `.spec.ts`.
- No `.spec.tsx` sharing a basename with a `.spec.ts` sibling (prevents TypeScript silent exclusion).

---

## Comprehensive Module Checklist

### 1. `src/types/trivia.ts`

- [x] Define `TriviaMode` ('choice' | 'type')
- [x] Define `TriviaConfig`
- [x] Define `PuzzleLine`
- [x] Define `TriviaTile`
- [x] Define `TriviaRound`
- [x] Define `TriviaProgress`
- [x] Define `TriviaSessionStatus` ('active' | 'paused' | 'completed')
- [x] Define `TriviaSessionRecord`

### 2. `src/trivia/triviaSessions.ts`

- [x] `generateNextSessionName(sessions)` (Incremental Trivia 1, Trivia 2)
- [x] `readTriviaSessions()`
- [x] `writeTriviaSessions(sessions)`
- [x] `readActiveSessionId()`
- [x] `writeActiveSessionId(id)`
- [x] `createSession(name, config, progress)`
- [x] `updateSession(id, patch)`
- [x] `deleteSession(id)`

### 3. `src/components/trivia/TriviaHeaderCard.tsx`

- [x] Render header card with active session name and status badge
- [x] Render level, rounds played, algorithms, and coverage badges
- [x] Render animated deck coverage progress bar
- [x] Render primary action button (**Start drilling** / **Edit deck**)
- [x] Render **New session** and **Reset progress** buttons

### 4. `src/components/trivia/TriviaSessionsManager.tsx`

- [x] Render saved sessions container card
- [x] Render active/paused session pills with algorithm count
- [x] Support inline renaming (`Edit2` icon)
- [x] Support session selection & resume
- [x] Support session deletion with confirmation

### 5. `src/components/trivia/TriviaDeckBuilder.tsx`

- [x] Render search and category/difficulty filter toolbar
- [x] Render category collapsible section cards
- [x] Place **Add all** button inside collapsible header `meta` prop
- [x] Render individual algorithm selection buttons with difficulty badges

### 6. `src/components/trivia/CodePuzzle.tsx`

- [x] Render Python syntax highlighted code lines using `highlightPythonLine`
- [x] Auto-focus first blank input on mount in "Type from memory" mode
- [x] Support `Tab`, `Enter`, `⌘+R` (retry), `⌘+H` (hint) keyboard shortcuts
- [x] Preserve vibrant Python syntax colors inside graded correct (green) and incorrect (red) slots

### 7. `src/components/trivia/TriviaSession.tsx`

- [x] Render active algorithm title, hidden lines badge, and mode description
- [x] Render CodePuzzle board and TileTray
- [x] Render action button bar (**Check answers ↵**, **Next round ↵**, **Retry ⌘R**)
- [x] Render **Pause & exit** button in header to return cleanly to dashboard

### 8. `src/routes/trivia.tsx`

- [x] Orchestrate `TriviaHeaderCard`, `TriviaSessionsManager`, `TriviaDeckBuilder`, `TriviaSettings`, and `TriviaSession`
- [x] Handle route lifecycle and persistent `localStorage` synchronization
- [x] Handle reset dialog modal confirmation

### 9. Test Suite Verification

- [x] `src/trivia/specs/triviaSessions.spec.ts`
- [x] `src/trivia/specs/triviaEngine.spec.ts`
- [x] `src/trivia/specs/triviaStorage.spec.ts`
- [x] `src/trivia/specs/triviaFlow.spec.ts`
- [x] `src/components/trivia/specs/TriviaHeaderCard.render.spec.tsx`
- [x] `src/components/trivia/specs/TriviaSessionsManager.render.spec.tsx`
- [x] `src/components/trivia/specs/TriviaDeckBuilder.spec.tsx`
- [x] `src/components/trivia/specs/TriviaSession.spec.tsx`
- [x] `src/components/trivia/specs/TriviaSettings.spec.tsx`
- [x] `src/components/trivia/specs/CodePuzzle.spec.tsx`
- [x] `src/components/trivia/specs/TileTray.spec.tsx`
- [x] `src/routes/specs/trivia.render.spec.tsx`
