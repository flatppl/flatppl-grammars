#!/usr/bin/env python3
"""Sync keyword lists in TextMate, Kate, tree-sitter, Pygments, and Sublime grammars from keyword-lists.json.

Usage:
    gen-grammars.py           -- update all grammars in-place
    gen-grammars.py --check   -- exit 1 if any grammar drifts from the JSON

Keyword list content is rewritten in all five grammar targets. The
tree-sitter `@operator` block (between the `; GEN:operators-start` /
`; GEN:operators-end` markers in `highlights.scm`) and the Pygments
`pygments/flatppl_lexer.py` word-list tuples and the
`sublime/flatppl.sublime-syntax` keyword alternations (both between
`# GEN:` markers) are also generated from `keyword-lists.json`. All other grammar content
(patterns, contexts, comments) is preserved exactly; the engine-specific
operator regexes in kate/textmate remain hand-maintained.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_keyword_lists():
    return json.loads((ROOT / "keyword-lists.json").read_text())


# ── TextMate ──────────────────────────────────────────────────────────────────

def _tm_match(words, suffix):
    escaped = [re.escape(w) for w in words]
    if suffix:
        return r"\b(" + "|".join(escaped) + ")" + suffix
    return r"\b(" + "|".join(escaped) + r")\b"


def check_or_update_textmate(categories, *, check):
    """Return list of drifted category keys. Write fixes unless check=True.

    NOTE: We update the JSON via a surgical regex splice rather than
    json.load + json.dump on purpose. The grammar file is hand-curated and a
    full parse-and-reformat would reflow every key/string and destroy the diff
    quality, so we replace only the affected "match" value in place.
    """
    path = ROOT / "textmate" / "flatppl.tmLanguage.json"
    text = path.read_text()
    data = json.loads(text)
    repo = data["repository"]
    drifted = []

    for cat in categories:
        key = cat["tm_key"]
        suffix = cat.get("tm_suffix", "")
        expected = _tm_match(cat["words"], suffix)
        if key not in repo:
            print(
                f"ERROR: textmate repository entry '{key}' not found"
                f" — add an empty \"{key}\" entry under \"repository\" in"
                f" textmate/flatppl.tmLanguage.json before re-running",
                file=sys.stderr,
            )
            sys.exit(2)
        actual = repo[key]["match"]
        if actual == expected:
            continue
        drifted.append(f"  textmate: repository/{key}")
        if not check:
            # Surgical in-place replacement: find the entry block and swap
            # only the "match" value, preserving all surrounding formatting.
            entry_re = re.compile(
                rf'("{re.escape(key)}":\s*\{{)(.*?)(^\s*\}})',
                re.DOTALL | re.MULTILINE,
            )
            m = entry_re.search(text)
            if m is None:
                print(
                    f"ERROR: textmate entry '{key}' not found"
                    f" — add an empty \"{key}\" entry under \"repository\" in"
                    f" textmate/flatppl.tmLanguage.json before re-running",
                    file=sys.stderr,
                )
                sys.exit(2)
            old_val = json.dumps(actual)    # JSON-escaped, with surrounding quotes
            new_val = json.dumps(expected)
            inner = m.group(2).replace(f'"match": {old_val}', f'"match": {new_val}', 1)
            if inner == m.group(2):
                print(f"ERROR: could not splice match value for '{key}' — encoding mismatch", file=sys.stderr)
                sys.exit(2)
            text = text[: m.start()] + m.group(1) + inner + m.group(3) + text[m.end() :]

    if not check and drifted:
        path.write_text(text)
    return drifted


# ── Kate ──────────────────────────────────────────────────────────────────────

def _kate_items(words):
    return "".join(f"<item>{w}</item>" for w in words)


def check_or_update_kate(categories, *, check):
    """Return list of drifted list names. Write fixes unless check=True.

    NOTE: We rewrite the <list> contents via a surgical regex splice rather
    than xml.etree parse + serialize on purpose. Re-serializing this
    hand-curated XML would reflow attribute order/whitespace across the whole
    file and ruin the diff, so we replace only the affected list body in place.
    """
    path = ROOT / "kate" / "flatppl.xml"
    raw = path.read_text()
    text = raw.replace("\r\n", "\n")
    crlf = "\r\n" in raw
    drifted = []

    for cat in categories:
        name = cat["kate_list"]
        expected_inner = "      " + _kate_items(cat["words"])
        list_re = re.compile(
            rf'(<list name="{re.escape(name)}">\n)(.*?)(\n    </list>)',
            re.DOTALL,
        )
        m = list_re.search(text)
        if m is None:
            print(
                f"ERROR: kate list '{name}' not found in flatppl.xml"
                f" — add a '<list name=\"{name}\"> ... </list>' block in"
                f" kate/flatppl.xml before re-running",
                file=sys.stderr,
            )
            sys.exit(2)
        if m.group(2) == expected_inner:
            continue
        drifted.append(f"  kate: list/{name}")
        if not check:
            replacement = m.group(1) + expected_inner + m.group(3)
            text = text[: m.start()] + replacement + text[m.end() :]

    if not check and drifted:
        path.write_text(text.replace("\n", "\r\n") if crlf else text)
    return drifted


# ── tree-sitter ─────────────────────────────────────────────────────────────

def _ts_pattern(words):
    return "^(" + "|".join(re.escape(w) for w in words) + ")$"


def check_or_update_tree_sitter(categories, *, check):
    """Return list of drifted GEN markers. Write fixes unless check=True."""
    path = ROOT / "tree-sitter" / "queries" / "highlights.scm"
    if not path.exists():
        return [f"  tree-sitter: queries/highlights.scm MISSING"]
    text = path.read_text()
    drifted = []
    for cat in categories:
        name = cat["kate_list"]
        scope = cat["ts_scope"]
        pattern = _ts_pattern(cat["words"])
        # Canonical block body, reproduced byte-for-byte from the JSON. Covers
        # BOTH the `((identifier) @scope` line and the `(#match? @scope "...")`
        # line so that a change to either drifts/updates the whole block.
        canonical = f'((identifier) @{scope}\n (#match? @{scope} "{pattern}"))\n'
        marker_re = re.compile(
            rf'(; GEN:{re.escape(name)}-start\n)(.*?)(; GEN:{re.escape(name)}-end)',
            re.DOTALL,
        )
        m = marker_re.search(text)
        if m is None:
            drifted.append(
                f"  tree-sitter: queries/highlights.scm GEN:{name} (marker not found"
                f"; add a '; GEN:{name}-start' / '; GEN:{name}-end' block to"
                f" tree-sitter/queries/highlights.scm before re-running)"
            )
            continue
        if m.group(2) == canonical:
            continue
        drifted.append(f"  tree-sitter: queries/highlights.scm GEN:{name}")
        if not check:
            text = text[: m.start()] + m.group(1) + canonical + m.group(3) + text[m.end():]
    if not check and drifted:
        path.write_text(text)
    return drifted


def _ts_operator_block(operators):
    """Canonical body for the GEN:operators block: a bracketed anonymous-token
    list captured as @operator, one space-separated line, reproduced
    byte-for-byte so any change drifts/updates the whole block."""
    toks = " ".join(json.dumps(op) for op in operators)
    return f"[\n  {toks}\n] @operator\n"


def check_or_update_tree_sitter_operators(operators, *, check):
    """Return list of drifted markers for the flat @operator block. Write fixes
    unless check=True. Only the engine-neutral flat-@operator tokens live here;
    the special-scoped operators (=, ~, :=, ->, contextual !, : selector) stay
    hand-maintained OUTSIDE the GEN markers."""
    path = ROOT / "tree-sitter" / "queries" / "highlights.scm"
    if not path.exists():
        return ["  tree-sitter: queries/highlights.scm MISSING"]
    text = path.read_text()
    canonical = _ts_operator_block(operators)
    marker_re = re.compile(
        r'(; GEN:operators-start\n)(.*?)(; GEN:operators-end)',
        re.DOTALL,
    )
    m = marker_re.search(text)
    if m is None:
        return [
            "  tree-sitter: queries/highlights.scm GEN:operators (marker not found"
            "; add a '; GEN:operators-start' / '; GEN:operators-end' block to"
            " tree-sitter/queries/highlights.scm before re-running)"
        ]
    if m.group(2) == canonical:
        return []
    if not check:
        new_text = text[: m.start()] + m.group(1) + canonical + m.group(3) + text[m.end():]
        path.write_text(new_text)
    return ["  tree-sitter: queries/highlights.scm GEN:operators"]


# ── Pygments ─────────────────────────────────────────────────────────────────

# Pygments module-level tuple variable name for each keyword category, keyed by
# its kate_list (the canonical category id). Operators use OPERATORS.
def _py_var(name):
    return name.upper()


def _py_tuple(words):
    # Trailing comma keeps a 1-tuple valid and the multi-element form clean.
    return "(" + ", ".join(json.dumps(w) for w in words) + ("," if len(words) == 1 else "") + ")"


def check_or_update_pygments(categories, operators, *, check):
    """Return list of drifted GEN markers in pygments/flatppl_lexer.py. Write
    fixes unless check=True. Splices ONLY the generated word-list tuples between
    the `# GEN:<name>-start` / `-end` markers; all lexer logic is hand-kept."""
    path = ROOT / "pygments" / "flatppl_lexer.py"
    if not path.exists():
        return ["  pygments: flatppl_lexer.py MISSING"]
    text = path.read_text()
    drifted = []
    blocks = [(cat["kate_list"], cat["words"]) for cat in categories]
    blocks.append(("operators", operators))
    for name, words_list in blocks:
        var = _py_var(name)
        canonical = f"{var} = {_py_tuple(words_list)}\n"
        marker_re = re.compile(
            rf'(# GEN:{re.escape(name)}-start\n)(.*?)(# GEN:{re.escape(name)}-end)',
            re.DOTALL,
        )
        m = marker_re.search(text)
        if m is None:
            drifted.append(
                f"  pygments: flatppl_lexer.py GEN:{name} (marker not found"
                f"; add a '# GEN:{name}-start' / '# GEN:{name}-end' block before re-running)"
            )
            continue
        if m.group(2) == canonical:
            continue
        drifted.append(f"  pygments: flatppl_lexer.py GEN:{name}")
        if not check:
            text = text[: m.start()] + m.group(1) + canonical + m.group(3) + text[m.end():]
    if not check and drifted:
        path.write_text(text)
    return drifted


# ── Sublime / syntect ───────────────────────────────────────────────────────

# Sublime-syntax scope for each keyword category, keyed by kate_list. These
# mirror the TextMate `name` scopes so themes colour the two grammars
# identically. The match value itself is byte-for-byte `_tm_match(...)`, so the
# splice below shares the TextMate alternation form.
SUBLIME_SCOPES = {
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


def check_or_update_sublime(categories, *, check):
    """Sync keyword alternations in sublime/flatppl.sublime-syntax.

    Each category's word list lives between `# GEN:<kate_list>` /
    `# GEN-END:<kate_list>` markers as a single-quoted YAML `match:` scalar.
    Single-quoted YAML treats backslashes literally, so the regex is stored
    verbatim (no escaping); category regexes never contain a single quote.
    Only the alternation is rewritten — surrounding structural contexts
    (comments, strings, numbers, operators) are hand-maintained.
    """
    path = ROOT / "sublime" / "flatppl.sublime-syntax"
    if not path.exists():
        return ["  sublime: flatppl.sublime-syntax MISSING"]
    text = path.read_text()
    drifted = []

    for cat in categories:
        kl = cat["kate_list"]
        expected = _tm_match(cat["words"], cat.get("tm_suffix", ""))
        block_re = re.compile(
            rf"(# GEN:{re.escape(kl)}\n\s*- match: ')([^']*)(')",
            re.MULTILINE,
        )
        m = block_re.search(text)
        if m is None:
            print(
                f"ERROR: sublime GEN marker for '{kl}' not found"
                f" — add `# GEN:{kl}` / `# GEN-END:{kl}` around the match line in"
                f" sublime/flatppl.sublime-syntax before re-running",
                file=sys.stderr,
            )
            sys.exit(2)
        if m.group(2) == expected:
            continue
        drifted.append(f"  sublime: GEN:{kl}")
        if not check:
            text = text[: m.start()] + m.group(1) + expected + m.group(3) + text[m.end():]

    if not check and drifted:
        path.write_text(text)
    return drifted


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit 1 if grammars drift from keyword-lists.json; make no changes.",
    )
    args = parser.parse_args()

    data = load_keyword_lists()
    categories = data["categories"]
    operators = data.get("operators")
    if operators is None:
        print('ERROR: "operators" key missing from keyword-lists.json', file=sys.stderr)
        sys.exit(2)
    drifted = []
    drifted += check_or_update_textmate(categories, check=args.check)
    drifted += check_or_update_kate(categories, check=args.check)
    drifted += check_or_update_tree_sitter(categories, check=args.check)
    drifted += check_or_update_tree_sitter_operators(operators, check=args.check)
    drifted += check_or_update_pygments(categories, operators, check=args.check)
    drifted += check_or_update_sublime(categories, check=args.check)

    if drifted:
        if args.check:
            print("Grammar drift detected:")
            for item in drifted:
                print(item)
            print("Fix: run  python tools/gen-grammars.py  (or: pixi run gen-grammars)")
            sys.exit(1)
        else:
            print(f"Updated {len(drifted)} list(s):")
            for item in drifted:
                print(item)
    else:
        if args.check:
            print("OK: all keyword lists in sync")
        else:
            print("OK: no changes needed")


if __name__ == "__main__":
    main()
