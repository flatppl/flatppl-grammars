#!/usr/bin/env bash
# Textobjects regression check via `tree-sitter query` (NOT `tree-sitter test`).
#
# Why query, not test: the tree-sitter-cli `test` highlight-assertion phase
# balloons RSS past the CI cap; `tree-sitter query` parses + runs the query once
# and stays ~12MB (see test/query/check.sh for the same rationale).
#
# Asserts the three portable textobjects (function/parameter/comment) land on
# the ranges the grammar implies, including the edge cases where a no-ERROR parse
# can silently mis-capture: a bare-identifier function body must NOT be captured
# as a parameter, and the function name must NOT be captured as a parameter.
set -euo pipefail
cd "$(dirname "$0")/../.."          # -> tree-sitter/
FIXTURE="test/query/textobjects.flatppl"

fail=0

# Run a query file against the fixture; print raw capture lines.
run_query() { npx tree-sitter query "$1" "$FIXTURE" 2>/dev/null; }

# Extract the `text` of every capture whose name == $2, from the output in $1.
# Capture lines look like: `  capture: 0 - function.outer, ... text: \`...\``
caps() {
  printf '%s\n' "$1" | grep -E -- "- ${2//./\\.}," \
    | sed -E 's/.*text: `([^`]*)`.*/\1/'
}
count() { printf '%s\n' "$1" | grep -c . || true; }

assert_count() { # name expected actual
  if [ "$3" -ne "$2" ]; then
    echo "FAIL: expected $2 @$1 captures, found $3"; fail=1
  fi
}
assert_has() { # capturename text  (in $list)
  if ! printf '%s\n' "$list" | grep -qxF -- "$2"; then
    echo "FAIL: @$1 missing expected text: \`$2\`"; fail=1
  fi
}
assert_lacks() { # capturename text  (in $list)
  if printf '%s\n' "$list" | grep -qxF -- "$2"; then
    echo "FAIL: @$1 wrongly captured: \`$2\`"; fail=1
  fi
}

out="$(run_query queries/textobjects.scm)"

# --- function ---
fo="$(caps "$out" function.outer)"
assert_count function.outer 3 "$(count "$fo")"   # 1 def + 2 lambdas
list="$(caps "$out" function.inner)"
assert_has function.inner "fbody"
assert_has function.inner "pbody"
assert_has function.inner "qbody"

# --- parameter ---
list="$(caps "$out" parameter.inner)"
for p in fpa fpb parg qa qb arg1 arg2 "key = 7"; do
  assert_has parameter.inner "$p"
done
# names / bodies / call targets must NOT be parameters
for nope in fdef fbody lam parg_no pbody qbody multilam csite kwcall empty somefn otherfn niladic; do
  assert_lacks parameter.inner "$nope"
done

# --- comment ---
co="$(caps "$out" comment.outer)"
assert_count comment.outer 2 "$(count "$co")"
list="$co"
assert_has comment.outer "# line comment text"
assert_has comment.outer "% doc comment text"

# --- editor copies: identical capture ranges (modulo dialect suffix) ---
# nvim copy must produce byte-identical query output to the canonical file.
nvim_out="$(run_query ../editors/nvim/queries/flatppl/textobjects.scm)"
if [ "$nvim_out" != "$out" ]; then
  echo "FAIL: editors/nvim copy captures differ from canonical query"; fail=1
fi
# Helix copy: same ranges once .inside/.around are normalized back to .inner/.outer.
helix_out="$(run_query ../editors/helix/queries/flatppl/textobjects.scm \
  | sed -E 's/\.inside,/.inner,/; s/\.around,/.outer,/')"
if [ "$helix_out" != "$out" ]; then
  echo "FAIL: editors/helix copy captures differ from canonical query"; fail=1
fi

[ "$fail" -eq 0 ] && echo "ok: textobjects captures verified"
exit "$fail"
