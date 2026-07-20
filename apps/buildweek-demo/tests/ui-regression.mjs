import assert from 'node:assert/strict'; import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8'); assert.match(html, /Your Career Horizon/); assert.match(html, /Future Value of Recent Evidence/); console.log('UI_REGRESSION_TEST=PASS');
