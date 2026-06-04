"""Verify the FlatPPL lexer is discoverable via its installed Pygments entry
point — the path Sphinx (`highlight:: flatppl`), Jupyter, and `pygmentize -l
flatppl` actually use. REQUIRES the editable install first:

    pixi run pip install -e ./pygments
    pixi run test-pygments-entrypoint

Run from the repo ROOT (not pygments/) so resolution can ONLY succeed through
the registered entry point, never a stray `import flatppl_lexer`. NOT part of
the `check` aggregate — that runs without the install and would fail here."""
import sys
from pygments.lexers import get_lexer_by_name, guess_lexer_for_filename

errs = []

try:
    lexer = get_lexer_by_name("flatppl")
    if lexer.name != "FlatPPL":
        errs.append(f"get_lexer_by_name('flatppl').name == {lexer.name!r}, want 'FlatPPL'")
    else:
        print(f"ok: get_lexer_by_name('flatppl') -> {lexer.name}")
except Exception as e:
    errs.append(f"get_lexer_by_name('flatppl') raised {type(e).__name__}: {e}")

try:
    guessed = guess_lexer_for_filename("model.flatppl", "x ~ Normal(0, 1)\n")
    if guessed.name != "FlatPPL":
        errs.append(f"guess_lexer_for_filename('*.flatppl').name == {guessed.name!r}, want 'FlatPPL'")
    else:
        print(f"ok: guess_lexer_for_filename('model.flatppl') -> {guessed.name}")
except Exception as e:
    errs.append(f"guess_lexer_for_filename('*.flatppl') raised {type(e).__name__}: {e}")

for e in errs:
    print(f"FAIL: {e}")
sys.exit(1 if errs else 0)
