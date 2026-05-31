module.exports = grammar({
  name: 'flatppl',

  word: $ => $.identifier,

  extras: $ => [
    /[ \t\r]/,
    $.line_comment,
    $.doc_line,
  ],

  rules: {
    module: $ => seq(
      optional($._sep),
      optional(seq(
        $._statement,
        repeat(seq($._sep, $._statement)),
      )),
      optional($._sep),
    ),

    _sep: _ => /[\n;]+/,
    _nl: _ => /[\n;]*/,

    _statement: $ => $.identifier,   // stub — replaced in later task

    identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    line_comment: _ => token(seq('#', /.*/)),
    doc_line: _ => token(seq('%', /.*/)),
  },
});
