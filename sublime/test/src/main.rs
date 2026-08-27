// Scope-regression test for sublime/flatppl.sublime-syntax.
//
// Loads the grammar into syntect (Oniguruma engine — the same one bat and
// ranger previews use), tokenises representative FlatPPL snippets, and asserts
// each token category lands on its expected scope. This is the behavioural twin
// of textmate/test/check.mjs, pygments/test_lexer.py, and kate/test/check.sh:
// it exercises the real engine, not the grammar file's text.
//
// GEN-marker presence and keyword/keyword-lists.json sync are enforced
// separately by `gen-grammars.py --check` (the `check-grammars` task), so this
// harness focuses purely on engine-observable scopes.

use std::process::exit;

use syntect::parsing::{ParseState, ScopeStack, SyntaxSetBuilder};

// (snippet, needle, expected-scope-substring, description)
// One representative per category, plus the hand-maintained structural tokens.
const CASES: &[(&str, &str, &str, &str)] = &[
    // ── keyword categories (generated from keyword-lists.json) ──
    ("x ~ Normal(0, 1)", "Normal", "entity.name.type.kernel.flatppl", "kernel Normal"),
    ("z = iid(d, n)", "iid", "entity.name.function.measure.flatppl", "combinator iid"),
    ("L = likelihoodof(k, d)", "likelihoodof", "entity.name.function.analysis.flatppl", "analysis likelihoodof"),
    ("z = reduce(add, v)", "reduce", "entity.name.function.higher-order.flatppl", "higher-order reduce"),
    ("s = interval(0, 1)", "interval", "entity.name.function.set-constructor.flatppl", "set-ctor interval"),
    ("f = fn(_ -> 1)", "fn", "keyword.other.special-operation.flatppl", "special-op fn"),
    ("r = record(a = 1)", "record", "support.function.builtin.flatppl", "builtin record"),
    ("x = inf", "inf", "constant.language.flatppl", "constant inf"),
    ("dom = reals", "reals", "constant.other.set.flatppl", "predefined-set reals"),
    ("y = v[all]", "all", "keyword.other.selector.flatppl", "selector all"),
    ("m = self", "self", "variable.language.flatppl", "reserved self"),
    // ── comments ──
    ("# a line comment", "#", "comment.line.number-sign.flatppl", "line comment"),
    ("% a doc comment", "%", "comment.line.documentation.flatppl", "doc-comment line"),
    // ── strings + escapes ──
    ("s = \"hello\"", "hello", "string.quoted.double.flatppl", "string body"),
    ("s = \"a\\nb\"", "\\n", "constant.character.escape.flatppl", "valid escape"),
    ("s = \"a\\qb\"", "\\q", "invalid.illegal.escape.flatppl", "invalid escape"),
    // ── numbers ──
    ("n = 0xFF_00", "0x", "constant.numeric.integer.hex.flatppl", "hex integer"),
    ("n = 1_000.5e-3", "1_000.5", "constant.numeric.float.flatppl", "float"),
    ("n = 42", "42", "constant.numeric.integer.flatppl", "decimal integer"),
    // ── placeholders / hole ──
    ("p = _name_", "_name_", "variable.other.placeholder.flatppl", "placeholder"),
    ("f = fn(_ -> 1)", "_ ", "variable.other.hole.flatppl", "hole"),
    // ── operators ──
    ("b = a == c", "==", "keyword.operator.comparison.flatppl", "comparison =="),
    ("b = a .== c", ".==", "keyword.operator.broadcast.flatppl", "broadcast .=="),
    ("f = a -> a", "->", "keyword.operator.lambda.flatppl", "lambda arrow"),
    ("C[.i] := e", ":=", "keyword.operator.assignment.aggregate.flatppl", "aggregate :="),
    ("x ~ d", "~", "keyword.operator.assignment.flatppl", "tilde binding"),
    ("b = x in s", "in", "keyword.operator.membership.flatppl", "membership in"),
    // ── axis name + variance marker (spec §05) ──
    ("g = C[.mu^]", "mu", "variable.other.member.flatppl", "axis name .mu"),
    ("g = C[.mu^]", "^", "variable.other.member.variance.flatppl", "axis variance ^"),
    // ── §09 particle-physics module members are member reads, never builtins ──
    ("q = hepphys.resonance_breitwigner(s)", "resonance_breitwigner", "variable.other.member.flatppl", "module member resonance_breitwigner"),
    ("bare = resonance_breitwigner(s)", "resonance_breitwigner", "variable.function.flatppl", "unqualified §09 name is a plain call, not a builtin"),
    ("q2 = hepphys.CrystalBall(m0)", "CrystalBall", "variable.other.member.flatppl", "module member CrystalBall (distribution)"),
    ("bare2 = CrystalBall(m0)", "CrystalBall", "variable.function.flatppl", "unqualified §09 distribution is a plain call, not a kernel"),
];

fn main() {
    // Load just our grammar from the parent dir (sublime/), built from the
    // pixi task's cwd of sublime/test.
    let mut builder = SyntaxSetBuilder::new();
    if let Err(e) = builder.add_from_folder("..", true) {
        eprintln!("FAIL: could not load grammar from ../: {e}");
        exit(1);
    }
    let ss = builder.build();
    let syntax = match ss.find_syntax_by_name("FlatPPL") {
        Some(s) => s,
        None => {
            eprintln!("FAIL: FlatPPL syntax not found after loading ../flatppl.sublime-syntax");
            exit(1);
        }
    };

    let mut failed = 0usize;
    for (line, needle, expected, desc) in CASES {
        let scopes = match scopes_at(&ss, syntax, line, needle) {
            Some(s) => s,
            None => {
                eprintln!("FAIL: {desc}  (needle {needle:?} not found in {line:?})");
                failed += 1;
                continue;
            }
        };
        if scopes.contains(expected) {
            println!("ok: {desc} -> {expected}");
        } else {
            eprintln!("FAIL: {desc}  (needle {needle:?})\n      expected scope containing: {expected}\n      got: {scopes}");
            failed += 1;
        }
    }

    if failed > 0 {
        eprintln!("\n{failed} scope assertion(s) failed");
        exit(1);
    }
    println!("\nOK: {} sublime-syntax scope assertions passed", CASES.len());
}

// Return the space-joined scope stack active at the first byte of `needle`
// within `line`, or None if the needle isn't present.
fn scopes_at(
    ss: &syntect::parsing::SyntaxSet,
    syntax: &syntect::parsing::SyntaxReference,
    line: &str,
    needle: &str,
) -> Option<String> {
    let start = line.find(needle)?;
    let mut state = ParseState::new(syntax);
    let ops = state.parse_line(line, ss).ok()?;
    let mut stack = ScopeStack::new();
    // Apply every scope-stack op at or before the needle's start byte; the push
    // for a token happens AT its start offset, so this captures it.
    for (offset, op) in &ops {
        if *offset > start {
            break;
        }
        stack.apply(op).ok()?;
    }
    Some(format!("{stack}"))
}
