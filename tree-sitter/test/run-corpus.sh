#!/usr/bin/env bash
# Run the tree-sitter corpus tests, stripping tree-sitter's spurious
# "Slow parse rate" WARNINGS. That warning is a bytes/ms heuristic: the suite's
# inputs are tiny (a few bytes), so they parse at the timer-resolution floor and
# the computed rate dips under the CLI's threshold regardless of real speed —
# and it varies with machine speed (CI runners trip different tests than dev
# machines). It is NOT a real slowdown: genuine parse performance / GLR memory
# blow-ups are guarded by the capped stress harness (test/stress/run-stress.sh).
# We strip ONLY the warning suffix; the test's ✓/✗ line, every real failure/diff,
# and the process exit code are preserved untouched.
set -o pipefail
out=$(npx tree-sitter test "$@" 2>&1); rc=$?
printf '%s\n' "$out" | sed -E 's/ *-- Warning: Slow parse rate \([0-9.]+ bytes\/ms\)//'
exit "$rc"
