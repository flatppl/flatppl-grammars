// FlatPPL CodeMirror 6 highlighter — canonical source (vendored into consumers
// such as flatppl-js at build time; see codemirror/README.md).
//
// Tokenizes with the canonical flatppl.tmLanguage.json via vscode-textmate +
// vscode-oniguruma (both bundled into this module by the consumer's esbuild),
// and maps TextMate scopes onto the consumer's `tok-*` CSS classes.
//
// CodeMirror's ViewPlugin/Decoration are NOT imported for runtime use: the
// decorations must be built with the SAME @codemirror/view instance that owns
// the EditorView. The consumer passes that instance in as `bundle`
// ({ ViewPlugin, Decoration, INITIAL? }). Only vscode-textmate/oniguruma are
// bundled here. Publishes window.FlatPPLTextmate.
import * as vsctm from 'vscode-textmate';
import * as oniguruma from 'vscode-oniguruma';

// Runtime asset URLs, relative to the page (consumer vendors these into vendor/).
const GRAMMAR_URL = 'vendor/flatppl.tmLanguage.json';
const WASM_URL = 'vendor/onig.wasm';
const SCOPE_NAME = 'source.flatppl';

let grammar: vsctm.IGrammar | null = null;
let readyPromise: Promise<vsctm.IGrammar | null> | null = null;
const refreshers = new Set<() => void>();

/** Map a TextMate scope stack (outermost→innermost) to a `tok-*` class,
    checking innermost first. Returns null for unscoped text. The classes match
    flatppl-js's editor theme (style.css). */
export function classForScopes(scopes: string[]): string | null {
  for (let i = scopes.length - 1; i >= 0; i--) {
    const s = scopes[i];
    if (s.indexOf('comment') === 0) return 'tok-comment';
    if (s.indexOf('string') === 0) return 'tok-string';
    if (s.indexOf('constant.numeric') === 0) return 'tok-number';
    if (s.indexOf('keyword.other.special-operation') === 0) return 'tok-special';
    if (s.indexOf('entity.name.type') === 0) return 'tok-dist';
    if (s.indexOf('entity.name.function.measure') === 0) return 'tok-mop';
    if (s.indexOf('entity.name.function.set-constructor') === 0) return 'tok-set';
    if (s.indexOf('entity.name.function') === 0) return 'tok-func';
    if (s.indexOf('support.function') === 0) return 'tok-func';
    if (s.indexOf('constant.language') === 0) return 'tok-const';
    if (s.indexOf('constant.other.set') === 0) return 'tok-set';
    if (s.indexOf('variable.language') === 0) return 'tok-reserved';
    if (s.indexOf('keyword.other.selector') === 0) return 'tok-keyword';
    if (s.indexOf('keyword.operator') === 0) return 'tok-op';
    if (s.indexOf('keyword') === 0) return 'tok-keyword';
    if (s.indexOf('variable.other.placeholder') === 0) return 'tok-placeholder';
    if (s.indexOf('variable.other.hole') === 0) return 'tok-hole';
    if (s.indexOf('variable.other.member') === 0) return 'tok-ident';
    // Plain identifiers (variable.other.flatppl) — keep them tok-ident to match
    // the editor's existing identifier color. MUST be last among variable.other.*
    // so the more specific placeholder/hole/member cases win first.
    if (s.indexOf('variable.other') === 0) return 'tok-ident';
  }
  return null;
}

/** Load onig.wasm + the grammar once. Resolves to the IGrammar, or null on
    failure (highlighting silently degrades to plain text). Refreshes any
    editors mounted before the grammar finished loading. */
export function init(): Promise<vsctm.IGrammar | null> {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    try {
      const wasmRes = await fetch(WASM_URL);
      if (!wasmRes.ok) throw new Error(`Failed to fetch ${WASM_URL}: ${wasmRes.status}`);
      const wasmBin = await wasmRes.arrayBuffer();
      await oniguruma.loadWASM(wasmBin);
      const onigLib = Promise.resolve({
        createOnigScanner: (patterns: string[]) => new oniguruma.OnigScanner(patterns),
        createOnigString: (s: string) => new oniguruma.OnigString(s),
      });
      const grammarRes = await fetch(GRAMMAR_URL);
      if (!grammarRes.ok) throw new Error(`Failed to fetch ${GRAMMAR_URL}: ${grammarRes.status}`);
      const grammarText = await grammarRes.text();
      const registry = new vsctm.Registry({
        onigLib,
        loadGrammar: async (scopeName: string) =>
          scopeName === SCOPE_NAME
            ? vsctm.parseRawGrammar(grammarText, GRAMMAR_URL)
            : null,
      });
      grammar = await registry.loadGrammar(SCOPE_NAME);
    } catch (_) {
      grammar = null;
    }
    refreshers.forEach((fn) => { try { fn(); } catch (_) {} });
    return grammar;
  })();
  return readyPromise;
}

/** Build a CodeMirror ViewPlugin that highlights the whole document via the
    TextMate grammar. `bundle` supplies the consumer's CM instance
    (ViewPlugin, Decoration). Playground docs are small, so we tokenize the
    whole document on each change, threading the rule stack line-to-line. */
export function makeHighlightPlugin(bundle: any) {
  const { ViewPlugin, Decoration } = bundle;

  function buildDecorations(view: any) {
    if (!grammar) return Decoration.none;
    const doc = view.state.doc;
    const ranges: any[] = [];
    let ruleStack = vsctm.INITIAL;
    for (let ln = 1; ln <= doc.lines; ln++) {
      const line = doc.line(ln);
      const res = grammar.tokenizeLine(line.text, ruleStack);
      ruleStack = res.ruleStack;
      for (const t of res.tokens) {
        const from = line.from + t.startIndex;
        const to = line.from + t.endIndex;
        if (to <= from) continue;
        const cls = classForScopes(t.scopes);
        if (cls) ranges.push(Decoration.mark({ class: cls }).range(from, to));
      }
    }
    return Decoration.set(ranges, true);
  }

  return ViewPlugin.fromClass(
    class {
      decorations: any;
      view: any;
      _refresh: () => void;
      constructor(view: any) {
        this.view = view;
        this.decorations = buildDecorations(view);
        this._refresh = () => {
          this.decorations = buildDecorations(this.view);
          this.view.dispatch({});
        };
        refreshers.add(this._refresh);
      }
      update(u: any) {
        // viewportChanged also re-tokenizes from line 1: the TextMate ruleStack
        // is stateful from the document start, so there is no valid way to
        // resume mid-document. O(doc) per change/scroll — fine for playground
        // sizes (same cost class as the tokenizer this replaces).
        if (u.docChanged || u.viewportChanged) {
          this.decorations = buildDecorations(u.view);
        }
      }
      destroy() { refreshers.delete(this._refresh); }
    },
    { decorations: (v: any) => v.decorations }
  );
}

// Publish for plain-script consumers (the web playground loads this as an IIFE
// that sets window.FlatPPLTextmate; esbuild's IIFE/global wrapper handles it).
declare const window: any;
if (typeof window !== 'undefined') {
  window.FlatPPLTextmate = { init, makeHighlightPlugin, classForScopes };
}

export default { init, makeHighlightPlugin, classForScopes };
