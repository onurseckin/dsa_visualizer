# Master Plan: Trivia UI Overhaul, Code Modularization, Keyboard Interactivity & 100% Test Coverage

> **Goal**: Complete architectural modularization, visual design system elevation, robust keyboard interactivity, and comprehensive unit/component test coverage expansion across the entire Trivia feature set (`/trivia`) and application.

---

## Architecture & System Blueprint

### 1. Inverted Surface & Design Token System
- **Page Canvas**: Deep carbon `#17171b` (`--bg-page`).
- **Cards & Panels**: Near-black `#0a0a0c` (`--bg-surface`), raised controls step lighter (`--bg-inset`).
- **Borders & Framing**: Every card, panel, well, button, and badge MUST carry an explicit border token (`1px solid var(--border-default)` or `var(--border-strong)`).
- **Typography & Scale**: System UI font stack (`Inter`, `Outfit`) for text; monospace (`JetBrains Mono`, `Fira Code`) for Python source code.

---

## Step-by-Step Implementation Roadmap

### Phase 1: Code Modularization & Component Decomposition
- [x] **Step 1.1**: Create `TriviaSessionRecord` & `TriviaSessionStatus` contracts in `src/types/trivia.ts`.
- [x] **Step 1.2**: Implement `src/trivia/triviaSessions.ts` for managing saved resumable trivia sessions in `localStorage`.
- [x] **Step 1.3**: Extract `TriviaHeaderCard.tsx` from `src/routes/trivia.tsx` into a dedicated component.
- [x] **Step 1.4**: Extract `TriviaSessionsManager.tsx` (Saved trivia sessions list, active selection, inline renaming, deletion) into a dedicated component under `src/components/trivia/`.
- [x] **Step 1.5**: Extract `TriviaCompletionCard.tsx` (Curriculum covered celebration) into a dedicated component under `src/components/trivia/`.
- [x] **Step 1.6**: Refactor `src/routes/trivia.tsx` into a lightweight, clean controller orchestrating sub-components.

---

### Phase 2: UI Aesthetics, Visual Hierarchy & Layout Margins
- [x] **Step 2.1**: Refactor `TriviaDeckBuilder.tsx` to place the `Add all` button directly inside the `Collapsible` category header `meta` prop.
- [x] **Step 2.2**: Standardize spacing tokens (`gap: var(--space-3..5)`, `padding: var(--space-4..6)`) across all Trivia cards.
- [x] **Step 2.3**: Elevate `<Badge>` styling with explicit internal text padding (`padding: 0 var(--space-3)` / `0 var(--space-4)`) and rounded medium borders (`border-radius: var(--radius-md)`).
- [x] **Step 2.4**: Preserve vibrant Python syntax highlighting inside graded correct (green) and incorrect (red) answer slots in `CodePuzzle.tsx`.

---

### Phase 3: Keyboard Navigation & Interactivity Audit
- [x] **Step 3.1**: Auto-focus the first blank input field in `CodePuzzle.tsx` upon entering a round in "Type from memory" mode.
- [x] **Step 3.2**: Support `Tab` and `Shift+Tab` cycling between blank input fields without focus traps.
- [x] **Step 3.3**: Support `Enter` key submission from input fields.
- [x] **Step 3.4**: Support `⌘+R` / `Ctrl+R` shortcut for re-attempting/retrying a puzzle.
- [x] **Step 3.5**: Support `⌘+H` / `Ctrl+H` for line hint toggle.
- [x] **Step 3.6**: Add Mac shortcut indicator badges (`<Kbd>`) to action buttons (`Check answers ↵`, `Next round ↵`, `Retry ⌘R`).

---

### Phase 4: Component Test Suite & Coverage Expansion
- [x] **Step 4.1**: Create `src/trivia/specs/triviaSessions.spec.ts` for unit testing session storage, incremental naming, deletion, and updates.
- [x] **Step 4.2**: Verify `src/routes/specs/trivia.render.spec.tsx` passes across all route states.
- [x] **Step 4.3**: Verify `src/components/trivia/specs/TriviaDeckBuilder.spec.tsx` passes.
- [x] **Step 4.4**: Verify `src/components/trivia/specs/TriviaSession.spec.tsx` passes.
- [x] **Step 4.5**: Verify `src/components/trivia/specs/TriviaSettings.spec.tsx` & `TileTray.spec.tsx` pass.

---

### Phase 5: Master Quality Gate Verification
- [x] **Step 5.1**: Run `bun run typecheck` (0 errors).
- [x] **Step 5.2**: Run `bun run lint` (0 warnings, 0 errors).
- [x] **Step 5.3**: Run `bun run test` (All test files passing).
- [x] **Step 5.4**: Run `bun run build` (Production static build succeeds).
