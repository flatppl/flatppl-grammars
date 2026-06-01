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

# --- Large generated inputs -------------------------------------------------
# Exercise each GLR danger class at a scale that would actually OOM an ambiguous
# grammar (blow-up is super-linear in input length). Generated to a temp dir,
# parsed under the same cap, then cleaned up.
gen_dir="$(mktemp -d)"
trap 'rm -rf "$gen_dir"' EXIT
N="${STRESS_N:-20000}"

{ printf 'z = a'; for _ in $(seq 1 "$N"); do printf ' < a'; done; printf '\n'; } > "$gen_dir/big_comparison.flatppl"
{ printf 'z = '; for _ in $(seq 1 "$N"); do printf '('; done; printf 'a'; for _ in $(seq 1 "$N"); do printf ')'; done; printf '\n'; } > "$gen_dir/big_parens.flatppl"
{ printf 'z = A'; for _ in $(seq 1 "$N"); do printf '[.i]'; done; printf '\n'; } > "$gen_dir/big_index.flatppl"
{ printf 'z = '; for _ in $(seq 1 "$N"); do printf '!'; done; printf 'a\n'; } > "$gen_dir/big_unary.flatppl"
{ printf 'z = '; for _ in $(seq 1 "$N"); do printf '('; done; printf 'a\n'; } > "$gen_dir/big_unbalanced.flatppl"

for f in "$gen_dir"/*.flatppl; do
  name="gen:$(basename "$f")"
  run_capped "$name" $TS parse --quiet "$f" >/dev/null
  rc=$?
  case "$(basename "$f")" in
    big_unbalanced.flatppl)
      # parse-error (rc=1) is EXPECTED here; only OOM (2) / timeout (3) are failures.
      { [ "$rc" -eq 2 ] || [ "$rc" -eq 3 ]; } && rc_all="$rc" ;;
    *)
      [ "$rc" -ne 0 ] && rc_all="$rc" ;;
  esac
done

echo "---"
[ "$rc_all" -eq 0 ] && echo "STRESS OK" || echo "STRESS FAILED (rc=$rc_all)"
exit "$rc_all"
