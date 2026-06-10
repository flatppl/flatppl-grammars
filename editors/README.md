# Editor integrations

Glue for editors that consume the grammar targets in this repo. Each subdir has
its own README with setup steps.

| Editor | Grammar target | Embedded (py/jl/md) | Verified |
|---|---|---|---|
| [helix](helix/) | tree-sitter | py + jl + md | ✅ rendered (Helix 25.07.1) |
| [nvim](nvim/) | tree-sitter | py + jl + md | ✅ core + py/jl verified (headless `vim.treesitter`, `nvim/test/verify.lua`); md by-eye + via Helix/vscode |
| [emacs](emacs/) | tree-sitter | none yet | ✅ loads/parses/font-locks verified (headless, `emacs/test/verify.sh`, Emacs 30.2); keyword colouring TODO |
| [vscode](vscode/) | TextMate | py + jl + md | ✅ embedding verified via vscode-textmate (`test-embedding`) |

The host-language **injection queries** (FlatPPL embedded in Python/Julia) are
shared across the tree-sitter editors and use node names verified against the
respective grammars. Markdown embedding works wherever the editor injects fenced
code blocks by language name.

The Emacs and Neovim checks are wired as `pixi run verify-emacs` / `verify-nvim`
(or `pixi run verify-editors` for both). Each **skips with exit 0** when its
editor isn't installed, so they're safe to run anywhere — and for that reason are
intentionally NOT in `pixi run check` / CI (those runners have no editors and
would only ever skip); run them locally.

The grammars these integrations point at *are* in `check`: tree-sitter
(`check-tree-sitter`), TextMate (`test-textmate`). The VS Code embedding (FlatPPL
in python/julia/markdown) is checked engine-level by `test-embedding`, which
tokenises the embedding grammars with vscode-textmate (VS Code's engine).
