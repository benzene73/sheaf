import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const source = path.resolve(process.env.BASE_UI_SOURCE || '../kaguya/tmp/design ref/base-ui');
const pin = '4d92faa1a4da6a5fe66a6194401470974fc2f8fe';
const head = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (head !== pin) throw new Error(`Upstream source differs: ${head}`);
const dirty = execFileSync('git', ['-C', source, 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' });
if (dirty.trim()) throw new Error('Upstream tracked source is modified; refusing untraceable fixture');
mkdirSync('artifacts/upstream', { recursive: true });
const result = await build({
  entryPoints: ['harness/upstream.tsx'], outfile: 'artifacts/upstream/app.js', bundle: true,
  platform: 'browser', format: 'esm', jsx: 'automatic', sourcemap: true, metafile: true,
  define: { 'process.env.NODE_ENV': '"development"' },
  nodePaths: [path.resolve('node_modules')],
  plugins: [{ name: 'pinned-base-ui-source', setup(builder) {
    builder.onResolve({ filter: /^@base-ui\/(react|utils)(\/.*)?$/ }, args => {
      const [, pkg, sub = '/index'] = args.path.match(/^@base-ui\/(react|utils)(\/.*)?$/);
      const stem = path.join(source, 'packages', pkg, 'src', sub);
      const resolved = [stem + '.ts', stem + '.tsx', path.join(stem, 'index.ts')].find(existsSync);
      if (!resolved) throw new Error(`Cannot resolve exact source ${args.path}`);
      return { path: resolved };
    });
  } }],
});
writeFileSync('artifacts/upstream/metafile.json', JSON.stringify(result.metafile, null, 2));
writeFileSync('artifacts/upstream/provenance.json', JSON.stringify({ source, pin, head, trackedSourceClean: true, builtAt: new Date().toISOString() }, null, 2));
console.log(`Built actual Base UI source ${head}`);
