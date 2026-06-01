#!/usr/bin/env bash
# Toolchain skew guard.
#
# Fails fast if the installed tree-sitter CLI cannot load the committed parser
# because of a LANGUAGE_VERSION / ABI mismatch. That skew (a stale CLI vs a newer
# committed src/parser.c) was the root cause of a multi-GB memory blow-up in the
# `tree-sitter test` runner. We detect it directly: try to load+parse a trivial
# input and look for the CLI's own "Incompatible language version" error. This is
# cheap (a single small parse, tens of MB) — NOT `tree-sitter test`.
set -u

cd "$(dirname "$0")/.." || exit 99   # -> tree-sitter/
TS="./node_modules/.bin/tree-sitter"
[ -x "$TS" ] || TS="npx tree-sitter"

want=$(grep -m1 '#define LANGUAGE_VERSION' src/parser.c 2>/dev/null | awk '{print $3}')
cli=$($TS --version 2>/dev/null)
echo "committed src/parser.c LANGUAGE_VERSION=${want:-?} ; installed CLI=${cli:-?}"

tmp=$(mktemp 2>/dev/null) || tmp="/tmp/ts-toolchain-probe.flatppl"
printf 'x = 1\n' > "$tmp"
out=$("$TS" parse "$tmp" 2>&1); rc=$?
rm -f "$tmp"

if printf '%s' "$out" | grep -qi 'Incompatible language version'; then
  echo "ERROR: tree-sitter CLI ($cli) cannot load committed parser (LANGUAGE_VERSION=$want)." >&2
  echo "       Toolchain skew — install the pinned CLI: (cd tree-sitter && npm ci && npm rebuild tree-sitter-cli)" >&2
  exit 1
fi
if [ "$rc" -ne 0 ]; then
  echo "ERROR: toolchain probe parse failed (rc=$rc):" >&2
  printf '%s\n' "$out" >&2
  exit 1
fi
echo "toolchain OK"
