; Foldable multi-line forms. Editors only fold ranges spanning >1 line, so
; listing single-line-capable nodes is harmless.
[
  (call_expression)
  (dot_call)
  (index_expression)
  (array_literal)
  (tuple_literal)
  (parenthesized_expression)
  (block_comment)
  (doc_block)
] @fold
