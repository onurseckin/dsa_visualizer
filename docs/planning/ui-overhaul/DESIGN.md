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

---

# Round 3 — contrast, customizable layout, education, smart sound

Supersedes conflicting details above. Sections 1–8 still describe the component
system; the deltas below win where they overlap.

## R3.1 Palette (navy + emerald, validated)

`src/styles/theme.css` is rewritten and **finished** — read it, never edit it.
No token was renamed, so components keep compiling; values and intent changed:

- **Two hue tiers.** Navy carries app chrome (`--bg-inset` wells → `--bg-page`
  → `--bg-chrome` navbar/toolbars); emerald carries content (`--bg-surface`
  cards → `--bg-elevated` buttons/chips → `--bg-hover` → `--bg-pressed`).
  Use `--bg-chrome` for the navbar and any toolbar strip.
- **Borders are solid tones now** (`--border-subtle` / `--border-default` /
  `--border-strong`), not near-invisible alphas. Every card and button must
  carry a real border — that is what makes controls read against the surface.
  `--border-strong` clears 3:1 against page and surface; use it for hovered
  or emphasized boundaries.
- **Accent is mint** `#5eead4`. Selection/interaction only.
- Text tones all clear WCAG AA on the surfaces they are used on. Never put
  `--text-muted` or `--text-faint` on `--bg-hover`/`--bg-pressed` (they lose
  contrast there) — use `--text-secondary`/`--text-primary` on hover states.
- **`--viz-1` … `--viz-8`**: a validated categorical palette for telling
  *groups* apart. Assign in fixed slot order, never cycle past 8 (fold extras
  into `--state-default`). Do not invent new chart colors — this set passed
  colorblind-separation gates as an ordered set and substitutions break it.
- Element `--state-*` tokens stay semantic (algorithm state, not identity).
  Untouched elements are navy so any color means "the algorithm acted here".
- New layout metrics: `--navbar-h`, `--stage-min-h`, `--panel-min-h`.

## R3.2 Smart responsive layout — never block page scroll

The old "expanded vs collapsed layout mode" switch is **removed**. One system:

- `<main>` always allows page scrolling (`overflow-y: auto`). Never
  `overflow: hidden` on the page or `<main>`.
- The stage sizes itself from the viewport with a floor:
  `height: max(var(--stage-min-h), calc(100dvh - <chrome+header+gaps>))`.
  On a tall monitor that resolves to the viewport, so everything fits with no
  scrolling; on a short monitor the floor wins and the page scrolls. This is
  the "smart flexibility" requirement — fit when it can, scroll when it must.
- Inner panels keep `min-height: 0` and scroll internally.
- Expanding details simply adds content above the stage; the page scrolls. The
  stage does not shrink and no mode switch happens.

## R3.3 Fully customizable, persisted workspace panels

Every workspace section is resizable — horizontally **and** vertically.

- Horizontal: the left/right stage split (visualizer column vs code column).
- Vertical, left column: visualizer / tutorial / auxiliary.
- Vertical, right column: code / complexity.
- Drag handles use the existing `role="separator"` pattern with
  `aria-orientation` set correctly, keyboard arrow support, and double-click to
  restore that handle's default.

Persistence contract — one versioned key, written on every commit of a drag:

```ts
// src/app/workspaceLayout.ts
export const WORKSPACE_LAYOUT_KEY = 'dsa_visualizer_workspace_layout_v3';

export interface WorkspaceLayout {
  version: 3;
  splitPercent: number;                                               // left column width %
  leftRows: { visualizer: number; tutorial: number; auxiliary: number }; // flex weights
  rightRows: { code: number; complexity: number };                    // flex weights
}
```

Rules: validate on read (wrong version, bad shape, NaN, out-of-range → defaults);
never throw on storage errors; sizes survive reload **and** dev-server restarts
because they live in `localStorage`, so never clear the key except on an
explicit confirmed reset.

**Reset requires confirmation.** "Reset layout" opens `ConfirmDialog` from
`src/ui` (new: `isOpen`, `title`, `message`, `confirmLabel`, `cancelLabel`,
`destructive`, `onConfirm`, `onCancel`; Escape/backdrop cancel). Only on confirm
does the key get removed and the layout return to defaults.

## R3.4 Educational details (`topicGuide`)

`AlgorithmDefinition` gains a **required** field:

```ts
export interface TopicGuide {
  overview: string;                                     // what this topic IS
  sections: { heading: string; body: string }[];        // the teaching body
  keyTerms?: { term: string; definition: string }[];    // vocabulary
}
```

