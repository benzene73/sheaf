import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';

const suites = ['paired', 'lifecycle', 'filtering', 'composition', 'menu', 'menu-scroll',
  'select', 'select-extra', 'positioning', 'popover-behavior', 'dialog', 'number-field',
  'liveview-bridge', 'liveview-lifecycle', 'bridge-isolation'];
const selected = process.argv.slice(2);
for (const name of selected) if (!suites.includes(name)) throw new Error(`Unknown suite: ${name}`);
mkdirSync('artifacts/current', {recursive: true});
const results = [];
for (const name of selected.length ? selected : suites) {
  const started = new Date().toISOString();
  const run = spawnSync(process.execPath, [`harness/${name}.mjs`], {
    stdio: 'inherit', env: {...process.env, BROWSERS: 'chromium', REPORT_PATH: `artifacts/current/${name}.json`},
  });
  results.push({suite: name, started, finished: new Date().toISOString(), exitCode: run.status,
    error: run.error?.message});
  if (run.error || run.status !== 0) break;
}
writeFileSync('artifacts/current/summary.json', JSON.stringify({browser: 'chromium', results}, null, 2));
if (results.some(result => result.error || result.exitCode !== 0)) process.exitCode = 1;
