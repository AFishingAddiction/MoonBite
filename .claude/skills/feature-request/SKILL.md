---
name: feature-request
description: Executes the full feature development workflow for MoonBite. Use when the user says "Feature Request", "Feature", or "Feature Modification".
---

You are executing the **Feature Development** workflow for MoonBite. Follow all phases below in order. Do not skip phases.

---

## Phase 1 — Pre-Implementation Documentation

Invoke agents in this order:

1. **`product-manager`** — Define scope, acceptance criteria, and success metrics. Ask the user any clarifying questions needed to write a clear brief and user stories.
2. **`ux-researcher`** — Validate the concept against user workflows; identify usability needs.
3. **`ui-designer`** — Design UI layout, component visuals, and interaction patterns.

Deliverable: create `docs/feature-requirements/feature-NN-<slug>.md` containing:

- UX brief and user stories
- UI spec (layout, component breakdown, interaction patterns)
- Architecture notes (new services, models, routes needed)
- Acceptance criteria (Gherkin-style)

Add a row to the Feature Index table in `docs/FEATURE-REQUIREMENTS.md` (Status: In Progress) and in `CLAUDE.md`.

---

## Phase 2 — Implementation (Strict TDD)

**Tests must be written BEFORE implementation code. Make tests red first, then green.**

### 2a — Architecture & Test Scaffolding

1. **`angular-architect`** — Translate the UI spec into component/service structure and routing changes.
2. **`qa-expert`** — Write failing Jasmine unit tests for all new services and component logic (red phase).
3. **`test-automator`** — Write failing Playwright acceptance tests in `e2e/tests/` (red phase).

Confirm both test suites fail before proceeding to implementation.

### 2b — Implementation

Run these agents in dependency order:

4. **`typescript-pro`** — Implement models, interfaces, and service logic. Goal: make Jasmine unit tests green.
5. **`frontend-developer`** — Build components, templates, and SCSS. Goal: make Playwright acceptance tests green.

   SCSS checklist (mandatory — do not ship unstyled components):
   - `@use 'variables' as *;` and `@use 'mixins' as *;` at the top of every new `.scss` file
   - Every CSS class referenced in the template must be defined
   - Use only design tokens — never raw hex/px values
   - All interactive elements (buttons, inputs, links) need `:hover` and `:focus-visible` states

### 2c — Quality Gates

6. **`code-reviewer`** — Review implementation before merge; includes SCSS completeness check.
7. **`accessibility-tester`** — Verify WCAG compliance against the `ui-designer` spec.

---

## Phase 3 — Post-Implementation Documentation

1. **`technical-writer`** — Update `docs/feature-requirements/feature-NN-<slug>.md`: mark Status as Complete, add implementation notes.
2. Update `CLAUDE.md` and `docs/FEATURE-REQUIREMENTS.md`: change Status to Complete; add any new services, models, or conventions.

---

## Test Commands

Always capture output with `tee`:

```bash
npm test 2>&1 | tee /tmp/test-results.txt      # unit tests
npm run e2e 2>&1 | tee /tmp/e2e-results.txt    # acceptance tests
```

Both suites must be green before the feature is considered complete.
