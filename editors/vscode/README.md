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
The **embedding** (FlatPPL inside Python/Julia/Markdown) is verified
engine-level by `pixi run test-embedding`, which loads these grammars into
vscode-textmate — VS Code's own engine — and asserts the embedded region gets
FlatPPL token scopes. The main FlatPPL grammar is covered by `test-textmate`.

The `package.json` / `language-configuration.json` manifest follows VS Code's
documented contribution format but was not loaded in a running VS Code instance
(none on the build machine); its grammar paths and scopeNames are checked for
consistency, but the extension activation itself is unverified.
