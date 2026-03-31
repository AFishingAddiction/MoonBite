# MoonBite — Agent Workflows

This document describes which Claude Code agents are relevant to this project and how to compose them for common tasks.

---

## Utility (Use Freely)

| Agent | When to use |
|---|---|
| `Explore` | Fast codebase search — find files, grep for patterns, answer structural questions without polluting context |
| `Plan` | Design an implementation strategy before writing code; returns step-by-step plans and identifies critical files |

These are built-in Claude Code agents — no installation required.

The sub-agents below come from [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) and are pre-installed in the Docker image.

---

## Relevant Agents

### Planning & Coordination
| Agent | When to use |
|---|---|
| `workflow-orchestrator` | Coordinating any multi-step or multi-agent workflow |
| `product-manager` | Defining scope, acceptance criteria, and success metrics — consult before implementing any feature |
| `architect-reviewer` | Reviewing architectural decisions before committing to an approach |

### Architecture & Development
| Agent | When to use |
|---|---|
| `angular-architect` | Component architecture, routing, change detection, standalone component patterns |
| `typescript-pro` | Advanced types, generics, strict type safety across models and services |
| `frontend-developer` | UI implementation, SCSS, template logic |
| `ui-designer` | Visual design, component layouts, interaction patterns, design system consistency |
| `api-designer` | HTTP client patterns, service design, error mapping |

### Testing & Quality
| Agent | When to use |
|---|---|
| `qa-expert` | Test strategy, coverage gaps, Jasmine/Karma test design |
| `test-automator` | Playwright acceptance tests, page object models |
| `code-reviewer` | Pre-merge review for quality and maintainability |
| `accessibility-tester` | WCAG compliance, ARIA attributes, keyboard navigation |
| `performance-engineer` | Bundle size, change detection cycles, lazy loading |
| `debugger` | Diagnosing runtime errors, async issues, unexpected behaviour |

### Documentation & Developer Experience
| Agent | When to use |
|---|---|
| `technical-writer` | Updating `CLAUDE.md`, `README.md`, or feature requirement docs |
| `refactoring-specialist` | Improving service structure, reducing duplication without changing behaviour |

---

## Common Workflows

All multi-agent workflows should be initiated via `workflow-orchestrator`.

### 1. Feature Development (TDD)

```
[PRE-IMPLEMENTATION]
product-manager         → Define scope and acceptance criteria
  └─ angular-architect  → Translate requirements into component/service structure
       → Capture in docs/feature-requirements/feature-NN-<slug>.md
       → Add entry to docs/FEATURE-REQUIREMENTS.md

[IMPLEMENTATION — TDD]
qa-expert               → Write failing Jasmine unit tests (red)
test-automator          → Write failing Playwright acceptance tests (red)
  └─ frontend-developer → Implement components and templates (make tests green)
  └─ typescript-pro     → Implement models, interfaces, service logic (make tests green)
       └─ code-reviewer → Review before merge
```

### 2. Bug Investigation & Fix (TDD)

```
debugger                → Isolate the defect
  └─ qa-expert          → Write failing Jasmine unit test that reproduces the bug (red)
  └─ test-automator     → Write failing Playwright acceptance test (red)
       └─ frontend-developer  → Implement the fix (make tests green)
            └─ code-reviewer  → Review fix and confirm both test suites pass
```

### 3. Refactoring & Technical Debt

```
architect-reviewer      → Assess current structure against Angular best practices
  └─ refactoring-specialist → Plan and execute refactoring
  └─ typescript-pro         → Strengthen type safety, remove `any` usage
       └─ test-automator    → Confirm all Playwright tests pass post-refactor
```

### 4. Performance Optimisation

```
performance-engineer    → Profile bundle size and change detection cycles
  └─ angular-architect  → Refactor OnPush change detection, lazy loading
       └─ test-automator → Verify no regressions in acceptance tests
```

---

## Agent Invocation Tips

- **Always start with `workflow-orchestrator`** for any task involving more than one agent — it decomposes work, sequences agents, and prevents duplicate effort.
- **Every new feature gets a file in `docs/feature-requirements/`** named `feature-NN-<slug>.md`. Create it during the `product-manager` phase — before any implementation begins. Add a row to `docs/FEATURE-REQUIREMENTS.md`.
- **Follow TDD for all feature work and bug fixes.** `qa-expert` writes failing Jasmine unit tests and `test-automator` writes failing Playwright acceptance tests *before* implementation begins.
- **Consult `angular-architect` before any structural change** — routing, state management approach, component boundaries, lazy loading strategy.
- **Pair `typescript-pro` with `angular-architect`** when working on models or service logic to maintain strict type safety.
- **Use `Explore` liberally** to search the codebase without consuming context — it is fast and free.
- **Use `Plan` before delegating to `frontend-developer` or `typescript-pro`** on non-trivial work to align on the approach first.

