#include "tree_sitter/parser.h"

#if defined(__GNUC__) || defined(__clang__)
#pragma GCC diagnostic ignored "-Wmissing-field-initializers"
#endif

#define LANGUAGE_VERSION 14
#define STATE_COUNT 15
#define LARGE_STATE_COUNT 13
#define SYMBOL_COUNT 16
#define ALIAS_COUNT 0
#define TOKEN_COUNT 12
#define EXTERNAL_TOKEN_COUNT 7
#define FIELD_COUNT 0
#define MAX_ALIAS_SEQUENCE_LENGTH 4
#define PRODUCTION_ID_COUNT 1

enum ts_symbol_identifiers {
  sym_identifier = 1,
  anon_sym_SEMI = 2,
  sym_line_comment = 3,
  sym_doc_line = 4,
  sym__newline = 5,
  sym_block_comment = 6,
  sym_doc_block = 7,
  sym__lparen = 8,
  sym__rparen = 9,
  sym__lbracket = 10,
  sym__rbracket = 11,
  sym_module = 12,
  aux_sym__sep = 13,
  sym__statement = 14,
  aux_sym_module_repeat1 = 15,
};

static const char * const ts_symbol_names[] = {
  [ts_builtin_sym_end] = "end",
  [sym_identifier] = "identifier",
  [anon_sym_SEMI] = ";",
  [sym_line_comment] = "line_comment",
  [sym_doc_line] = "doc_line",
  [sym__newline] = "_newline",
  [sym_block_comment] = "block_comment",
  [sym_doc_block] = "doc_block",
  [sym__lparen] = "_lparen",
  [sym__rparen] = "_rparen",
  [sym__lbracket] = "_lbracket",
  [sym__rbracket] = "_rbracket",
  [sym_module] = "module",
  [aux_sym__sep] = "_sep",
  [sym__statement] = "_statement",
  [aux_sym_module_repeat1] = "module_repeat1",
};

static const TSSymbol ts_symbol_map[] = {
  [ts_builtin_sym_end] = ts_builtin_sym_end,
  [sym_identifier] = sym_identifier,
  [anon_sym_SEMI] = anon_sym_SEMI,
  [sym_line_comment] = sym_line_comment,
  [sym_doc_line] = sym_doc_line,
  [sym__newline] = sym__newline,
  [sym_block_comment] = sym_block_comment,
  [sym_doc_block] = sym_doc_block,
  [sym__lparen] = sym__lparen,
  [sym__rparen] = sym__rparen,
  [sym__lbracket] = sym__lbracket,
  [sym__rbracket] = sym__rbracket,
  [sym_module] = sym_module,
  [aux_sym__sep] = aux_sym__sep,
  [sym__statement] = sym__statement,
  [aux_sym_module_repeat1] = aux_sym_module_repeat1,
};

static const TSSymbolMetadata ts_symbol_metadata[] = {
  [ts_builtin_sym_end] = {
    .visible = false,
    .named = true,
  },
  [sym_identifier] = {
    .visible = true,
    .named = true,
  },
  [anon_sym_SEMI] = {
    .visible = true,
    .named = false,
  },
  [sym_line_comment] = {
    .visible = true,
    .named = true,
  },
  [sym_doc_line] = {
    .visible = true,
    .named = true,
  },
  [sym__newline] = {
    .visible = false,
    .named = true,
  },
  [sym_block_comment] = {
    .visible = true,
    .named = true,
  },
  [sym_doc_block] = {
    .visible = true,
    .named = true,
  },
  [sym__lparen] = {
    .visible = false,
    .named = true,
  },
  [sym__rparen] = {
    .visible = false,
    .named = true,
  },
  [sym__lbracket] = {
    .visible = false,
    .named = true,
  },
  [sym__rbracket] = {
    .visible = false,
    .named = true,
  },
  [sym_module] = {
    .visible = true,
    .named = true,
  },
  [aux_sym__sep] = {
    .visible = false,
    .named = false,
  },
  [sym__statement] = {
    .visible = false,
    .named = true,
  },
  [aux_sym_module_repeat1] = {
    .visible = false,
    .named = false,
  },
};

