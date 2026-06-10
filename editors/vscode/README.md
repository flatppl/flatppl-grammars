# VS Code integration

VS Code consumes the **TextMate** target. This is a thin extension wrapper:
`package.json` (language + grammar contributions) and
`language-configuration.json` (comments/brackets). It points at the grammars in
`../../textmate/`, including the embedding injection grammars so FlatPPL
highlights inside Python (`flatppl(r"""…""")`), Julia (`flatppl"""…"""`), and
Markdown (```` ```flatppl ````).

## Run / package
- **Dev (from this repo):** open `editors/vscode/` in VS Code and press F5
  (Extension Development Host). The relative `../../textmate/*.tmLanguage.json`
  paths resolve from the checkout.
- **Packaging with `vsce`:** `vsce` won't bundle files outside the extension
  root — copy the grammars in first and repoint the `path`s:
  ```sh
  mkdir -p editors/vscode/textmate
  cp textmate/flatppl*.tmLanguage.json editors/vscode/textmate/
  # then change ../../textmate/ -> ./textmate/ in package.json
  ```
  (Not committed copied to avoid drift from `textmate/` — the single source.)

## Status
**Not verified** — VS Code was not available on the build machine. The manifest
follows VS Code's documented grammar-contribution format; the underlying
TextMate grammars are exercised by `pixi run test-textmate`.
