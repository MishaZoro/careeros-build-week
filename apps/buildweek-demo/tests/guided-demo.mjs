import assert from 'node:assert/strict'; import { readFile } from 'node:fs/promises';
const ui = await readFile(new URL('../public/app.js', import.meta.url), 'utf8'); assert.match(ui, /Career Horizon/); assert.match(ui, /Future Value/); assert.match(ui, /ROLE-003/); console.log('GUIDED_DEMO_TEST=PASS');
