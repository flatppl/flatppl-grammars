; FlatPPL embedded in a Julia string macro: flatppl"""<code>""" or flatppl"<code>".
; APPEND this to a copy of Helix's bundled julia/injections.scm (Helix replaces
; the file per runtime dir, it does not merge — keep the bundled rules too).
; prefix: (identifier) == "flatppl". prefixed_string_literal verified against
; Helix's compiled julia grammar.
; KNOWN LIMITATION: julia's prefixed_string_literal has no inner-content node, so
; (like Helix's own r"…"/md"…" rules) the injected range includes the `flatppl`
; prefix and the surrounding quotes — only that wrapper mis-highlights.
(
  (prefixed_string_literal
    prefix: (identifier) @_p) @injection.content
  (#eq? @_p "flatppl")
  (#set! injection.language "flatppl"))