This is a **topic lesson, not step narration**. The step `explanation.why`
strings stay as they are (that is the play-by-play). `topicGuide` teaches the
whole subject behind the problem so the details panel is a reference you could
study from with the animation paused.

Required shape per algorithm:
- `overview`: 2–4 sentences orienting the learner — what the technique/data
  structure is and what class of problem it solves.
- `sections`: **4–6** sections, each `body` being 3–6 full sentences. Cover, in
  this spirit (adapt headings to the topic): the core idea and the insight that
  makes it work; how the mechanism operates concretely; why it is correct
  (the invariant it maintains); when to reach for it versus alternatives;
  common pitfalls and edge cases; how it generalizes to sibling problems.
- `keyTerms`: 3–6 terms a newcomer would stumble on, each defined in one or two
  sentences.
- Voice: a good teacher writing prose — second person ("you"), concrete, no
  bullet fragments inside `body`, no markdown syntax, no Big-O dumps (that is
  `complexityAnalysis`), no restating the step list.

**Details are expanded by default** in the workspace.

## R3.5 Smart step-by-step sound

Every step transition must be audible, with a cue that matches what the step
did — not silence for most steps as before.

```ts
// src/engine/stepSound.ts
export type SoundCueKind =
  | 'advance' | 'compare' | 'swap' | 'push' | 'pop' | 'visit'
  | 'enqueue' | 'dequeue' | 'relax' | 'match' | 'complete';

export interface SoundCue {
  kind: SoundCueKind;
  /** 0..1 — drives pitch so stepping reads as motion, not noise. */
  pitch: number;
}

export function deriveStepCue(
  step: AlgorithmStep,
  prevStep: AlgorithmStep | null,
  totalSteps: number,
): SoundCue;
```

- Pure function, fully unit-testable, no audio imports.
- Derive the kind from real step content: which `ElementState`s appeared in the
  snapshot versus the previous step, `auxiliaryState` growth/shrink
  (stack/queue push vs pop), distance-table changes (`relax`), and
  `explanation.what` keywords as a tiebreaker. Last step → `complete`.
- Default to `'advance'` (a soft tick) so **no step is silent**.
- `pitch` should generally track progress through the run or the value being
  touched, so a sort audibly rises as it converges.
- `soundEngine` gains `playCue(cue: SoundCue)`; existing public methods stay.
- Timing: the step interval goes as low as 50ms, so the throttle must not
  swallow legitimate consecutive steps — cap it near 30ms and raise the voice
  ceiling. Distinct cue kinds get distinct timbre/duration, kept short
  (≤120ms) so fast playback stays crisp rather than muddy.

---

# Round 4 — near-black palette, content-hugging panels, uniform toggles

Supersedes conflicting details in Rounds 1–3.

## R4.1 Palette is now near-black (theme.css is FINISHED — read, never edit)

The previous palette was still too light. New anchors, all validated numerically:

| Token | Value | Relative luminance |
|---|---|---|
| `--bg-inset` | `#01060a` | 0.0016 |
| `--bg-page` | `#030b11` | 0.0030 |
| `--bg-chrome` | `#05121a` | 0.0054 |
| `--bg-surface` | `#071c13` | 0.0092 |
| `--bg-elevated` | `#0c2619` | 0.0153 |
| `--bg-hover` | `#113022` | 0.0235 |
| `--bg-pressed` | `#153a2a` | 0.0335 |

For scale: Tailwind slate-950 is 0.0021, green-950 is 0.0204, green-900 is 0.0652.
The page sits just above pure black; containers step up by a *small* amount, not a
full Tailwind stop. Navy = near-black blues (`inset`/`page`/`chrome`),
emerald = near-black greens (`surface`/`elevated`/`hover`/`pressed`).

**Because surfaces are nearly black, borders carry the edge definition.** Border
tokens were brightened (`--border-subtle` `#1c4234`, `--border-default` `#2d6249`,
`--border-strong` `#43896b`). Every container, card, panel and button MUST carry a
visible border — without one it dissolves into the background. Verified:
`--border-default` 2.5:1 vs surface, `--border-strong` 4.25:1 vs surface.

Text tones all clear AA on every surface (primary ≥ 13:1 everywhere). The
`--viz-1..8` categorical set was re-validated against the new surface and still
passes every gate — do not substitute values.

## R4.2 Panels hug their content — no dead space

The Round 3 fixed flex-weight rows created empty space when a panel's content was
short. New rule:

