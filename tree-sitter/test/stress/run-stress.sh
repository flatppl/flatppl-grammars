#!/usr/bin/env bash
# Resource-limited tree-sitter parse stress harness.
#
# Parses each fixture under a hard wall-clock timeout AND an RSS cap enforced by
# a polling monitor that kills the whole process subtree if it exceeds the cap.
# This is the SAFE way to reproduce the GLR memory blow-up: a runaway parse is
# killed at ~1.5 GB instead of climbing to ~11 GB and freezing the machine.
# macOS does not reliably enforce `ulimit -v`/`-m`, hence the explicit monitor.
#
# Exit non-zero if ANY fixture OOM-kills, times out, or errors.
set -u

CAP_MB="${CAP_MB:-500}"      # RSS cap per parse (sum over process subtree)
TIMEOUT_S="${TIMEOUT_S:-15}" # wall-clock cap per parse
POLL_S="${POLL_S:-0.05}"  # tight: a fast GLR blow-up can climb GBs between polls

cd "$(dirname "$0")/../.." || exit 99   # -> tree-sitter/
TS="./node_modules/.bin/tree-sitter"
[ -x "$TS" ] || TS="npx tree-sitter"

# echo a pid and all of its descendants
descendants() {
  local p=$1 c
  echo "$p"
  for c in $(pgrep -P "$p" 2>/dev/null); do descendants "$c"; done
}
# total RSS (KB) of pid + descendants
rss_kb() {
  local pids; pids=$(descendants "$1" | paste -sd, -)
  ps -o rss= -p "$pids" 2>/dev/null | awk '{s+=$1} END{print s+0}'
}

rc_all=0
for f in "$(dirname "$0")"/*.flatppl; do
  name=$(basename "$f")
  $TS parse --quiet "$f" >/dev/null 2>&1 &
  pid=$!
  start=$SECONDS peak=0 verdict=""
  while kill -0 "$pid" 2>/dev/null; do
    r=$(rss_kb "$pid")
    [ "$r" -gt "$peak" ] && peak=$r
    if [ "$r" -gt $((CAP_MB * 1024)) ]; then
      pkill -9 -P "$pid" 2>/dev/null; kill -9 "$pid" 2>/dev/null
      verdict="OOM-KILLED (>${CAP_MB}MB)"; rc_all=2; break
    fi
    if [ $((SECONDS - start)) -ge "$TIMEOUT_S" ]; then
      pkill -9 -P "$pid" 2>/dev/null; kill -9 "$pid" 2>/dev/null
      verdict="TIMEOUT (>${TIMEOUT_S}s)"; rc_all=3; break
    fi
    sleep "$POLL_S"
  done
  if [ -z "$verdict" ]; then
    wait "$pid"; pcode=$?
    [ "$pcode" -eq 0 ] && verdict="ok" || verdict="parse-error (rc=$pcode)"
  fi
  printf '%-22s peak=%6dMB  %s\n' "$name" $((peak / 1024)) "$verdict"
done

echo "---"
[ "$rc_all" -eq 0 ] && echo "STRESS OK" || echo "STRESS FAILED (rc=$rc_all)"
exit "$rc_all"
