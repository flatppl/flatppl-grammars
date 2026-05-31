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
      $._literal,
      $.identifier,
      // expanded in later tasks (operators, calls, lambda, etc.)
    ),

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
