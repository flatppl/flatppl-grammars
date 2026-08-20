// highlight.js language definition for FlatPPL — the Flat Portable
// Probabilistic Language.
//
// The keyword/operator arrays between the `// GEN:` markers are SYNCED from
// keyword-lists.json by tools/gen-grammars.py (run `pixi run gen-grammars`); do
// NOT hand-edit them. Everything else (modes, scope buckets, operator-regex
// assembly) is hand-maintained.
//
// Usage (highlight.js 11+):
//   import hljs from 'highlight.js';
//   import flatppl from './flatppl.js';
//   hljs.registerLanguage('flatppl', flatppl);
//
// Scope mapping vs. the other FlatPPL grammars: highlight.js has a deliberately
// small set of theme classes, so the four "function" categories (combinators,
// analysis, higher-order, set-constructors) collapse into `built_in` alongside
// the builtin functions. The richer per-category scopes the TextMate /
// tree-sitter / Pygments grammars emit are intentionally coarsened here.
//
// Known coarsening (a regex highlighter cannot disambiguate without a parser,
// matching the same limitation documented in pygments/flatppl_lexer.py):
//   - `.name` is uniformly scoped `property`; an axis name (`.i`) and a record
//     field (`r.field`) are indistinguishable. Scoping `.name` also stops a
//     keyword-looking field (`r.Normal`) from being mis-highlighted.
//   - `:` (slice-all / metricsum binding), `!` (only-selector / lnot), `=`/`~`
//     (assignment) are all scoped `operator`.

