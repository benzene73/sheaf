import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { build } from 'esbuild';

// Run only while the coordinator has reserved this source file and served bundle.
const lab = path.resolve(process.env.LAB_ROOT || '../liveview-primitives-lab');
const sourcePath = path.join(lab, 'src/behavior/list-navigation.ts');
const original = readFileSync(sourcePath);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const needle = 'if (allowEscape && currentIndex !== list.length) {\n          index = -1;';
const text = original.toString('utf8');
const normalized = text.replaceAll('\r\n', '\n');
if (normalized.split(needle).length !== 2) throw new Error('Mutation anchor must match exactly once');
const mutated = normalized.replace(needle, needle.replace('index = -1', 'index = minIndex'));
const rebuild = () => build({ entryPoints: [path.join(lab, 'client.js')], bundle: true, outfile: path.join(lab, 'priv/static/app.js') });
const evidence = { before: hash(original), mutation: 'forward allowEscape index=-1 -> minIndex' };
mkdirSync('artifacts', { recursive: true });
try {
  writeFileSync(sourcePath, mutated);
  await rebuild();
  const run = spawnSync(process.execPath, ['harness/paired.mjs'], {
    stdio: 'inherit', env: { ...process.env, BROWSERS: 'chromium', REPORT_PATH: 'artifacts/negative-results.json' },
  });
  evidence.negativeExitCode = run.status;
  const report = JSON.parse(readFileSync('artifacts/negative-results.json', 'utf8'));
  const failures = report.results.filter(row => !row.pass);
  evidence.failures = failures.map(({ target, scenario, actual }) => ({ target, scenario, actual }));
  if (run.status !== 1 || failures.length !== 1 || failures[0].target !== 'liveview' || failures[0].scenario !== 'down highlights disabled and loops through input') {
    throw new Error('Negative control did not fail only the expected LiveView scenario');
  }
} finally {
  writeFileSync(sourcePath, original);
  await rebuild();
  evidence.after = hash(readFileSync(sourcePath));
  evidence.sourceRestored = evidence.before === evidence.after;
  writeFileSync('artifacts/negative-control.json', JSON.stringify(evidence, null, 2));
}
const restored = spawnSync(process.execPath, ['harness/paired.mjs'], {
  stdio: 'inherit', env: { ...process.env, BROWSERS: 'chromium', REPORT_PATH: 'artifacts/restored-results.json' },
});
if (restored.status !== 0) throw new Error('Restored source failed paired suite');
console.log('Negative control failed precisely; source byte hash restored; restored suite passed.');
