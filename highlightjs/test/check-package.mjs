// Package-manifest regression test for highlightjs/package.json.
// Two checks that guard how the package is consumed and published:
//   (a) exports map — `flatppl-highlightjs/embed.js` (documented in README)
//       must be a declared subpath. A bare-string `exports` makes Node throw
//       ERR_PACKAGE_PATH_NOT_EXPORTED for any path but the main entry.
//   (b) pack allowlist — `npm pack` must ship flatppl.js + embed.js + README.md
//       and NOTHING under test/. Without a `files` allowlist the whole dir
//       (incl. this test tree) gets published.
// Plain node .mjs, house style: print `ok:`/`FAIL:` lines, exit non-zero on failure.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(here, '..');
const pkg = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf8'));

let fail = 0;

function ok(desc) {
  console.log(`ok: ${desc}`);
}
function bad(desc, detail) {
  fail = 1;
  console.error(`FAIL: ${desc}${detail ? `\n  ${detail}` : ''}`);
}

// ── (a) exports map exposes ./embed.js subpath ───────────────────────────────
const exp = pkg.exports;
if (exp && typeof exp === 'object' && !Array.isArray(exp) && exp['./embed.js']) {
  ok("exports map declares './embed.js' subpath");
} else {
  bad(
    "exports must be a subpath map exposing './embed.js'",
    `got exports=${JSON.stringify(exp)} (bare string blocks 'flatppl-highlightjs/embed.js' — README documents it)`,
  );
}
// The main entry must still resolve via '.'.
if (exp && typeof exp === 'object' && !Array.isArray(exp) && exp['.']) {
  ok("exports map declares '.' main entry");
} else {
  bad("exports map must keep a '.' main entry", `got exports=${JSON.stringify(exp)}`);
}

// ── (b) npm pack allowlist ships only the published files, never test/ ───────
let listed;
try {
  const out = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: pkgDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const meta = JSON.parse(out);
  listed = (meta[0]?.files ?? []).map((f) => f.path);
} catch (e) {
  bad('npm pack --dry-run --json failed', String(e?.message ?? e));
  listed = null;
}

if (listed) {
  for (const want of ['flatppl.js', 'embed.js', 'README.md']) {
    if (listed.includes(want)) {
      ok(`pack includes ${want}`);
    } else {
      bad(`pack must include ${want}`, `packed: ${JSON.stringify(listed)}`);
    }
  }
  const leaked = listed.filter((p) => p === 'test' || p.startsWith('test/'));
  if (leaked.length === 0) {
    ok('pack ships nothing under test/');
  } else {
    bad('pack must NOT ship anything under test/', `leaked: ${JSON.stringify(leaked)}`);
  }
}

process.exit(fail);
