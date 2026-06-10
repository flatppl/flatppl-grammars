# Emacs integration (treesit)

`flatppl-ts-mode.el` is a **skeleton** major mode using Emacs 29+ built-in
tree-sitter (`treesit`). It consumes the **tree-sitter** target.

## Install
1. Put `flatppl-ts-mode.el` on your `load-path` and `(require 'flatppl-ts-mode)`.
2. `M-x treesit-install-language-grammar RET flatppl RET` (builds the grammar
   from this repo's `tree-sitter/src`; pin a revision in the
   `treesit-language-source-alist` entry instead of `main` for reproducibility).
3. Open a `.flatppl` file.

## Status / limitations
- **Not verified** — Emacs was not available on the build machine.
- Highlights structural nodes (comments, doc-comments, strings, escapes,
  numbers, booleans, axis names, call heads). **Distribution/builtin keyword**
  highlighting is a TODO: those identifiers are listed in
  `keyword-lists.json` and adding them here would duplicate the word lists —
  pull them from there (or generate) rather than hand-copying.
- `treesit` font-lock references grammar **node names** (not the `.scm`
  highlight captures), so it can't reuse `tree-sitter/queries/highlights.scm`
  directly; the rules here are written against the node names in `grammar.js`.
- No host-language embedding (Python/Julia/Markdown) wired for Emacs yet.
