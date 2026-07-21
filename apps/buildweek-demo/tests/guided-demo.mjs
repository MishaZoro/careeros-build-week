import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ui = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
assert.match(ui, /createDemoState/);
assert.match(ui, /transitionAchievement/);
assert.match(ui, /78% → 82%/);
assert.match(ui, /Adjacent → Direct/);
assert.match(ui, /actionRequired/);
assert.doesNotMatch(html, />Next</);
assert.doesNotMatch(html, /No demonstration achievement is loaded/);
for (const title of ['Career DNA', 'Choose a Career Direction', 'Review Current Readiness', 'Explore Career Horizon', 'Recommended Evidence', 'Review and Validate Evidence', 'Add to Career DNA', 'See What Changed', 'Explore Updated Career Intelligence']) assert.match(ui, new RegExp(title));
for (const target of ['target-role-readiness', 'recommended-evidence-section', 'loaded-evidence-summary', 'add-to-career-dna-action', 'updated-career-intelligence']) assert.match(html, new RegExp(`id="${target}"`));
for (const target of ['current-readiness-result', 'what-changed']) assert.match(ui, new RegExp(`id="${target}"`));
assert.match(ui, /Explore Updated Career Intelligence/);
assert.match(html, /Recommended Evidence to Strengthen This Role/);
assert.match(ui, /Why CareerOS recommended this/);
console.log('GUIDED_DEMO_TEST=PASS');
