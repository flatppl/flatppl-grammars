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

// ── Keyword categories (JSON-driven; shared source of truth) ────────────────
// Every word in every keyword-lists.json category must highlight onto the
// hljs class the README scope-map prescribes. A dropped or mis-bucketed word
// in flatppl.js would otherwise be invisible to the runtime test.
//
// `needle` is the substring assertScope matches inside `hljs-…` (the coarsened
// `variable.constant` / `variable.language` scopes emit `hljs-variable
// constant_` / `hljs-variable language_`, so we match the trailing token).
// `call` categories (builtins) only highlight in call position (`name(`),
// matching the `(?=\s*\()` suffix — assert them as a `word(` form.
const CATEGORY_SCOPE = {
  specialops: { needle: 'keyword' },
  selectors: { needle: 'keyword' },
  kernels: { needle: 'type' },
  combinators: { needle: 'built_in' },
  analysis: { needle: 'built_in' },
  higherorder: { needle: 'built_in' },
  setctors: { needle: 'built_in' },
  builtins: { needle: 'built_in', call: true },
  constants: { needle: 'literal' },
  predefsets: { needle: 'constant_' },
  reserved: { needle: 'language_' },
};
// Digit-suffixed names (`Categorical0`, `NegativeBinomial2`, `log10`) must
// highlight as a single token: the NUMBER mode's `(?<!\w)` guard in flatppl.js
// stops it from chopping the trailing digit off an identifier. Assert the whole
// word lands on its class so a regression of that guard fails here.
for (const cat of keywordLists.categories ?? []) {
  const name = cat.kate_list;
  const spec = CATEGORY_SCOPE[name];
  if (!spec) {
    fail = 1;
    console.error(`FAIL: keyword-lists category ${JSON.stringify(name)} has no scope-map entry in the test`);
    continue;
  }
  for (const word of cat.words ?? []) {
    const line = spec.call ? `${word}(x)` : `q = ${word}`;
    assertScope(line, word, spec.needle, `${name} ${word} → hljs-…${spec.needle}`);
  }
}

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

// ── Selectors (explicit; also covered by the JSON-driven loop above) ────────
assertScope('w = all', 'all', 'keyword', 'selector all → keyword');
assertScope('w = only', 'only', 'keyword', 'selector only → keyword');

// ── Assignment / binding / lambda / selector operators ──────────────────────
assertScope('x = 1', '=', 'operator', 'assignment =');
assertScope('x ~ d', '~', 'operator', 'tilde ~');
assertScope('C[.i] := e', ':=', 'operator', 'aggregate :=');
assertScope('a -> b', '->', 'operator', 'lambda arrow ->');
// Coarsened single-char operators (README "known coarsening"): `:` (slice-all)
// and `!` (only-selector / lnot) both collapse onto `operator`.
assertScope('C[:] = x', ':', 'operator', 'slice-all colon :');
assertScope('a ! b', '!', 'operator', 'bang !');

// ── Block-comment / doc-block fences (spec §05) ─────────────────────────────
// The `###` block fence and `%%%md` doc block must be tagged `comment`. The
// grammar relies on an ordering invariant — fences listed before the `#`/`%`
// single-char forms — so these guard against a regression in that ordering.
assertAnyScope('###\nbody\n###', 'comment', 'block-comment fence ###');
assertAnyScope('%%%md\nbody\n%%%', 'comment', 'doc-block fence %%%md');

// ── Operator coverage (JSON-driven; shared source of truth) ─────────────────
for (const op of keywordLists.operators ?? []) {
  assertScope(`a ${op} b`, op, 'operator', `operator ${op}`);
}

process.exit(fail);
