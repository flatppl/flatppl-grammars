// highlight.js embedding modes for FlatPPL inside host languages.
//
// Unlike TextMate (which *injects* a grammar into a host scope), highlight.js
// has no injection layer — a host grammar must itself contain a `subLanguage`
// mode. These factories return such modes; the body between the host delimiters
// is dispatched to the registered `flatppl` sub-language (register it first via
// `hljs.registerLanguage('flatppl', flatppl)`). The delimiters are excluded
// (`excludeBegin`/`excludeEnd`) so they fall back to the host's own
// tokenisation and are NOT fed to FlatPPL — otherwise FlatPPL's own `"` string
// rule would swallow a `"""`-delimited body.
//
// Triggers mirror the TextMate embedding grammars
// (textmate/flatppl-{python,julia,markdown}.tmLanguage.json):
//   - Python : flatppl(r\"\"\"  …  \"\"\")   (optional r/b string prefix, """ or ''')
//   - Julia  : flatppl\"\"\"  …  \"\"\"       (also the single-quote one-liner flatppl"…")
//   - Markdown: ```flatppl … ```             (3+ backticks or tildes)
//
// Integration: highlight.js cannot inject into its built-in `python` / `julia`
// grammars without forking them, so these are for composing custom host
// grammars (add to a host definition's `contains`). The common Markdown path —
// a ```flatppl fenced block — needs nothing from here: once `flatppl` is
// registered, a render-layer `hljs.highlightAll()` highlights the emitted
// `<code class="language-flatppl">` block directly. `markdownEmbed` is provided
// for highlighting Markdown *source* in one pass.

/** Python: `flatppl(r""" … """)` / `flatppl(r''' … ''')`. */
export function pythonEmbed(/* hljs */) {
  const PREFIX = '(?:[rR][bB]?|[bB][rR])?';
  return {
    subLanguage: 'flatppl',
    excludeBegin: true,
    excludeEnd: true,
    relevance: 10,
    variants: [
      { begin: new RegExp('\\bflatppl\\s*\\(\\s*' + PREFIX + '"""'), end: /"""/ },
      { begin: new RegExp("\\bflatppl\\s*\\(\\s*" + PREFIX + "'''"), end: /'''/ },
    ],
  };
}

/** Julia: `flatppl""" … """` and the single-quote one-liner `flatppl"…"`. */
export function juliaEmbed(/* hljs */) {
  return {
    subLanguage: 'flatppl',
    excludeBegin: true,
    excludeEnd: true,
    relevance: 10,
    variants: [
      { begin: /\bflatppl"""/, end: /"""/ }, // triple-quote first (longest match)
      { begin: /\bflatppl"/, end: /"/ },
    ],
  };
}

/** Markdown: a ```flatppl (or ~~~flatppl) fenced code block. */
export function markdownEmbed(/* hljs */) {
  return {
    subLanguage: 'flatppl',
    excludeBegin: true,
    excludeEnd: true,
    relevance: 10,
    variants: [
      { begin: /^[ \t]*`{3,}[ \t]*flatppl[ \t]*$/, end: /^[ \t]*`{3,}[ \t]*$/ },
      { begin: /^[ \t]*~{3,}[ \t]*flatppl[ \t]*$/, end: /^[ \t]*~{3,}[ \t]*$/ },
    ],
  };
}

/** All three embed modes, keyed by host. */
export function flatpplEmbeds(hljs) {
  return {
    python: pythonEmbed(hljs),
    julia: juliaEmbed(hljs),
    markdown: markdownEmbed(hljs),
  };
}
