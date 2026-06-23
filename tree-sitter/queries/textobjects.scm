; FlatPPL textobjects — selection/movement query (nvim-treesitter dialect).
;
; This is the CANONICAL source. The install copies under editors/nvim and
; editors/helix are GENERATED from this file by tools/gen-grammars.py
; (`pixi run gen-grammars`) and guarded by `--check` — do not hand-edit them.
;
; Capture set is the portable intersection of nvim-treesitter and Helix: only
; function / parameter / comment. Helix cannot navigate assignment/call/number/
; statement, so they are intentionally absent (keeps both editor files behave
; identically). Helix uses .inside/.around; the generator translates the suffix.
;
; Brackets `(` `)` `[` `]` are HIDDEN EXTERNAL tokens and are NOT matchable;
; parameters are anchored on the visible tokens `,` and the defining `=` / `->`
; (the function name precedes them, the body follows `=`/`->`, so neither is
; captured as a parameter).

; ---- function: named definitions and lambdas ----
(function_definition) @function.outer
(lambda)              @function.outer

; inner = the body expression (the node immediately after `=` / `->`).
(function_definition "=" . (_) @function.inner)
(lambda "->" . (_) @function.inner)

; ---- parameter ----
; Call / distribution arguments: each named child of an argument_list (commas,
; being anonymous, are skipped by the `(_)` named-node wildcard). A keyword
; argument (`key = 7`) is captured whole as one parameter.
(argument_list (_) @parameter.inner @parameter.outer)

; Function-definition params: identifiers immediately before a `,` or the `=`.
; (The name is followed by the first param, never by `,`/`=`; the body follows
; `=`. So only the parameters match.)
(function_definition (identifier) @parameter.inner @parameter.outer . ",")
(function_definition (identifier) @parameter.inner @parameter.outer . "=")

; Lambda params: identifiers immediately before a `,` or the `->`.
(lambda (identifier) @parameter.inner @parameter.outer . ",")
(lambda (identifier) @parameter.inner @parameter.outer . "->")

; ---- comment ----
; inner == outer: the `#` / `%` / `%%%` / block delimiters live inside opaque
; single-token text with no inner content node to exclude (same limitation
; injections.scm notes for the doc-comment fence).
[
  (line_comment)
  (doc_line)
  (block_comment)
  (doc_block)
] @comment.inner @comment.outer
