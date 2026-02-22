#!/usr/bin/env bash
set -euo pipefail

branch="${1:-}"
if [[ -z "$branch" ]]; then
  echo "Usage: $0 <branch-name>" >&2
  exit 1
fi

if [[ ! -d ".git" ]]; then
  echo "Run this script from the repo root." >&2
  exit 1
fi

worktree_name="${branch#*/}"
worktree_path="../${worktree_name}"

git worktree add "$worktree_path" "$branch"

copy_if_exists() {
  local item="$1"
  if [[ -e "$item" ]]; then
    if [[ -d "$item" ]]; then
      rsync -a "$item"/ "$worktree_path/$item/"
    else
      rsync -a "$item" "$worktree_path/$item"
    fi
  fi
}

copy_if_exists ".vercel"
copy_if_exists ".env"
copy_if_exists ".env.local"
copy_if_exists ".env.development"
copy_if_exists ".env.production"
copy_if_exists ".codex"
copy_if_exists "node_modules"
copy_if_exists "AGENTS.md"
