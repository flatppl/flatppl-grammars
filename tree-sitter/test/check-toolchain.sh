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

# Structural skew check — numeric ABI comparison (M5).
# tree-sitter 0.26.9 has no dedicated flag that prints the CLI max ABI; however
# the `generate --help` output embeds the value as "newest supported version (N)".
# We extract that number so the check is independent of the "Incompatible language
# version" error wording (which could change in future CLI releases).
parser_abi="$(sed -n 's/^#define LANGUAGE_VERSION //p' src/parser.c 2>/dev/null | head -1)"
cli_max_abi="$("$TS" generate --help 2>&1 | grep -oE 'newest supported version \([0-9]+\)' | grep -oE '[0-9]+')"
if [ -n "$parser_abi" ] && [ -n "$cli_max_abi" ] \
   && [ "$parser_abi" -gt "$cli_max_abi" ] 2>/dev/null; then
  echo "TOOLCHAIN SKEW: committed parser ABI $parser_abi > CLI max ABI $cli_max_abi." >&2
  echo "Run 'pixi run npm-install' to install the pinned tree-sitter-cli." >&2
  exit 1
fi

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
# ── Error-recovery heuristic version canary (review Risk 1) ──────────────────
# src/scanner.c detects parser error-recovery via tree-sitter's UNDOCUMENTED
# "all external symbols valid at once" behavior, verified ONLY on the pinned
# CLI. If the installed CLI differs from the pin in package.json, that
# assumption may no longer hold — surface it loudly so a human re-verifies the
# scanner.txt recovery tests against the new CLI.
verified_cli="$(sed -n 's/.*"tree-sitter-cli"[[:space:]]*:[[:space:]]*"[~^]\{0,1\}\([0-9][0-9.]*\)".*/\1/p' package.json | head -1)"
installed_cli="$(printf '%s' "$cli" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
if [ -n "$verified_cli" ] && [ -n "$installed_cli" ] && [ "$verified_cli" != "$installed_cli" ]; then
  echo "WARNING: tree-sitter-cli $installed_cli != pinned/verified $verified_cli." >&2
  echo "         src/scanner.c's error-recovery heuristic relies on UNDOCUMENTED" >&2
  echo "         CLI behavior verified only on the pinned $verified_cli. RE-VERIFY the" >&2
  echo "         'error-recovery resync' tests in test/corpus/scanner.txt, then" >&2
  echo "         bump the pin in tree-sitter/package.json." >&2
fi
echo "toolchain OK"
