"""Pygments lexer for FlatPPL — the Flat Portable Probabilistic Language.

The keyword/operator word lists between the `# GEN:` markers are SYNCED from
keyword-lists.json by tools/gen-grammars.py (run `pixi run gen-grammars`); do
not hand-edit them. Everything else (token rules, states) is hand-maintained.
"""
from pygments.lexer import RegexLexer, words, bygroups
from pygments.token import (
    Comment, String, Number, Operator, Keyword, Name, Punctuation,
    Whitespace, Error,
)

# ── Word lists — generated from keyword-lists.json ──────────────────────────
# GEN:specialops-start
SPECIALOPS = ("draw", "lawof", "functionof", "kernelof", "fn", "elementof", "external", "valueset", "load_module", "standard_module", "load_data")
# GEN:specialops-end
# GEN:kernels-start
KERNELS = ("Uniform", "Normal", "GeneralizedNormal", "Cauchy", "StudentT", "Logistic", "LogNormal", "Exponential", "Gamma", "Weibull", "Pareto", "InverseGamma", "Beta", "ChiSquared", "VonMises", "Laplace", "Bernoulli", "Categorical", "Categorical0", "Binomial", "Poisson", "Geometric", "NegativeBinomial", "NegativeBinomial2", "MvNormal", "Wishart", "InverseWishart", "LKJ", "LKJCholesky", "Dirichlet", "Multinomial", "PoissonProcess", "BinnedPoissonProcess", "Dirac", "Lebesgue", "Counting", "CrystalBall", "DoubleSidedCrystalBall", "Argus", "RelativisticBreitWigner", "Voigtian", "Landau", "BifurcatedNormal", "ContinuedPoisson")
# GEN:kernels-end
# GEN:combinators-start
COMBINATORS = ("weighted", "logweighted", "normalize", "totalmass", "superpose", "ksuperpose", "joint", "jointchain", "kchain", "markovchain", "kscan", "iid", "truncate", "pushfwd", "locscale")
# GEN:combinators-end
# GEN:analysis-start
ANALYSIS = ("likelihoodof", "joint_likelihood", "densityof", "logdensityof", "bayesupdate", "disintegrate", "restrict")
# GEN:analysis-end
# GEN:higherorder-start
HIGHERORDER = ("broadcast", "broadcasted", "reduce", "scan", "fchain", "bijection", "aggregate", "metricsum")
# GEN:higherorder-end
# GEN:setctors-start
SETCTORS = ("interval", "cartprod", "cartpow", "stdsimplex")
# GEN:setctors-end
# GEN:builtins-start
BUILTINS = ("identity", "vector", "array", "fill", "zeros", "ones", "eye", "onehot", "linspace", "extlinspace", "get", "get0", "cat", "rowstack", "colstack", "record", "table", "tuple", "partition", "reverse", "relabel", "fixed", "tile", "splitblocks", "joinblocks", "addaxes", "blockdiagmat", "bandedmat", "conv", "crosscorr", "boolean", "integer", "real", "complex", "string", "imag", "exp", "expm1", "log", "log10", "log1p", "pow", "sqrt", "abs", "abs2", "sin", "cos", "tan", "asin", "acos", "atan", "atan2", "sinh", "cosh", "tanh", "asinh", "acosh", "atanh", "min", "max", "floor", "ceil", "round", "div", "mod", "conj", "cis", "gamma", "loggamma", "logit", "invlogit", "probit", "invprobit", "add", "sub", "mul", "divide", "neg", "equal", "unequal", "lt", "le", "gt", "ge", "isfinite", "isinf", "isnan", "iszero", "transpose", "adjoint", "det", "logabsdet", "inv", "trace", "linsolve", "lower_cholesky", "row_gram", "col_gram", "self_outer", "cross", "diagmat", "qr", "diag", "quadform", "sum", "mean", "var", "std", "prod", "maximum", "minimum", "cumsum", "cumprod", "lengthof", "sizeof", "indicesof", "indicesof0", "l1norm", "l2norm", "l1unit", "l2unit", "logsumexp", "softmax", "logsoftmax", "land", "lor", "lnot", "lxor", "ifelse", "filter", "selectbins", "bincounts", "polynomial", "bernstein", "stepwise", "rngstate", "rnginit", "rand", "builtin_logdensityof", "builtin_sample", "builtin_touniform", "builtin_fromuniform", "builtin_tonormal", "builtin_fromnormal", "checked", "interp_pwlin", "interp_pwexp", "interp_poly2_lin", "interp_poly6_lin", "interp_poly6_exp", "resonance_breitwigner", "kallen", "breakup_momentum", "blatt_weisskopf", "wignerd", "wignerD", "wignerd_doublearg", "wignerD_doublearg")
# GEN:builtins-end
# GEN:constants-start
CONSTANTS = ("true", "false", "inf", "pi", "im")
# GEN:constants-end
# GEN:predefsets-start
PREDEFSETS = ("reals", "posreals", "nonnegreals", "unitinterval", "posintegers", "nonnegintegers", "integers", "booleans", "complexes", "rngstates", "anything")
# GEN:predefsets-end
# GEN:selectors-start
SELECTORS = ("all", "only")
# GEN:selectors-end
# GEN:reserved-start
RESERVED = ("self", "base", "flatppl_compat")
# GEN:reserved-end
# GEN:operators-start
OPERATORS = ("+", "-", "*", "/", "^", ".+", ".-", ".*", "./", ".^", "<", ">", "==", "!=", "<=", ">=", ".<", ".>", ".==", ".!=", ".<=", ".>=", "&&", "||", ".&&", ".||", ".!", "in")
# GEN:operators-end


