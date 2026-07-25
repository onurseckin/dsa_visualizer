# UI Overhaul Design Brief

Single source of truth for the app-wide quality overhaul. Every agent working on this
effort reads this file first. Token values live in `src/styles/theme.css` (do not
duplicate hex values in components — always reference tokens).

## 1. Goals

- Replace the neon "Matrix green on black" look with a **professional dark spruce +
  muted emerald** theme. Dark green identity stays, but softer surfaces, calmer accent,
  no glow shadows, no `#00ff9d`.
- One reusable UI library (`src/ui/`) — every button, badge, card, input in the app is
  built from it. No hand-rolled one-off buttons.
- The visualizer workspace focuses on **visualization + code**; the primary stage fits
  the viewport; secondary details are compact/collapsible.
- Step tutorials read like a teacher talking (1–2 sentences per step), and complexity
  gets plain-English *why* explanations, for all 40 algorithms.

## 2. Theme tokens (defined in `src/styles/theme.css`)

Old tokens are **deleted**. Never reference: `--bg-darkest`, `--bg-base`, `--bg-surface-hover`,
`--bg-card`, `--bg-glass`, `--border-muted`, `--border-glow`, `--accent-emerald`,
`--accent-mint`, `--accent-cyan`, `--accent-glow`, `--text-main`, `--text-dim`,
`--text-dark`, `--shadow-card`, `--shadow-glow`, `--shadow-glow-lg`, `--focus-ring-subtle`,
or the classes `.glass-card`, `.btn`, `.btn-primary`, `.btn-active`, `.badge`,
`.badge-easy/medium/hard`, `.code-line`, `.code-line-active`, `.visualizer-hero-card`,
`.visualizer-canvas-stage`, `.main-workspace-grid`. Also never hardcode the old hex
values (`#00ff9d`, `rgba(0, 255, 157, …)`, `#ff0055`, `#ffb703`).

New token groups (see theme.css for exact values):

| Group | Tokens |
|---|---|
| Surfaces | `--bg-page`, `--bg-surface`, `--bg-elevated`, `--bg-inset`, `--bg-hover`, `--bg-pressed`, `--bg-backdrop` |
| Borders | `--border-subtle`, `--border-default`, `--border-strong`, `--border-accent` |
| Accent | `--accent`, `--accent-hover`, `--accent-soft`, `--accent-softer`, `--text-on-accent`, `--accent-secondary` |
| Text | `--text-primary`, `--text-secondary`, `--text-muted`, `--text-faint` |
| Semantic | `--success`, `--warning`, `--danger`, `--info` + `-soft` background variants |
| Element states | `--state-<name>` + `--state-<name>-bg` for every `ElementState` (default, compare, swap, sorted, active, pivot, visited, queued, in-stack, path) |
| Type scale | `--text-xs/sm/md/lg/xl/2xl`; fonts `--font-ui`, `--font-code` |
| Spacing | `--space-1..8` on a 4px grid |
| Controls | `--control-h-sm` (28px), `--control-h-md` (34px), `--control-h-lg` (40px) |
| Radius | `--radius-sm/md/lg/full` |
| Elevation | `--shadow-sm/md/lg` (neutral, subtle — no colored glows) |
| Focus | `--focus-ring` |
| Motion | `--transition-fast`, `--transition-normal` |
| Z-index | `--z-dropdown`, `--z-drawer`, `--z-modal`, `--z-tooltip` |

Usage rules:
- Surfaces nest: page → surface (cards) → elevated (nested panels, chips) → inset (code
  wells, input fields). Hover always `--bg-hover`.
- Text hierarchy: primary for headings/values, secondary for body, muted for labels,
  faint for placeholders/disabled only.
- The emerald accent marks **interaction and selection**, sparingly. It is not a
  decoration color; most chrome is neutral.
- Sizes come from the token scales. No ad-hoc `0.35rem`-style values in new code —
  use `var(--space-*)`, `var(--text-*)`, control heights.

## 3. UI library (`src/ui/`)

