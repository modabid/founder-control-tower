import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'apps', 'web');
const output = join(root, 'dist');
const files = [
  'index.html',
  'dashboard.js',
  'live-dashboard.js',
  'styles.css',
  'live.css'
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of files) {
  await cp(join(source, file), join(output, file));
}

console.log('FCT_WEB_BUILD_PASS ' + files.length + ' files');