static const TSSymbol ts_alias_sequences[PRODUCTION_ID_COUNT][MAX_ALIAS_SEQUENCE_LENGTH] = {
  [0] = {0},
};

static const uint16_t ts_non_terminal_alias_map[] = {
  0,
};

static const TSStateId ts_primary_state_ids[STATE_COUNT] = {
  [0] = 0,
  [1] = 1,
  [2] = 2,
  [3] = 3,
  [4] = 4,
  [5] = 5,
  [6] = 6,
  [7] = 7,
  [8] = 8,
  [9] = 9,
  [10] = 10,
  [11] = 11,
  [12] = 12,
  [13] = 13,
  [14] = 14,
};

static bool ts_lex(TSLexer *lexer, TSStateId state) {
  START_LEXER();
  eof = lexer->eof(lexer);
  switch (state) {
    case 0:
      if (eof) ADVANCE(1);
      if (lookahead == '#') ADVANCE(4);
      if (lookahead == '%') ADVANCE(5);
      if (lookahead == ';') ADVANCE(2);
      if (lookahead == '\t' ||
          lookahead == '\n' ||
          lookahead == '\r' ||
          lookahead == ' ') SKIP(0);
      if (('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(3);
      END_STATE();
    case 1:
      ACCEPT_TOKEN(ts_builtin_sym_end);
      END_STATE();
    case 2:
      ACCEPT_TOKEN(anon_sym_SEMI);
      END_STATE();
    case 3:
      ACCEPT_TOKEN(sym_identifier);
      if (('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(3);
      END_STATE();
    case 4:
      ACCEPT_TOKEN(sym_line_comment);
      if (lookahead != 0 &&
          lookahead != '\n') ADVANCE(4);
      END_STATE();
    case 5:
      ACCEPT_TOKEN(sym_doc_line);
      if (lookahead != 0 &&
          lookahead != '\n') ADVANCE(5);
      END_STATE();
    default:
      return false;
  }
}

static bool ts_lex_keywords(TSLexer *lexer, TSStateId state) {
  START_LEXER();
  eof = lexer->eof(lexer);
  switch (state) {
    case 0:
      ACCEPT_TOKEN(ts_builtin_sym_end);
      END_STATE();
    default:
      return false;
  }
}

static const TSLexMode ts_lex_modes[STATE_COUNT] = {
  [0] = {.lex_state = 0, .external_lex_state = 1},
  [1] = {.lex_state = 0, .external_lex_state = 2},
  [2] = {.lex_state = 0, .external_lex_state = 2},
  [3] = {.lex_state = 0, .external_lex_state = 2},
  [4] = {.lex_state = 0, .external_lex_state = 2},
  [5] = {.lex_state = 0, .external_lex_state = 2},
  [6] = {.lex_state = 0, .external_lex_state = 2},
  [7] = {.lex_state = 0, .external_lex_state = 2},
  [8] = {.lex_state = 0, .external_lex_state = 2},
  [9] = {.lex_state = 0, .external_lex_state = 2},
  [10] = {.lex_state = 0, .external_lex_state = 2},
  [11] = {.lex_state = 0, .external_lex_state = 2},
  [12] = {.lex_state = 0, .external_lex_state = 2},
  [13] = {.lex_state = 0, .external_lex_state = 2},
  [14] = {.lex_state = 0, .external_lex_state = 3},
};

static const uint16_t ts_parse_table[LARGE_STATE_COUNT][SYMBOL_COUNT] = {
  [0] = {
    [ts_builtin_sym_end] = ACTIONS(1),
    [sym_identifier] = ACTIONS(1),
    [anon_sym_SEMI] = ACTIONS(1),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
    [sym__newline] = ACTIONS(1),
    [sym_block_comment] = ACTIONS(3),
    [sym_doc_block] = ACTIONS(3),
    [sym__lparen] = ACTIONS(1),
    [sym__rparen] = ACTIONS(1),
    [sym__lbracket] = ACTIONS(1),
    [sym__rbracket] = ACTIONS(1),
  },
  [1] = {
    [sym_module] = STATE(14),
    [aux_sym__sep] = STATE(2),
    [sym__statement] = STATE(6),
    [ts_builtin_sym_end] = ACTIONS(5),
    [sym_identifier] = ACTIONS(7),
    [anon_sym_SEMI] = ACTIONS(9),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
    [sym__newline] = ACTIONS(9),
    [sym_block_comment] = ACTIONS(3),
    [sym_doc_block] = ACTIONS(3),
  },
  [2] = {
    [aux_sym__sep] = STATE(7),
    [sym__statement] = STATE(8),
    [ts_builtin_sym_end] = ACTIONS(11),
    [sym_identifier] = ACTIONS(13),
    [anon_sym_SEMI] = ACTIONS(15),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
    [sym__newline] = ACTIONS(15),
    [sym_block_comment] = ACTIONS(3),
    [sym_doc_block] = ACTIONS(3),
  },
  [3] = {
    [aux_sym__sep] = STATE(7),
    [sym__statement] = STATE(13),
    [ts_builtin_sym_end] = ACTIONS(17),
    [sym_identifier] = ACTIONS(19),
    [anon_sym_SEMI] = ACTIONS(15),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
    [sym__newline] = ACTIONS(15),
    [sym_block_comment] = ACTIONS(3),
    [sym_doc_block] = ACTIONS(3),
  },
  [4] = {
    [aux_sym__sep] = STATE(7),
    [sym__statement] = STATE(13),
    [ts_builtin_sym_end] = ACTIONS(21),
    [sym_identifier] = ACTIONS(19),
    [anon_sym_SEMI] = ACTIONS(15),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
    [sym__newline] = ACTIONS(15),
    [sym_block_comment] = ACTIONS(3),
    [sym_doc_block] = ACTIONS(3),
  },
  [5] = {
    [aux_sym__sep] = STATE(7),
    [sym__statement] = STATE(13),
    [ts_builtin_sym_end] = ACTIONS(23),
    [sym_identifier] = ACTIONS(19),
    [anon_sym_SEMI] = ACTIONS(15),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
    [sym__newline] = ACTIONS(15),
    [sym_block_comment] = ACTIONS(3),
    [sym_doc_block] = ACTIONS(3),
  },
  [6] = {
    [aux_sym__sep] = STATE(3),
    [aux_sym_module_repeat1] = STATE(9),
    [ts_builtin_sym_end] = ACTIONS(11),
    [anon_sym_SEMI] = ACTIONS(25),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
    [sym__newline] = ACTIONS(25),
    [sym_block_comment] = ACTIONS(3),
    [sym_doc_block] = ACTIONS(3),
  },
  [7] = {
    [aux_sym__sep] = STATE(7),
    [ts_builtin_sym_end] = ACTIONS(27),
    [sym_identifier] = ACTIONS(27),
    [anon_sym_SEMI] = ACTIONS(29),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
    [sym__newline] = ACTIONS(29),
    [sym_block_comment] = ACTIONS(3),
    [sym_doc_block] = ACTIONS(3),
  },
  [8] = {
    [aux_sym__sep] = STATE(4),
    [aux_sym_module_repeat1] = STATE(10),
    [ts_builtin_sym_end] = ACTIONS(17),
    [anon_sym_SEMI] = ACTIONS(32),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
    [sym__newline] = ACTIONS(32),
    [sym_block_comment] = ACTIONS(3),
    [sym_doc_block] = ACTIONS(3),
  },
  [9] = {
    [aux_sym__sep] = STATE(4),
    [aux_sym_module_repeat1] = STATE(11),
    [ts_builtin_sym_end] = ACTIONS(17),
    [anon_sym_SEMI] = ACTIONS(32),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
    [sym__newline] = ACTIONS(32),
    [sym_block_comment] = ACTIONS(3),
    [sym_doc_block] = ACTIONS(3),
  },
  [10] = {
    [aux_sym__sep] = STATE(5),
    [aux_sym_module_repeat1] = STATE(11),
    [ts_builtin_sym_end] = ACTIONS(21),
    [anon_sym_SEMI] = ACTIONS(34),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
    [sym__newline] = ACTIONS(34),
    [sym_block_comment] = ACTIONS(3),
    [sym_doc_block] = ACTIONS(3),
  },
  [11] = {
    [aux_sym__sep] = STATE(12),
    [aux_sym_module_repeat1] = STATE(11),
    [ts_builtin_sym_end] = ACTIONS(36),
    [anon_sym_SEMI] = ACTIONS(38),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
    [sym__newline] = ACTIONS(38),
    [sym_block_comment] = ACTIONS(3),
    [sym_doc_block] = ACTIONS(3),
  },
  [12] = {
    [aux_sym__sep] = STATE(7),
    [sym__statement] = STATE(13),
    [sym_identifier] = ACTIONS(19),
    [anon_sym_SEMI] = ACTIONS(15),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
    [sym__newline] = ACTIONS(15),
    [sym_block_comment] = ACTIONS(3),
    [sym_doc_block] = ACTIONS(3),
  },
};

static const uint16_t ts_small_parse_table[] = {
  [0] = 2,
    ACTIONS(36), 3,
      sym__newline,
      ts_builtin_sym_end,
      anon_sym_SEMI,
    ACTIONS(3), 4,
      sym_block_comment,
      sym_doc_block,
      sym_line_comment,
      sym_doc_line,
  [12] = 2,
    ACTIONS(41), 1,
      ts_builtin_sym_end,
    ACTIONS(3), 4,
      sym_block_comment,
      sym_doc_block,
      sym_line_comment,
      sym_doc_line,
};

static const uint32_t ts_small_parse_table_map[] = {
  [SMALL_STATE(13)] = 0,
  [SMALL_STATE(14)] = 12,
};

static const TSParseActionEntry ts_parse_actions[] = {
  [0] = {.entry = {.count = 0, .reusable = false}},
  [1] = {.entry = {.count = 1, .reusable = false}}, RECOVER(),
  [3] = {.entry = {.count = 1, .reusable = true}}, SHIFT_EXTRA(),
  [5] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_module, 0, 0, 0),
  [7] = {.entry = {.count = 1, .reusable = true}}, SHIFT(6),
  [9] = {.entry = {.count = 1, .reusable = true}}, SHIFT(2),
  [11] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_module, 1, 0, 0),
  [13] = {.entry = {.count = 1, .reusable = true}}, SHIFT(8),
  [15] = {.entry = {.count = 1, .reusable = true}}, SHIFT(7),
  [17] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_module, 2, 0, 0),
  [19] = {.entry = {.count = 1, .reusable = true}}, SHIFT(13),
  [21] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_module, 3, 0, 0),
  [23] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_module, 4, 0, 0),
  [25] = {.entry = {.count = 1, .reusable = true}}, SHIFT(3),
  [27] = {.entry = {.count = 1, .reusable = true}}, REDUCE(aux_sym__sep, 2, 0, 0),
  [29] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym__sep, 2, 0, 0), SHIFT_REPEAT(7),
  [32] = {.entry = {.count = 1, .reusable = true}}, SHIFT(4),
  [34] = {.entry = {.count = 1, .reusable = true}}, SHIFT(5),
  [36] = {.entry = {.count = 1, .reusable = true}}, REDUCE(aux_sym_module_repeat1, 2, 0, 0),
  [38] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_module_repeat1, 2, 0, 0), SHIFT_REPEAT(12),
  [41] = {.entry = {.count = 1, .reusable = true}},  ACCEPT_INPUT(),
};

