# Neovim integration (nvim-treesitter)

Neovim consumes the **tree-sitter** target. Register the parser, install the
grammar's queries, and (for embedded FlatPPL in Python/Julia) add the injection
queries here.

## 1. Filetype + parser

```lua
-- Detect .flatppl
vim.filetype.add({ extension = { flatppl = "flatppl" } })

-- Register the parser (nvim-treesitter)
local parsers = require("nvim-treesitter.parsers").get_parser_configs()
parsers.flatppl = {
  install_info = {
    url = "https://github.com/flatppl/flatppl-grammars",
    location = "tree-sitter",          -- grammar lives in the subdir
    files = { "src/parser.c", "src/scanner.c" },
    branch = "main",
  },
  filetype = "flatppl",
}
```

Then `:TSInstall flatppl`.

## 2. FlatPPL's own queries

nvim-treesitter loads queries from `queries/flatppl/*.scm` on the runtimepath.
Copy the grammar's queries there:

```sh
mkdir -p ~/.config/nvim/queries/flatppl
cp tree-sitter/queries/*.scm ~/.config/nvim/queries/flatppl/
```

(The repo's highlight captures — `@function.builtin`, `@variable.member`,
`@keyword.operator`, … — are the standard nvim-treesitter capture set.)

## 3. Embedded FlatPPL in host languages

- **Markdown** — works out of the box (nvim-treesitter injects fenced blocks by
  language name once the `flatppl` parser is installed).
- **Python / Julia** — drop the files here into
  `~/.config/nvim/after/queries/<lang>/injections.scm`. They start with
  `; extends`, so nvim-treesitter **appends** them to the bundled injections
  (no need to copy the bundled rules — unlike Helix):

```sh
for lang in python julia; do
  mkdir -p ~/.config/nvim/after/queries/$lang
  cp editors/nvim/queries/$lang/injections.scm ~/.config/nvim/after/queries/$lang/
done
```

### Embedding forms
- Python: `flatppl(r"""<code>""")` / `flatppl('''<code>''')`.
- Julia: `flatppl"""<code>"""` / `flatppl"<code>"`.
- Markdown: ```` ```flatppl ````.

## Verification

`test/verify.lua` is a headless `vim.treesitter` check — it parses fixtures and
asserts query captures on the real trees (no rendering):

```sh
nvim --headless -l editors/nvim/test/verify.lua
```

Verified: core FlatPPL highlighting (`Normal` → `@type`, numerics) and the
**Python + Julia** embedding injections (`flatppl` injected tree exists and the
embedded `Normal` highlights as a kernel). Markdown ` ```flatppl ` is
nvim-treesitter's generic by-language injection (not a flatppl rule); its
directive misbehaves under headless `-l`, so it's confirmed visually and via the
equivalent Helix render + vscode-textmate `test-embedding`. Not part of the
repo's pixi CI (no Neovim there); run it locally after installing the parser +
queries above.
