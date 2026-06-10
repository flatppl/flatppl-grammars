// Verify the FlatPPL embed modes (highlightjs/embed.js) dispatch an embedded
// FlatPPL body to the `flatppl` sub-language inside a host language.
//
// highlight.js has no injection layer, so — exactly as the TextMate embedding
// test uses minimal host *stubs* — we register a stub host language whose only
// content is the embed mode under test. This exercises OUR embed mode, not host
// tokenisation. Signal: the embedded `alpha ~ Normal(0, 1)` highlights `Normal`
// with FlatPPL's kernel class (hljs-type).
import hljs from 'highlight.js/lib/core';
import flatppl from '../flatppl.js';
import { pythonEmbed, juliaEmbed, markdownEmbed } from '../embed.js';

hljs.registerLanguage('flatppl', flatppl);

let bad = 0;

function check(hostName, embedMode, lines, desc) {
  hljs.registerLanguage(hostName, () => ({ name: hostName, contains: [embedMode] }));
  const html = hljs.highlight(lines.join('\n'), { language: hostName }).value;
  // The embedded kernel `Normal` must carry flatppl's type class…
  const embeddedKernel = /<span class="hljs-type">Normal<\/span>/.test(html);
  // …and it must sit inside the dispatched sub-language block, not be a stray
  // host token (hljs wraps sublanguage output in `class="language-flatppl"`).
  const dispatched = /class="language-flatppl"/.test(html);
  const ok = embeddedKernel && dispatched;
  if (ok) {
    console.log(`ok: ${desc}`);
  } else {
    bad += 1;
    console.error(`FAIL: ${desc}\n  kernel=${embeddedKernel} dispatched=${dispatched}\n  got: ${html}`);
  }
}

// Negative counterpart of `check`: assert a host snippet that *resembles* a
// FlatPPL trigger but should NOT fire is in fact NOT dispatched. Without these,
// an over-broad trigger (e.g. `\bflatppl` loosened to also match `notflatppl`,
// or the markdown info-string anchor dropped so `flatpplx`/`python` fences fire)
// would ship green. We assert the sublanguage wrapper is absent — and, belt and
// braces, that no stray `Normal` kernel span leaked from a mis-dispatch.
function checkNoDispatch(hostName, embedMode, lines, desc) {
  hljs.registerLanguage(hostName, () => ({ name: hostName, contains: [embedMode] }));
  const html = hljs.highlight(lines.join('\n'), { language: hostName }).value;
  const dispatched = /class="language-flatppl"/.test(html);
  const embeddedKernel = /<span class="hljs-type">Normal<\/span>/.test(html);
  const ok = !dispatched && !embeddedKernel;
  if (ok) {
    console.log(`ok: ${desc}`);
  } else {
    bad += 1;
    console.error(`FAIL: ${desc} (expected NO dispatch)\n  kernel=${embeddedKernel} dispatched=${dispatched}\n  got: ${html}`);
  }
}

check('pyhost', pythonEmbed(hljs),
  ['model = flatppl(r"""', 'alpha ~ Normal(0, 1)', '""")'],
  'python flatppl(r""" ... """)');
check('pyhost-sq', pythonEmbed(hljs),
  ["model = flatppl(r'''", 'alpha ~ Normal(0, 1)', "''')"],
  "python flatppl(r''' ... ''')");
check('jlhost', juliaEmbed(hljs),
  ['m = flatppl"""', 'alpha ~ Normal(0, 1)', '"""'],
  'julia flatppl""" ... """');
check('mdhost', markdownEmbed(hljs),
  ['```flatppl', 'alpha ~ Normal(0, 1)', '```'],
  'markdown ```flatppl');

// Markdown fence must be case-insensitive and tolerate an info-string suffix,
// matching the TextMate trigger `(?i:(flatppl)(\s+[^`~]*)?$)`.
check('mdhost-case', markdownEmbed(hljs),
  ['```Flatppl', 'alpha ~ Normal(0, 1)', '```'],
  'markdown ```Flatppl (case-variant)');
check('mdhost-info', markdownEmbed(hljs),
  ['```flatppl title=foo', 'alpha ~ Normal(0, 1)', '```'],
  'markdown ```flatppl title=foo (info-string)');

// Guards: these already dispatch at runtime — lock them against regression.
check('jlhost-sq', juliaEmbed(hljs),
  ['m = flatppl"alpha ~ Normal(0, 1)"'],
  'julia flatppl"…" one-liner');
check('mdhost-tilde', markdownEmbed(hljs),
  ['~~~flatppl', 'alpha ~ Normal(0, 1)', '~~~'],
  'markdown ~~~flatppl tilde fence');
check('pyhost-br', pythonEmbed(hljs),
  ['model = flatppl(br"""', 'alpha ~ Normal(0, 1)', '""")'],
  'python flatppl(br""" ... """) prefix');

// Negative guards: host constructs that merely *resemble* a FlatPPL trigger
// must NOT be mis-dispatched. The grammar is already correct here (these pass
// now) — they are regression guards, not red-first tests. Each pins a specific
// anchor in embed.js's triggers; the comment on each names the mutation it bites.
//
// markdownEmbed only fires on a `flatppl` info-string, so an ordinary ```python
// fence (even with FlatPPL-looking body) must stay with the host. Bites: dropping
// the literal-`flatppl` anchor from the markdown begin regex.
checkNoDispatch('mdhost-python', markdownEmbed(hljs),
  ['```python', 'alpha ~ Normal(0, 1)', '```'],
  'markdown ```python (foreign fence) does NOT dispatch flatppl');
// `notflatppl(` — the `\b` word boundary in `\bflatppl` blocks a match mid-word
// (no boundary between `t` and `f`). Bites: loosening `\bflatppl` to `flatppl`.
checkNoDispatch('pyhost-not', pythonEmbed(hljs),
  ['model = notflatppl(r"""', 'alpha ~ Normal(0, 1)', '""")'],
  'python notflatppl(r""" … """) (name contains flatppl) does NOT dispatch');
// Two backticks — markdown requires `{3,}. Bites: relaxing the fence to `{2,}.
checkNoDispatch('mdhost-2tick', markdownEmbed(hljs),
  ['``flatppl', 'alpha ~ Normal(0, 1)', '``'],
  'markdown ``flatppl (only 2 backticks) does NOT dispatch');
// `flatpplx` — the info-string is `(?:[ \t]+[^`~]*)?[ \t]*$`, so a glued trailing
// char (no whitespace) fails the EOL anchor. Bites: dropping the `$`/whitespace
// anchor on the info-string suffix.
checkNoDispatch('mdhost-trail', markdownEmbed(hljs),
  ['```flatpplx', 'alpha ~ Normal(0, 1)', '```'],
  'markdown ```flatpplx (trailing char) does NOT dispatch');

if (bad) {
  console.error(`\n${bad} embedding check(s) failed`);
  process.exit(1);
}
console.log('\nOK: all embed modes dispatch FlatPPL inside the host language');
