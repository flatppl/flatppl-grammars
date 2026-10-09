// Verify the FlatPPL embedding grammars (flatppl-{python,julia,markdown}) inject
// FlatPPL into host languages, using vscode-textmate — the engine VS Code uses,
// including line-by-line tokenization. Python has string/comment rules to check
// host boundaries; Julia and Markdown use empty stubs. Set PYTHON_GRAMMAR to a
// real host grammar for integration checks. The embedded `Normal` must carry
// meta.embedded.block.flatppl and FlatPPL's kernel scope.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vsctm from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';

const here = dirname(fileURLToPath(import.meta.url));
const tm = (f) => resolve(here, '..', f);

const wasmBin = readFileSync(resolve(here, 'node_modules', 'vscode-oniguruma', 'release', 'onig.wasm'));
const onigLib = oniguruma.loadWASM(wasmBin.buffer.slice(wasmBin.byteOffset, wasmBin.byteOffset + wasmBin.byteLength))
  .then(() => ({
    createOnigScanner: (p) => new oniguruma.OnigScanner(p),
    createOnigString: (s) => new oniguruma.OnigString(s),
  }));

const files = {
  'source.flatppl': tm('flatppl.tmLanguage.json'),
  'flatppl.embedded.python': tm('flatppl-python.tmLanguage.json'),
  'flatppl.embedded.julia': tm('flatppl-julia.tmLanguage.json'),
  'markdown.flatppl.codeblock': tm('flatppl-markdown.tmLanguage.json'),
};
const stub = (scope) => ({ scopeName: scope, patterns: [] });
const hostStubs = { 'source.julia': 1, 'text.html.markdown': 1 };
const python = process.env.PYTHON_GRAMMAR
  ? vsctm.parseRawGrammar(readFileSync(process.env.PYTHON_GRAMMAR, 'utf8'), process.env.PYTHON_GRAMMAR)
  : {
    scopeName: 'source.python',
    patterns: [
      { name: 'comment.line.number-sign.python', match: '#.*$' },
      { name: 'string.quoted.multi.python', begin: '([rR]?)("""|\'\'\')', end: '\\2' },
      { name: 'string.quoted.single.python', begin: '([rR]?)("|\')', end: '\\2',
        patterns: [{ match: '\\\\.' }] },
    ],
  };

const registry = new vsctm.Registry({
  onigLib,
  loadGrammar: async (scope) => {
    if (scope === 'source.python') return python;
    if (files[scope]) return vsctm.parseRawGrammar(readFileSync(files[scope], 'utf8'), files[scope]);
    if (hostStubs[scope]) return stub(scope);
    return null;
  },
  getInjections: (scope) => ({
    'source.python': ['flatppl.embedded.python'],
    'source.julia': ['flatppl.embedded.julia'],
    'text.html.markdown': ['markdown.flatppl.codeblock'],
  }[scope] || []),
});

// Does the line containing `Normal` carry a flatppl scope when embedded?
async function check(hostScope, lines, desc, expectEmbedded = true) {
  const grammar = await registry.loadGrammar(hostScope);
  let stack = vsctm.INITIAL;
  let hit = null;
  for (const line of lines) {
    const r = grammar.tokenizeLine(line, stack);
    stack = r.ruleStack;
    if (line.includes('Normal')) {
      for (const t of r.tokens) {
        const txt = line.slice(t.startIndex, t.endIndex);
        if (txt.includes('Normal')) hit = t.scopes;
      }
    }
  }
  // Correct signal: the embed marker (contentName) + flatppl's own token scope.
  // `include: source.flatppl` applies flatppl patterns without pushing a
  // source.flatppl root scope, so check the kernel scope, not source.flatppl.
  const embedded = hit && hit.some((s) => s === 'meta.embedded.block.flatppl');
  const asKernel = hit && hit.some((s) => s.startsWith('entity.name.type.kernel.flatppl'));
  const ok = expectEmbedded ? embedded && asKernel
    : hit && !embedded && !asKernel && hit.some((s) => /^(string|comment)\./.test(s));
  console.log(`${ok ? 'ok ' : 'FAIL'}: ${desc} -> Normal scopes: ${hit ? hit.join(' ') : '(not found)'}`);
  return ok;
}

let bad = 0;
bad += !(await check('source.python', ['model = flatppl(r"""', 'alpha ~ Normal(0, 1)', '""")'], 'python flatppl(r""" ... """)'));
bad += !(await check('source.python', ['model = flatppl(', '    r"""', '    alpha ~ Normal(0, 1)', '""", context=context)'], 'python multiline source argument'));
bad += !(await check('source.python', ['model = flatppl(', '    # source follows', "    r'''", '# """ does not close single quotes', 'alpha ~ Normal(0, 1)', "''')"], 'python comment before single-quoted source'));
bad += !(await check('source.python', ['model = flatppl(', '    r"""x = 1""",', '    context="Normal",', ')'], 'python keyword argument after source', false));
bad += !(await check('source.python', ['model = flatppl(', '    source,', '    context=r"""Normal""",', ')'], 'python nonliteral source argument', false));
bad += !(await check('source.python', ['text = """', "flatppl(r'''alpha ~ Normal(0, 1)''')", '"""'], 'python ordinary string containing a call', false));
bad += !(await check('source.python', ['# flatppl(r"""alpha ~ Normal(0, 1)""")'], 'python commented call', false));
bad += !(await check('source.julia', ['m = flatppl"""', 'alpha ~ Normal(0, 1)', '"""'], 'julia flatppl""" ... """'));
bad += !(await check('text.html.markdown', ['```flatppl', 'alpha ~ Normal(0, 1)', '```'], 'markdown ```flatppl'));
if (bad) { console.error(`\n${bad} embedding check(s) failed`); process.exit(1); }
console.log('\nOK: all embedding injections highlight FlatPPL inside the host language');
