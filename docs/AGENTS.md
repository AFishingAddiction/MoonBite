# MoonBite — Agent Workflows

This document describes which Claude Code agents are relevant to this project and how to compose them for common tasks.

The agents below come from [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents). Install them by following the instructions in that repo.

## Relevant Agents

| Agent | When to use |
|---|---|
| `frontend-developer` | Building new components, views, or Angular features |
| `debugger` | Diagnosing test failures, runtime errors, or unexpected behaviour |
| `code-reviewer` | Pre-merge review of a feature branch |
| `refactoring-specialist` | Cleaning up a component or service without changing behaviour |
| `test-automator` | Adding or improving unit or Playwright acceptance tests |
| `technical-writer` | Updating `CLAUDE.md`, `README.md`, or feature requirement docs |

## Common Workflows

### Feature development

1. Create a feature requirement file in `docs/feature-requirements/`
2. Use `frontend-developer` to implement the feature
3. Use `test-automator` to add unit and/or acceptance tests
4. Use `code-reviewer` before merging

### Bug investigation

1. Use `debugger` to identify the root cause
2. Fix inline or delegate to `frontend-developer` for larger changes
3. Use `test-automator` to add a regression test

### Refactoring

1. Use `refactoring-specialist` — always verify tests pass before and after
