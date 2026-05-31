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

; Operators (anonymous tokens — NO field syntax, NO brackets)
[
  "+" "-" "*" "/" "^"
  ".+" ".-" ".*" "./" ".^"
  "<" ">" "==" "!=" "<=" ">="
  ".<" ".>" ".==" ".!=" ".<=" ".>="
  "&&" "||" ".&&" ".||"
  "!" ".!"
  "in"
] @operator

; Assignment / binding operators
"=" @operator
"~" @operator
":=" @operator

; Lambda arrow
"->" @keyword.operator

; Selectors
(slice_selector)     @operator
(singleton_selector) @operator
(all_selector)       @keyword
(only_selector)      @keyword

; Punctuation (only the anonymous tokens that exist)
"," @punctuation.delimiter
";" @punctuation.delimiter
"." @punctuation.delimiter

; ── Capture ordering: tree-sitter uses LAST-match-wins, so more-specific
;    captures must appear AFTER less-specific ones.
;      1. @variable                    — most generic fallback
;      2. @variable.member             — field access overrides plain variable
;      3. @function.call               — call-position identifier overrides plain variable
;      4. GEN keyword blocks           — known keyword names override @function.call
;      5. axis_name / keyword_argument — position-specific labels override keyword scope
;      6. placeholder/_hole_ patterns  — always last (most specific)
; ──────────────────────────────────────────────────────────────────────────────

; Variables (generic fallback — must come BEFORE @variable.member, @function.call, and keyword blocks)
(identifier) @variable

; Field access member (overrides @variable for `r.field`'s field component)
(field_access (identifier) @variable.member .)

; Function calls — generic callee (overrides @variable; overridden by GEN keyword blocks)
(call_expression (identifier) @function.call)

; ── Keyword categories — SYNCED from keyword-lists.json via gen-grammars.py ──
; GEN:specialops-start
((identifier) @keyword.other
 (#match? @keyword.other "^(draw|lawof|functionof|kernelof|fn|elementof|external|valueset|load_module|standard_module|load_data)$"))
; GEN:specialops-end

; GEN:kernels-start
((identifier) @type
 (#match? @type "^(Uniform|Normal|GeneralizedNormal|Cauchy|StudentT|Logistic|LogNormal|Exponential|Gamma|Weibull|InverseGamma|Beta|ChiSquared|VonMises|Laplace|Bernoulli|Categorical|Categorical0|Binomial|Poisson|Geometric|NegativeBinomial|NegativeBinomial2|MvNormal|Wishart|InverseWishart|LKJ|LKJCholesky|Dirichlet|Multinomial|PoissonProcess|BinnedPoissonProcess|Dirac|Lebesgue|Counting)$"))
; GEN:kernels-end

; GEN:combinators-start
((identifier) @function
 (#match? @function "^(weighted|logweighted|normalize|totalmass|superpose|joint|jointchain|kchain|iid|truncate|pushfwd)$"))
; GEN:combinators-end

; GEN:analysis-start
((identifier) @function
 (#match? @function "^(likelihoodof|joint_likelihood|densityof|logdensityof|bayesupdate|disintegrate|restrict)$"))
; GEN:analysis-end

; GEN:higherorder-start
((identifier) @function
 (#match? @function "^(broadcast|broadcasted|reduce|scan|fchain|bijection|aggregate)$"))
; GEN:higherorder-end

; GEN:setctors-start
((identifier) @function
 (#match? @function "^(interval|cartprod|cartpow|stdsimplex)$"))
; GEN:setctors-end

; GEN:builtins-start
((identifier) @function.builtin
 (#match? @function.builtin "^(identity|vector|array|fill|zeros|ones|eye|onehot|linspace|extlinspace|get|get0|cat|rowstack|colstack|record|table|tuple|partition|reverse|relabel|fixed|boolean|integer|real|complex|string|imag|exp|expm1|log|log10|log1p|pow|sqrt|abs|abs2|sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|asinh|acosh|atanh|min|max|floor|ceil|round|div|mod|conj|cis|gamma|loggamma|logit|invlogit|probit|invprobit|add|sub|mul|divide|neg|equal|unequal|lt|le|gt|ge|isfinite|isinf|isnan|iszero|transpose|adjoint|det|logabsdet|inv|trace|linsolve|lower_cholesky|row_gram|col_gram|self_outer|cross|diagmat|sum|mean|var|std|prod|maximum|minimum|cumsum|cumprod|lengthof|sizeof|indicesof|indicesof0|l1norm|l2norm|l1unit|l2unit|logsumexp|softmax|logsoftmax|land|lor|lnot|lxor|ifelse|filter|selectbins|bincounts|polynomial|bernstein|stepwise|rngstate|rnginit|rand|builtin_logdensityof|builtin_sample|builtin_touniform|builtin_fromuniform|builtin_tonormal|builtin_fromnormal|checked)$"))
; GEN:builtins-end

; GEN:constants-start
((identifier) @constant.builtin
 (#match? @constant.builtin "^(true|false|inf|pi|im)$"))
; GEN:constants-end

; GEN:predefsets-start
((identifier) @constant
 (#match? @constant "^(reals|posreals|nonnegreals|unitinterval|posintegers|nonnegintegers|integers|booleans|complexes|rngstates|anything)$"))
; GEN:predefsets-end

; GEN:reserved-start
((identifier) @variable.builtin
 (#match? @variable.builtin "^(self|base|flatppl_compat)$"))
; GEN:reserved-end

; Axis names (position-specific: a `.name` axis label, overrides keyword scope)
(axis_name (identifier) @property)

; Keyword-argument names (position-specific: a kwarg label, even if it matches a builtin name)
(keyword_argument . (identifier) @variable.parameter)

; Placeholder _name_
((identifier) @variable.parameter
 (#match? @variable.parameter "^_[a-zA-Z][a-zA-Z0-9_]*_$"))

; Hole _
((identifier) @variable.parameter
 (#eq? @variable.parameter "_"))
