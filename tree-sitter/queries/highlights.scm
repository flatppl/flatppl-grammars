; FlatPPL highlight queries.
;
; Capture names follow the standard Neovim/Helix/Zed convention.
;
; NOTE: `(` `)` `[` `]` are HIDDEN EXTERNAL tokens in the grammar; they do not
; exist as anonymous nodes and MUST NOT be referenced here. The grammar defines
; no `field(...)`s, so operators are matched as anonymous token lists rather than
; via `operator:` fields.

; Comments
(line_comment)  @comment
(doc_line)      @comment.documentation
(block_comment) @comment
(doc_block)     @comment.documentation

; Strings
(string)          @string
(escape_sequence) @string.escape
(invalid_escape)  @string.escape

; Numbers
(integer) @number
(float)   @number.float

; Booleans
(boolean) @boolean

; Operators (anonymous tokens — NO field syntax, NO brackets).
; SYNCED from keyword-lists.json "operators" via gen-grammars.py — do not hand-edit
; between the GEN markers. The special-scoped operators (= ~ := -> contextual !,
; : selector) are NOT here; they stay hand-maintained below.
; GEN:operators-start
[
  "+" "-" "*" "/" "^" ".+" ".-" ".*" "./" ".^" "<" ">" "==" "!=" "<=" ">=" ".<" ".>" ".==" ".!=" ".<=" ".>=" "&&" "||" ".&&" ".||" ".!" "in"
] @operator
; GEN:operators-end

; Unary logical-not `!` — captured contextually so it does NOT collide with the
; `only_selector` `!` inside `[...]` (that one is @punctuation.special). A bare
; anonymous `"!"` in the list above would also match the selector token and, being
; a leaf capture, would win over the (only_selector) node capture.
(unary_expression "!" @operator)

; Assignment / binding operators
"=" @operator
"~" @keyword.operator
":=" @keyword.operator

; Lambda arrow
"->" @keyword.operator

; Selectors (§05 IndexExpr: `:` = all-axis, `!` = only).
; Bare-word `all`/`only` are plain identifiers and fall through to (identifier) @variable.
(slice_selector) @punctuation.special
(only_selector)  @punctuation.special

; Punctuation (only the anonymous tokens that exist)
"," @punctuation.delimiter
";" @punctuation.delimiter
"." @punctuation.delimiter

; ── Capture ordering: tree-sitter uses LAST-match-wins, so more-specific
;    captures must appear AFTER less-specific ones.
;      1. @variable                    — most generic fallback
;      2. @function.call               — call-position identifier overrides plain variable
;      3. GEN keyword blocks           — known keyword names override @function.call
;      4. field_access member          — a member name is not a global name
;      5. axis_name / keyword_argument — position-specific labels override keyword scope
;      6. placeholder/_hole_ patterns  — always last (most specific)
; ──────────────────────────────────────────────────────────────────────────────

; Variables (generic fallback — must come BEFORE @function.call and the keyword blocks)
(identifier) @variable

; Function calls — generic callee (overrides @variable; overridden by GEN keyword blocks)
(call_expression (identifier) @function.call)