enum ts_external_scanner_symbol_identifiers {
  ts_external_token__newline = 0,
  ts_external_token_block_comment = 1,
  ts_external_token_doc_block = 2,
  ts_external_token__lparen = 3,
  ts_external_token__rparen = 4,
  ts_external_token__lbracket = 5,
  ts_external_token__rbracket = 6,
};

static const TSSymbol ts_external_scanner_symbol_map[EXTERNAL_TOKEN_COUNT] = {
  [ts_external_token__newline] = sym__newline,
  [ts_external_token_block_comment] = sym_block_comment,
  [ts_external_token_doc_block] = sym_doc_block,
  [ts_external_token__lparen] = sym__lparen,
  [ts_external_token__rparen] = sym__rparen,
  [ts_external_token__lbracket] = sym__lbracket,
  [ts_external_token__rbracket] = sym__rbracket,
};

static const bool ts_external_scanner_states[4][EXTERNAL_TOKEN_COUNT] = {
  [1] = {
    [ts_external_token__newline] = true,
    [ts_external_token_block_comment] = true,
    [ts_external_token_doc_block] = true,
    [ts_external_token__lparen] = true,
    [ts_external_token__rparen] = true,
    [ts_external_token__lbracket] = true,
    [ts_external_token__rbracket] = true,
  },
  [2] = {
    [ts_external_token__newline] = true,
    [ts_external_token_block_comment] = true,
    [ts_external_token_doc_block] = true,
  },
  [3] = {
    [ts_external_token_block_comment] = true,
    [ts_external_token_doc_block] = true,
  },
};

