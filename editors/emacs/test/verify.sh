#!/usr/bin/env bash
# Self-contained headless check of flatppl-ts-mode: compiles the FlatPPL grammar
# as an Emacs treesit lib into a temp dir, then runs verify.el against it.
# Requires emacs (29+, built with tree-sitter) and a C compiler. Not in the
# repo's pixi CI.
set -euo pipefail

# Skip cleanly when prereqs are absent, so this is safe to run anywhere (e.g. via
# `pixi run verify-emacs`) including CI machines without an editor.
if ! command -v emacs >/dev/null 2>&1; then
  echo "skip: emacs not installed — flatppl-ts-mode check not run"
  exit 0
fi
if ! command -v cc >/dev/null 2>&1; then
  echo "skip: no C compiler (cc) — cannot build the treesit grammar lib"
  exit 0
fi

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../../.." && pwd)"
ts="$root/tree-sitter"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

if [ "$(uname)" = "Darwin" ]; then
  cc -dynamiclib -fPIC -I "$ts/src" "$ts/src/parser.c" "$ts/src/scanner.c" \
     -o "$tmp/libtree-sitter-flatppl.dylib"
else
  cc -shared -fPIC -I "$ts/src" "$ts/src/parser.c" "$ts/src/scanner.c" \
     -o "$tmp/libtree-sitter-flatppl.so"
fi

FLATPPL_TS_LOAD_PATH="$tmp" emacs --batch -Q -L "$here/.." -l "$here/verify.el"
