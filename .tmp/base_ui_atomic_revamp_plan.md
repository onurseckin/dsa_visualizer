# Complete UI Architecture, Atomic Design Hierarchy & Page Revamp Plan

## 1. Directory Structure (`src/ui/`)

Reorganize all UI components into 4 explicit Atomic Design levels:

```
src/ui/
├── atoms/
│   ├── Button.tsx
│   ├── IconButton.tsx
│   ├── ButtonGroup.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Slider.tsx
│   ├── Badge.tsx
│   ├── Chip.tsx
│   ├── Kbd.tsx
│   ├── FieldLabel.tsx
│   ├── Well.tsx
│   └── Card.tsx
├── molecules/
│   ├── SearchTrigger.tsx
│   ├── Segmented.tsx
│   ├── Collapsible.tsx
│   ├── PanelHeader.tsx
│   ├── ConfirmDialog.tsx
│   ├── Drawer.tsx
│   ├── AuxiliaryPanel.tsx
│   ├── CodeBlockViewer.tsx
│   ├── TutorialCard.tsx
│   ├── ProblemHeader.tsx
│   ├── TileTray.tsx
│   ├── CodePuzzle.tsx
│   └── SessionCard.tsx
├── organisms/
│   ├── Navbar.tsx
│   ├── ControlPanel.tsx
│   ├── ComplexityCard.tsx
│   ├── ProblemDescriptionCard.tsx
│   ├── SolutionApproachCard.tsx
│   ├── ProblemListFilterToolbar.tsx
│   ├── ProblemTable.tsx
│   ├── QuickAccessDrawer.tsx
│   ├── TriviaDeckBuilder.tsx
│   ├── TriviaSettings.tsx
│   ├── DeckGroupCollapsible.tsx
│   ├── KnowledgeGraph.tsx
│   └── ProblemList.tsx
├── templates/
│   ├── MainLayout.tsx
│   ├── ResizableLayout.tsx
│   ├── ResizableRows.tsx
│   └── PageHeader.tsx
├── styles/
│   ├── index.css
│   └── components/*.css
├── cx.ts
└── index.ts
```

## 2. Redesign Objectives (Eliminating "Lake" Visual Mismatches)

- **Knowledge Tree Page**:
  - Remove dark card wrapper around page header; replace with clean, borderless `PageHeader` template.
  - Floating frosted pill legend toolbar (`bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-subtle)] rounded-full px-6 py-3`).
  - Perfect SVG canvas viewBox (`viewBox="-20 100 1380 820"`) preventing node overlaps and dead space.

- **Problem List Page**:
  - Borderless `PageHeader` template with category badge chips.
  - High-contrast unified filter toolbar (`bg-[var(--bg-card)] border border-[var(--border-default)] p-4 rounded-xl shadow-sm`).
  - Enhanced table styling with hover effects, uppercase tracking headers, and pill status badges.

- **Workspace Page**:
  - Modernized stage container, header controls, control panel, collapsible lesson details, code viewer.

- **Trivia Page**:
  - High-contrast card decks, settings sliders, interactive occlusion puzzle tiles.

## 3. 50-Agent Swarm Orchestration Strategy

We deploy 50 subagents running concurrently across 5 specialized squads to complete the folder migration, component re-architecting, CSS consolidation, page redesigns, and 1342 unit test validations.