#ifdef __cplusplus
extern "C" {
#endif
void *tree_sitter_flatppl_external_scanner_create(void);
void tree_sitter_flatppl_external_scanner_destroy(void *);
bool tree_sitter_flatppl_external_scanner_scan(void *, TSLexer *, const bool *);
unsigned tree_sitter_flatppl_external_scanner_serialize(void *, char *);
void tree_sitter_flatppl_external_scanner_deserialize(void *, const char *, unsigned);

#ifdef TREE_SITTER_HIDE_SYMBOLS
#define TS_PUBLIC
#elif defined(_WIN32)
#define TS_PUBLIC __declspec(dllexport)
#else
#define TS_PUBLIC __attribute__((visibility("default")))
#endif

TS_PUBLIC const TSLanguage *tree_sitter_flatppl(void) {
  static const TSLanguage language = {
    .version = LANGUAGE_VERSION,
    .symbol_count = SYMBOL_COUNT,
    .alias_count = ALIAS_COUNT,
    .token_count = TOKEN_COUNT,
    .external_token_count = EXTERNAL_TOKEN_COUNT,
    .state_count = STATE_COUNT,
    .large_state_count = LARGE_STATE_COUNT,
    .production_id_count = PRODUCTION_ID_COUNT,
    .field_count = FIELD_COUNT,
    .max_alias_sequence_length = MAX_ALIAS_SEQUENCE_LENGTH,
    .parse_table = &ts_parse_table[0][0],
    .small_parse_table = ts_small_parse_table,
    .small_parse_table_map = ts_small_parse_table_map,
    .parse_actions = ts_parse_actions,
    .symbol_names = ts_symbol_names,
    .symbol_metadata = ts_symbol_metadata,
    .public_symbol_map = ts_symbol_map,
    .alias_map = ts_non_terminal_alias_map,
    .alias_sequences = &ts_alias_sequences[0][0],
    .lex_modes = ts_lex_modes,
    .lex_fn = ts_lex,
    .keyword_lex_fn = ts_lex_keywords,
    .keyword_capture_token = sym_identifier,
    .external_scanner = {
      &ts_external_scanner_states[0][0],
      ts_external_scanner_symbol_map,
      tree_sitter_flatppl_external_scanner_create,
      tree_sitter_flatppl_external_scanner_destroy,
      tree_sitter_flatppl_external_scanner_scan,
      tree_sitter_flatppl_external_scanner_serialize,
      tree_sitter_flatppl_external_scanner_deserialize,
    },
    .primary_state_ids = ts_primary_state_ids,
  };
  return &language;
}
#ifdef __cplusplus
}
#endif
