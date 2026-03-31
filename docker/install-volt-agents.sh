#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://raw.githubusercontent.com/VoltAgent/awesome-claude-code-subagents/main"
AGENTS_DIR="${HOME}/.claude/agents"

download_agent() {
    local category="$1"
    local filename="$2"
    local url="${BASE_URL}/categories/${category}/${filename}"

    mkdir -p "${AGENTS_DIR}"
    curl -fsSL "${url}" -o "${AGENTS_DIR}/${filename}"
    echo "Installed: ${filename}"
}

# Planning & Coordination
download_agent "09-meta-orchestration" "workflow-orchestrator.md"
download_agent "04-quality-security" "architect-reviewer.md"
download_agent "08-business-product" "product-manager.md"

# Architecture & Development
download_agent "02-language-specialists" "angular-architect.md"
download_agent "02-language-specialists" "typescript-pro.md"
download_agent "01-core-development" "frontend-developer.md"
download_agent "01-core-development" "ui-designer.md"
download_agent "01-core-development" "api-designer.md"

# Testing & Quality
download_agent "04-quality-security" "qa-expert.md"
download_agent "04-quality-security" "test-automator.md"
download_agent "04-quality-security" "code-reviewer.md"
download_agent "04-quality-security" "accessibility-tester.md"
download_agent "04-quality-security" "performance-engineer.md"
download_agent "04-quality-security" "debugger.md"

# Documentation & Developer Experience
download_agent "08-business-product" "technical-writer.md"
download_agent "06-developer-experience" "refactoring-specialist.md"