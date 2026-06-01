#!/usr/bin/env bash
# Run any command under the shared RSS cap (default 700 MB). Used by
# `pixi run test-tree-sitter` to wrap `tree-sitter test` so the corpus runner
# can never OOM the machine (regression guard for the historical multi-GB GLR
# blow-up). Exit non-zero if the command fails, OOMs, or times out.
set -u
cd "$(dirname "$0")/.." || exit 99   # -> tree-sitter/
. "$(dirname "$0")/lib/rss-cap.sh"
CAP_MB="${CAP_MB:-700}" run_capped "tree-sitter test" "$@"
rc=$?
echo "---"
[ "$rc" -eq 0 ] && echo "CAPPED RUN OK" || echo "CAPPED RUN FAILED (rc=$rc)"
exit "$rc"
