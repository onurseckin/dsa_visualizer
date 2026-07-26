# Master Execution Plan V2: Trivia UX, Session Flow, Line Cues & Shared Workspace Integration

## Executive Overview

This master plan addresses user feedback regarding the Trivia session lifecycle, control flow logic, category badge visual alignment, line-level explanation cues, and seamless integration between Trivia and the Workspace code viewer.

---

## Execution Streams

### Stream 1: Session Lifecycle & Control Flow Logic Refinement

- **Target Files**: `src/routes/trivia.tsx`, `src/components/trivia/TriviaHeaderCard.tsx`, `src/components/trivia/TriviaSessionsManager.tsx`, `src/trivia/triviaSessions.ts`
- **Tasks**:
  1. Fix conflicting control buttons: Disambiguate "Start Drilling", "Pause Drilling", "New Session", and "Reset Progress".
     - When drilling is active: Show "Pause & Setup" or "Pause Session".
     - When in setup: Show "Start Drilling" (if deck is non-empty) or "+ New Session".
     - "Reset Progress" is gated to active sessions with non-zero progress, with confirmation dialog.
  2. Enhanced Session Naming & Pill Manager:
     - Provide automatic default names (`Session 1`, `Session 2`, ...) when creating sessions.
     - Add inline edit box / input in `TriviaHeaderCard` and `TriviaSessionsManager` to rename active/saved sessions directly.
     - Display active and paused sessions with clear state indicators at the top of the Trivia view.
     - Gracefully handle session exit/pause so progress is never lost.

### Stream 2: Deck Builder Search, Select & Badge Geometry Uniformity

- **Target Files**: `src/components/trivia/TriviaDeckBuilder.tsx`, `src/components/trivia/TriviaSettings.tsx`, `src/styles/ui.css`
- **Tasks**:
  1. Search & Filter Integration: Ensure live search input works seamlessly alongside category and difficulty filter pills.
  2. Fixed Badge Geometry: Standardize badge dimensions for difficulty badges (`Easy`, `Medium`, `Hard`) and algorithm count chips:
     - Apply fixed min-width (`minWidth: '68px'`, `textAlign: 'center'`, uniform padding) so badges align vertically across category cards.
  3. Visual Polish: Ensure proper carbon dark surfaces (`--bg-surface`), borders (`--border-default`), and zero layout shifts on expand/collapse.

### Stream 3: Shared Line-Level Educational Cues & Workspace Integration

- **Target Files**: `src/types/dsa.ts`, `src/types/trivia.ts`, `src/components/trivia/CodePuzzle.tsx`, `src/components/trivia/TriviaSession.tsx`, `src/components/primitives/CodeBlockViewer.tsx`, `src/algorithms/**/*.ts`
- **Tasks**:
  1. Shared Line Explanation Schema: Ensure `TriviaMeta` / `AlgorithmDefinition` includes comprehensive line-by-line educational explanations (`hints` / `lineExplanations`).
  2. Line Cues in Trivia (`CodePuzzle.tsx`):
     - Display an active helper cue callout for the currently selected/focused line blank in addition to the full line reveal option (`⌘+E`).
     - Provide both line cue guidance and reveal buttons cleanly on each blank slot.
  3. Line Explanation Popover in Workspace (`CodeBlockViewer.tsx`):
     - In the visualizer's code viewer panel, make line numbers interactive (or add an info indicator).
     - Clicking a line number opens a clean popover explaining what that specific Python code line accomplishes in the algorithm.
  4. Jump to Workspace from Trivia:
     - Add a "Study in Workspace" button (`<Button icon={ExternalLink}>`) in `TriviaSession.tsx` and `TriviaHeaderCard.tsx` that routes to `/workspace/:algorithmId` to let learners inspect visualizations before resuming trivia.

### Stream 4: 100% Unit & Render Test Coverage Audit

- **Target Files**: `src/routes/specs/*.tsx`, `src/components/trivia/specs/*.tsx`, `src/components/primitives/specs/*.tsx`, `src/trivia/specs/*.ts`
- **Tasks**:
  1. Write unit and component render tests for session naming, pause/resume flow, line cues in `CodePuzzle`, line popovers in `CodeBlockViewer`, and jump-to-workspace navigation.
  2. Enforce `.render.spec.tsx` naming convention for all React component specs.
  3. Verify master quality gate `bun run check` (typecheck + lint + test + build).

---

## Quality Requirements

- **TypeScript**: 0 `any` / 0 `unknown` / 0 suppression comments (`@ts-ignore`).
- **Styling**: Standard design tokens from `src/styles/theme.css` and `ui.css`.
- **Verification**: All changes must pass `bun run check`.
