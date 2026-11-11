#!/usr/bin/env bash
# pixi `verify-nvim` entry point. Skips cleanly (exit 0) when Neovim or a C
# compiler is absent — so it is safe to run anywhere, including machines/CI
# without an editor — otherwise compiles THIS checkout's FlatPPL grammar into a
# temp dir (as the emacs verifier does) and runs the headless vim.treesitter
# check in verify.lua against it. The python/julia host parsers still come from
# nvim-treesitter (see ../README.md).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"

if ! command -v nvim >/dev/null 2>&1; then
  echo "skip: neovim not installed — nvim integration check not run"
  exit 0
fi
if ! command -v cc >/dev/null 2>&1; then
  echo "skip: no C compiler (cc) — cannot build the flatppl parser"
  exit 0
fi

root="$(cd "$here/../../.." && pwd)"
ts="$root/tree-sitter"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

if [ "$(uname)" = "Darwin" ]; then
  cc -dynamiclib -fPIC -I "$ts/src" "$ts/src/parser.c" "$ts/src/scanner.c" -o "$tmp/flatppl.so"
else
  cc -shared -fPIC -I "$ts/src" "$ts/src/parser.c" "$ts/src/scanner.c" -o "$tmp/flatppl.so"
fi

FLATPPL_NVIM_PARSER="$tmp/flatppl.so" FLATPPL_NVIM_QUERIES="$ts/queries" \
  nvim --headless -l "$here/verify.lua"
