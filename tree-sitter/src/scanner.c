#include "tree_sitter/parser.h"

#include <string.h>
#include <stdbool.h>
#include <stdint.h>

// External tokens. Order MUST match the `externals` array in grammar.js.
enum TokenType {
  NEWLINE,
  BLOCK_COMMENT,
  DOC_BLOCK,
  LPAREN,
  RPAREN,
  LBRACKET,
  RBRACKET,
};

// Scanner state: bracket nesting depth for ( and [ line-continuation.
typedef struct {
  uint32_t bracket_depth;
} Scanner;

void *tree_sitter_flatppl_external_scanner_create(void) {
  Scanner *s = (Scanner *)malloc(sizeof(Scanner));
  s->bracket_depth = 0;
  return s;
}

void tree_sitter_flatppl_external_scanner_destroy(void *payload) {
  free(payload);
}

unsigned tree_sitter_flatppl_external_scanner_serialize(void *payload, char *buffer) {
  Scanner *s = (Scanner *)payload;
  // Store the depth as 4 bytes (little endian).
  uint32_t d = s->bracket_depth;
  buffer[0] = (char)(d & 0xff);
  buffer[1] = (char)((d >> 8) & 0xff);
  buffer[2] = (char)((d >> 16) & 0xff);
  buffer[3] = (char)((d >> 24) & 0xff);
  return 4;
}

void tree_sitter_flatppl_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  Scanner *s = (Scanner *)payload;
  s->bracket_depth = 0;
  if (length >= 4) {
    s->bracket_depth =
        ((uint32_t)(unsigned char)buffer[0]) |
        ((uint32_t)(unsigned char)buffer[1] << 8) |
        ((uint32_t)(unsigned char)buffer[2] << 16) |
        ((uint32_t)(unsigned char)buffer[3] << 24);
  }
}

static inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }
static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

static inline bool is_hws(int32_t c) { return c == ' ' || c == '\t'; }
static inline bool is_newline(int32_t c) { return c == '\n' || c == '\r'; }

// Scan a fenced block: the opening fence line has already been recognized up to
// (but not including) its terminating newline. We must consume through the
// closing fence line's terminating newline.
//
// `fence` is the 3-char fence string ("###" or "%%%").
// On entry the lexer is positioned just after the opener's fence characters
// (and optional tag); we consume the rest of the opener line then look for a
// closer line whose trimmed content is exactly the fence.
static bool scan_fenced(TSLexer *lexer, const char *fence) {
  // Consume the remainder of the opener line (HWS only is allowed by spec, but
  // be lenient and consume to end-of-line) up to and including the newline.
  while (!lexer->eof(lexer) && !is_newline(lexer->lookahead)) {
    advance(lexer);
  }
  if (lexer->eof(lexer)) {
    return false; // opener never terminated by a newline; not a fenced block
  }
  // consume newline (handle CRLF)
  if (lexer->lookahead == '\r') {
    advance(lexer);
    if (lexer->lookahead == '\n') advance(lexer);
  } else {
    advance(lexer);
  }

  // Now scan lines until we find a closer line: HWS* fence HWS* Newline (or EOF).
  for (;;) {
    if (lexer->eof(lexer)) {
      // Unterminated fence: treat as not a valid fenced token.
      return false;
    }
    // skip leading HWS
    while (is_hws(lexer->lookahead)) {
      advance(lexer);
    }
    // try to match the fence chars
    bool matched = true;
    for (int i = 0; i < 3; i++) {
      if (lexer->lookahead == fence[i]) {
        advance(lexer);
      } else {
        matched = false;
        break;
      }
    }
    if (matched) {
      // After the fence, only HWS then newline/EOF makes it a closer.
      while (is_hws(lexer->lookahead)) advance(lexer);
      if (lexer->eof(lexer)) {
        lexer->mark_end(lexer);
        return true;
      }
      if (is_newline(lexer->lookahead)) {
        if (lexer->lookahead == '\r') {
          advance(lexer);
          if (lexer->lookahead == '\n') advance(lexer);
        } else {
          advance(lexer);
        }
        lexer->mark_end(lexer);
        return true;
      }
      // Not a pure fence line (extra chars after fence); fall through to consume
      // the rest of this line as inner content.
    }
    // Not a closer line: consume to end of line (including newline).
    while (!lexer->eof(lexer) && !is_newline(lexer->lookahead)) {
      advance(lexer);
    }
    if (lexer->eof(lexer)) {
      return false;
    }
    if (lexer->lookahead == '\r') {
      advance(lexer);
      if (lexer->lookahead == '\n') advance(lexer);
    } else {
      advance(lexer);
    }
  }
}

