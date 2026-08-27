#!/usr/bin/env bash
# Highlight regression check via `tree-sitter query` (NOT `tree-sitter test`).
#
# Why query, not test: the tree-sitter-cli `test` highlight-assertion phase
# balloons RSS pathologically (180MB -> 735MB past the CI cap from a handful of
# extra assertions -- see the project memo / scanner OOM history). `tree-sitter
# query` parses + runs the query once and stays ~12MB, so it is a safe way to
# assert capture scopes in CI.
#
# Asserts:
#  1. §05 axis variance markers `^`/`_` are captured as @property (the axis
#     name's scope), so `.sigma^` reads as one unit and the marker is NOT
#     coloured as the arithmetic `^` operator (@keyword.operator).
#  2. §04 member names are local to their object, so `r.sum` is @variable.member
#     and not the builtin `sum` — while a real `sum(...)` call stays
#     @function.builtin.
set -euo pipefail
cd "$(dirname "$0")/../.."          # -> tree-sitter/
FIXTURE="test/query/variance.flatppl"

# `npx` resolves the local node_modules tree-sitter-cli (bare `tree-sitter` is
# not on PATH in CI); matches gen-tree-sitter / run-corpus.sh.
out="$(npx tree-sitter query queries/highlights.scm "$FIXTURE" 2>/dev/null)"

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

# `|| true` so a variance failure does not abort under `set -e` — the member
# checks below must still run and report.
[ "$fail" -eq 0 ] && echo "ok: all $n axis variance markers (^/_) captured as @property" || true

# ── Member reads vs builtin calls ─────────────────────────────────────────────
# highlights.scm is last-match-wins, so the pattern with the HIGHEST index is the
# scope that actually renders. `tree-sitter query` lists every matching pattern,
# so reduce its output to one winning capture per source position.
MEMBER_FIXTURE="test/query/member.flatppl"

winners="$(npx tree-sitter query queries/highlights.scm "$MEMBER_FIXTURE" 2>/dev/null \
  | sed -n -E 's/^ *pattern: ([0-9]+)$/P\t\1/p; s/^ *capture: [0-9]+ - ([^,]+), start: \(([0-9]+), ([0-9]+)\).*text: `(.*)`$/C\t\1\t\2\t\3\t\4/p' \
  | awk -F'\t' 'BEGIN{OFS="\t"} $1=="P"{p=$2; next} $1=="C"{print $3":"$4, p, $5, $2}' \
  | sort -t"$(printf '\t')" -k1,1 -k2,2n \
  | awk -F'\t' 'BEGIN{OFS="\t"} {if ($1!=k && NR>1) print k,t,s; k=$1; t=$3; s=$4} END{print k,t,s}')"

# line:col of each name under test in member.flatppl (0-based, as tree-sitter reports).
check_scope() {  # <line:col> <text> <expected scope>
  local got
  got="$(printf '%s\n' "$winners" | awk -F'\t' -v k="$1" '$1==k {print $3}')"
  if [ "$got" != "$3" ]; then
    echo "FAIL: \`$2\` at $1 captured as ${got:-<nothing>}, expected $3"
    fail=1
  fi
}

check_scope 1:16 "r.sum"                          variable.member
check_scope 2:15 "sum("                           function.builtin
check_scope 2:21 "r.mean"                         variable.member
check_scope 3:22 "hepphys.resonance_breitwigner"  variable.member
check_scope 4:22 "hepphys.resonance_breitwigner(" variable.member
check_scope 5:12 "resonance_breitwigner("         function.call
check_scope 0:11 "record(sum = ...)"              variable.parameter

[ "$fail" -eq 0 ] && echo "ok: member reads captured as @variable.member, builtin calls as @function.builtin"
exit "$fail"
