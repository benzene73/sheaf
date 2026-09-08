import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
import {copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = resolve(root, 'dist');
// This script only removes its own generated directory; validate before recursive removal.
if (relative(root, destination) !== 'dist' || !destination.startsWith(root + sep)) {
  throw new Error('Build output must be the repository dist directory');
}
rmSync(destination, {recursive: true, force: true});
mkdirSync(destination, {recursive: true});

const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/liveview/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
  sourcemap: true,
  minify: false,
  external: ['@floating-ui/*'],
  metafile: true,
  banner: {js: '/* Includes Base UI-derived code. Copyright (c) 2019 Material-UI SAS. See BASE-UI-MIT.txt. */'},
});
const declarations = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.build.json'],
  {cwd: root, stdio: 'inherit'});
if (declarations.error) throw declarations.error;
if (declarations.status !== 0) process.exit(declarations.status || 1);

copyFileSync(resolve(root, 'licenses/BASE-UI-MIT.txt'), resolve(destination, 'BASE-UI-MIT.txt'));
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const imports = [...new Set(Object.values(result.metafile.outputs).flatMap(output =>
  output.imports.filter(item => item.external).map(item => item.path)))].sort();
const packages = [...new Set(imports.map(name => name.startsWith('@') ? name.split('/').slice(0, 2).join('/') : name.split('/')[0]))];
writeFileSync(resolve(destination, 'package.json'), JSON.stringify({
  name: 'sheaf', version: '0.1.0', private: true, type: 'module',
  main: './index.js', types: './types/liveview/index.d.ts',
  exports: {'.': {types: './types/liveview/index.d.ts', import: './index.js'}},
  dependencies: Object.fromEntries(packages.map(name => [name, manifest.dependencies[name]])),
}, null, 2) + '\n');
writeFileSync(resolve(destination, 'metafile.json'), JSON.stringify(result.metafile, null, 2) + '\n');
const javascript = readFileSync(resolve(destination, 'index.js'));
const map = readFileSync(resolve(destination, 'index.js.map'));
const summary = {javascriptBytes: javascript.length, gzipBytes: gzipSync(javascript).length,
  sourceMapBytes: map.length, externalImports: imports,
  declarationEntry: 'dist/types/liveview/index.d.ts'};
writeFileSync(resolve(destination, 'build-summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(summary);
