import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const publicRoot = join(appRoot, 'public');
const forbiddenMarkers = [
  'source_documents',
  'outputs/careeros',
  'careeros.xlsx',
  'nikolay valov',
  'c:\\users\\',
  '@gmail.com'
];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map(async (entry) => {
    const target = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(target) : [target];
  }));
  return groups.flat();
}

assert.equal(existsSync(join(appRoot, 'data', 'evidence.json')), true, 'approved Career DNA should be present in the package-local curated directory');
// Candidate review is derived from tracked evidence; no standalone sanitized candidate-review artifact is currently tracked.
assert.equal(existsSync(join(appRoot, 'data', 'target-roles.json')), true, 'approved target roles should be present in the package-local curated directory');
assert.equal(existsSync(join(appRoot, 'data', 'CareerOS.xlsx')), false, 'workbook data must not be packaged');
for (const file of await filesUnder(publicRoot)) {
  const content = (await readFile(file, 'utf8')).toLowerCase();
  for (const marker of forbiddenMarkers) {
    assert.equal(content.includes(marker), false, `public asset leaks forbidden marker: ${marker}`);
  }
}
console.log('PRIVACY_BOUNDARY_TEST=PASS');
