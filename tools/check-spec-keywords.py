#!/usr/bin/env python3
"""Check keyword-lists.json against the FlatPPL spec's built-in function tables.

Extracts every function name from the markdown tables in 07-functions.md,
06-measure-algebra.md, and 08-distributions.md, and verifies each appears
somewhere in keyword-lists.json. Catches spec additions that have not yet been
mirrored into the grammars' keyword source.

The spec lives in a SEPARATE repo (flatppl-design). If the docs directory is
absent (e.g. in flatppl-grammars CI, where that repo is not checked out) the
check SKIPS with exit 0 so it never breaks an isolated build.

SCOPE / LIMITATIONS (this is a completeness tripwire, not a full validator):
  * Presence-only. A name is "covered" if it appears in ANY category. It does
    NOT verify the name landed in the CORRECT category (e.g. a builtin filed
    under predefsets still passes).
  * First-cell-only extraction. spec_keyword_names() reads the first backticked
    token of each table row; names in a non-first column, or multiple names in
    one row, are not seen. Tables in 07-functions.md must put the function name
    in the first column for it to be checked. Tables in 06-measure-algebra.md
    and 08-distributions.md use linked entries only ([`name`](#anchor)) to
    avoid argument-table false positives.

Usage:
    check-spec-keywords.py [--docs-dir DIR]
Env:
    FLATPPL_DOCS_DIR  overrides the default ../flatppl-design/docs
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DOCS = ROOT.parent / "flatppl-design" / "docs"

# Names defined in 07-functions.md tables that are intentionally NOT keyword-
# list entries (operators / syntax, handled structurally by the grammars).
INTENTIONAL_EXCLUSIONS = {"in"}

# Catalog docs whose first-column entry names a keyword the grammars must list.
#   07-functions.md       — builtins; first backtick (bracket optional).
#   06-measure-algebra.md — measure combinators + analysis ops; LINKED entries
#                           only (`[\`name\`](#anchor)`) so argument tables
#                           (bare `\`mu\``, `\`f\``) don't produce false misses.
#   08-distributions.md   — kernels; LINKED entries only.
# Presence-only tripwire (see module docstring): a name is "covered" if it
# appears in ANY keyword-lists.json category.
_FIRST_BACKTICK = re.compile(r"\s*\|\s*\[?`([a-zA-Z_][a-zA-Z0-9_]*)`")
_LINKED_BACKTICK = re.compile(r"\s*\|\s*\[`([a-zA-Z_][a-zA-Z0-9_]*)`\]\(#")
CATALOG_DOCS = [
    ("07-functions.md", _FIRST_BACKTICK),
    ("06-measure-algebra.md", _LINKED_BACKTICK),
    ("08-distributions.md", _LINKED_BACKTICK),
]


def spec_keyword_names(docs: Path):
    """Collect catalogued keyword names from every catalog doc present."""
    names = []
    for fname, pat in CATALOG_DOCS:
        path = docs / fname
        if not path.is_file():
            continue
        for line in path.read_text().splitlines():
            m = pat.match(line)
            if m:
                names.append(m.group(1))
    return list(dict.fromkeys(names))


def listed_words():
    cats = json.loads((ROOT / "keyword-lists.json").read_text())["categories"]
    return {w for c in cats for w in c["words"]}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--docs-dir", default=os.environ.get("FLATPPL_DOCS_DIR", str(DEFAULT_DOCS)))
    args = ap.parse_args()

    docs = Path(args.docs_dir)
    if not (docs / "07-functions.md").is_file():
        print(f"SKIP: spec docs not found at {docs} (set --docs-dir or FLATPPL_DOCS_DIR)")
        return 0

    listed = listed_words()
    missing = [n for n in spec_keyword_names(docs)
               if n not in listed and n not in INTENTIONAL_EXCLUSIONS]
    if missing:
        print("Spec builtins missing from keyword-lists.json:")
        for n in missing:
            print(f"  {n}")
        print("Fix: add them to the appropriate category in keyword-lists.json,"
              " then run  pixi run gen-grammars")
        return 1
    print("OK: every spec-catalogued builtin/combinator/kernel is present in keyword-lists.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
