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

    _statement: $ => $.identifier,   // stub — replaced in later task

    identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    line_comment: _ => token(seq('#', /.*/)),
    doc_line: _ => token(seq('%', /.*/)),
  },
});
