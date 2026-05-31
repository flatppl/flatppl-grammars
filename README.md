# FlatPPL Grammars

Editor grammar definitions for FlatPPL, the Flat Portable Probabilistic
Language.

There is one canonical FlatPPL surface syntax. The grammars also
provide **injection** grammars for FlatPPL embedded in host languages
— `flatppl(r"""…""")` in Python and `flatppl"""…"""` in Julia — so
editors highlight the embedded model with the FlatPPL grammar.

## About FlatPPL

FlatPPL is a minimal, inference-agnostic stochastic language for specifying
probabilistic models.

## Available grammars

* [TextMate grammar](textmate) — `flatppl.tmLanguage.json` (the
  language), plus injections: `flatppl-markdown` (fenced ` ```flatppl `
  code blocks), `flatppl-python` (`flatppl(r"""…""")`),
  `flatppl-julia` (`flatppl"""…"""`).
* [tree-sitter grammar](tree-sitter) — hand-written `grammar.js` + external scanner, with `queries/highlights.scm`; keyword lists synced from `keyword-lists.json` via `tools/gen-grammars.py` (same source as TextMate/Kate). Corpus tests under `tree-sitter/test/`. The C bindings and `Makefile` (`tree-sitter/Makefile`, the C target in `tree-sitter/binding.gyp`, `tree-sitter/bindings/c/`) are kept deliberately for potential future engine embedding (e.g. Julia/Rust/Python via cffi), not just editor use — they are intentional, not leftover scaffold.
* [Kate / skylighting definition](kate) — `flatppl.xml`, consumed by
  Pandoc via `--syntax-definition=flatppl.xml` to highlight fenced
  ` ```flatppl ` blocks in HTML/LaTeX output. Hand-ported from the
  TextMate grammar; keep the two in sync. Regression harness:
  `kate/test/check.sh`. Three deliberate divergences from the TextMate
  grammar, all forced by skylighting/Pandoc: (1) generic function-calls
  are left un-highlighted (skylighting's `dsOther` emits no HTML class);
  (2) the lookbehind assertions in the TextMate number/hole/assignment
  rules are replaced by rule ordering (skylighting lookbehind is
  unreliable; lookahead is fine); (3) builtin names are matched as a
  keyword list (no `(?=\s*\()` call-context guard — Kate keyword lists
  can't take a lookahead), so a builtin name highlights even where it
  isn't a call. These names are reserved in FlatPPL, so the colouring is
  semantically correct.

## Spell-checker vocabulary

[`cspell/flatppl-words.txt`](cspell/flatppl-words.txt) is the canonical
[Code Spell Checker](https://cspell.org) dictionary of FlatPPL
builtins / keywords.

## Extending the grammars

Concrete steps for common changes. Verify your edits with `pixi run check`
(CI runs the same).

* **Add a builtin / keyword.** Add the word to the right category in
  `keyword-lists.json` (each category carries a `ts_scope` that drives
  tree-sitter highlighting), then run `pixi run gen-grammars`. CI's
  `pixi run check-grammars` fails if you forget to regenerate.
* **Add an operator (infix/unary).** Add it to the relevant precedence rule
  in `tree-sitter/grammar.js` (`binary_expression`, `unary_expression`,
  `comparison_expression`, or `exponential_expression`), add the operator
  to the operator token list in `tree-sitter/queries/highlights.scm`, and
  add a corpus entry under `tree-sitter/test/corpus/`.
* **Add a postfix form.** Add a left-recursive rule in `grammar.js`
  analogous to `call_expression` / `field_access` / `dot_call` /
  `index_expression`; add corpus.
* **Add a fence-style comment/string.** Add a `TokenType` enum value plus a
  scan block in `tree-sitter/src/scanner.c` (mirror the `###` / `%%%`
  blocks), add the token to `externals` in `grammar.js`, and add corpus. If
  it needs more than `bracket_depth` state, update the serialize/deserialize
  functions too.
* **Add a new bracket pair.** Add `_l*` / `_r*` symbols to `externals`, to
  the scanner's bracket switch, and to the grammar rules; update the
  bracket-depth serialisation if the pair participates in line continuation.
* **Add a new editor / publication target.** Add a `check_or_update_<target>`
  sink in `tools/gen-grammars.py`, register it in `main()`, and add a CI step.

Discipline: land the grammar, the scanner (if touched), the corpus, and the
highlights in the **same commit** — one feature per commit.

## pixi.lock policy

`pixi.lock` is gitignored deliberately, as an ecosystem-wide FlatPPL policy:
we favour a lighter VCS footprint and accept conda-forge package drift over a
strict environment lock. This runs counter to pixi's own default
recommendation to commit the lockfile, so the temptation to add it is
expected — please don't.

## License

[MIT](LICENSE)
