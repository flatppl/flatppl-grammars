# Helix integration

[Helix](https://helix-editor.com) consumes the **tree-sitter** target (parser +
`tree-sitter/queries/*.scm`). It does not use the TextMate, Sublime, Kate, or
CodeMirror targets. This directory holds the Helix-specific glue: a
`languages.toml` entry and the host-language **injection** queries that
highlight FlatPPL embedded in Python, Julia, and Markdown (the embedding forms
in flatppl-design `docs/05-syntax.md` § "Host-language embedding").

Verified against **Helix 25.07.1**.

## 1. Register the language + grammar

Add to your `~/.config/helix/languages.toml` (see `languages.toml` here for a
copy):

```toml
[[language]]
name = "flatppl"
scope = "source.flatppl"
file-types = ["flatppl"]
comment-tokens = ["#"]
indent = { tab-width = 4, unit = "    " }
grammar = "flatppl"

[[grammar]]
name = "flatppl"
# Pin a rev for reproducibility. For local development use:
#   source = { path = "/abs/path/to/flatppl-grammars/tree-sitter" }
source = { git = "https://github.com/flatppl/flatppl-grammars", subpath = "tree-sitter", rev = "REPLACE_WITH_COMMIT_SHA" }
```

Then build the parser:

```sh
hx --grammar fetch   # only needed for the git source
hx --grammar build
```

## 2. FlatPPL's own queries

Copy (or symlink) the grammar's queries into your Helix runtime so `.flatppl`
files highlight:

```sh
mkdir -p ~/.config/helix/runtime/queries/flatppl
cp tree-sitter/queries/*.scm ~/.config/helix/runtime/queries/flatppl/
```

`hx --health flatppl` should then show the parser, highlight, and indent
queries as present.

## 3. Embedded FlatPPL in host languages

- **Markdown** — works out of the box: Helix's bundled Markdown grammar injects
  by fenced-code info string, so ```` ```flatppl ```` blocks highlight once the
  `flatppl` language above is installed. No extra query needed.
- **Python / Julia** — Helix's bundled grammars don't know the FlatPPL embedding
  forms, so add the injection rules from `editors/helix/queries/<lang>/injections.scm`.

Helix loads `injections.scm` from the **first** runtime dir that has it (your
user dir wins and *replaces* the bundled file — it does not merge). So append
the FlatPPL rule from each file here to a copy of Helix's bundled
`injections.scm` for that language, keeping the bundled rules:

```sh
RT=$(hx --health 2>/dev/null | sed -n 's/^Runtime directory: //p')   # or the bundled runtime
for lang in python julia; do
  mkdir -p ~/.config/helix/runtime/queries/$lang
  cat "$RT/queries/$lang/injections.scm" editors/helix/queries/$lang/injections.scm \
    > ~/.config/helix/runtime/queries/$lang/injections.scm
done
```

### Embedding forms recognised
- Python: `flatppl(r"""<code>""")` / `flatppl('''<code>''')` (raw/bytes prefixes ok).
- Julia: `flatppl"""<code>"""` or `flatppl"<code>"` (string macro).
- Markdown: ```` ```flatppl ```` fenced block.

## Notes / limitations
- The Julia rule injects the whole `prefixed_string_literal` (no inner-content
  node exists), so — like Helix's own `r"…"` / `md"…"` rules — the injected
  range includes the `flatppl` prefix and the surrounding quotes. Only that
  wrapper mis-highlights; the embedded code is correct.
- These queries are not exercised by `pixi run check` (no Helix in CI). They are
  verified by rendering the embedding forms in Helix and confirming the
  embedded region receives FlatPPL token scopes.
- Re-sync after a Helix upgrade if the bundled `injections.scm` for a host
  language changes.
