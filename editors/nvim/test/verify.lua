-- Rigorous headless check of the FlatPPL Neovim integration via vim.treesitter:
-- core highlighting + Python/Julia embedding injections (the flatppl-authored
-- rules). Asserts query captures on the real parse trees — no rendering.
--
-- Run:  nvim --headless -l editors/nvim/test/verify.lua
-- Prereqs (see ../README.md): the `flatppl` parser + queries installed in your
-- nvim, the `editors/nvim/queries/{python,julia}/injections.scm` in
-- ~/.config/nvim/after/queries/, and nvim-treesitter with python/julia parsers.
--
-- NOT in the repo's pixi CI (no Neovim there). Markdown ` ```flatppl ` injection
-- is nvim-treesitter's generic by-language machinery (not a flatppl rule); its
-- directive misbehaves under headless `-l`, so it's checked by eye + in Helix
-- and the vscode-textmate `test-embedding`.

-- `-l` mode uses a minimal rtp; nvim-treesitter (host parsers + its directives)
-- is an opt/lazy plugin, so add it back to match real nvim.
local nts = vim.fn.globpath(vim.fn.stdpath("data"), "site/pack/*/opt/nvim-treesitter", false, true)[1]
  or vim.fn.globpath(vim.fn.stdpath("data"), "lazy/nvim-treesitter", false, true)[1]
if nts then
  vim.opt.rtp:prepend(nts)
  pcall(require, "nvim-treesitter")
end

local fail = 0
local function ok(cond, msg)
  print((cond and "ok  : " or "FAIL: ") .. msg)
  if not cond then fail = fail + 1 end
end

local function add_lang(lang)
  local hits = vim.fn.globpath(vim.o.rtp, "parser/" .. lang .. ".so", false, true)
  assert(#hits > 0, "no parser .so on rtp for " .. lang .. " (install it first)")
  vim.treesitter.language.add(lang, { path = hits[1] })
end

-- Capture names the flatppl highlights query assigns to a node whose text ==
-- needle, across all trees of the given LanguageTree (src = bufnr or string).
local function flatppl_caps(src, ltree, needle)
  local q = vim.treesitter.query.get("flatppl", "highlights")
  local res = {}
  for _, tree in pairs(ltree:trees()) do
    for id, node in q:iter_captures(tree:root(), src) do
      if vim.treesitter.get_node_text(node, src) == needle then
        res[q.captures[id]] = true
      end
    end
  end
  return res
end

local function setup_str(text, lang)
  add_lang(lang)
  add_lang("flatppl")
  local p = vim.treesitter.get_string_parser(text, lang)
  p:parse(true)
  return text, p
end

-- 1. Core FlatPPL highlighting
do
  local src, p = setup_str("alpha ~ Normal(0, 1)\n# a comment", "flatppl")
  ok(flatppl_caps(src, p, "Normal")["type"], "flatppl core: Normal -> @type")
  ok(next(flatppl_caps(src, p, "0")) ~= nil, "flatppl core: 0 -> a numeric capture")
end

-- 2/3. flatppl-specific injection rules (python/julia)
for _, c in ipairs({
  { lang = "python", text = 'm = flatppl(r"""\nalpha ~ Normal(0, 1)\n""")', desc = 'python flatppl(r""" … """)' },
  { lang = "julia",  text = 'm = flatppl"""\nalpha ~ Normal(0, 1)\n"""',     desc = 'julia flatppl""" … """' },
}) do
  local src, p = setup_str(c.text, c.lang)
  local child = p:children()["flatppl"]
  ok(child ~= nil, c.desc .. ": flatppl injected tree exists")
  if child then
    ok(flatppl_caps(src, child, "Normal")["type"], c.desc .. ": embedded Normal -> @type")
  end
end

-- 4. Markdown fenced ```flatppl (best-effort under headless; verified elsewhere)
do
  add_lang("markdown")
  add_lang("flatppl")
  local b = vim.api.nvim_create_buf(true, false)
  vim.api.nvim_buf_set_lines(b, 0, -1, false, { "```flatppl", "alpha ~ Normal(0, 1)", "```" })
  vim.bo[b].filetype = "markdown"
  local p = vim.treesitter.get_parser(b, "markdown", { error = false })
  local got, child = pcall(function()
    p:parse(true)
    return p:children()["flatppl"]
  end)
  if got and child then
    ok(flatppl_caps(b, child, "Normal")["type"], "markdown ```flatppl: embedded Normal -> @type")
  else
    print("skip: markdown ```flatppl (nvim-treesitter directive unavailable headless; verified elsewhere)")
  end
end

if fail > 0 then
  io.write("\n" .. fail .. " nvim check(s) failed\n")
  vim.cmd("cquit 1")
end
io.write("\nOK: nvim flatppl core + python/julia injection verified\n")