- **Secondary panels size to their content** (`flex: 0 0 auto`): tutorial,
  auxiliary/working data, complexity. They grow and shrink automatically as steps
  add or remove content (aux rows appearing, longer explanations), so no panel
  ever renders blank filler.
- **The visualizer is the only greedy panel** (`flex: 1`) — it absorbs the
  leftover space in its column. The code panel is greedy in its column too, since
  code is long and benefits from height, but it must not fall below its content.
- **A user drag overrides the hug** for that panel only: dragging a handle pins
  that panel to an explicit pixel height (with internal `overflow: auto`), which
  persists. Everything not explicitly dragged stays automatic.
- Persist `null` for "automatic" and a number for "user-pinned". Reset returns
  every panel to `null`/automatic.
- Never render a handle, gap, or wrapper for a hidden panel.

`WorkspaceLayout` (v4) therefore stores nullable pixel heights, not weights:

```ts
export interface WorkspaceLayout {
  version: 4;
  splitPercent: number;                    // left/right column split, still a %
  panelHeights: {                          // null = hug content (default)
    visualizer: number | null;
    tutorial: number | null;
    auxiliary: number | null;
    code: number | null;
    complexity: number | null;
  };
}
```

Read/validate/fallback rules from R3.3 still apply; bump the storage key to
`dsa_visualizer_workspace_layout_v4` and ignore older payloads.

## R4.3 Details use the full container width

Remove the `max-width: 72ch` readable-measure cap from ProblemHeader. The topic
guide, description, sections, key terms, constraints and examples all span the
full width of their container. No internal max-width anywhere in the details
panel, and no left-squeezed column.

## R4.4 Uniform, independent panel toggles

The Split/Visual/Code `Segmented` control is **removed**. `ViewMode` is replaced
in the workspace by `PanelVisibility` (`src/types/dsa.ts`):

```ts
export interface PanelVisibility {
  visualizer: boolean; code: boolean; tutorial: boolean; auxiliary: boolean;
}
```

The navbar shows **five visually identical toggle buttons** — Visualizer, Code,
Tutorial, Aux data, Sound — each an independent on/off that shows or hides that
thing. Same `size="sm"`, same icon size, same selected treatment
(`selected` → accent-soft bg + accent border + accent text), same gap, aligned on
one baseline in a single row. `aria-pressed` reflects state on every one.

The app-view navigation (Knowledge Tree / Problem List / Workspace) stays a
`Segmented` control — it is mutually exclusive routing, not a set of toggles.

If every workspace panel is toggled off, render a calm centered empty state
telling the user to enable a panel — never a blank screen and never a trap.

Settings persistence: store the four panel booleans (plus `soundEnabled`) and
migrate any legacy `view_mode` value on read (`split` → visualizer+code both on,
`visual` → visualizer only, `code` → code only).

## R4.5 Size standardization

One scale, applied everywhere: navbar/toolbar controls are `size="sm"`
(`--control-h-sm`, 14px icons); in-panel actions are `size="md"`; badges are
`size="sm"` except the problem title's difficulty badge. Never mix sizes inside a
row. Icon-only buttons stay square (`--control-h-*` on both axes) and always
carry `aria-label`.

---

# Round 5 — black/carbon/smoke shell, graph-focused workspace

Supersedes ALL earlier color guidance and the Round 4 panel arrangement.

## R5.1 The shell is achromatic; color is reserved for data

`theme.css` is rewritten and FINISHED (read-only). The app is now black / carbon /
smoke, and **hue only appears where it carries meaning**.

| Token | Value | L | Role |
|---|---|---|---|
| `--bg-inset` | `#030304` | 0.0009 | code wells, inputs |
| `--bg-page` | `#08080a` | 0.0025 | page (black) |
| `--bg-chrome` | `#0e0e11` | 0.0045 | navbar, toolbars |
| `--bg-surface` | `#141417` | 0.0071 | containers (carbon) |
| `--bg-elevated` | `#1c1c21` | 0.0119 | buttons, chips (smoke) |
| `--bg-hover` | `#26262c` | 0.0198 | hover |
| `--bg-pressed` | `#303037` | 0.0302 | pressed |

- **No green, teal, or navy anywhere in the shell.** Chrome, panels, cards,
  buttons, inputs, drawers, navbar, sidebars and text are all neutral.
- The accent is **bright smoke** `#e9e9ef` (not mint). Selected =
  `--accent-soft` background + `--border-accent` border + `--accent` text.
