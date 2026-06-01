#!/usr/bin/env bash
# Reusable RSS-cap + wall-clock monitor. Source this file, then call:
#   run_capped <label> <cmd> [args...]
# Env knobs: CAP_MB (default 700), TIMEOUT_S (default 120), POLL_S (default 0.05).
# A tight poll is required: a GLR blow-up can climb GBs between polls.
# Return code: 0 ok; 2 OOM-killed (>CAP_MB); 3 timeout; else the command's own rc.
# Side effects: sets RUN_CAPPED_PEAK_MB and RUN_CAPPED_VERDICT; prints one summary
# line to stderr. macOS does not reliably enforce `ulimit -v`/`-m`, hence this
# explicit polling monitor that kills the whole process subtree.

_rsscap_descendants() {
  local p=$1 c
  echo "$p"
  for c in $(pgrep -P "$p" 2>/dev/null); do _rsscap_descendants "$c"; done
}
_rsscap_rss_kb() {
  local pids; pids=$(_rsscap_descendants "$1" | paste -sd, -)
  ps -o rss= -p "$pids" 2>/dev/null | awk '{s+=$1} END{print s+0}'
}

run_capped() {
  local label=$1; shift
  local cap_mb="${CAP_MB:-700}" timeout_s="${TIMEOUT_S:-120}" poll_s="${POLL_S:-0.05}"
  "$@" &
  local pid=$! start=$SECONDS peak=0 verdict="" rc=0 r
  while kill -0 "$pid" 2>/dev/null; do
    r=$(_rsscap_rss_kb "$pid")
    [ "$r" -gt "$peak" ] && peak=$r
    if [ "$r" -gt $((cap_mb * 1024)) ]; then
      pkill -9 -P "$pid" 2>/dev/null; kill -9 "$pid" 2>/dev/null
      verdict="OOM-KILLED (>${cap_mb}MB)"; rc=2; break
    fi
    if [ $((SECONDS - start)) -ge "$timeout_s" ]; then
      pkill -9 -P "$pid" 2>/dev/null; kill -9 "$pid" 2>/dev/null
      verdict="TIMEOUT (>${timeout_s}s)"; rc=3; break
    fi
    sleep "$poll_s"
  done
  if [ -z "$verdict" ]; then
    wait "$pid"; rc=$?
    [ "$rc" -eq 0 ] && verdict="ok" || verdict="exit rc=$rc"
  fi
  RUN_CAPPED_PEAK_MB=$((peak / 1024))
  RUN_CAPPED_VERDICT="$verdict"
  printf '%-28s peak=%6dMB  %s\n' "$label" "$RUN_CAPPED_PEAK_MB" "$verdict" >&2
  return "$rc"
}
