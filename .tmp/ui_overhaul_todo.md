# UI & Layout Overhaul — Comprehensive Master TODO List

## 1. Global Page Layout & Design System Standards
- [ ] **Page Containers:** Ensure every route (`/`, `/problems`, `/workspace/:id`, `/trivia`) has a standardized top header, title, description block, and consistent outer padding (`px-6 py-6` to `px-8 py-8`).
- [ ] **Surface & Padding Tokens:** Enforce uniform container inner paddings: `Card` (`p-6` / `p-8`), `Well` (`p-4` / `p-5`), `Header` (`py-4 px-6`).
- [ ] **Interactive Elements:** Standardize `SearchTrigger`, `Input`, `Badge`, `Button` internal paddings and rounded corners (`radius-full` for badges, `radius-md` for inputs/buttons).
- [ ] **Borders:** Remove all aggressive/harsh white border overrides; rely on `--border-default` and `--border-subtle` tokens.

## 2. Knowledge Tree Page (`/`)
- [ ] Add 4-side padding around the canvas container (`px-6 py-6` or 60px canvas margin).
- [ ] Give `KnowledgeGraphLegend` top and bottom spacing so it doesn't touch the top of the canvas or graph.
- [ ] Ensure SVG viewBox and node positions leave generous clearance around all nodes (especially Node 1 at the top).

## 3. Problem Directory Page (`/problems`)
- [ ] Add internal padding and page description header to "Algorithm Directory".
- [ ] Increase vertical margin/spacing between the category filters container and the problems table (`mb-6`).
- [ ] Standardize category badges in table and filter drawer (subtle borders, pill shape, proper padding).

## 4. Navbar Component (`Navbar.tsx` & `SearchTrigger.tsx`)
- [ ] Increase internal padding of the `SearchTrigger` input button (`px-5 py-2.5`, proper icon alignment).
- [ ] Ensure navbar brand icon, segmented control, and panel toggles have balanced horizontal/vertical alignment and spacing.

## 5. Workspace Page (`/workspace/:id`)
- [ ] **Visualizer Canvases (Graph, Tree, Array):** Ensure a minimum 32px internal padding floor so elements never touch or clip container borders.
- [ ] **Working Data & Variables Panel (`AuxiliaryPanel`):** Add internal padding (`p-4`) for header and chip rows.
- [ ] **Solution Approach Card:** Add padding to title wrapper, proper margin above the divider, and internal padding in details section.
- [ ] **Problem Description Card:** Give header section `py-4 px-6` padding; wrap problem description text and constraint bullet lists in padded `Well` containers (`p-4 md:p-5`).
- [ ] **Control Panel & Speed Sliders:** Ensure playback buttons and controls have generous touch/click padding.

## 6. Trivia Drill Page (`/trivia`)
- [ ] Wrap top drill description and question fields in padded card/well containers.
- [ ] Fix "Build Your Deck" and category group collapsibles (`Arrays & Hashing`, `Two Pointers`, etc.): remove harsh white borders, use sleek subtle borders and `radius-lg` rounded corners.
- [ ] Add spacing and padding to `TriviaSettings` sliders and toggle controls.

## 7. Quality & Verification
- [ ] Verify each page by checking rendered layout and running `bun run check`.
- [ ] Ensure all 1342 unit/component tests pass cleanly.
