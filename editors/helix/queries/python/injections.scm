; FlatPPL embedded in Python: flatppl(r"""<code>""") / flatppl('''<code>''').
; APPEND this to a copy of Helix's bundled python/injections.scm (Helix replaces
; the file per runtime dir, it does not merge — keep the bundled rules too).
; Injects the string CONTENT only; the r/b prefix and quotes live in
; string_start/string_end. Node names (call / function / argument_list / string
; / string_content) verified against Helix's compiled python grammar.
((call
   function: (identifier) @_fn
   arguments: (argument_list . (string (string_content) @injection.content)))
 (#eq? @_fn "flatppl")
 (#set! injection.language "flatppl"))
