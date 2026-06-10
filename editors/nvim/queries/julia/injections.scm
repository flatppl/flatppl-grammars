; extends
; FlatPPL embedded in a Julia string macro: flatppl"""<code>""" or flatppl"<code>".
; `; extends` makes nvim-treesitter APPEND this to the bundled julia injections.
; prefix: (identifier) == "flatppl". Verified against tree-sitter-julia.
; KNOWN LIMITATION: julia's prefixed_string_literal has no inner-content node, so
; the injected range includes the `flatppl` prefix and the surrounding quotes —
; only that wrapper mis-highlights, the embedded code is correct.
((prefixed_string_literal
   prefix: (identifier) @_p) @injection.content
 (#eq? @_p "flatppl")
 (#set! injection.language "flatppl"))
