#!/usr/bin/env bash
# Resource-limited tree-sitter parse stress harness. Parses each fixture under a
# hard RSS cap + wall-clock timeout (see test/lib/rss-cap.sh). A runaway GLR parse
# is killed at the cap instead of climbing to multi-GB and freezing the machine.
# Exit non-zero if ANY fixture OOM-kills, times out, or errors.
set -u

CAP_MB="${CAP_MB:-500}"      # RSS cap per parse (well under the 700MB ceiling)
TIMEOUT_S="${TIMEOUT_S:-15}" # wall-clock cap per parse
export CAP_MB TIMEOUT_S

cd "$(dirname "$0")/../.." || exit 99   # -> tree-sitter/
. "$(dirname "$0")/../lib/rss-cap.sh"
TS="./node_modules/.bin/tree-sitter"
[ -x "$TS" ] || TS="npx tree-sitter"

rc_all=0
for f in "$(dirname "$0")"/*.flatppl; do
  run_capped "$(basename "$f")" $TS parse --quiet "$f" >/dev/null
  rc=$?
  # Only OOM (2) / timeout (3) are stress failures; a plain parse-error (e.g. the
  # unbalanced fixture, rc=1) is expected — this harness guards MEMORY, not parse
  # correctness (the corpus tests cover that).
  { [ "$rc" -eq 2 ] || [ "$rc" -eq 3 ]; } && rc_all="$rc"
done

# Large generated inputs are added by Task 5 below this line.

echo "---"
[ "$rc_all" -eq 0 ] && echo "STRESS OK" || echo "STRESS FAILED (rc=$rc_all)"
exit "$rc_all"
