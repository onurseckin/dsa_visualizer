# Base UI & Atomic Design System Overhaul Specification

## 1. Objective & Architecture Overview
This specification details the complete architectural refactoring of the application's UI design system onto **Base UI (`@base-ui-components/react`)** as the unstyled headless foundation, using **`@radix-ui/react-slot`** for element composition/`asChild` slots.

All component primitives in `src/ui/` and application components in `src/components/` are structured according to **Atomic Design Principles**, enforcing strict 8pt spatial grid alignment, tokenized dark mode elevations (`#17171b` page, `#0a0a0c` card, `#050506` well), standardized control sizing scales (`sm: 32px`, `md: 40px`, `lg: 48px`), and accessible ARIA attributes.

---

## 2. Dependency Rules & Enforcement
- **Headless Primitive Standard:** `@base-ui-components/react` MUST be used for all interactive headless primitives (`Button`, `Input`, `Select`, `Slider`, `Collapsible`, `Dialog`, `Drawer`).
- **Slot Composition Standard:** `@radix-ui/react-slot` (`Slot`) MUST be used for polymorphic rendering (`asChild` prop).
- **Package Manager Standard:** ALL installations must be performed exclusively via **`bun`** (`bun add ...`). `npm`, `pnpm`, and `yarn` are strictly prohibited.

---

## 3. Atomic Design Component Hierarchy

### Level 1: Atoms (`src/ui/`)
- `Button`: Base UI `Button.Root` + Radix `Slot` + size tokens (`sm`/`md`/`lg`).
- `IconButton`: Base UI `Button.Root` square variant.
- `ButtonGroup`: Standardized flex gap container for buttons.
- `Input`: Base UI `Input.Root` + size tokens.
- `Select`: Base UI `Select` primitive family (`Root`, `Trigger`, `Portal`, `Positioner`, `Popup`, `Item`).
- `Slider`: Base UI `Slider` primitive family (`Root`, `Control`, `Track`, `Indicator`, `Thumb`).
- `Collapsible`: Base UI `Collapsible` primitive family (`Root`, `Trigger`, `Panel`).
- `ConfirmDialog`: Base UI `Dialog` primitive family (`Root`, `Portal`, `Backdrop`, `Popup`, `Title`, `Description`, `Close`).
- `Drawer`: Base UI `Dialog` with slide-in positioner.
- `Badge`: Pill-shaped (`radius-full`) badge with `--border-subtle` and semantic variants.
- `Chip`: Key-value or data tag with `--border-subtle` and icon slots.
- `Card`: Primary dark container (`#0a0a0c`) with `p-6 md:p-8` padding, `border border-[var(--border-default)]`, `rounded-[var(--radius-lg)]`, `shadow-sm`.
- `Well`: Secondary recessed container (`#050506`) with `p-4 md:p-5` padding, `border border-[var(--border-subtle)]`, `rounded-[var(--radius-md)]`.
- `Segmented`: Tab/view switcher with Base UI button semantics.
- `FieldLabel`: Accessible form/section label.
- `Kbd`: Shortcut key badge (`radius-sm`).
- `PanelHeader`: Padded panel title bar.

### Level 2: Molecules & Organisms (`src/components/`)
- `SearchTrigger`: `Input` + `Kbd` trigger button for drawer search.
- `ProblemDescriptionCard`: `Card` header + `Well` wrapped problem text & constraints.
- `SolutionApproachCard`: `Card` header + `pb-6 border-b` overview divider + key terms grid.
- `AuxiliaryPanel`: `Card` container + `Chip` grid rows for working variables.
- `ControlPanel`: `Card` playback controls + speed `Slider` + size controls.
- `TriviaDeckBuilder` & `TriviaSettings`: Base UI `Collapsible` & `Slider` containers.
- `ProblemTable` & `ProblemListFilterToolbar`: Base UI `Select`, `Input`, and `Badge` integration.

### Level 3: Page Layouts (`src/routes/` & `src/components/`)
- `KnowledgeGraph`: SVG canvas + `KnowledgeGraphLegend` + title card.
- `ProblemList`: Filter toolbar + `ProblemTable`.
- `Workspace`: `MainLayout` + `ResizableLayout` + `ProblemHeader` + Visualizer canvas.
- `Trivia`: `TriviaDeckBuilder` + `TriviaSettings` + `CodePuzzle`.

---

## 4. Multi-Agent System Execution Plan (Visual Pushback Loop)
1. **Subagent 1 (`base_ui_primitives_refactor`):** Refactor `src/ui/` primitive components using Base UI and Radix Slot.
2. **Subagent 2 (`base_ui_molecules_refactor`):** Refactor `src/components/` domain components using the updated `src/ui/` primitives.
3. **Subagent 3 (`layout_visual_auditor_v3`):** Capture Headless Chrome screenshots (`tree_page.png`, `problems_page.png`, `workspace_page.png`, `trivia_page.png`) and issue visual pushbacks until 100% layout pass.
4. **Main Orchestrator Gatekeeper:** Run `bun run check` (typecheck, oxfmt, oxlint, 1342 unit tests, build) and push to `main`.
