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

## License

[MIT](LICENSE)
