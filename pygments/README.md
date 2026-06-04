# FlatPPL Pygments lexer

A [Pygments](https://pygments.org) lexer for FlatPPL. The keyword/operator word
lists are generated from `../keyword-lists.json` by `tools/gen-grammars.py`, so
this lexer always matches the other FlatPPL grammars.

**Not published to PyPI** — install from a checkout or vendor `flatppl_lexer.py`.

## Install (local, into the project's pixi env)

```sh
pixi run pip install -e ./pygments    # from the flatppl-grammars repo root
```

This registers the `flatppl` lexer via an entry point, so it is auto-discovered:

```sh
pixi run pygmentize -l flatppl model.flatppl
```

- **Sphinx:** with the package installed, ` ```{code-block} flatppl ` and
  `.. highlight:: flatppl` work directly.
- **Jupyter / nbconvert:** installed lexers are picked up automatically.

## Without installing

```python
from flatppl_lexer import FlatPPLLexer   # with pygments/ on sys.path
# or:
from pygments.lexers import load_lexer_from_file
lexer = load_lexer_from_file("flatppl_lexer.py", "FlatPPLLexer")
```
