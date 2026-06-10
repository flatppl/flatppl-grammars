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
//   - Markdown: ```flatppl … ```             (3+ backticks or tildes;
//               case-insensitive, optional info-string suffix)
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
    // The TextMate trigger is `(`{3,}|~{3,})\s*(?i:(flatppl)(\s+[^`~]*)?$)`:
    // case-insensitive `flatppl` plus an optional trailing info-string (any text
    // up to EOL that contains no fence char). We mirror that here.
    // LIMITATION: highlight.js regexes can't backreference, so begin/end do NOT
    // enforce a matching delimiter (backtick body can be closed by a tilde fence
    // and vice versa, and the fence length isn't matched). TextMate's `\3`/`\2`
    // backrefs do enforce this — these variants are an approximation, not a
    // fidelity guarantee.
    variants: [
      // Case-insensitivity is spelled out per-letter ([Ff][Ll]…) rather than via
      // the /i flag: highlight.js concatenates each variant's `begin` source into
      // one combined regex and discards per-regex flags, so /i would be ignored.
      { begin: /^[ \t]*`{3,}[ \t]*[Ff][Ll][Aa][Tt][Pp][Pp][Ll](?:[ \t]+[^`~]*)?[ \t]*$/, end: /^[ \t]*`{3,}[ \t]*$/ },
      { begin: /^[ \t]*~{3,}[ \t]*[Ff][Ll][Aa][Tt][Pp][Pp][Ll](?:[ \t]+[^`~]*)?[ \t]*$/, end: /^[ \t]*~{3,}[ \t]*$/ },
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