class FlatPPLLexer(RegexLexer):
    """Syntax lexer for FlatPPL (spec §05). Canonical surface form only."""

    name = "FlatPPL"
    aliases = ["flatppl"]
    filenames = ["*.flatppl"]
    mimetypes = ["text/x-flatppl"]
    url = "https://github.com/flatppl/flatppl-grammars"

    tokens = {
        "root": [
            (r"[ \t]+", Whitespace),
            (r"\r?\n", Whitespace),
            # Fenced block comment / doc-block (whole-line fences, spec §05).
            (r"^[ \t]*###[ \t]*$", Comment.Multiline, "block_comment"),
            (r"^[ \t]*%%%(?:md|typ)?[ \t]*$", Comment.Special, "doc_block"),
            # Line comments terminate at newline or ';' (spec §05).
            (r"#[^\n;]*", Comment.Single),
            (r"%(?:md|typ)?[^\n;]*", Comment.Special),
            # Strings.
            (r'"', String, "string"),
            # Numbers.
            (r"0x[0-9a-fA-F]+(?:_[0-9a-fA-F]+)*", Number.Hex),
            (r"[0-9]+(?:_[0-9]+)*\.(?:[0-9]+(?:_[0-9]+)*)?(?:[eE][+-]?[0-9]+(?:_[0-9]+)*)?", Number.Float),
            (r"\.[0-9]+(?:_[0-9]+)*(?:[eE][+-]?[0-9]+(?:_[0-9]+)*)?", Number.Float),
            (r"[0-9]+(?:_[0-9]+)*[eE][+-]?[0-9]+(?:_[0-9]+)*", Number.Float),
            (r"[0-9]+(?:_[0-9]+)*", Number.Integer),
            # Placeholder _name_ and hole _.
            (r"\b_[a-zA-Z][a-zA-Z0-9_]*_\b", Name.Variable.Magic),
            (r"(?<![a-zA-Z0-9])_(?![a-zA-Z0-9_])", Name.Variable),
            # Keyword categories (word lists; specific names before generic ident).
            (words(SPECIALOPS, prefix=r"\b", suffix=r"\b"), Keyword),
            (words(KERNELS, prefix=r"\b", suffix=r"\b"), Name.Class),
            (words(COMBINATORS, prefix=r"\b", suffix=r"\b"), Name.Function),
            (words(ANALYSIS, prefix=r"\b", suffix=r"\b"), Name.Function),
            (words(HIGHERORDER, prefix=r"\b", suffix=r"\b"), Name.Function),
            (words(SETCTORS, prefix=r"\b", suffix=r"\b"), Name.Function),
            # Builtins are scoped only in call position (`\b(?=\s*\()`), matching
            # the `(?=\s*\()` tm_suffix the other FlatPPL grammars use — builtins
            # are NOT reserved (spec §05), so a bare `real`/`string`/`sum` used as
            # an ordinary name stays Name, not Name.Builtin.
            (words(BUILTINS, prefix=r"\b", suffix=r"\b(?=\s*\()"), Name.Builtin),
            (words(CONSTANTS, prefix=r"\b", suffix=r"\b"), Keyword.Constant),
            (words(PREDEFSETS, prefix=r"\b", suffix=r"\b"), Name.Constant),
            (words(SELECTORS, prefix=r"\b", suffix=r"\b"), Keyword),
            (words(RESERVED, prefix=r"\b", suffix=r"\b"), Name.Builtin.Pseudo),
            # Axis name `.name` with optional variance marker ^ / _ (spec §05).
            # LIMITATION: a regex lexer can't tell an Axis (`.i` in an aggregation)
            # from field access (`r.field`); both surface as `.name`, so field
            # access is also scoped Name.Attribute here, and a field name ending in
            # `_` has its `_` consumed as a variance marker. Disambiguation needs a
            # parser (spec §05 "Note on parser disambiguation").
            (r"(\.)([a-zA-Z][a-zA-Z0-9_]*[a-zA-Z0-9]|[a-zA-Z])([\^_])?",
             bygroups(Punctuation, Name.Attribute, Name.Attribute)),
            # Operators. OPERATORS is mostly symbolic, but also includes the
            # alphabetic `in`, which needs word boundaries so it doesn't match
            # inside identifiers like `index`; so `in` is pulled out and handled
            # separately (like :=, ->).
            # `:=` and `->` must come BEFORE the `words()` rule because `words()`
            # includes `-` and `>` as single-char operators that would otherwise
            # match first. `words()` escapes each token and prefers the longest
            # match within its own set, so multi-char ops (.==, .<=) win over their
            # prefixes, but only within the set it knows about.
            (r"\bin\b", Operator),
            (r":=", Operator),
            (r"->", Operator),
            (words(tuple(op for op in OPERATORS if op != "in")), Operator),
            (r"[=~]", Operator),
            # `!` (also the `only` selector in `[...]`) and `:` (also slice-`all`
            # and the metricsum binding colon) are lookahead-dependent; without a
            # parser they are uniformly scoped Operator here.
            (r"[:!]", Operator),
            # Identifiers.
            (r"[a-zA-Z_][a-zA-Z0-9_]*", Name),
            # Punctuation.
            (r"[(){}\[\],;.]", Punctuation),
        ],
        "string": [
            (r'\\[\\"nrt0]', String.Escape),
            (r"\\.", Error),
            (r'[^"\\]+', String),
            (r'"', String, "#pop"),
        ],
        "block_comment": [
            (r"^[ \t]*###[ \t]*$", Comment.Multiline, "#pop"),
            (r"[^\n]+", Comment.Multiline),
            (r"\n", Comment.Multiline),
        ],
        "doc_block": [
            (r"^[ \t]*%%%[ \t]*$", Comment.Special, "#pop"),
            (r"[^\n]+", Comment.Special),
            (r"\n", Comment.Special),
        ],
    }
