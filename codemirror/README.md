# FlatPPL CodeMirror 6 highlighter

`textmate-highlight.ts` is the canonical CodeMirror 6 highlighter for FlatPPL.
It tokenizes source with the project's `../textmate/flatppl.tmLanguage.json` via
`vscode-textmate` + `vscode-oniguruma`, and maps TextMate scopes onto `tok-*`
CSS classes. It lives here (with the other grammars) and is vendored into
consumers — e.g. `flatppl-js`'s web playground — at build time.

## Consumer contract

- **Bundle it yourself.** Build `textmate-highlight.ts` as an IIFE that bundles
  `vscode-textmate` + `vscode-oniguruma`. It publishes `window.FlatPPLTextmate =
  { init, makeHighlightPlugin, classForScopes }`.
- **Shared CodeMirror instance.** `makeHighlightPlugin(bundle)` takes YOUR
  `@codemirror/view` exports (`{ ViewPlugin, Decoration }`). Do not let this
  module bundle its own `@codemirror/view` — decorations must be built with the
  same instance that owns the `EditorView`.
- **Runtime assets.** It fetches `vendor/flatppl.tmLanguage.json` and
  `vendor/onig.wasm` (paths relative to the page). Vendor both next to your
  bundle.
- **Theme.** It emits these classes — define them in your editor CSS:
  `tok-comment, tok-string, tok-number, tok-special, tok-dist, tok-mop,
  tok-set, tok-func, tok-const, tok-reserved, tok-keyword, tok-op,
  tok-placeholder, tok-hole, tok-ident`.
- **Async load.** Call `init()` once; until the grammar resolves the plugin
  emits no decorations, then refreshes mounted editors. On load failure it
  degrades to plain text (no throw).

This module is validated by its consumer's build/typecheck (kept dependency-free
here to keep the grammars repo lean).
