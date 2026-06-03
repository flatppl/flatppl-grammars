// Scope-regression test for textmate/flatppl.tmLanguage.json.
// Tokenizes inline FlatPPL snippets with vscode-textmate (the engine VS Code
// uses) and asserts each token category lands on its expected scope. The
// operator loop is driven by keyword-lists.json so it stays in sync with the
// tree-sitter @operator block (see the grammar-drift-hardening plan, Risk 2).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
// vscode-textmate and vscode-oniguruma ship as CommonJS. Node's ESM loader
// exposes their module.exports as the default export, so a default import
// gives the full API object directly.
import vsctm from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';

const here = dirname(fileURLToPath(import.meta.url));
const grammarPath = resolve(here, '..', 'flatppl.tmLanguage.json');
const repoRoot = resolve(here, '..', '..');
const keywordLists = JSON.parse(readFileSync(resolve(repoRoot, 'keyword-lists.json'), 'utf8'));

const wasmBin = readFileSync(resolve(here, 'node_modules', 'vscode-oniguruma', 'release', 'onig.wasm'));
const onigLib = oniguruma.loadWASM(
  wasmBin.buffer.slice(wasmBin.byteOffset, wasmBin.byteOffset + wasmBin.byteLength)
).then(() => ({
  createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
  createOnigString: (s) => new oniguruma.OnigString(s),
}));

const registry = new vsctm.Registry({
  onigLib,
  loadGrammar: async (scopeName) =>
    scopeName === 'source.flatppl'
      ? vsctm.parseRawGrammar(readFileSync(grammarPath, 'utf8'), grammarPath)
      : null,
});

const grammar = await registry.loadGrammar('source.flatppl');
if (!grammar) {
  console.error('FAIL: could not load source.flatppl grammar');
  process.exit(1);
}

function tokenize(line) {
  const r = grammar.tokenizeLine(line, vsctm.INITIAL);
  return r.tokens.map((t) => ({ text: line.substring(t.startIndex, t.endIndex), scopes: t.scopes }));
}

let fail = 0;

// Assert SOME token with exactly `text` carries a scope containing `needle`.
function assertScope(line, text, needle, desc) {
  const toks = tokenize(line);
  const hit = toks.find((t) => t.text === text && t.scopes.some((s) => s.includes(needle)));
  if (hit) {
    console.log(`ok: ${desc}`);
  } else {
    fail = 1;
    console.error(`FAIL: ${desc}\n  line: ${JSON.stringify(line)}\n  wanted text=${JSON.stringify(text)} scope~=${JSON.stringify(needle)}\n  got: ${JSON.stringify(toks)}`);
  }
}

// Assert SOME token (any text) carries a scope containing `needle`.
function assertAnyScope(line, needle, desc) {
  const toks = tokenize(line);
  const hit = toks.find((t) => t.scopes.some((s) => s.includes(needle)));
  if (hit) {
    console.log(`ok: ${desc}`);
  } else {
    fail = 1;
    console.error(`FAIL: ${desc}\n  line: ${JSON.stringify(line)}\n  wanted scope~=${JSON.stringify(needle)}\n  got: ${JSON.stringify(toks)}`);
  }
}

// ── Keyword categories ──────────────────────────────────────────────────────
assertScope('x ~ Normal(0, 1)', 'Normal', 'entity.name.type.kernel', 'kernel Normal');
assertScope('m = iid(d, 3)', 'iid', 'entity.name.function.measure', 'combinator iid');
assertScope('y = likelihoodof(m, d)', 'likelihoodof', 'entity.name.function.analysis', 'analysis likelihoodof');
assertScope('z = reduce(f, xs)', 'reduce', 'entity.name.function.higher-order', 'higher-order reduce');
assertScope('s = interval(0, 1)', 'interval', 'entity.name.function.set-constructor', 'set-constructor interval');
assertScope('fn(x)', 'fn', 'keyword.other.special-operation', 'special-operation fn');
assertScope('r = record(a)', 'record', 'support.function.builtin', 'builtin record');
assertScope('c = inf', 'inf', 'constant.language', 'constant inf');
assertScope('q = reals', 'reals', 'constant.other.set', 'predefined-set reals');
assertScope('v = self', 'self', 'variable.language', 'reserved self');
assertScope('w = all', 'all', 'keyword.other.selector', 'selector all');

// ── Comments / strings / numbers ────────────────────────────────────────────
assertAnyScope('# a comment', 'comment.line.number-sign', 'line comment');
assertAnyScope('% a doc comment', 'comment.line.documentation', 'doc comment');
assertAnyScope('"a\\nb"', 'string.quoted.double', 'string');
assertAnyScope('"a\\nb"', 'constant.character.escape', 'valid escape');
assertAnyScope('"a\\zb"', 'invalid.illegal.escape', 'invalid escape');
assertAnyScope('n = 0xFF', 'constant.numeric.integer.hex', 'hex integer');
assertAnyScope('n = 3.14', 'constant.numeric.float', 'float');
assertAnyScope('n = 42', 'constant.numeric.integer', 'decimal integer');

// ── Members / placeholders / variance markers ───────────────────────────────
assertScope('r.field', 'field', 'variable.other.member', 'field member');
assertScope('y = a.sigma^', '^', 'variable.other.member.variance', 'axis variance marker ^');
assertScope('y = a.sigma_', '_', 'variable.other.member.variance', 'axis variance marker _');
assertScope('p = _name_', '_name_', 'variable.other.placeholder', 'placeholder _name_');
assertScope('h = _', '_', 'variable.other.hole', 'hole _');

// ── Assignment / binding / lambda operators ─────────────────────────────────
assertScope('x = 1', '=', 'keyword.operator.assignment', 'assignment =');
assertScope('x ~ d', '~', 'keyword.operator.assignment', 'tilde ~');
assertScope('C[.i] := e', ':=', 'keyword.operator.assignment.aggregate', 'aggregate :=');
assertScope('a -> b', '->', 'keyword.operator.lambda', 'lambda arrow ->');

// ── Operator coverage (JSON-driven; shared source of truth with tree-sitter) ─
// `keyword-lists.json` may not have an "operators" key yet (added in Risk 2).
// Guard so this harness works standalone before Risk 2 lands.
if (!keywordLists.operators) {
  console.log('note: operator coverage skipped (no "operators" key in keyword-lists.json yet — added in Risk 2)');
}
for (const op of keywordLists.operators ?? []) {
  assertScope(`a ${op} b`, op, 'keyword.operator', `operator ${op}`);
}

process.exit(fail);