- **Colour is allowed in exactly three places**: (1) algorithm-state marks
  (`--state-*`) inside visualizers, (2) the categorical `--viz-1..8` palette for
  identity/groups in graphs and data-structure views, (3) semantic badges and
  status (`--success`/`--warning`/`--danger`/`--info`) in lists and badges.
  Everything else is neutral.
- Adjacent surfaces sit only ~1.09x apart, so **borders carry the edge
  definition** — every card, panel, well, chip and button MUST carry a border
  token or it dissolves into the background.

## R5.2 The workspace is graph-focused: one stage, nothing stacked outside it

The left column is **a single container** — the visualizer panel — with the step
context living *inside* it. Top to bottom, inside that one panel:

1. **Working data** strip (the auxiliary/aux-data content) pinned at the top.
2. **The visualization canvas** in the middle, taking all remaining height.
3. **Tutorial** strip at the bottom.
4. **ControlPanel** docked at the very bottom edge.

Why: the panel's outer size is stable, so step-to-step content changes never
resize or reflow the surrounding layout ("no width/height twitching"), and the
learner sees the graph, its working data and the tutorial together without ever
scrolling between them. The canvas is the flexible region that absorbs small
content deltas — everything else keeps its natural height.

`panels.tutorial` / `panels.auxiliary` still toggle those strips; hiding one
gives its space to the canvas and renders no wrapper, divider or gap.

## R5.3 Trim the canvas letterboxing — without shrinking graphs

Visualizations currently waste large bands of empty space above and below the
drawing. Fix the *cause*, not the symptom:

- Compute the viewBox tightly around actual content bounds (plus a small,
  uniform padding), then let the SVG scale to fill its box.
- Do not letterbox: avoid a `preserveAspectRatio` + fixed-ratio viewBox
  combination that centres a short drawing inside a tall box.
- Drop oversized fixed `minHeight`s on canvas wrappers that force empty bands.
- **Graphs must not get visually smaller.** After trimming, nodes/edges should be
  the same size or LARGER because the drawing now fills the available area.
  Verify per visualizer kind (array, grid, graph, tree) that the content scales
  up into the reclaimed space rather than staying pinned at its old scale.

## R5.4 The right column hugs its content

- The code panel shows the solution **in full** — its height equals its content,
  with no trailing empty space and no internal scroll while it fits.
- The complexity card sits **immediately below** the code, so a short solution
  pulls it up rather than leaving a gap.
- Neither panel is greedy. If the two together exceed the column height, the
  column itself scrolls.

---

# Round 6 — kill the canvas bands, integrate the tutorial, invert the surfaces

Supersedes conflicting guidance in every earlier round.

## R6.1 Canvas whitespace: the architecture, not a tweak

Two previous attempts failed and BOTH are forbidden now:
- a viewBox from fixed constants rendered into a 100%-sized `<svg>` — `meet`
  centred the drawing and left dead bands *inside* the svg;
- sizing the `<svg>` to the content's aspect ratio (`fitBox`, now deleted) —
  which moved the identical dead bands *outside* the svg, into the panel. This is
  what the user is still seeing.

**The contract:** `viewBox = boxViewBox(measuredBox)` — literally
`0 0 box.width box.height` — with `<svg width="100%" height="100%">`. User units
are CSS pixels, so the viewBox and the element can never disagree and
`preserveAspectRatio` has nothing to letterbox. Every visualizer lays its content
out in real pixels inside that box and is responsible for spreading across BOTH
axes:

- **Array**: bars span the full width; the tallest bar spans the full height.
- **Tree**: depths spread over the full height, leaf slots over the full width.
- **Graph with authored x/y**: run the points through `spreadToBox()` so they
  reach the edges. Positions scale per-axis; the node radius stays uniform, so
  nothing is squashed.
- **Graph without coordinates**: lay out on an **ellipse** inscribed in the box,
  not a circle — a circle in a wide panel wastes the horizontal margin.
- **Grid**: square cells cannot fill an arbitrary aspect. Size cells from the
  HEIGHT (`box.height / rows`, capped for sanity) so vertical space is always
  consumed, and let any horizontal remainder centre or scroll.

Where a shape constraint leaves slack it goes horizontal and centred. Vertical
slack is the defect being fixed — it must be zero. The canvas region must not
centre a shrunken child: no `alignItems: center` around a 100%-sized svg, and no
padding large enough to read as a band.

## R6.2 Surfaces are inverted: cards are darker than the page

