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

## Spell-checker vocabulary

[`cspell/flatppl-words.txt`](cspell/flatppl-words.txt) is the canonical
[Code Spell Checker](https://cspell.org) dictionary of FlatPPL
builtins / keywords.

## License

[MIT](LICENSE)
