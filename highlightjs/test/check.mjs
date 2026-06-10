// Scope-regression test for highlightjs/flatppl.js.
// Highlights inline FlatPPL snippets with highlight.js (core build) and asserts
// each token category lands on its expected `hljs-…` class. Mirrors the
// TextMate harness (../../textmate/test/check.mjs); the operator loop is driven
// by keyword-lists.json so it stays in sync with the shared source of truth.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import hljs from 'highlight.js/lib/core';
import flatppl from '../flatppl.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const keywordLists = JSON.parse(readFileSync(resolve(repoRoot, 'keyword-lists.json'), 'utf8'));

hljs.registerLanguage('flatppl', flatppl);

function highlight(code) {
  return hljs.highlight(code, { language: 'flatppl' }).value;
}

function htmlEscape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function reEscape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let fail = 0;

// Assert SOME `<span class="hljs-…needle…">text</span>` (with exact inner text)
// appears in the highlighted output.
function assertScope(line, text, needle, desc) {
  const html = highlight(line);
  const re = new RegExp(`<span class="hljs-[^"]*${reEscape(needle)}[^"]*">${reEscape(htmlEscape(text))}</span>`);
  if (re.test(html)) {
    console.log(`ok: ${desc}`);
  } else {
    fail = 1;
    console.error(`FAIL: ${desc}\n  line: ${JSON.stringify(line)}\n  wanted text=${JSON.stringify(text)} class~=hljs-…${needle}\n  got: ${html}`);
  }
}

// Assert SOME span whose class contains `needle` exists (any inner text).
function assertAnyScope(line, needle, desc) {
  const html = highlight(line);
  const re = new RegExp(`<span class="hljs-[^"]*${reEscape(needle)}[^"]*">`);
  if (re.test(html)) {
    console.log(`ok: ${desc}`);
  } else {
    fail = 1;
    console.error(`FAIL: ${desc}\n  line: ${JSON.stringify(line)}\n  wanted class~=hljs-…${needle}\n  got: ${html}`);
  }
}

// Assert NO span carries `class~=hljs-…needle…` wrapping exactly `text`.
function refuteScope(line, text, needle, desc) {
  const html = highlight(line);
  const re = new RegExp(`<span class="hljs-[^"]*${reEscape(needle)}[^"]*">${reEscape(htmlEscape(text))}</span>`);
  if (!re.test(html)) {
    console.log(`ok: ${desc}`);
  } else {
    fail = 1;
    console.error(`FAIL: ${desc}\n  line: ${JSON.stringify(line)}\n  unexpected text=${JSON.stringify(text)} class~=hljs-…${needle}\n  got: ${html}`);
  }
}

// ── Keyword categories ──────────────────────────────────────────────────────
assertScope('x ~ Normal(0, 1)', 'Normal', 'type', 'kernel Normal → type');
assertScope('m = iid(d, 3)', 'iid', 'built_in', 'combinator iid → built_in');
assertScope('y = likelihoodof(m, d)', 'likelihoodof', 'built_in', 'analysis likelihoodof → built_in');
assertScope('z = reduce(f, xs)', 'reduce', 'built_in', 'higher-order reduce → built_in');
assertScope('s = interval(0, 1)', 'interval', 'built_in', 'set-constructor interval → built_in');
assertScope('fn(x)', 'fn', 'keyword', 'special-operation fn → keyword');
assertScope('w = all', 'all', 'keyword', 'selector all → keyword');
assertScope('r = record(a)', 'record', 'built_in', 'builtin record → built_in (call position)');
assertScope('c = inf', 'inf', 'literal', 'constant inf → literal');
assertScope('q = reals', 'reals', 'constant_', 'predefined-set reals → variable.constant');
assertScope('v = self', 'self', 'language_', 'reserved self → variable.language');

// ── Builtins are NOT reserved: bare (non-call) use stays unscoped (spec §05) ──
refuteScope('real = 1', 'real', 'built_in', 'bare `real` (not a call) is NOT built_in');
// `r.Normal` is field access, not the Normal kernel — `.name` is scoped property,
// which also stops the keyword matcher from tagging the field.
refuteScope('y = r.Normal', 'Normal', 'type', 'field `.Normal` is NOT the kernel type');
assertScope('y = r.Normal', '.Normal', 'property', 'field `.Normal` → property');

// ── Comments / strings / numbers ────────────────────────────────────────────
assertAnyScope('# a comment', 'comment', 'line comment');
assertAnyScope('% a doc comment', 'comment', 'doc comment');
assertAnyScope('"a\\nb"', 'string', 'string');
assertAnyScope('"a\\nb"', 'escape_', 'valid escape (char.escape)');
assertScope('n = 0xFF', '0xFF', 'number', 'hex integer');
assertScope('n = 3.14', '3.14', 'number', 'float');
assertScope('n = .5', '.5', 'number', 'leading-dot float');
assertScope('n = 42', '42', 'number', 'decimal integer');

// ── Members / placeholders ──────────────────────────────────────────────────
assertScope('r.field', '.field', 'property', 'field member → property');
assertScope('p = _name_', '_name_', 'variable', 'placeholder _name_ → variable');
assertScope('h = _', '_', 'variable', 'hole _ → variable');

// ── Assignment / binding / lambda / selector operators ──────────────────────
assertScope('x = 1', '=', 'operator', 'assignment =');
assertScope('x ~ d', '~', 'operator', 'tilde ~');
assertScope('C[.i] := e', ':=', 'operator', 'aggregate :=');
assertScope('a -> b', '->', 'operator', 'lambda arrow ->');

// ── Operator coverage (JSON-driven; shared source of truth) ─────────────────
for (const op of keywordLists.operators ?? []) {
  assertScope(`a ${op} b`, op, 'operator', `operator ${op}`);
}

process.exit(fail);
