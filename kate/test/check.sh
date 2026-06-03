#!/usr/bin/env bash
# Render the FlatPPL sample through Pandoc and assert each token category
# produces the expected skylighting span class. Grows task-by-task: comment
# out assertions for categories not yet implemented.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
XML="$DIR/../flatppl.xml"
SAMPLE="$DIR/sample.flatppl"
MD="$(mktemp -t flatppl.XXXXXX)"; mv "$MD" "$MD.md"; MD="$MD.md"
OUT="$(mktemp -t flatppl.XXXXXX)"; mv "$OUT" "$OUT.html"; OUT="$OUT.html"
OPS_MD=""; OPS_OUT=""
trap 'rm -f "$MD" "$OUT" "$OPS_MD" "$OPS_OUT"' EXIT
{ echo '```flatppl'; cat "$SAMPLE"; echo '```'; } > "$MD"
pandoc --syntax-definition="$XML" --syntax-highlighting=tango "$MD" -o "$OUT"

fail=0
assert() { # $1 = grep -E pattern, $2 = description
  if grep -qE "$1" "$OUT"; then
    echo "ok: $2"
  else
    echo "FAIL: $2  (pattern: $1)"; fail=1
  fi
}

# Task 1
assert 'class="sourceCode flatppl"' 'flatppl recognized as a language'
assert '<span class="dt">Normal</span>' 'distribution kernel Normal -> dt'
# Task 2
assert '<span class="co">' 'plain comment -> co'
assert '<span class="do">' 'doc comment -> do'
# Task 3
assert '<span class="st">' 'string -> st'
assert '<span class="sc">' 'valid escape -> sc'
assert '<span class="er">' 'invalid escape -> er'
# Task 4
assert '<span class="bn">' 'hex integer -> bn'
assert '<span class="fl">' 'float -> fl'
assert '<span class="dv">' 'decimal integer -> dv'
# Task 5
assert '<span class="kw">fn</span>' 'special-operation fn -> kw'
assert '<span class="bu">iid</span>' 'combinator iid -> bu'
assert '<span class="cf">likelihoodof</span>' 'analysis likelihoodof -> cf'
assert '<span class="im">reduce</span>' 'higher-order reduce -> im'
assert '<span class="ex">interval</span>' 'set-constructor interval -> ex'
# Task 6
assert '<span class="fu">record</span>' 'builtin record -> fu'
assert '<span class="cn">inf</span>' 'constant inf -> cn'
assert '<span class="vs">reals</span>' 'predefined-set reals -> vs'
assert '<span class="va">self</span>' 'reserved self -> va'
# Task 7
assert '<span class="an">_name_</span>' 'placeholder _name_ -> an'
assert '<span class="re">' 'hole _ -> re (dsRegionMarker)'
assert '<span class="at">' 'dot-access member -> at'
# NB: generic function-calls are intentionally NOT highlighted — skylighting's
# dsOther emits no HTML class in pandoc, so there is no usable style for them.
# Task 8
assert '<span class="op">' 'operators -> op'

# ── Operator coverage (drift guard vs keyword-lists.json "operators") ─────────
# Render one `a OP b` line per canonical operator and assert the operator span
# count is at least the number of operators: each line contributes exactly one
# dsOperator (class="op") span, so a missing/mis-scoped operator drops the count
# and fails. Source of truth is shared with the tree-sitter @operator block.
# NOTE: the check is >=, not ==, so if kate ever splits a multi-char op into two
# spans the count inflates and could mask a sibling regression; an == check would
# be tighter but depends on pandoc's exact per-context span structure.
JSON="$DIR/../../keyword-lists.json"
OPS_MD="$(mktemp -t flatppl-ops.XXXXXX)"; mv "$OPS_MD" "$OPS_MD.md"; OPS_MD="$OPS_MD.md"
OPS_OUT="$(mktemp -t flatppl-ops.XXXXXX)"; mv "$OPS_OUT" "$OPS_OUT.html"; OPS_OUT="$OPS_OUT.html"
{
  echo '```flatppl'
  python3 -c "import json,sys
ops=json.load(open(sys.argv[1]))['operators']
sys.stdout.write(''.join('a %s b\n'%o for o in ops))" "$JSON"
  echo '```'
} > "$OPS_MD"
pandoc --syntax-definition="$XML" --syntax-highlighting=tango "$OPS_MD" -o "$OPS_OUT"
n_ops="$(python3 -c "import json,sys;print(len(json.load(open(sys.argv[1]))['operators']))" "$JSON")"
got="$(grep -oE 'class="op"' "$OPS_OUT" | wc -l | tr -d ' ')"
if [ "$got" -ge "$n_ops" ]; then
  echo "ok: operator coverage ($got >= $n_ops dsOperator spans)"
else
  echo "FAIL: operator coverage — $got dsOperator spans for $n_ops operators (one or more not highlighted as operator in kate/flatppl.xml)"; fail=1
fi

exit $fail
