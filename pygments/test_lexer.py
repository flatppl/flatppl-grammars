"""Smoke test for the FlatPPL Pygments lexer. Run: `python test_lexer.py`
(from the pygments/ dir, with Pygments importable — pixi provides it). Asserts
representative snippets produce the expected token types. Exits non-zero if any assertion fails
(used by `pixi run test-pygments`)."""
import json
import os
import sys
from pygments.token import (
    Comment, String, Number, Operator, Keyword, Name, Error,
)
from flatppl_lexer import FlatPPLLexer

lexer = FlatPPLLexer()
fail = 0


def has(source, ttype, text):
    for tok_type, tok_text in lexer.get_tokens(source):
        if tok_type is ttype and tok_text == text:
            return True
    return False


def check(source, ttype, text, desc):
    global fail
    if has(source, ttype, text):
        print(f"ok: {desc}")
    else:
        fail = 1
        toks = [(str(t), v) for t, v in lexer.get_tokens(source)]
        print(f"FAIL: {desc}\n  source={source!r}\n  want=({ttype}, {text!r})\n  got={toks}")


check("x ~ Normal(0, 1)", Name.Class, "Normal", "kernel Normal -> Name.Class")
check("m = iid(d, 3)", Name.Function, "iid", "combinator iid -> Name.Function")
check("y = densityof(m, d)", Name.Function, "densityof", "analysis densityof -> Name.Function")
check("z = reduce(f, xs)", Name.Function, "reduce", "higher-order reduce -> Name.Function")
check("s = interval(0, 1)", Name.Function, "interval", "set-ctor interval -> Name.Function")
check("fn(x)", Keyword, "fn", "special-op fn -> Keyword")
check("r = record(a)", Name.Builtin, "record", "builtin record -> Name.Builtin")
check("c = inf", Keyword.Constant, "inf", "constant inf -> Keyword.Constant")
check("q = reals", Name.Constant, "reals", "predefined-set reals -> Name.Constant")
check("v = self", Name.Builtin.Pseudo, "self", "reserved self -> Name.Builtin.Pseudo")
check("w = all", Keyword, "all", "selector all -> Keyword")
check("a == b", Operator, "==", "operator == -> Operator")
check("a .== b", Operator, ".==", "broadcast .== -> Operator")
check("a .! b", Operator, ".!", "broadcast-not .! -> Operator")
check("a -> b", Operator, "->", "lambda arrow -> Operator")
check("C[.i] := e", Operator, ":=", "aggregate := -> Operator")
check("a in b", Operator, "in", "membership in -> Operator")
check("# a comment", Comment.Single, "# a comment", "line comment -> Comment.Single")
check('"hi"', String, "hi", "string body -> String")
check("n = 0xFF", Number.Hex, "0xFF", "hex int -> Number.Hex")
check("n = 3.14", Number.Float, "3.14", "float -> Number.Float")
check("n = 42", Number.Integer, "42", "decimal int -> Number.Integer")
check("p = _name_", Name.Variable.Magic, "_name_", "placeholder -> Name.Variable.Magic")
# Regression: `in`-prefixed identifier must NOT tokenize as the `in` operator.
check("index = 1", Name, "index", "identifier 'index' is NOT split by 'in' operator")
# Regression: longest broadcast op `.!=` must win over its `.!` prefix.
check("a .!= b", Operator, ".!=", "broadcast .!= -> Operator (longest match beats .!)")
# Hole `_` (single underscore, not a placeholder _name_) -> Name.Variable.
check("f(_, x)", Name.Variable, "_", "hole _ -> Name.Variable")
# Axis variance markers ^/_ captured as Name.Attribute, not operators (spec §05).
check("C[.i^]", Name.Attribute, "^", "axis variance marker ^ -> Name.Attribute")
check("C[.j_]", Name.Attribute, "_", "axis variance marker _ -> Name.Attribute")
# Builtins are scoped only in call position (matches the other grammars); a bare
# builtin name used as an ordinary identifier stays Name (spec §05: not reserved).
check("real(0)", Name.Builtin, "real", "builtin in call position -> Name.Builtin")
check("real = 1", Name, "real", "bare builtin (no call) -> Name, not Name.Builtin")
# Bad string escape -> Error (good escapes are String.Escape).
check('"a\\q"', Error, "\\q", "invalid string escape -> Error")
check('"a\\n"', String.Escape, "\\n", "valid string escape -> String.Escape")
# Whole-line block fences open multiline/doc states (spec §05).
check("###\nbody\n###\n", Comment.Multiline, "body", "### block comment body -> Comment.Multiline")
check("%%%md\nbody\n%%%\n", Comment.Special, "body", "%%% doc block body -> Comment.Special")

# ── Full coverage: EVERY keyword in keyword-lists.json lexes to its category ──
# The drift check (`gen-grammars --check`) only proves the file's tuples match
# the JSON; it does NOT prove each word actually lexes to the intended token (a
# reordered/shadowing rule could keep drift green while mis-categorizing a whole
# list). This loop closes that gap with zero hand-maintenance: edit the JSON and
# every word is covered. A NEW category with no mapping below is a hard failure,
# forcing this map to stay in lockstep with the lexer's category->token rules.
CATEGORY_TOKEN = {
    "specialops": Keyword,
    "kernels": Name.Class,
    "combinators": Name.Function,
    "analysis": Name.Function,
    "higherorder": Name.Function,
    "setctors": Name.Function,
    "builtins": Name.Builtin,
    "constants": Keyword.Constant,
    "predefsets": Name.Constant,
    "selectors": Keyword,
    "reserved": Name.Builtin.Pseudo,
}

_kw_path = os.path.join(os.path.dirname(__file__), "..", "keyword-lists.json")
with open(_kw_path) as f:
    _kw = json.load(f)

# Categories scoped only in call position (lexer uses `\b(?=\s*\()`), so their
# coverage words must be tested followed by `(`, not bare.
CALL_ONLY = {"builtins"}

# `kate_list` is the canonical, cross-grammar category id (not Kate-specific);
# all grammar targets key on it. See tools/gen-grammars.py.
for cat in _kw["categories"]:
    name = cat["kate_list"]
    ttype = CATEGORY_TOKEN.get(name)
    if ttype is None:
        fail = 1
        print(f"FAIL: keyword category {name!r} has no token mapping in "
              f"test_lexer.py CATEGORY_TOKEN (add it to match the lexer rule)")
        continue
    for word in cat["words"]:
        src = f"{word}(" if name in CALL_ONLY else word
        check(src, ttype, word, f"coverage: {name}/{word} -> {ttype}")

# Every operator in the JSON lexes to Operator (symbolic + the alphabetic `in`).
for op in _kw["operators"]:
    check(op, Operator, op, f"coverage: operator {op!r} -> Operator")

sys.exit(fail)
