# Contributing

Verify every change with `pixi run check` (CI runs the same). Land the grammar,
the scanner (if touched), the corpus test, and the highlights in the **same
commit** — one feature per commit.

## Extending the grammars

- **Add a builtin / keyword.** Add the word to the right category in
  `keyword-lists.json` (each category's `ts_scope` drives tree-sitter
  highlighting), then run `pixi run gen-grammars`. CI's `check-grammars` fails
  if you forget to regenerate.
- **Add an operator (infix/unary).** Add it to the relevant precedence rule in
  `tree-sitter/grammar.js` (`binary_expression`, `unary_expression`,
  `comparison_expression`, `exponential_expression`), add it to the
  `"operators"` array in `keyword-lists.json` (the tree-sitter `@operator`
  block in `highlights.scm` is generated from there — hand-edits get
  overwritten), then run `pixi run gen-grammars`. CI's `check-grammars` fails
  if you forget to regenerate. Add a corpus entry.
- **Add a postfix form.** Add a left-recursive rule in `grammar.js` analogous to
  `call_expression` / `field_access` / `dot_call` / `index_expression`; add
  corpus.
- **Add a fence-style comment/string.** Add a `TokenType` enum value plus a scan
  block in `tree-sitter/src/scanner.c` (mirror the `###` / `%%%` blocks), add the
  token to `externals` in `grammar.js`, and add corpus. If it needs more than
  `bracket_depth` state, update serialize/deserialize too.
- **Add a new bracket pair.** Add `_l*` / `_r*` symbols to `externals`, to the
  scanner's bracket switch, and to the grammar rules; update bracket-depth
  serialisation if the pair participates in line continuation.
- **Add a new editor / publication target.** Add a `check_or_update_<target>`
  sink in `tools/gen-grammars.py`, register it in `main()`, and add a CI step.

The Pygments lexer (`pygments/flatppl_lexer.py`) word lists are generated the
same way — edit `keyword-lists.json`, then `pixi run gen-grammars`.

The CodeMirror highlighter (`codemirror/textmate-highlight.ts`) reuses the
TextMate grammar at runtime; it lives here and is vendored into flatppl-js at
build time. It is not generated — edit it directly, keeping the `tok-*` classes
in sync with the consumer's editor CSS.

## Kate grammar divergences

`kate/flatppl.xml` is hand-ported from the TextMate grammar — keep the two in
sync (regression harness: `kate/test/check.sh`). Three deliberate divergences,
all forced by skylighting/Pandoc:

1. Generic function-calls are left un-highlighted (skylighting's `dsOther` emits
   no HTML class).
2. The TextMate number/hole/assignment lookbehind assertions are replaced by
   rule ordering (skylighting lookbehind is unreliable; lookahead is fine).
3. Builtin names match as a keyword list with no `(?=\s*\()` call-context guard
   (Kate keyword lists can't take a lookahead), so a builtin name highlights even
   where it isn't a call — `f = sum` colours `sum` as a builtin, where TextMate
   leaves it a plain variable. This over-colours, and the reason is the keyword
   list, not the language: §04 "Name resolution" makes builtin names shadowable
   ("a module may bind any name except for `self` and `base`"), so the name is
   not reserved and a bare reference to it need not be the builtin. Accepted,
   because a flat keyword list cannot take the lookahead that would express it.

## Member names are never builtins

Every target scopes a `field_access` member name (`r.sum`, `tbl.col`,
`mod.member`) as a **member**, never as a builtin, and does so whether or not the
member is called:

| Target | Member scope |
|---|---|
| tree-sitter | `@variable.member` |
| TextMate / Sublime / CodeMirror | `variable.other.member.flatppl` |
| Pygments | `Name.Attribute` |
| Kate | `Member` (`dsAttribute`) |
| highlight.js | `hljs-property` |

§04 "Objects, expressions, names and modules" is the rule: "record field names
and table column names are local to their object and not part of the global
module namespace". So `r.sum` is not the builtin `sum`, and a highlighter must
not paint it as one.

The word-list targets get this from rule ordering — their `\.name` rule consumes
the dot and the name together, before the builtin word list can see the name.
tree-sitter gets it from capture ordering: the `field_access` member capture sits
**after** the GEN keyword blocks in `highlights.scm`, which is last-match-wins.
Keep it there. Moving it back above the GEN blocks silently reintroduces the bug
without any parse error.

One case stays accepted in every target: a **shadowed binding** (`Gamma = 0.1`)
still takes the builtin scope. Deciding it needs module-wide scope analysis,
which none of these engines can do.

## Standard-module members never go in `keyword-lists.json`

A §09 standard-module member (e.g. `particle-physics`'s `resonance_breitwigner`,
`kallen`, the `interp_*` functions, the Wigner functions) resolves only through
`alias.member(...)` after `standard_module(...)` — an unqualified call is not
valid FlatPPL. Ruling (2026-08-27): such names must never be listed in any
`keyword-lists.json` category, including `builtins`. An unqualified reference is
a plain identifier/function-call, not `@function.builtin` — the "Member names are
never builtins" scoping above already colours the qualified form correctly, so
no keyword-list entry is needed on either side of the dot.

`tools/check-spec-keywords.py`'s `EXCLUDED_MODULE_MEMBERS` set carries the
exemption per name so the completeness guard does not demand these entries.
Keep the names spellable via the hand-maintained block above the `cspell`
`GEN:keywords` markers instead.

Regression: `tree-sitter/test/query/check.sh` (fixture
`tree-sitter/test/query/member.flatppl`), run by `pixi run check`.