// ── Keyword arrays — generated from keyword-lists.json ──────────────────────
// GEN:specialops-start
const SPECIALOPS = ["draw", "lawof", "functionof", "kernelof", "fn", "elementof", "external", "valueset", "load_module", "standard_module", "load_data"];
// GEN:specialops-end
// GEN:kernels-start
const KERNELS = ["Uniform", "Normal", "GeneralizedNormal", "Cauchy", "StudentT", "Logistic", "LogNormal", "Exponential", "Gamma", "Weibull", "Pareto", "InverseGamma", "Beta", "ChiSquared", "VonMises", "Laplace", "Bernoulli", "Categorical", "Categorical0", "Binomial", "Poisson", "Geometric", "NegativeBinomial", "NegativeBinomial2", "MvNormal", "Wishart", "InverseWishart", "LKJ", "LKJCholesky", "Dirichlet", "Multinomial", "PoissonProcess", "BinnedPoissonProcess", "Dirac", "Lebesgue", "Counting", "CrystalBall", "DoubleSidedCrystalBall", "Argus", "RelativisticBreitWigner", "Voigtian", "Landau", "BifurcatedNormal", "ContinuedPoisson"];
// GEN:kernels-end
// GEN:combinators-start
const COMBINATORS = ["weighted", "logweighted", "normalize", "totalmass", "superpose", "ksuperpose", "joint", "jointchain", "kchain", "markovchain", "kscan", "iid", "truncate", "pushfwd", "locscale"];
// GEN:combinators-end
// GEN:analysis-start
const ANALYSIS = ["likelihoodof", "joint_likelihood", "densityof", "logdensityof", "bayesupdate", "disintegrate", "restrict"];
// GEN:analysis-end
// GEN:higherorder-start
const HIGHERORDER = ["broadcast", "broadcasted", "reduce", "scan", "fchain", "bijection", "aggregate", "metricsum"];
// GEN:higherorder-end
// GEN:setctors-start
const SETCTORS = ["interval", "cartprod", "cartpow", "stdsimplex"];
// GEN:setctors-end
// GEN:builtins-start
const BUILTINS = ["identity", "vector", "array", "fill", "zeros", "ones", "eye", "onehot", "linspace", "extlinspace", "get", "get0", "cat", "rowstack", "colstack", "record", "table", "tuple", "partition", "reverse", "relabel", "fixed", "tile", "splitblocks", "joinblocks", "addaxes", "blockdiagmat", "bandedmat", "conv", "crosscorr", "boolean", "integer", "real", "complex", "string", "imag", "exp", "expm1", "log", "log10", "log1p", "pow", "sqrt", "abs", "abs2", "sin", "cos", "tan", "asin", "acos", "atan", "atan2", "sinh", "cosh", "tanh", "asinh", "acosh", "atanh", "min", "max", "floor", "ceil", "round", "div", "mod", "conj", "cis", "gamma", "loggamma", "logit", "invlogit", "probit", "invprobit", "add", "sub", "mul", "divide", "neg", "equal", "unequal", "lt", "le", "gt", "ge", "isfinite", "isinf", "isnan", "iszero", "transpose", "adjoint", "det", "logabsdet", "inv", "trace", "linsolve", "lower_cholesky", "row_gram", "col_gram", "self_outer", "cross", "diagmat", "qr", "diag", "quadform", "sum", "mean", "var", "std", "prod", "maximum", "minimum", "cumsum", "cumprod", "lengthof", "sizeof", "indicesof", "indicesof0", "l1norm", "l2norm", "l1unit", "l2unit", "logsumexp", "softmax", "logsoftmax", "land", "lor", "lnot", "lxor", "ifelse", "filter", "selectbins", "bincounts", "polynomial", "bernstein", "stepwise", "rngstate", "rnginit", "rand", "builtin_logdensityof", "builtin_sample", "builtin_touniform", "builtin_fromuniform", "builtin_tonormal", "builtin_fromnormal", "checked", "interp_pwlin", "interp_pwexp", "interp_poly2_lin", "interp_poly6_lin", "interp_poly6_exp", "resonance_breitwigner", "kallen", "breakup_momentum", "blatt_weisskopf", "wignerd", "wignerD", "wignerd_doublearg", "wignerD_doublearg"];
// GEN:builtins-end
// GEN:constants-start
const CONSTANTS = ["true", "false", "inf", "pi", "im"];
// GEN:constants-end
// GEN:predefsets-start
const PREDEFSETS = ["reals", "posreals", "nonnegreals", "unitinterval", "posintegers", "nonnegintegers", "integers", "booleans", "complexes", "rngstates", "anything"];
// GEN:predefsets-end
// GEN:selectors-start
const SELECTORS = ["all", "only"];
// GEN:selectors-end
// GEN:reserved-start
const RESERVED = ["self", "base", "flatppl_compat"];
// GEN:reserved-end
// GEN:operators-start
const OPERATORS = ["+", "-", "*", "/", "^", ".+", ".-", ".*", "./", ".^", "<", ">", "==", "!=", "<=", ">=", ".<", ".>", ".==", ".!=", ".<=", ".>=", "&&", "||", ".&&", ".||", ".!", "in"];
// GEN:operators-end

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** @see https://highlightjs.readthedocs.io/en/latest/language-guide.html */
export default function flatppl(hljs) {
  // Builtins highlight only in call position (`name(...)`), mirroring the
  // `(?=\s*\()` suffix the other grammars use: builtins are NOT reserved
  // (spec §05), so a bare `real`/`sum` used as an ordinary name stays plain.
  const BUILTIN_CALL = {
    scope: 'built_in',
    begin: new RegExp('\\b(?:' + BUILTINS.map(escapeRe).join('|') + ')\\b(?=\\s*\\()'),
  };

  // Symbolic operators (from JSON) plus the hand-maintained special operators.
  // `in` is alphabetic so it needs a word boundary; everything else is matched
  // longest-first so multi-char ops (.==, .<=, :=, ->) beat their prefixes.
  const SYM_OPS = OPERATORS.filter((op) => op !== 'in')
    .concat([':=', '->', '=', '~', ':', '!'])
    .sort((a, b) => b.length - a.length)
    .map(escapeRe);
  const OPERATOR = {
    scope: 'operator',
    begin: new RegExp('(?:' + SYM_OPS.join('|') + ')|\\bin\\b'),
  };

  // `.name` (axis or field) with an optional trailing variance marker `^`/`_`
  // (spec §05). The axis-id (`[A-Za-z][A-Za-z0-9_]*[A-Za-z0-9]|[A-Za-z]`) never
  // ends in `_`, so a trailing `_` is read as the sub-variance marker and the
  // optional `[\^_]` absorbs the super/sub marker into the property token —
  // `.i^`/`.i_` highlight wholly as property, not property+operator (matching
  // the tree-sitter/TextMate/Pygments grammars). Letter-led, so it never
  // collides with the dotted operators (`.+`, `.<=`) or a leading-dot float
  // (`.5`); the marker is gated behind a letter-led name so the power operator
  // `^` (e.g. `x^2`) is untouched.
  const MEMBER = { scope: 'property', begin: /\.(?:[A-Za-z][A-Za-z0-9_]*[A-Za-z0-9]|[A-Za-z])[\^_]?/ };

  const PLACEHOLDER = { scope: 'variable', begin: /\b_[A-Za-z][A-Za-z0-9_]*_\b/ };
  const HOLE = { scope: 'variable', begin: /(?<![\w])_(?![\w])/ };

  const STRING = {
    scope: 'string',
    begin: /"/,
    end: /"/,
    contains: [{ scope: 'char.escape', begin: /\\[\\"nrt0]/ }],
  };

  // The `(?<!\w)` guard on the digit-led variants stops a number from starting
  // in the middle of an identifier: without it the trailing digits of a keyword
  // (`Categorical0`, `log10`, `NegativeBinomial2`) match the NUMBER begin-mode
  // and chop the word before keyword-lookup sees it whole. The leading-dot
  // float variant is letter/dot-led and can't begin inside an identifier, so it
  // needs no guard.
  const NUMBER = {
    scope: 'number',
    variants: [
      { begin: /(?<!\w)0x[0-9a-fA-F]+(?:_[0-9a-fA-F]+)*/ },
      { begin: /(?<!\w)[0-9]+(?:_[0-9]+)*\.(?:[0-9]+(?:_[0-9]+)*)?(?:[eE][+-]?[0-9]+(?:_[0-9]+)*)?/ },
      { begin: /\.[0-9]+(?:_[0-9]+)*(?:[eE][+-]?[0-9]+(?:_[0-9]+)*)?/ },
      { begin: /(?<!\w)[0-9]+(?:_[0-9]+)*[eE][+-]?[0-9]+(?:_[0-9]+)*/ },
      { begin: /(?<!\w)[0-9]+(?:_[0-9]+)*/ },
    ],
    relevance: 0,
  };

  // Comments (spec §05): whole-line `###` block fence and `%%%[md|typ]` doc
  // block; line comment `#…` and doc line `%[md|typ]…`, both ending at newline
  // OR `;`. Fences must precede the single-char forms so `###`/`%%%` are not
  // swallowed by the `#`/`%` line rules (ties resolve to the first-listed mode).
  const BLOCK_COMMENT = { scope: 'comment', begin: /^[ \t]*###[ \t]*$/, end: /^[ \t]*###[ \t]*$/ };
  const DOC_BLOCK = { scope: 'comment', begin: /^[ \t]*%%%(?:md|typ)?[ \t]*$/, end: /^[ \t]*%%%[ \t]*$/ };
  const LINE_COMMENT = { scope: 'comment', begin: /#/, end: /(?=[\n;])/ };
  const DOC_LINE = { scope: 'comment', begin: /%(?:md|typ)?/, end: /(?=[\n;])/ };

  return {
    name: 'FlatPPL',
    aliases: ['flatppl'],
    case_insensitive: false,
    keywords: {
      $pattern: /[A-Za-z_]\w*/,
      keyword: SPECIALOPS.concat(SELECTORS),
      type: KERNELS,
      built_in: COMBINATORS.concat(ANALYSIS, HIGHERORDER, SETCTORS),
      literal: CONSTANTS,
      'variable.constant': PREDEFSETS,
      'variable.language': RESERVED,
    },
    contains: [
      BLOCK_COMMENT,
      DOC_BLOCK,
      LINE_COMMENT,
      DOC_LINE,
      STRING,
      PLACEHOLDER,
      HOLE,
      NUMBER,
      BUILTIN_CALL,
      MEMBER,
      OPERATOR,
    ],
  };
}
