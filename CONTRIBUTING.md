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
   where it isn't a call. These names are reserved in FlatPPL, so the colouring
   is semantically correct.
