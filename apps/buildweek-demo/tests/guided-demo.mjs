import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ui = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
assert.match(ui, /createDemoState/);
assert.match(ui, /transitionAchievement/);
assert.match(ui, /78% → 82%/);
assert.match(ui, /Adjacent → Direct/);
assert.match(ui, /activeSteps|actionSteps/);
assert.doesNotMatch(html, />Next</);
assert.doesNotMatch(html, /No demonstration achievement is loaded/);
for (const title of ['Career DNA', 'Choose a Career Direction', 'Review Current Readiness', 'Explore Career Horizon', 'Select New Career Evidence', 'Review and Validate Evidence', 'Add to Career DNA', 'See What Changed', 'Explore Updated Career Intelligence']) assert.match(ui, new RegExp(title));
console.log('GUIDED_DEMO_TEST=PASS');
