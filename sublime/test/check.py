#!/usr/bin/env python3
"""Structural checks for sublime/flatppl.sublime-syntax.

syntect (the engine bat/ranger use) only loads `.sublime-syntax`, never
TextMate `.tmLanguage[.json]`, so this is a first-class grammar target. We have
no Rust/syntect harness in-tree, so this test does NOT exercise tokenisation
(that is covered live via `bat --language=flatppl`); it pins the file's
structure and the GEN-marked keyword alternations against keyword-lists.json.
Keyword sync itself is enforced by `gen-grammars.py --check`; here we assert the
markers exist and the scopes are present so a hand-edit can't silently break the
generator's splice target.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SYNTAX = ROOT / "sublime" / "flatppl.sublime-syntax"
KEYWORDS = ROOT / "keyword-lists.json"

# Mirror of SUBLIME_SCOPES in tools/gen-grammars.py — kept here so the test
# fails loudly if a category's scope is dropped from the grammar.
EXPECTED_SCOPES = {
    "specialops":  "keyword.other.special-operation.flatppl",
    "kernels":     "entity.name.type.kernel.flatppl",
    "combinators": "entity.name.function.measure.flatppl",
    "analysis":    "entity.name.function.analysis.flatppl",
    "higherorder": "entity.name.function.higher-order.flatppl",
    "setctors":    "entity.name.function.set-constructor.flatppl",
    "builtins":    "support.function.builtin.flatppl",
    "constants":   "constant.language.flatppl",
    "predefsets":  "constant.other.set.flatppl",
    "selectors":   "keyword.other.selector.flatppl",
    "reserved":    "variable.language.flatppl",
}


def fail(msg):
    print(f"FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def main():
    if not SYNTAX.exists():
        fail(f"{SYNTAX} missing")
    text = SYNTAX.read_text()

    # 1. Required Sublime header — syntect rejects the file without these.
    if not text.startswith("%YAML 1.2"):
        fail("file must start with the `%YAML 1.2` directive")
    for key in ("name: FlatPPL", "scope: source.flatppl"):
        if key not in text:
            fail(f"missing required top-level `{key}`")
    if not re.search(r"file_extensions:\s*\n\s*-\s*flatppl", text):
        fail("file_extensions must list `flatppl`")
    if "main:" not in text:
        fail("missing `main` context")

    # 2. Every keyword category has a GEN/GEN-END marker pair, a single-quoted
    #    match scalar between them, and its expected scope on the next line.
    cats = json.loads(KEYWORDS.read_text())["categories"]
    seen = set()
    for cat in cats:
        kl = cat["kate_list"]
        seen.add(kl)
        m = re.search(
            rf"# GEN:{re.escape(kl)}\n\s*- match: '([^']*)'\n\s*scope: (\S+)\n\s*# GEN-END:{re.escape(kl)}",
            text,
        )
        if m is None:
            fail(f"category '{kl}' missing well-formed GEN block (match + scope + GEN-END)")
        scope = m.group(2)
        if scope != EXPECTED_SCOPES.get(kl):
            fail(f"category '{kl}' scope is '{scope}', expected '{EXPECTED_SCOPES.get(kl)}'")
        # Every word must appear in the alternation (sync is exact-checked by
        # gen-grammars --check; this catches a truncated/garbled splice).
        for w in cat["words"]:
            if re.escape(w) not in m.group(1):
                fail(f"category '{kl}' alternation missing word '{w}'")

    missing_scope = set(EXPECTED_SCOPES) - seen
    if missing_scope:
        fail(f"EXPECTED_SCOPES has categories absent from keyword-lists.json: {missing_scope}")

    print(f"OK: sublime-syntax structure + {len(cats)} keyword categories verified")


if __name__ == "__main__":
    main()
