import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const directory = fileURLToPath(new URL('../tests/unit/', import.meta.url));
const files = readdirSync(directory).filter(file => file.endsWith('.test.cjs')).sort()
  .map(file => path.join(directory, file));
if (files.length === 0) throw new Error('No unit tests found');
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
