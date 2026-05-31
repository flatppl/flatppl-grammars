#include "tree_sitter/parser.h"

#if defined(__GNUC__) || defined(__clang__)
#pragma GCC diagnostic ignored "-Wmissing-field-initializers"
#endif

#define LANGUAGE_VERSION 14
#define STATE_COUNT 15
#define LARGE_STATE_COUNT 11
#define SYMBOL_COUNT 8
#define ALIAS_COUNT 0
#define TOKEN_COUNT 5
#define EXTERNAL_TOKEN_COUNT 0
#define FIELD_COUNT 0
#define MAX_ALIAS_SEQUENCE_LENGTH 4
#define PRODUCTION_ID_COUNT 1

enum ts_symbol_identifiers {
  sym_identifier = 1,
  sym__sep = 2,
  sym_line_comment = 3,
  sym_doc_line = 4,
  sym_module = 5,
  sym__statement = 6,
  aux_sym_module_repeat1 = 7,
};

static const char * const ts_symbol_names[] = {
  [ts_builtin_sym_end] = "end",
  [sym_identifier] = "identifier",
  [sym__sep] = "_sep",
  [sym_line_comment] = "line_comment",
  [sym_doc_line] = "doc_line",
  [sym_module] = "module",
  [sym__statement] = "_statement",
  [aux_sym_module_repeat1] = "module_repeat1",
};

