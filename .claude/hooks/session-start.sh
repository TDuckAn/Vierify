#!/bin/bash
set -euo pipefail

# Only run in Claude Code remote (web) sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo '{"async": true, "asyncTimeout": 300000}'

REPO_DIR="/home/claude/vierify"
REPO_URL="https://github.com/TDuckAn/Vierify.git"

# Clone repo if not already present
if [ ! -d "$REPO_DIR/.git" ]; then
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    git clone "https://${GITHUB_TOKEN}@github.com/TDuckAn/Vierify.git" "$REPO_DIR"
  else
    git clone "$REPO_URL" "$REPO_DIR"
  fi
else
  # Repo exists — pull latest
  cd "$REPO_DIR"
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    git remote set-url origin "https://${GITHUB_TOKEN}@github.com/TDuckAn/Vierify.git"
  fi
  git pull --ff-only origin main || true
fi

cd "$REPO_DIR"

# Configure git push auth via credential helper if token available
if [ -n "${GITHUB_TOKEN:-}" ]; then
  git config credential.helper "!f() { echo username=x-token; echo password=${GITHUB_TOKEN}; }; f"
fi

# Install dependencies
pnpm install --frozen-lockfile
