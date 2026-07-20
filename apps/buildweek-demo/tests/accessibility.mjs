import assert from 'node:assert/strict'; import { readFile } from 'node:fs/promises';
const [html, css] = await Promise.all([readFile(new URL('../public/index.html', import.meta.url), 'utf8'), readFile(new URL('../public/styles.css', import.meta.url), 'utf8')]); assert.match(html, /aria-live/); assert.match(css, /focus-visible/); console.log('ACCESSIBILITY_TEST=PASS');
