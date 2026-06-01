; Doc-comments carry GitHub-Flavored Markdown by default (Typst with a `typ`
; tag) per spec §05. The markup tag lives inside the opaque doc-comment token
; text (not a separate node), so we default every doc-comment to markdown.
; KNOWN LIMITATION: the `%`/`%%%` fence + optional tag are included in the
; injected range (no inner content node exists to exclude them).
((doc_block) @injection.content
 (#set! injection.language "markdown"))

((doc_line) @injection.content
 (#set! injection.language "markdown"))
