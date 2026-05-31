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
    [$.lambda, $._expression],
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

    _statement: $ => $._expression,

    _expression: $ => choice(
      $.lambda,
      $.binary_expression,
      $.comparison_expression,
      $.unary_expression,
      $.exponential_expression,
      $.parenthesized_expression,
      $._literal,
      $.identifier,
      // Postfix forms (call/index/field/dot-call) added in Task 5
    ),

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

    // Precedence: OR=1, AND=2, comparison=3, additive=4, multiplicative=5, unary=6, exponential=7.
    binary_expression: $ => choice(
      prec.left(1, seq($._expression, choice('||', '.||'), $._expression)),
      prec.left(2, seq($._expression, choice('&&', '.&&'), $._expression)),
      prec.left(4, seq($._expression, choice('+', '-', '.+', '.-'), $._expression)),
      prec.left(5, seq($._expression, choice('*', '/', '.*', './'), $._expression)),
    ),

    // `in` is a CompOp per EBNF — included here, NOT in binary_expression.
    // NOTE: although the rule looks like a flat repeat1 chain, the parser produces
    // RIGHT-NESTED trees for `a < b <= c` (i.e. comparison_expression(a,
    // comparison_expression(b, c))) because the right operand is a full _expression;
    // downstream consumers must walk the nesting to recover chained-comparison
    // semantics (a<b ∧ b<=c).
    comparison_expression: $ => prec.left(3, seq(
      $._expression,
      repeat1(seq(
        choice('<', '>', '==', '!=', '<=', '>=', 'in',
               '.<', '.>', '.==', '.!=', '.<=', '.>='),
        $._expression,
      )),
    )),

    unary_expression: $ => prec.right(6, seq(
      choice('-', '!', '.-', '.!'),
      $._expression,
    )),

    // `^`/`.^` is ONLY here (not in binary_expression), right-assoc, prec 7.
    exponential_expression: $ => prec.right(7, seq(
      $._expression,
      choice('^', '.^'),
      $._expression,
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
      /0[xX][0-9a-fA-F]+(_[0-9a-fA-F]+)*/,
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
    invalid_escape: _ => /\\./,

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
