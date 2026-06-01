; Indentation hints (nvim-treesitter convention). Brackets are hidden external
; tokens and cannot be matched, so indentation anchors on the container nodes:
; children indent one level relative to the node's start line.
; KNOWN LIMITATION: without bracket tokens the dedent line is the node's last
; line (handled by @indent.end), which is correct for the canonical
; one-closing-bracket-per-line style in spec §05.
[
  (call_expression)
  (dot_call)
  (index_expression)
  (array_literal)
  (tuple_literal)
  (parenthesized_expression)
  (argument_list)
] @indent.begin

[
  (call_expression)
  (dot_call)
  (index_expression)
  (array_literal)
  (tuple_literal)
  (parenthesized_expression)
  (argument_list)
] @indent.end