; ── Keyword categories — SYNCED from keyword-lists.json via gen-grammars.py ──
; GEN:specialops-start
((identifier) @keyword.other
 (#match? @keyword.other "^(draw|lawof|functionof|kernelof|fn|elementof|external|valueset|load_module|standard_module|load_data)$"))
; GEN:specialops-end

; GEN:kernels-start
((identifier) @type
 (#match? @type "^(Uniform|Normal|GeneralizedNormal|Cauchy|StudentT|Logistic|LogNormal|Exponential|Gamma|Weibull|Pareto|InverseGamma|Beta|ChiSquared|VonMises|Laplace|Bernoulli|Categorical|Categorical0|Binomial|Poisson|Geometric|NegativeBinomial|NegativeBinomial2|MvNormal|Wishart|InverseWishart|LKJ|LKJCholesky|Dirichlet|Multinomial|PoissonProcess|BinnedPoissonProcess|Dirac|Lebesgue|Counting)$"))
; GEN:kernels-end

; GEN:combinators-start
((identifier) @function
 (#match? @function "^(weighted|logweighted|normalize|totalmass|superpose|ksuperpose|joint|jointchain|kchain|markovchain|kscan|iid|truncate|pushfwd|locscale)$"))
; GEN:combinators-end

; GEN:analysis-start
((identifier) @function
 (#match? @function "^(likelihoodof|joint_likelihood|densityof|logdensityof|bayesupdate|disintegrate|restrict)$"))
; GEN:analysis-end

; GEN:higherorder-start
((identifier) @function
 (#match? @function "^(broadcast|broadcasted|reduce|scan|fchain|bijection|aggregate|metricsum)$"))
; GEN:higherorder-end

; GEN:setctors-start
((identifier) @function
 (#match? @function "^(interval|cartprod|cartpow|stdsimplex)$"))
; GEN:setctors-end

; GEN:builtins-start
((identifier) @function.builtin
 (#match? @function.builtin "^(identity|vector|array|fill|zeros|ones|eye|onehot|linspace|extlinspace|get|get0|cat|rowstack|colstack|record|table|tuple|partition|reverse|relabel|fixed|tile|splitblocks|joinblocks|addaxes|blockdiagmat|bandedmat|conv|crosscorr|boolean|integer|real|complex|string|imag|exp|expm1|log|log10|log1p|pow|sqrt|abs|abs2|sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|asinh|acosh|atanh|min|max|floor|ceil|round|div|mod|conj|cis|gamma|loggamma|logit|invlogit|probit|invprobit|add|sub|mul|divide|neg|equal|unequal|lt|le|gt|ge|isfinite|isinf|isnan|iszero|transpose|adjoint|det|logabsdet|inv|trace|linsolve|lower_cholesky|row_gram|col_gram|self_outer|cross|diagmat|qr|diag|quadform|sum|mean|var|std|prod|maximum|minimum|median|quantile|cumsum|cumprod|cummax|cummin|lengthof|sizeof|indicesof|indicesof0|l1norm|l2norm|linfnorm|l1unit|l2unit|logsumexp|softmax|logsoftmax|land|lor|lnot|lxor|lany|lall|ifelse|filter|selectbins|bincounts|polynomial|bernstein|stepwise|rngstate|rnginit|rand|builtin_logdensityof|builtin_sample|builtin_touniform|builtin_fromuniform|builtin_tonormal|builtin_fromnormal|checked)$"))
; GEN:builtins-end

; GEN:constants-start
((identifier) @constant.builtin
 (#match? @constant.builtin "^(true|false|inf|pi|im)$"))
; GEN:constants-end

; GEN:predefsets-start
((identifier) @constant
 (#match? @constant "^(reals|posreals|nonnegreals|unitinterval|posintegers|nonnegintegers|integers|booleans|complexes|rngstates|anything)$"))
; GEN:predefsets-end

; GEN:selectors-start
((identifier) @keyword
 (#match? @keyword "^(all|only)$"))
; GEN:selectors-end

; GEN:reserved-start
((identifier) @variable.builtin
 (#match? @variable.builtin "^(self|base|flatppl_compat)$"))
; GEN:reserved-end

; Field-access member name (`r.field`, `tbl.col`, `mod.member`). Placed AFTER the
; GEN keyword blocks so a member whose name collides with a builtin does not take
; the builtin scope: §04 "Objects, expressions, names and modules" — "Record field
; names and table column names are local to their object and not part of the
; global module namespace". Same last-match-wins ordering as (keyword_argument)
; below. Call position does NOT re-override: every other target scopes a member
; name as a member whether or not it is called (TextMate variable.other.member,
; Pygments Name.Attribute, Kate dsAttribute, highlight.js hljs-property).
(field_access (identifier) @variable.member .)

; Axis sigil `.` (distinct from list/field punctuation)
(axis_name "." @punctuation.special)

; Axis names (position-specific: a `.name` axis label, overrides keyword scope)
(axis_name (axis_id) @property)

; Axis variance markers (`^` upper / `_` lower). Coloured as @property to match
; the axis name (axis_id above) so `.sigma^` reads as one unit, NOT as an
; operator -- the marker is part of the axis label, not arithmetic `^`.
(variance_marker) @property

; Metric-sum binding metric-prefix colon (`metric: result[...] := expr`)
(metricsum_binding ":" @keyword.operator)

; Keyword-argument names (position-specific: a kwarg label, even if it matches a builtin name)
(keyword_argument . (identifier) @variable.parameter)

; Placeholder _name_
((identifier) @variable.parameter
 (#match? @variable.parameter "^_[a-zA-Z][a-zA-Z0-9_]*_$"))

; Hole _
((identifier) @variable.parameter
 (#eq? @variable.parameter "_"))