Components live in `src/ui/`, class styles in `src/styles/ui.css` (class prefix `ui-`,
BEM-ish: `.ui-btn`, `.ui-btn--primary`, `.ui-btn--sm`, `.ui-btn--selected`). Barrel
export from `src/ui/index.ts`. Specs in `src/ui/specs/*.spec.tsx`. All components
forward native props and accept `className`/`style` overrides for flexibility.

| Component | API (all sizes default `md`) |
|---|---|
| `Button` | `variant?: 'primary' \| 'secondary' \| 'ghost' \| 'danger'` (default `secondary`), `size?: 'sm' \| 'md' \| 'lg'`, `selected?: boolean`, `icon?: ReactNode`, `fullWidth?: boolean` + native button props. Labels never wrap (`white-space: nowrap`). |
| `IconButton` | Square button, `icon: ReactNode`, `size?`, `variant?`, `selected?`; `aria-label` required. |
| `Badge` | `variant?: 'neutral' \| 'accent' \| 'success' \| 'warning' \| 'danger' \| 'info'`, `size?: 'sm' \| 'md'`. Export helper `difficultyBadgeVariant(difficulty)` → Easy=success, Medium=warning, Hard=danger. No uppercase-all-the-things; sentence case text. |
| `Card` | Surface panel: `title?`, `icon?`, `actions?: ReactNode`, `padding?: 'none' \| 'sm' \| 'md'`, `inset?: boolean`. Replaces `.glass-card` (no backdrop blur on ordinary cards). |
| `Input` | Text input, `leadingIcon?`, `onClear?` (shows clear button when value non-empty), sizes. |
| `Slider` | Labeled range input: `label?`, `value`, `min`, `max`, `step?`, `onChange(value: number)`, `formatValue?`. |
| `Segmented` | `options: { value: string; label: string; icon?: ReactNode }[]`, `value`, `onChange`, `size?`. Single accent-selected segment; replaces hand-rolled toggle groups. |
| `Collapsible` | `title: ReactNode`, `meta?: ReactNode` (right side of header), `defaultOpen?`, `open?/onOpenChange?` (controlled optional), chevron rotates; header is a real `<button>`. |
| `Drawer` | `isOpen`, `onClose`, `title`, `side?: 'right'`, `width?`, `children`, `footer?`. Renders backdrop (`--bg-backdrop`), closes on ESC + backdrop click, `role="dialog"` `aria-modal`, uses `--z-drawer`. |
| `Kbd` | Small keycap chip for shortcut hints, e.g. `/`. |

Shared classes in `ui.css` (for app components that are not worth a dedicated component):
`.ui-code-line` / `.ui-code-line--active` (code viewer rows: active row = `--accent-soft`
background + 2px `--accent` left border + `--text-primary`, normal weight — no bold
jumping), `.ui-chip` (small mono key/value chip used for live variables and aux data).

### Selection & interaction — one system everywhere

- **Selected/active**: background `--accent-soft`, 1px border `--border-accent`, text
  `--accent`. Nothing else (no glow, no bold-only signaling, no scale).
- **Hover** (non-selected): background `--bg-hover`, text `--text-primary`.
- **Primary buttons**: solid `--accent` bg, `--text-on-accent` text; hover `--accent-hover`.
- **Focus**: `:focus-visible` → `--focus-ring` (global).
- **Disabled**: opacity 0.45, `cursor: not-allowed`.
- Icon sizes: 14px in `sm`, 16px in `md`, 18px in `lg` controls.

## 4. Workspace layout (MainLayout / ResizableLayout)

- Workspace fills `calc(100vh - <navbar height>)`; the **stage row** (visualizer left,
  code right, ResizableLayout split) takes the flexible space. Panels scroll
  *internally*; the page itself should not need scrolling at ≥1280×800 with the
  problem header collapsed.
- Left column: visualizer canvas (hero, flex-1) with the playback ControlPanel attached
  at its bottom edge; below it the TutorialCard (compact, 1–2 lines); below it the
  AuxiliaryPanel (compact row of chips, collapsible).
