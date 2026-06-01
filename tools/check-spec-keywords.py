#!/usr/bin/env python3
"""Check keyword-lists.json against the FlatPPL spec's built-in function tables.

Extracts every function name from the markdown tables in 07-functions.md and
verifies each appears somewhere in keyword-lists.json. Catches spec additions
that have not yet been mirrored into the grammars' keyword source.

The spec lives in a SEPARATE repo (flatppl-design). If the docs directory is
absent (e.g. in flatppl-grammars CI, where that repo is not checked out) the
check SKIPS with exit 0 so it never breaks an isolated build.

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


def doc_function_names(functions_md: Path):
    names = []
    for line in functions_md.read_text().splitlines():
        # Table rows: | `name` | ...   or   | [`name`](#anchor) | ...
        m = re.match(r"\s*\|\s*\[?`([a-zA-Z_][a-zA-Z0-9_]*)`", line)
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
    functions_md = docs / "07-functions.md"
    if not functions_md.is_file():
        print(f"SKIP: spec docs not found at {functions_md} (set --docs-dir or FLATPPL_DOCS_DIR)")
        return 0

    listed = listed_words()
    missing = [n for n in doc_function_names(functions_md)
               if n not in listed and n not in INTENTIONAL_EXCLUSIONS]
    if missing:
        print("Spec builtins missing from keyword-lists.json:")
        for n in missing:
            print(f"  {n}")
        print("Fix: add them to the appropriate category in keyword-lists.json,"
              " then run  pixi run gen-grammars")
        return 1
    print("OK: every 07-functions.md table builtin is present in keyword-lists.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
