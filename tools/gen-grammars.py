#!/usr/bin/env python3
"""Sync keyword lists in TextMate and Kate grammars from keyword-lists.json.

Usage:
    gen-grammars.py           -- update both grammars in-place
    gen-grammars.py --check   -- exit 1 if any grammar drifts from the JSON

Only the keyword list content is rewritten. All other grammar content
(patterns, contexts, operator rules, comments) is preserved exactly.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_categories():
    return json.loads((ROOT / "keyword-lists.json").read_text())["categories"]


# ── TextMate ──────────────────────────────────────────────────────────────────

def _tm_match(words, suffix):
    if suffix:
        return r"\b(" + "|".join(words) + ")" + suffix
    return r"\b(" + "|".join(words) + r")\b"


def check_or_update_textmate(categories, *, check):
    """Return list of drifted category keys. Write fixes unless check=True."""
    path = ROOT / "textmate" / "flatppl.tmLanguage.json"
    text = path.read_text()
    data = json.loads(text)
    repo = data["repository"]
    drifted = []

    for cat in categories:
        key = cat["tm_key"]
        suffix = cat.get("tm_suffix", "")
        expected = _tm_match(cat["words"], suffix)
        actual = repo[key]["match"]
        if actual == expected:
            continue
        drifted.append(f"  textmate: repository/{key}")
        if not check:
            # Surgical in-place replacement: find the entry block and swap
            # only the "match" value, preserving all surrounding formatting.
            entry_re = re.compile(
                rf'("{re.escape(key)}":\s*\{{)(.*?)(\}})',
                re.DOTALL,
            )
            m = entry_re.search(text)
            if m is None:
                print(f"ERROR: textmate entry '{key}' not found", file=sys.stderr)
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
    """Return list of drifted list names. Write fixes unless check=True."""
    path = ROOT / "kate" / "flatppl.xml"
    text = path.read_text().replace("\r\n", "\n")
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
            print(f"ERROR: kate list '{name}' not found in flatppl.xml", file=sys.stderr)
            sys.exit(2)
        if m.group(2) == expected_inner:
            continue
        drifted.append(f"  kate: list/{name}")
        if not check:
            replacement = m.group(1) + expected_inner + m.group(3)
            text = text[: m.start()] + replacement + text[m.end() :]

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

    categories = load_categories()
    drifted = []
    drifted += check_or_update_textmate(categories, check=args.check)
    drifted += check_or_update_kate(categories, check=args.check)

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
