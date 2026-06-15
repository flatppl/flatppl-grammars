module.exports = grammar({
  name: 'flatppl',

  word: $ => $.identifier,

  // External scanner tokens (src/scanner.c). Order MUST match the TokenType
  // enum in the scanner.
  //
  // The bracket tokens are external because the scanner needs to *consume* each
  // bracket exactly once to maintain its `bracket_depth` counter (tree-sitter
  // gives a character to either the external scanner or the internal lexer, not
  // both). That depth is what lets the scanner suppress `_newline` inside an
  // unclosed `(`/`[` (implicit line continuation, spec §05). Later tasks that
  // need parentheses/brackets must reference $._lparen/$._rparen/$._lbracket/
  // $._rbracket instead of the literal "(" "[" ")" "]".
  externals: $ => [
    $._newline,
    $.block_comment,
    $.doc_block,
    $._lparen,
    $._rparen,
    $._lbracket,
    $._rbracket,
  ],

  // NOTE: `block_comment` and `doc_block` appear in both `externals` and
  // `extras`. Listing them in `extras` makes doc-comments float as whitespace
  // anywhere in the token stream. The §04/§05 binding-ATTACHMENT semantics
  // (i.e. which binding a doc-comment belongs to) are intentionally NOT
  // represented in this tree — this grammar targets syntax highlighting and
  // structural AST only, not semantic doc-comment association.
  extras: $ => [
    /[ \t\r\n]/,
    $.line_comment,
    $.doc_line,
    $.block_comment,
    $.doc_block,
  ],

  conflicts: $ => [
    // After `( identifier`, the parser cannot yet decide whether the `(` opens a
    // lambda parameter list, a tuple_literal, or a parenthesized_expression — all
    // three begin `_lparen identifier`. tuple_literal and parenthesized_expression
    // are both reachable via `_expression`, so a single conflict between `lambda`
    // and `_expression` covers all of them (the narrower lambda/tuple_literal and
    // lambda/parenthesized_expression conflicts are subsumed and reported as
    // unnecessary by tree-sitter). GLR + the operator precedences resolve it.
    [$.lambda, $._comp_operand],

    // `identifier _lbracket` begins both an index_expression (`A[i]`, where the
    // identifier reduces to _expression first) and the LHS of an
    // aggregate_binding (`C[.i] := e`, where the identifier is kept bare). The
    // parser cannot decide whether to reduce `identifier` to `_expression`
    // until it sees whether the first bracket arg is an axis_name (`.i`, only
    // legal in aggregate_binding) or an index arg. GLR explores both; the
    // leading `.` of axis_name disambiguates, so they never collide on real
    // input.
    [$._comp_operand, $.aggregate_binding],

    // `identifier _lparen` begins both a call_expression (`f(x, y)`, where the
    // identifier reduces to _comp_operand first) and the LHS of a
    // function_definition (`f(x, y) = e`, identifier kept bare). The parser
    // cannot decide until it sees whether the closing `)` is followed by `=`.
    // GLR explores both; the trailing `=` (or its absence) disambiguates.
    [$._comp_operand, $.function_definition],
  ],

  rules: {
    module: $ => seq(
      optional($._sep),
      optional(seq(
        $._statement,
        repeat(seq($._sep, $._statement)),
        optional($._sep),
      )),
    ),

    // statement separator: one or more newlines/semicolons
    _sep: $ => repeat1(choice($._newline, ';')),

    // Spec §05 says statements are binding-only, but the existing corpus (and
    // real-world highlighting of code fragments) treats bare expressions as
    // module statements. Keep the expression alternative so fragments still
    // parse and prior tests stay green.
    _statement: $ => choice(
      $.binding,
      $.tilde_binding,
      $.decomposition,
      $.tilde_decomposition,
      $.function_definition,
      $.aggregate_binding,
      $.metricsum_binding,
      $._expression,
    ),

    binding: $ => seq($.identifier, '=', $._expression),

    // §05 "Function definition syntax": FunctionDefinition ::= Name "(" Name
    // ("," Name)* ")" "=" Expression. Sugar for `f = (args) -> expr`; the
    // parameter list is bare Names (≥1, no nullary) and must be followed by
    // `=` — a `=` inside the parens (`f(x = a)`) is a keyword_argument, i.e. a
    // call_expression, not a definition.
    function_definition: $ => seq(
      $.identifier,
      $._lparen,
      $.identifier,
      repeat(seq(',', $.identifier)),
      $._rparen,
      '=',
      $._expression,
    ),
    tilde_binding: $ => seq($.identifier, '~', $._expression),

    decomposition: $ => seq(
      $.identifier,
      repeat1(seq(',', $.identifier)),
      '=',
      $._expression,
    ),
    tilde_decomposition: $ => seq(
      $.identifier,
      repeat1(seq(',', $.identifier)),
      '~',
      $._expression,
    ),

    aggregate_binding: $ => seq(
      $.identifier,
      $._lbracket,
      // §05: the axis list may be empty (`x[] := expr`) for full reduction to a scalar.
      optional(seq(
        $.axis_name,
        repeat(seq(',', $.axis_name)),
      )),
      $._rbracket,
      ':=',
      $._expression,
    ),

    // §05 L275: MetricsumBinding ::= Name ":" Name "[" (Axis ("," Axis)*)? "]" ":=" Expression
    metricsum_binding: $ => seq(
      field('metric', $.identifier),
      ':',
      field('result', $.identifier),
      $._lbracket,
      optional(seq($.axis_name, repeat(seq(',', $.axis_name)))),
      $._rbracket,
      ':=',
      $._expression,
    ),

    // §05: Axis ::= "." AxisName VarianceMarker?  (VarianceMarker = "^" | "_").
    // AxisName must not start or end with "_" — a trailing "_" is the lower-variance
    // marker, so the name token deliberately stops before it (and "^" is the upper).
    axis_name: $ => seq(
      '.',
      field('name', $.axis_id),
      optional(field('variance', $.variance_marker)),
    ),

    axis_id: $ => token.immediate(/[a-zA-Z][a-zA-Z0-9_]*[a-zA-Z0-9]|[a-zA-Z]/),

    variance_marker: $ => token.immediate(choice('^', '_')),

    // Precedence hierarchy (mirrors §05 EBNF layering). An expression is a lambda,
    // a logical-or/and chain, a comparison chain, or anything binding tighter than
    // comparison (`_comp_operand`). `_expression` DELEGATES to `_comp_operand`
    // rather than re-listing its leaves — a leaf reduces to exactly one
    // non-terminal, so no operand ambiguity and the comparison repeat1 chains flat.
    _expression: $ => choice(
      $.lambda,
      $.logical_expression,
      $.comparison_expression,
      $._comp_operand,
    ),

    // Everything binding TIGHTER than comparison (its operands per the EBNF). Logical
    // ||/&& and lambda are looser (in `_expression`); comparison itself is excluded
    // so the chain stays flat.
    _comp_operand: $ => choice(
      $.binary_expression,
      $.unary_expression,
      $.exponential_expression,
      $.parenthesized_expression,
      $._literal,
      $.identifier,
      $.call_expression,
      $.index_expression,
      $.field_access,
      $.dot_call,
    ),

    // Postfix: left-recursive, highest binding (prec 8).
    call_expression: $ => prec.left(8, seq(
      $._comp_operand,
      $._lparen,
      optional($.argument_list),
      $._rparen,
    )),

    // §05 CallArgs: PositionalArgs | KeywordArgs | MixedArgs. A keyword arg may
    // only FOLLOW positionals — `f(a = 1, x)` (keyword before positional) is
    // rejected. Two branches: all-keyword, or positionals-then-(optional)-keywords.
    argument_list: $ => seq(
      choice(
        seq(
          $.keyword_argument,
          repeat(seq(',', $.keyword_argument)),
        ),
        seq(
          $._expression,
          repeat(seq(',', $._expression)),
          repeat(seq(',', $.keyword_argument)),
        ),
      ),
      optional(','),
    ),

    keyword_argument: $ => seq($.identifier, '=', $._expression),

    field_access: $ => prec.left(8, seq(
      $._comp_operand,
      '.',
      $.identifier,
    )),

    dot_call: $ => prec.left(8, seq(
      $._comp_operand,
      '.',
      $._lparen,
      optional($.argument_list),
      $._rparen,
    )),

    index_expression: $ => prec.left(8, seq(
      $._comp_operand,
      $._lbracket,
      $._index_arg,
      repeat(seq(',', $._index_arg)),
      $._rbracket,
    )),

    // §05 IndexExpr: `:` is the all-axis selector, `!` is the "only" selector.
    // Bare words `all`/`only` are NOT surface tokens — they parse as ordinary
    // identifiers via $._expression. Dedicated `all_selector`/`only_selector`
    // keyword rules have been removed to match the spec.
    _index_arg: $ => choice(
      $.slice_selector,
      $.only_selector,
      $.axis_name,
      $._expression,
    ),

    // `:` — all-axis selector (§05 IndexExpr).
    slice_selector: _ => ':',

    // `!` — "only" selector (§05 IndexExpr). Disambiguated from unary-not
    // (!expr) by GLR: when '!' is followed by ',' or ']' there is no operand,
    // so only only_selector parses; when followed by an expression,
    // unary_expression wins.
    only_selector: _ => '!',

    // Lambda: lowest precedence, body extends right.
    lambda: $ => prec.right(0, seq(
      choice(
        $.identifier,
        seq(
          $._lparen,
          $.identifier,
          repeat1(seq(',', $.identifier)),
          optional(','),
          $._rparen,
        ),
      ),
      '->',
      $._expression,
    )),

    // Logical OR/AND — LOOSER than comparison, so operands are full `_expression`
    // (they may contain comparisons, e.g. `a < b && c < d`).
    logical_expression: $ => choice(
      prec.left(1, seq($._expression, choice('||', '.||'), $._expression)),
      prec.left(2, seq($._expression, choice('&&', '.&&'), $._expression)),
    ),

    // Arithmetic — TIGHTER than comparison, so operands are `_comp_operand`.
    binary_expression: $ => choice(
      prec.left(4, seq($._comp_operand, choice('+', '-', '.+', '.-'), $._comp_operand)),
      prec.left(5, seq($._comp_operand, choice('*', '/', '.*', './'), $._comp_operand)),
    ),

    // §05: `Comparison ::= Additive (CompOp Additive)*` — a FLAT chain.
    // `a < b <= c` lowers to `land(a < b, b <= c)`: ONE flat node with every
    // operand and every operator (named `comparison_operator` children, so a
    // consumer pairs each operator with its operands by position). `in` is a CompOp.
    comparison_expression: $ => prec.left(3, seq(
      $._comp_operand,
      repeat1(seq(
        $.comparison_operator,
        $._comp_operand,
      )),
    )),

    comparison_operator: _ => choice(
      '<', '>', '==', '!=', '<=', '>=', 'in',
      '.<', '.>', '.==', '.!=', '.<=', '.>=',
    ),

    unary_expression: $ => prec.right(6, seq(
      choice('-', '!', '.-', '.!'),
      $._comp_operand,
    )),

    // `^`/`.^` is ONLY here (not in binary_expression), right-assoc, prec 7.
    exponential_expression: $ => prec.right(7, seq(
      $._comp_operand,
      choice('^', '.^'),
      $._comp_operand,
    )),

    parenthesized_expression: $ => seq($._lparen, $._expression, $._rparen),

    _literal: $ => choice(
      $.integer,
      $.float,
      $.string,
      $.boolean,
      $.array_literal,
      $.tuple_literal,
    ),

    integer: _ => token(choice(
      /0x[0-9a-fA-F]+(_[0-9a-fA-F]+)*/,
      /[0-9]+(_[0-9]+)*/,
    )),

    // Float: NO trailing \b on the dotted form (spec §05: `1./x` must munch `1.` as float).
    // tree-sitter's regex engine has no look-ahead; greedy longest-match already
    // ensures `1.5` munches its fraction rather than stopping at `1.`.
    float: _ => token(choice(
      /[0-9]+(_[0-9]+)*\.([0-9]+(_[0-9]+)*)?([eE][+-]?[0-9]+(_[0-9]+)*)?/,
      /\.[0-9]+(_[0-9]+)*([eE][+-]?[0-9]+(_[0-9]+)*)?/,
      /[0-9]+(_[0-9]+)*[eE][+-]?[0-9]+(_[0-9]+)*/,
    )),

    string: $ => seq(
      '"',
      repeat(choice(
        $.escape_sequence,
        $.invalid_escape,
        /[^"\\]+/,
      )),
      '"',
    ),
    escape_sequence: _ => /\\[\\"nrt0]/,
    invalid_escape: _ => /\\[\s\S]/,

    boolean: _ => token(choice('true', 'false')),

    array_literal: $ => seq(
      $._lbracket,
      optional(seq(
        $._expression,
        repeat(seq(',', $._expression)),
        optional(','),
      )),
      $._rbracket,
    ),

    tuple_literal: $ => seq(
      $._lparen,
      $._expression, ',', $._expression,
      repeat(seq(',', $._expression)),
      optional(','),
      $._rparen,
    ),

    identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    line_comment: _ => token(seq('#', /[^\n;]*/)),
    doc_line: _ => token(seq('%', /[^\n;]*/)),
  },
});
