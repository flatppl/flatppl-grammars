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

if (bad) {
  console.error(`\n${bad} embedding check(s) failed`);
  process.exit(1);
}
console.log('\nOK: all embed modes dispatch FlatPPL inside the host language');
