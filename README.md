# FlatPPL Grammars

Editor grammar definitions for FlatPPL — the Flat Portable Probabilistic
Language, a minimal, inference-agnostic language for specifying probabilistic
models.

They also provide **injection** grammars so editors highlight FlatPPL embedded
in host languages: `flatppl(r"""…""")` in Python, `flatppl"""…"""` in Julia, and
` ```flatppl ` fenced blocks in Markdown.

## Grammars

| Target | File | Used by |
| --- | --- | --- |
| [TextMate](textmate) | `flatppl.tmLanguage.json` | VS Code, GitHub, … |
| [tree-sitter](tree-sitter) | `grammar.js` + `src/scanner.c` | Neovim, Helix, … |
| [Kate / skylighting](kate) | `flatppl.xml` | Pandoc highlighting |
| [Pygments](pygments) | `flatppl_lexer.py` | Sphinx, Jupyter, `pygmentize` |
| [CodeMirror](codemirror) | `textmate-highlight.ts` | Web editors (e.g. flatppl-js playground) |

Keyword lists for all grammars are single-sourced from `keyword-lists.json`.

## Development

```sh
pixi run check         # run all checks (CI runs the same)
pixi run gen-grammars  # regenerate grammars from keyword-lists.json
```

See [CONTRIBUTING.md](CONTRIBUTING.md) to add builtins, operators, brackets, or
new editor targets.

## Notes

- [`cspell/flatppl-words.txt`](cspell/flatppl-words.txt) — canonical spell-check
  dictionary of FlatPPL builtins / keywords.
- `pixi.lock` is gitignored deliberately (ecosystem-wide policy: a lighter VCS
  footprint over a strict environment lock). Please don't add it.

## License

[MIT](LICENSE)
