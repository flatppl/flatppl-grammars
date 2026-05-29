# FlatPPL Grammars

Editor grammar definitions for FlatPPL, the Flat Portable Probabilistic
Language.

There is one canonical FlatPPL surface syntax. The grammars also
provide **injection** grammars for FlatPPL embedded in host languages
— `flatppl(r"""…""")` in Python and `flatppl"""…"""` in Julia — so
editors highlight the embedded model with the FlatPPL grammar.

## Getting started

[Install pixi](https://pixi.sh), then after cloning:

```bash
pixi run pre-commit install   # install the pre-commit hook
pixi run check                # verify grammars and Kate highlighting
```

## About FlatPPL

FlatPPL is a minimal, inference-agnostic stochastic language for specifying
probabilistic models.

## Available grammars

* [TextMate grammar](textmate) — `flatppl.tmLanguage.json` (the
  language), plus injections: `flatppl-markdown` (fenced ` ```flatppl `
  code blocks), `flatppl-python` (`flatppl(r"""…""")`),
  `flatppl-julia` (`flatppl"""…"""`).
* [Kate / skylighting definition](kate) — `flatppl.xml`, consumed by
  Pandoc via `--syntax-definition=flatppl.xml` to highlight fenced
  ` ```flatppl ` blocks in HTML/LaTeX output. Hand-ported from the
  TextMate grammar. Keyword lists are auto-synced from
  [`keyword-lists.json`](keyword-lists.json) via `pixi run gen-grammars`
  (see §Keyword list maintenance); structural rules are hand-maintained.
  Regression harness: `kate/test/check.sh`. Three deliberate divergences
  from the TextMate grammar, all forced by skylighting/Pandoc:
  (1) generic function-calls are left un-highlighted (skylighting's
  `dsOther` emits no HTML class); (2) the lookbehind assertions in the
  TextMate number/hole/assignment rules are replaced by rule ordering
  (skylighting lookbehind is unreliable; lookahead is fine);
  (3) builtin names are matched as a keyword list (no `(?=\s*\()`
  call-context guard — Kate keyword lists can't take a lookahead), so a
  builtin name highlights even where it isn't a call. These names are
  reserved in FlatPPL, so the colouring is semantically correct.

## Keyword list maintenance

All 10 keyword categories are defined once in [`keyword-lists.json`](keyword-lists.json)
at the repo root. The TextMate alternation regexes and Kate `<list>` blocks are
generated from it — do not edit those sections directly.

**To add or remove a keyword:**

1. Edit `keyword-lists.json`.
2. Run `pixi run gen-grammars` — updates both grammars in-place.
3. Commit all three files together: `keyword-lists.json`, `textmate/flatppl.tmLanguage.json`,
   `kate/flatppl.xml`.

The pre-commit hook runs `pixi run check-grammars` automatically on commits that
touch any of those three files. CI runs the same check on every push.

## Spell-checker vocabulary

[`cspell/flatppl-words.txt`](cspell/flatppl-words.txt) is the canonical
[Code Spell Checker](https://cspell.org) dictionary of FlatPPL
builtins / keywords.

## License

[MIT](LICENSE)
