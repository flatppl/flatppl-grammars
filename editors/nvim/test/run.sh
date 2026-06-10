#!/usr/bin/env bash
# pixi `verify-nvim` entry point. Skips cleanly (exit 0) when Neovim is absent —
# so it is safe to run anywhere, including machines/CI without an editor —
# otherwise runs the headless vim.treesitter check in verify.lua. The lua script
# still asserts its parser/query prereqs loudly when nvim IS present (see
# ../README.md); only a missing nvim binary is treated as a skip.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"

if ! command -v nvim >/dev/null 2>&1; then
  echo "skip: neovim not installed — nvim integration check not run"
  exit 0
fi

exec nvim --headless -l "$here/verify.lua"
