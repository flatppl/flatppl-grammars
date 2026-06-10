# Emacs integration (treesit)

`flatppl-ts-mode.el` is a **skeleton** major mode using Emacs 29+ built-in
tree-sitter (`treesit`). It consumes the **tree-sitter** target.

## Install
1. Put `flatppl-ts-mode.el` on your `load-path` and `(require 'flatppl-ts-mode)`.
2. `M-x treesit-install-language-grammar RET flatppl RET` (builds the grammar
   from this repo's `tree-sitter/src`; pin a revision in the
   `treesit-language-source-alist` entry instead of `main` for reproducibility).
3. Open a `.flatppl` file.

## Verification

`test/verify.sh` is a self-contained headless check (Emacs 29+ with tree-sitter
+ a C compiler):

```sh
pixi run verify-emacs        # or: ./editors/emacs/test/verify.sh
```

It compiles the FlatPPL grammar as a treesit lib, loads `flatppl-ts-mode`, and
asserts the grammar loads, the parser produces a tree (root `module`), the
font-lock **queries compile** (an invalid node name would error), and faces
apply (call head → function-call, number, comment). Verified on Emacs 30.2. The
`pixi run verify-emacs` task **skips with exit 0** when Emacs isn't installed, so
it is intentionally NOT in the `check` aggregate / CI (the CI runner has no
Emacs); run it locally.

## Limitations
- Highlights structural nodes (comments, doc-comments, strings, escapes,
  numbers, booleans, axis names, call heads). **Distribution/builtin keyword**
  highlighting is a TODO: those identifiers are in `keyword-lists.json`, and
  adding them here would duplicate the word lists — pull them from there (or
  generate) rather than hand-copying.
- `treesit` font-lock references grammar **node names** (not the `.scm` highlight
  captures), so it can't reuse `tree-sitter/queries/highlights.scm` directly; the
  rules here are written against the node names in `grammar.js`.
- No host-language embedding (Python/Julia/Markdown) wired for Emacs yet.
