# Master Plan V5: Professional React Engineering Architecture & Skill-Guided Refactoring

## Objectives

Elevate the entire `dsa_visualizer` codebase to enterprise-grade React engineering standards guided by Vercel React Best Practices, Vercel Composition Patterns, Modern Web Guidance, and Web Design Guidelines.

---

## Execution Streams & Specialized Agent Roles

### Stream 1: Vercel React Best Practices Agent (`react_performance_architect`)

- **Focus**: Performance, re-render prevention, memory & JS optimization.
- **Rules Applied**:
  - `rerender-lazy-state-init`: Pass initializer function to `useState` for complex objects (`readStored`, `readTriviaSessions`, `readWorkspaceLayout`).
  - `rerender-derived-state-no-effect`: Derive state during render instead of updating state inside `useEffect`.
  - `rerender-functional-setstate`: Use functional state updates `setState(prev => ...)` to ensure stable callbacks.
  - `js-set-map-lookups`: Use `Set`/`Map` for O(1) lookups in render loops instead of `Array.includes()`.
  - `js-early-exit`: Apply early returns to keep component functions flat and readable.

### Stream 2: Composition Patterns & API Architecture Agent (`react_composition_architect`)

- **Focus**: Modular API design, compound components, avoiding boolean prop proliferation.
- **Rules Applied**:
  - `architecture-avoid-boolean-props`: Replace multi-boolean prop flags with explicit composition or variant unions.
  - `architecture-compound-components`: Structure complex multi-part components (`ControlPanel`, `ComplexityCard`, `TriviaSession`, `CodePuzzle`) with explicit sub-component composition.
  - `state-decouple-implementation`: Decouple provider state internals in `SettingsContext` and `TriviaPage`.

### Stream 3: Modern Web Guidance & UI Accessibility Agent (`web_interface_accessibility_architect`)

- **Focus**: Web Interface Guidelines, semantic HTML, ARIA compliance, keyboard focus states.
- **Rules Applied**:
  - Semantic HTML5 structure (`<main>`, `<nav>`, `<aside>`, `<header>`, `<article>`).
  - Full keyboard accessibility: Ensure all interactive elements (`span role="button"`, custom triggers) handle `Space`/`Enter` keys and provide visible focus rings.
  - ARIA attributes: Ensure `aria-expanded`, `aria-label`, `aria-controls`, `aria-disabled` are accurately set.

### Stream 4: Engineering Contribution & Quality Gatekeeper Agent (`master_quality_gatekeeper`)

- **Focus**: Code documentation, strict type safety, zero lint warnings, unit test suite preservation.
- **Rules Applied**:
  - Clean JSDoc & architecture comments explaining _why_ gotchas and contracts.
  - Standard `.spec.tsx` and `.spec.ts` naming for all 168 test files.
  - Run master quality gate `bun run check` (`tsc --noEmit && bun run lint && bun run test && bun run build`).

---

## Success Criteria

1. `tsc --noEmit` returns 0 errors.
2. `bun run lint` returns 0 warnings and 0 errors.
3. `vitest run` passes 100% of test files and 1012+ tests.
4. `vite build` builds production bundle cleanly.
5. The application architecture is clean, professional, modular, and easy for any engineer to contribute to.