static const TSSymbol ts_symbol_map[] = {
  [ts_builtin_sym_end] = ts_builtin_sym_end,
  [sym_identifier] = sym_identifier,
  [sym__sep] = sym__sep,
  [sym_line_comment] = sym_line_comment,
  [sym_doc_line] = sym_doc_line,
  [sym_module] = sym_module,
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
  [sym__sep] = {
    .visible = false,
    .named = true,
  },
  [sym_line_comment] = {
    .visible = true,
    .named = true,
  },
  [sym_doc_line] = {
    .visible = true,
    .named = true,
  },
  [sym_module] = {
    .visible = true,
    .named = true,
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
      if (lookahead == '\n' ||
          lookahead == ';') ADVANCE(2);
      if (lookahead == '\t' ||
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
      ACCEPT_TOKEN(sym__sep);
      if (lookahead == '\n' ||
          lookahead == ';') ADVANCE(2);
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
  [0] = {.lex_state = 0},
  [1] = {.lex_state = 0},
  [2] = {.lex_state = 0},
  [3] = {.lex_state = 0},
  [4] = {.lex_state = 0},
  [5] = {.lex_state = 0},
  [6] = {.lex_state = 0},
  [7] = {.lex_state = 0},
  [8] = {.lex_state = 0},
  [9] = {.lex_state = 0},
  [10] = {.lex_state = 0},
  [11] = {.lex_state = 0},
  [12] = {.lex_state = 0},
  [13] = {.lex_state = 0},
  [14] = {.lex_state = 0},
};

static const uint16_t ts_parse_table[LARGE_STATE_COUNT][SYMBOL_COUNT] = {
  [0] = {
    [ts_builtin_sym_end] = ACTIONS(1),
    [sym_identifier] = ACTIONS(1),
    [sym__sep] = ACTIONS(1),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
  },
  [1] = {
    [sym_module] = STATE(13),
    [sym__statement] = STATE(3),
    [ts_builtin_sym_end] = ACTIONS(5),
    [sym_identifier] = ACTIONS(7),
    [sym__sep] = ACTIONS(9),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
  },
  [2] = {
    [sym__statement] = STATE(4),
    [ts_builtin_sym_end] = ACTIONS(11),
    [sym_identifier] = ACTIONS(13),
    [sym__sep] = ACTIONS(15),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
  },
  [3] = {
    [aux_sym_module_repeat1] = STATE(6),
    [ts_builtin_sym_end] = ACTIONS(11),
    [sym__sep] = ACTIONS(17),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
  },
  [4] = {
    [aux_sym_module_repeat1] = STATE(8),
    [ts_builtin_sym_end] = ACTIONS(19),
    [sym__sep] = ACTIONS(21),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
  },
  [5] = {
    [sym__statement] = STATE(11),
    [ts_builtin_sym_end] = ACTIONS(19),
    [sym_identifier] = ACTIONS(23),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
  },
  [6] = {
    [aux_sym_module_repeat1] = STATE(9),
    [ts_builtin_sym_end] = ACTIONS(19),
    [sym__sep] = ACTIONS(21),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
  },
  [7] = {
    [sym__statement] = STATE(11),
    [ts_builtin_sym_end] = ACTIONS(25),
    [sym_identifier] = ACTIONS(23),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
  },
  [8] = {
    [aux_sym_module_repeat1] = STATE(9),
    [ts_builtin_sym_end] = ACTIONS(25),
    [sym__sep] = ACTIONS(27),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
  },
  [9] = {
    [aux_sym_module_repeat1] = STATE(9),
    [ts_builtin_sym_end] = ACTIONS(29),
    [sym__sep] = ACTIONS(31),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
  },
  [10] = {
    [sym__statement] = STATE(11),
    [ts_builtin_sym_end] = ACTIONS(34),
    [sym_identifier] = ACTIONS(23),
    [sym_line_comment] = ACTIONS(3),
    [sym_doc_line] = ACTIONS(3),
  },
};

static const uint16_t ts_small_parse_table[] = {
  [0] = 2,
    ACTIONS(3), 2,
      sym_line_comment,
      sym_doc_line,
    ACTIONS(29), 2,
      ts_builtin_sym_end,
      sym__sep,
  [9] = 3,
    ACTIONS(23), 1,
      sym_identifier,
    STATE(11), 1,
      sym__statement,
    ACTIONS(3), 2,
      sym_line_comment,
      sym_doc_line,
  [20] = 2,
    ACTIONS(36), 1,
      ts_builtin_sym_end,
    ACTIONS(3), 2,
      sym_line_comment,
      sym_doc_line,
  [28] = 2,
    ACTIONS(19), 1,
      ts_builtin_sym_end,
    ACTIONS(3), 2,
      sym_line_comment,
      sym_doc_line,
};

static const uint32_t ts_small_parse_table_map[] = {
  [SMALL_STATE(11)] = 0,
  [SMALL_STATE(12)] = 9,
  [SMALL_STATE(13)] = 20,
  [SMALL_STATE(14)] = 28,
};

static const TSParseActionEntry ts_parse_actions[] = {
  [0] = {.entry = {.count = 0, .reusable = false}},
  [1] = {.entry = {.count = 1, .reusable = false}}, RECOVER(),
  [3] = {.entry = {.count = 1, .reusable = true}}, SHIFT_EXTRA(),
  [5] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_module, 0, 0, 0),
  [7] = {.entry = {.count = 1, .reusable = true}}, SHIFT(3),
  [9] = {.entry = {.count = 1, .reusable = true}}, SHIFT(2),
  [11] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_module, 1, 0, 0),
  [13] = {.entry = {.count = 1, .reusable = true}}, SHIFT(4),
  [15] = {.entry = {.count = 1, .reusable = true}}, SHIFT(14),
  [17] = {.entry = {.count = 1, .reusable = true}}, SHIFT(5),
  [19] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_module, 2, 0, 0),
  [21] = {.entry = {.count = 1, .reusable = true}}, SHIFT(7),
  [23] = {.entry = {.count = 1, .reusable = true}}, SHIFT(11),
  [25] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_module, 3, 0, 0),
  [27] = {.entry = {.count = 1, .reusable = true}}, SHIFT(10),
  [29] = {.entry = {.count = 1, .reusable = true}}, REDUCE(aux_sym_module_repeat1, 2, 0, 0),
  [31] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_module_repeat1, 2, 0, 0), SHIFT_REPEAT(12),
  [34] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_module, 4, 0, 0),
  [36] = {.entry = {.count = 1, .reusable = true}},  ACCEPT_INPUT(),
};

#ifdef __cplusplus
extern "C" {
#endif
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
    .primary_state_ids = ts_primary_state_ids,
  };
  return &language;
}
#ifdef __cplusplus
}
#endif
