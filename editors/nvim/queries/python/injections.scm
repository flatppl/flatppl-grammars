; extends
; FlatPPL embedded in Python: flatppl(r"""<code>""") / flatppl('''<code>''').
; `; extends` makes nvim-treesitter APPEND this to the bundled python
; injections. Injects the string CONTENT only (the r/b prefix and quotes live in
; string_start/string_end). Node names verified against tree-sitter-python.
((call
   function: (identifier) @_fn
   arguments: (argument_list . (string (string_content) @injection.content)))
 (#eq? @_fn "flatppl")
 (#set! injection.language "flatppl"))
