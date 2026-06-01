#!/usr/bin/env bash
# Highlight regression check via `tree-sitter query` (NOT `tree-sitter test`).
#
# Why query, not test: the tree-sitter-cli `test` highlight-assertion phase
# balloons RSS pathologically (180MB -> 735MB past the CI cap from a handful of
# extra assertions -- see the project memo / scanner OOM history). `tree-sitter
# query` parses + runs the query once and stays ~12MB, so it is a safe way to
# assert capture scopes in CI.
#
# Asserts: §05 axis variance markers `^`/`_` are captured as @property (the axis
# name's scope), so `.sigma^` reads as one unit and the marker is NOT coloured
# as the arithmetic `^` operator (@keyword.operator).
set -euo pipefail
cd "$(dirname "$0")/../.."          # -> tree-sitter/
FIXTURE="test/query/variance.flatppl"

out="$(tree-sitter query queries/highlights.scm "$FIXTURE")"

# Capture lines for a standalone single-char `^`/`_` token (the variance markers).
markers="$(printf '%s\n' "$out" | grep -E 'text: `[\^_]`$' || true)"
n="$(printf '%s\n' "$markers" | grep -c . || true)"
prop="$(printf '%s\n' "$markers" | grep -c 'property' || true)"

fail=0
# The fixture has 6 variance markers (^/_ across mu/nu/alpha/beta x2/gamma).
if [ "$n" -lt 6 ]; then
  echo "FAIL: expected >=6 variance markers in $FIXTURE, found $n"; fail=1
fi
if [ "$n" -ne "$prop" ]; then
  echo "FAIL: $((n - prop)) of $n variance markers not captured as @property:"
  printf '%s\n' "$markers" | grep -v 'property' | sed 's/^/  /'
  fail=1
fi

[ "$fail" -eq 0 ] && echo "ok: all $n axis variance markers (^/_) captured as @property"
exit "$fail"
