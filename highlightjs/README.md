# FlatPPL — highlight.js

A [highlight.js](https://highlightjs.org/) (v11+) language definition for
FlatPPL, for highlighting code blocks on the web and in static-site toolchains.

```js
import hljs from 'highlight.js';
import flatppl from 'flatppl-highlightjs'; // or: './flatppl.js'

hljs.registerLanguage('flatppl', flatppl);
hljs.highlightAll();
```

The keyword/operator arrays between the `// GEN:` markers in `flatppl.js` are
single-sourced from the repo-root `keyword-lists.json` by
`tools/gen-grammars.py` (`pixi run gen-grammars`) — do **not** hand-edit them.
Everything else (modes, scope buckets, operator-regex assembly) is
hand-maintained.

## Scope mapping

highlight.js has a deliberately small set of theme classes, so the per-category
scopes the TextMate / tree-sitter / Pygments grammars emit are coarsened here:

| keyword-lists category | hljs scope |
| --- | --- |
| `specialops`, `selectors` | `keyword` |
| `kernels` | `type` |
| `combinators`, `analysis`, `higherorder`, `setctors`, `builtins` | `built_in` |
| `constants` | `literal` |
| `predefsets` | `variable.constant` |
| `reserved` | `variable.language` |

Builtins are scoped only in call position (`name(`), matching the `(?=\s*\()`
suffix the other grammars use — a bare `real`/`sum` used as an ordinary name
stays unscoped (builtins are not reserved; spec §05).

Known coarsening (a regex highlighter cannot disambiguate these without a
parser, matching `pygments/flatppl_lexer.py`): `.name` is uniformly scoped
`property` (an axis `.i` and a field `r.field` are indistinguishable); `:`,
`!`, `=`, `~` are uniformly `operator`.

## Embedding

`embed.js` provides FlatPPL embed modes for host languages, mirroring the
TextMate embedding triggers:

| Host | Trigger |
| --- | --- |
| Python | `flatppl(r""" … """)` (optional `r`/`b` prefix, `"""` or `'''`) |
| Julia | `flatppl""" … """` and the one-liner `flatppl"…"` |
| Markdown | ` ```flatppl … ``` ` (3+ backticks or tildes) |

**highlight.js has no injection layer** (unlike TextMate): a host grammar must
itself contain a `subLanguage` mode, so you cannot inject into the built-in
`python` / `julia` grammars without forking them. The embed modes are for
composing a custom host grammar:

```js
import hljs from 'highlight.js';
import flatppl from 'flatppl-highlightjs';
import { pythonEmbed } from 'flatppl-highlightjs/embed.js';

hljs.registerLanguage('flatppl', flatppl);
hljs.registerLanguage('my-python', (hl) => ({
  name: 'Python+FlatPPL',
  contains: [pythonEmbed(hl) /*, …your python rules… */],
}));
```

For the common **Markdown** case you usually need nothing from here: once
`flatppl` is registered, a render-layer `hljs.highlightAll()` highlights an
emitted `<code class="language-flatppl">` block directly. `markdownEmbed` is for
highlighting Markdown *source* in a single pass.

## Test

```sh
pixi run test-highlightjs            # scope-regression test (test/check.mjs)
pixi run test-embedding-highlightjs  # embed-dispatch test (test/check-embedding.mjs)
```