- `--bg-page` `#17171b` is **carbon** — the interactive backdrop.
- `--bg-surface` `#0a0a0c` is **near-black** and DARKER than the page, because
  cards are where the eye rests (code, tutorial, topic guide).
- `--bg-inset` `#050506` is deepest (code wells, inputs).
- Controls raised on a card step *lighter*: `--bg-elevated` `#1e1e24`, hover
  `#282830`, pressed `#32323b`. `--bg-chrome` `#1c1c21` is the navbar.
- **Primary buttons are black-filled** (`.ui-btn--primary` = `--bg-inset` fill,
  `--accent` border, `--text-primary` ink, weight 600) — never a light slab.

## R6.3 Colour comes back where it carries meaning

The achromatic sweep went too far. Restore and keep:
- **Problem list**: difficulty badges and any status/count badges are coloured
  (`--success` / `--warning` / `--danger` / `--info` via `difficultyBadgeVariant`).
- **Knowledge map**: keep the full `--viz-1..8` cluster colouring exactly as is.
- **Visualizers**: `--state-*` marks and `--viz-*` group colours stay.
Chrome, panels, inputs, toolbars and body text remain neutral.

## R6.4 The tutorial is the panel's header, and it is readable

- The tutorial moves to the **TOP** of the visualizer panel, as its header, so
  the panel reads top-to-bottom: tutorial → working data → canvas → controls.
- It must be **readable, not a caption**: body at `--text-md` minimum,
  line-height ~1.6, `--text-primary` for the lead sentence and
  `--text-secondary` for the rest, real padding (`--space-3`), and enough room
  for two or three lines without clipping. It is the thing the user reads on
  every step — size it accordingly.
- It is visually part of the panel (band fill + one divider facing the canvas),
  not a floating card.

## R6.5 Every manual adjustment persists; reset lives in the navbar

Persist and restore across reloads and dev-server restarts:
- the column split percentage,
- every user-pinned panel height,
- **whether the details panel is expanded or collapsed**.

All of it under the versioned workspace-layout key, restored on mount, and only
cleared by an explicit confirmed reset. **The "Reset layout" button moves out of
ProblemHeader and into the navbar**, next to the panel toggles, because it
governs the whole workspace. It still opens `ConfirmDialog` first.

## R6.6 Keyboard control of playback

Global shortcuts on the workspace, active whenever focus is not in an
input/textarea/select/contenteditable:
- `ArrowRight` / `ArrowLeft` — step forward / step back
- `Space` — play/pause (must `preventDefault` so the page does not scroll)

Do not hijack these while the drawer is open or a dialog has focus, and keep the
existing `/` search shortcut working. Announce them in the control panel via
`title`/`aria-keyshortcuts` so they are discoverable.

---

# Round 7 — sound removed, all sections resizable, colour consistency

## R7.1 Interactive controls take the DARKEST fill

Buttons, icon buttons, segmented options, neutral badges, chips and inputs rest on
`--bg-inset` (the darkest tier) and rely on their border to read. Hover and active
step *lighter* (`--bg-surface`, then `--bg-elevated`) because the resting state is
already the floor. Primary buttons stay black-filled with an `--accent` edge.

## R7.2 Section fills are consistent; only headers lift

- Every panel body — code, complexity, tutorial, working data, visualizer — uses
  the same darkest reading fill `--bg-surface`. A panel that lifted itself to
  `--bg-chrome` looked like a different component; that is the inconsistency the
  user reported between "Step" and "Solution / Complexity".
- **Card headers step lighter** (`--bg-elevated` + `--border-default` bottom) so
  section titles like `solution.py` and `Complexity` are clearly visible against
  the near-black body. Header lifts; body never does.
- Seams between strips inside a panel are a single `--border-subtle` divider, not
  a fill change.

## R7.3 Working data wraps; it never scrolls sideways

The one-line horizontal chip track is gone. Each structure is a labelled row in a
two-column grid (label column ~5.5rem, values column `1fr`), and the values
**wrap** onto additional lines. Horizontal scrolling hid values off-screen and made
the learner drag a track mid-step; wrapping keeps every value visible at once and
lets the rows align into a readable table.

## R7.4 Every section has BOTH width and height control

Width comes from the column split. Height now has a handle for every section:
- `tutorial` and `auxiliary` are resizable rows inside the visualizer panel, so
  dragging either one changes the canvas height (the canvas is the greedy row).
- `code` and `complexity` keep their row handle.
- `stage` pins the whole stage row, so the graph area can be made taller or
  shorter instead of being fixed to the viewport calculation.

