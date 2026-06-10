// Render a standalone HTML preview of the FlatPPL highlight.js grammar +
// embed modes, so the highlighting can be eyeballed before pushing.
//
//   node preview.mjs            # writes preview.html (tokyo-night-dark theme)
//   node preview.mjs atom-one-light   # pick any theme in highlight.js/styles
//
// NOT a test (the scope assertions live in check.mjs / check-embedding.mjs);
// this is a human-facing visual check only.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import hljs from 'highlight.js/lib/core';
import flatppl from '../flatppl.js';
import { pythonEmbed, juliaEmbed, markdownEmbed } from '../embed.js';

const here = dirname(fileURLToPath(import.meta.url));
const theme = process.argv[2] || 'tokyo-night-dark';

hljs.registerLanguage('flatppl', flatppl);
// Composed host grammars so the embedded blocks render in context.
hljs.registerLanguage('py', (hl) => ({ name: 'py', contains: [pythonEmbed(hl)] }));
hljs.registerLanguage('jl', (hl) => ({ name: 'jl', contains: [juliaEmbed(hl)] }));
hljs.registerLanguage('md', (hl) => ({ name: 'md', contains: [markdownEmbed(hl)] }));

const sample = readFileSync(resolve(here, '..', '..', 'kate', 'test', 'sample.flatppl'), 'utf8');
const pySrc = 'model = flatppl(r"""\nalpha ~ Normal(0, 1)\ny ~ iid(Normal(alpha, sigma), N)\n""")';
const jlSrc = 'm = flatppl"""\ntheta ~ Beta(2, 2)\nk ~ Binomial(theta, 10)\n"""';
const mdSrc = '```flatppl\nmu ~ Normal(0, 5)\np = normalize(truncate(Cauchy(0, 1), interval(0, inf)))\n```';

const themeCss = readFileSync(
  resolve(here, 'node_modules', 'highlight.js', 'styles', `${theme}.css`),
  'utf8',
);

const block = (title, lang, code) =>
  `<h2>${title}</h2>\n<pre><code class="hljs">${hljs.highlight(code, { language: lang }).value}</code></pre>`;

const html = `<!doctype html>
<meta charset="utf-8">
<title>FlatPPL — highlight.js preview (${theme})</title>
<style>
${themeCss}
body { font: 15px/1.5 system-ui, sans-serif; margin: 2rem auto; max-width: 860px; padding: 0 1rem; }
pre { padding: 1rem; border-radius: 8px; overflow-x: auto; }
pre code.hljs { font: 13px/1.45 ui-monospace, "SF Mono", Menlo, monospace; }
h1 { font-size: 1.4rem; } h2 { font-size: 1rem; margin-top: 2rem; color: #888; }
.note { color: #888; font-size: 13px; }
</style>
<h1>FlatPPL — highlight.js preview</h1>
<p class="note">theme: <code>${theme}</code> · run <code>node preview.mjs &lt;theme&gt;</code> to try another (see highlight.js/styles).</p>
${block('Standalone <code>.flatppl</code> (kate/test/sample.flatppl)', 'flatppl', sample)}
${block('Embedded in Python — <code>flatppl(r""" … """)</code>', 'py', pySrc)}
${block('Embedded in Julia — <code>flatppl""" … """</code>', 'jl', jlSrc)}
${block('Embedded in Markdown — <code>```flatppl</code>', 'md', mdSrc)}
`;

const out = resolve(here, 'preview.html');
writeFileSync(out, html);
console.log(out);