- Right column: code viewer (flex-1, internal scroll) above the ComplexityCard
  (collapsible; shows Big-O chips + prose explanation).
- ProblemHeader is a compact strip: title + difficulty/category badges + a details
  toggle that expands description/constraints/examples. Collapsed by default.
- Component prop contracts crossing agent boundaries (both sides must match):
  - `ComplexityCard` gains required prop `complexityAnalysis: ComplexityAnalysis`
    (from `types/dsa.ts`); `MainLayout` passes `algorithm.complexityAnalysis`.
  - `ControlPanelProps`, `TutorialCard` props, `ProblemHeader` props keep their current
    external shape (internal redesign is free).

## 5. Navbar, search trigger, drawer

- Navbar right side: a **search trigger** that *looks* like an input —
  `[🔍 Search 40 algorithms…  ⟨/⟩]` (Kbd chip) — but is a button that opens the
  QuickAccessDrawer. The old dropdown-results search UI is deleted.
- Pressing `/` anywhere (except when typing in an input/textarea/contenteditable)
  opens the drawer. ESC closes it.
- QuickAccessDrawer (built on `ui/Drawer`): search `Input` at top (autofocused), then
  **collapsible category sections** (`Collapsible`): active algorithm's category open
  by default, others collapsed; per-category count badge. While searching, only
  categories with matches show and they are auto-expanded. Selected algorithm row uses
  the standard selected treatment + check icon; rows show difficulty `Badge`.
- Navbar toggle buttons (Tutorial, Aux, Sound) use `Button` with `selected`; view
  switchers use `Segmented`.

## 6. Tutorial voice (step explanations)

Each `AlgorithmStep.explanation` is `{ what, why }`:
- `what`: short present-tense action label (≤ 8 words), e.g. `Compute the complement`.
- `why`: **the teacher's sentence(s)** — 1–2 conversational sentences explaining why this
  step happens and what it means, using the actual runtime values interpolated into the
  string. Address the learner as "we". No headers, no bullet lists, no exclamation
  spam, no robotic "Equation:" prefixes, no Big-O lectures mid-step (a brief note at
  the final step is fine).

Example (Two Sum, checking the map):
- what: `Look up 7 in the map`
- why: `We need a partner for 2 that reaches 9, so we check whether 7 has already been
  seen. It hasn't yet — so we remember 2 and keep walking.`

Keep the existing step structure, `codeLine` mappings, snapshots, and variables
untouched — only the explanation text (and `description` clarity, lightly) changes.

## 7. Complexity analysis prose

`AlgorithmDefinition` gains a required field:

```ts
export interface ComplexityAnalysis {
  time: string;  // 2–4 plain-English sentences: why the time complexity is what it is
  space: string; // 1–3 sentences: what memory grows and why
}
```

Example (Two Sum):
- time: `We walk the array once, and each hash-map lookup and insert costs O(1) on
  average, so the total work grows linearly with the number of elements — O(n). Even
  in the worst case, where no pair exists, we still make just a single pass.`
- space: `The hash map stores up to one entry per element before a pair is found, so
  extra memory grows linearly with the input — O(n).`

The `ComplexityCard` renders the Big-O chips plus these paragraphs.

## 8. Working rules for agents

- Only edit files you own (your prompt lists them). `src/styles/theme.css`,
  `src/styles/index.css`, `index.html`, and `src/types/dsa.ts` are already done — read,
  don't touch. Only the UI-library agent edits `src/styles/ui.css` and `src/ui/**`.
- TypeScript: no `any` in any form, no `@ts-ignore`/`@ts-expect-error`/`eslint-disable`.
  Comments only for non-obvious *why*.
- Tests: update the spec files you own to match new behavior/text; run only your own
  spec files (`bunx vitest run <paths>`) — never the full suite. Keep them passing.
- Don't start dev servers or browsers. Don't commit — the orchestrator commits.
