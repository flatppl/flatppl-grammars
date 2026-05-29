#!/usr/bin/env bash
# Render the FlatPPL sample through Pandoc and assert each token category
# produces the expected skylighting span class. Grows task-by-task: comment
# out assertions for categories not yet implemented.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
XML="$DIR/../flatppl.xml"
SAMPLE="$DIR/sample.flatppl"
MD="$(mktemp -t flatppl).md"
OUT="$(mktemp -t flatppl).html"
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
#assert '<span class="st">' 'string -> st'
#assert '<span class="sc">' 'valid escape -> sc'
#assert '<span class="er">' 'invalid escape -> er'
# Task 4
#assert '<span class="bn">' 'hex integer -> bn'
#assert '<span class="fl">' 'float -> fl'
#assert '<span class="dv">' 'decimal integer -> dv'
# Task 5
#assert '<span class="kw">fn</span>' 'special-operation fn -> kw'
#assert '<span class="bu">iid</span>' 'combinator iid -> bu'
#assert '<span class="cf">likelihoodof</span>' 'analysis likelihoodof -> cf'
#assert '<span class="im">reduce</span>' 'higher-order reduce -> im'
#assert '<span class="ex">interval</span>' 'set-constructor interval -> ex'
# Task 6
#assert '<span class="fu">record</span>' 'builtin record -> fu'
#assert '<span class="cn">inf</span>' 'constant inf -> cn'
#assert '<span class="vs">reals</span>' 'predefined-set reals -> vs'
#assert '<span class="va">self</span>' 'reserved self -> va'
# Task 7
#assert '<span class="an">_name_</span>' 'placeholder _name_ -> an'
#assert '<span class="rm">' 'hole _ -> rm'
#assert '<span class="at">' 'dot-access member -> at'
#assert '<span class="ot">' 'generic function-call -> ot'
# Task 8
#assert '<span class="op">' 'operators -> op'

exit $fail
