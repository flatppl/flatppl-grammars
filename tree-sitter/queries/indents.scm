; Indentation hints (nvim-treesitter convention). Brackets are hidden external
; tokens and cannot be matched, so indentation anchors on the container nodes:
; children indent one level relative to the node's start line.
;
; The SAME node set appears under @indent.begin and @indent.end on purpose, and
; does NOT net to zero: @indent.begin indents the lines AFTER the node's start
; line; @indent.end dedents the node's LAST line. They act on different lines.
;
; call_expression / dot_call / index_expression each also contain an
; argument_list, so a node and its argument_list both carry @indent.begin. This
; does NOT double-indent: the call and its `(` open on the same source line, and
; nvim-treesitter collapses multiple @indent.begin nodes that start on one line
; to a single indent level.
;
; KNOWN LIMITATION: without bracket tokens the dedent line is the node's last
; line (handled by @indent.end), which is correct for the canonical
; one-closing-bracket-per-line style in spec §05.
[
  (call_expression)
  (dot_call)
  (index_expression)
  (array_literal)
  (axis_list)
  (tuple_literal)
  (parenthesized_expression)
  (argument_list)
] @indent.begin

[
  (call_expression)
  (dot_call)
  (index_expression)
  (array_literal)
  (axis_list)
  (tuple_literal)
  (parenthesized_expression)
  (argument_list)
] @indent.end