bool tree_sitter_flatppl_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  Scanner *s = (Scanner *)payload;

  // Strategy: the external scanner is invoked before each token whenever any of
  // its tokens is in `valid_symbols`. We skip leading horizontal whitespace,
  // then:
  //
  //  - On `(` `[` `)` `]`: consume the bracket and emit it as an external
  //    token, updating `bracket_depth`. Emitting the bracket here (rather than
  //    leaving it to a grammar literal) guarantees the scanner observes each
  //    bracket exactly once, so the depth counter is reliable.
  //
  //  - On a NEWLINE: if `bracket_depth > 0` we are inside an unclosed `(`/`[`,
  //    so the newline is implicit line continuation: decline (return false)
  //    WITHOUT consuming, letting tree-sitter's own extras lexer absorb the
  //    `\n` as ordinary whitespace (`\n` is in the grammar's `extras` regex).
  //    Declining instead of skipping keeps every GLR parse stack consistent --
  //    no stack ever sees a NEWLINE token inside brackets. Otherwise (depth ==
  //    0) emit NEWLINE when it is in `valid_symbols`; if not valid, skip it.
  //
  //  - On `###` / `%%%` fence openers: emit the fenced comment token.

  for (;;) {
    // Skip horizontal whitespace.
    while (is_hws(lexer->lookahead)) {
      skip(lexer);
    }

    if (lexer->eof(lexer)) {
      return false;
    }

    int32_t c = lexer->lookahead;

    // Bracket tokens: consumed and emitted as external tokens so the scanner
    // observes each exactly once (no double-counting from GLR re-scans) and can
    // maintain `bracket_depth`. Inside an unclosed ( or [, NEWLINE is consumed
    // as whitespace (line continuation); see the newline branch below.
    if (c == '(' && valid_symbols[LPAREN]) {
      advance(lexer);
      lexer->mark_end(lexer);
      s->bracket_depth++;
      lexer->result_symbol = LPAREN;
      return true;
    }
    if (c == '[' && valid_symbols[LBRACKET]) {
      advance(lexer);
      lexer->mark_end(lexer);
      s->bracket_depth++;
      lexer->result_symbol = LBRACKET;
      return true;
    }
    if (c == ')' && valid_symbols[RPAREN]) {
      advance(lexer);
      lexer->mark_end(lexer);
      if (s->bracket_depth > 0) s->bracket_depth--;
      lexer->result_symbol = RPAREN;
      return true;
    }
    if (c == ']' && valid_symbols[RBRACKET]) {
      advance(lexer);
      lexer->mark_end(lexer);
      if (s->bracket_depth > 0) s->bracket_depth--;
      lexer->result_symbol = RBRACKET;
      return true;
    }

    if (is_newline(c)) {
      if (s->bracket_depth > 0) {
        // Inside unclosed ( or [ : implicit line continuation. The scanner
        // itself skips the newline as ordinary whitespace and keeps scanning,
        // rather than declining and leaving the `\n` for tree-sitter's extras
        // lexer. Deferring to extras breaks when a newline sits immediately
        // before a closing bracket (e.g. `(x\n)` / `[x\n]`): the external-only
        // closing-bracket token is not valid in the state the parser resyncs
        // to, producing an ERROR node. Skipping here keeps every parse stack
        // consistent: no stack ever sees a NEWLINE token inside brackets.
        skip(lexer);
        continue;
      }
      if (valid_symbols[NEWLINE]) {
        // Consume this newline (and collapse trailing CR of CRLF) as the token.
        if (c == '\r') {
          advance(lexer);
          if (lexer->lookahead == '\n') advance(lexer);
        } else {
          advance(lexer);
        }
        lexer->result_symbol = NEWLINE;
        lexer->mark_end(lexer);
        return true;
      }
      // NEWLINE not valid in this state: skip it so we don't block the parse.
      skip(lexer);
      continue;
    }

    // Fenced comments. They only open at a line position (we've skipped HWS).
    if (c == '#' && valid_symbols[BLOCK_COMMENT]) {
      // Need exactly "###" then HWS* then newline/EOF to be a fence opener.
      // Peek by advancing; if it's not a fence, we still must let the line
      // comment regex handle a single '#'. So only commit if "###" + EOL.
      advance(lexer);
      if (lexer->lookahead == '#') {
        advance(lexer);
        if (lexer->lookahead == '#') {
          advance(lexer);
          // after ### : require HWS* then newline/EOF for opener line
          while (is_hws(lexer->lookahead)) advance(lexer);
          if (is_newline(lexer->lookahead) || lexer->eof(lexer)) {
            if (scan_fenced(lexer, "###")) {
              lexer->result_symbol = BLOCK_COMMENT;
              return true;
            }
            return false;
          }
        }
      }
      // Not a fence opener -> let the line_comment regex handle it.
      return false;
    }

    if (c == '%' && valid_symbols[DOC_BLOCK]) {
      advance(lexer);
      if (lexer->lookahead == '%') {
        advance(lexer);
        if (lexer->lookahead == '%') {
          advance(lexer);
          // optional markup tag: md | typ (immediately, no space)
          if (lexer->lookahead == 'm') {
            advance(lexer);
            if (lexer->lookahead == 'd') advance(lexer);
          } else if (lexer->lookahead == 't') {
            advance(lexer);
            if (lexer->lookahead == 'y') {
              advance(lexer);
              if (lexer->lookahead == 'p') advance(lexer);
            }
          }
          while (is_hws(lexer->lookahead)) advance(lexer);
          if (is_newline(lexer->lookahead) || lexer->eof(lexer)) {
            if (scan_fenced(lexer, "%%%")) {
              lexer->result_symbol = DOC_BLOCK;
              return true;
            }
            return false;
          }
        }
      }
      // Not a doc fence -> let doc_line regex handle it.
      return false;
    }

    // Any other character: nothing for the external scanner to produce here.
    return false;
  }
}