All six slots (`stage`, `visualizer`, `tutorial`, `auxiliary`, `code`,
`complexity`) persist as `number | null` under
`dsa_visualizer_workspace_layout_v7`; `null` means automatic, double-click a
handle to restore automatic, and only a confirmed navbar reset clears them.

## R7.5 Sound is removed from the product

`soundEngine.ts`, `stepSound.ts` and their specs are deleted. `SettingsContext`
has no `soundEnabled`, `NavbarProps` has no sound props, the navbar has no Sound
toggle, and `useStepEngine` takes no `soundEnabled` option. `onStepChange` and its
StrictMode dedupe remain — they now exist purely for per-step side effects, of
which there are currently none. Do not reintroduce audio.

---

# Round 8 — Trivia: progressive code-occlusion drill

A fourth app view (`/trivia`) for memorising solutions before interviews.

## R8.1 The technique

Cloze deletion over source lines, escalated by **coverage, not time**:

- At **level N** the drill hides N lines of a solution at once.
- The level only advances to N+1 once **every blankable line of every deck entry**
  has been drilled at level N. You therefore meet every line at every difficulty
  before the work gets harder, instead of re-drilling whatever the shuffle likes.
- Within a level, line selection prefers undrilled lines, then weights by
  `misses + 1`, so fumbled lines resurface sooner (Leitner, reduced to its core).
- A revealed line counts as drilled **and** as a miss, so giving up schedules it
  again rather than skipping it.
- Levels run from `minBlanks` to `maxBlanks`, both user-configurable; the drill
  reports `completed` when the ceiling is covered.
- An algorithm with fewer blankable lines than the current level cannot supply
  that many blanks, so it is treated as satisfied instead of blocking the deck.

## R8.2 Two answer modes

- **`choice`** (the intermediate step): the blanks are empty slots and the tray
  offers shuffled tiles to drag in. Decoys are **other real lines from the same
  solution** — far harder to reject than random text — plus any author-supplied
  `distractors`. One decoy per blank keeps the tray proportional to difficulty.
- **`type`**: write the line from memory, no tiles.

Both modes share one `TriviaRound`. Indentation is displayed as a fixed prefix and
is never graded — Python needs it, but retyping leading spaces tests typing, not
recall. Grading trims the ends and requires an exact match inside.

## R8.3 Engine contract (`src/trivia/triviaEngine.ts`)

Pure, React-free, RNG-injectable so every escalation rule is unit-testable:

```ts
parsePuzzleLines(code, meta?)   // -> PuzzleLine[] (indent/content split, blankable)
createProgress(config)          // -> TriviaProgress
pickRound({ config, progress, sources, meta?, rng? })  // -> TriviaRound | null
gradeRound(round, answers)      // -> TriviaGrade
recordRound(progress, round, grade, config, sources)   // -> next TriviaProgress
isLevelCovered / remainingAt / coverageRatio / buildTiles / isAnswerCorrect
```

`sources` is `Map<algorithmId, PuzzleLine[]>`; `pickRound` returns null on an
empty deck or a completed drill. Never call `Math.random` inside a component —
take it from the engine so tests stay deterministic.

## R8.4 UI

`/trivia` route with two states: **deck builder** and **session**.

- **Deck builder**: multi-select over the whole registry with *quick multi-add* —
  add a whole category at once, add all, clear, and per-category counts. Difficulty
  badges keep their semantic colour (R6.3).
- **Session**: the solution renders as a code panel where blanked lines become
  drop slots; the tile tray sits beside it. Drag and drop uses native HTML5 DnD
  (no new dependency) and **must also work by keyboard and click** — select a
  tile, then activate a slot — so the drill is usable without a mouse and is
  testable in jsdom.
- Controls: check answers, reveal a blank, next round, and a visible
  level/coverage indicator.
- **Settings**: mode, `minBlanks`, `maxBlanks`, distractors on/off. Persisted with
  the deck and progress under versioned `dsa_visualizer_trivia_*` keys, restored on
  mount, cleared only by an explicit confirmed reset.
- Styling follows the existing system: neutral chrome, darkest fill on interactive
  controls, card headers lifted, colour only for correctness feedback
  (`--success` / `--danger`) and difficulty badges.

## R8.5 Algorithm metadata

`AlgorithmDefinition` gains **optional** `trivia?: TriviaMeta`
(`skipLines`, `distractors`, `hints`). Optional by design: any solution drills
correctly straight from its `code` string, so the feature works for all 40
algorithms immediately and authors only add metadata to sharpen a specific drill.
