# Zed integration

Zed consumes the **tree-sitter** target via a Zed extension. This dir is a
**skeleton** — `extension.toml` (grammar source) and `languages/flatppl/config.toml`.

## Finish the extension
Zed loads syntax queries from `languages/flatppl/*.scm` inside the extension.
Copy the grammar's queries in before building/installing:

```sh
cp tree-sitter/queries/highlights.scm  editors/zed/languages/flatppl/
cp tree-sitter/queries/injections.scm  editors/zed/languages/flatppl/
# optional: indents.scm, folds.scm
```

(These are intentionally **not** committed here to avoid drift from
`tree-sitter/queries/` — that dir is the single source. Re-copy after grammar
changes.) Then install as a dev extension: Zed → `zed: install dev extension` →
pick `editors/zed/`.

## Embedded FlatPPL
- **Markdown** fenced ```` ```flatppl ```` blocks highlight once the extension
  is installed (Zed injects fenced blocks by language name).
- **Python / Julia** embedding is **not** wired: Zed injections live in each
  host language's extension, which this extension can't amend. No support
  without upstream changes to Zed's Python/Julia extensions.

## Verification status
**Not verified** — Zed was not available on the build machine. Files follow
Zed's documented extension format; treat as a starting point.
