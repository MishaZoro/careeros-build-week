import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { aiWorkflowPilotFixture } from '../data/growth-fixture.mjs';
import { transformAchievement } from '../lib/achievement-validator.mjs';
import { runGrowthLoop } from '../lib/growth-loop.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const [html, ui, css, evidenceText, roleText] = await Promise.all([
  read('public/index.html'), read('public/app.js'), read('public/styles.css'),
  read('data/evidence.json'), read('data/target-roles.json')
]);
const baseline = JSON.parse(evidenceText);
const role = JSON.parse(roleText).find((item) => item.id === 'ROLE-003');
const baselineHash = createHash('sha256').update(evidenceText).digest('hex');
const growth = runGrowthLoop(role, baseline, [aiWorkflowPilotFixture], (entry) => transformAchievement(entry, '2026-07-18T20:01:39-04:00'));

for (const id of ['start-guided', 'reset-demo', 'career-dna-summary', 'next-action-card', 'role-selector', 'load-fixture', 'comparison', 'timeline']) assert.match(html, new RegExp(`id="${id}"`), `${id} must render in Command Center`);
assert.match(html, /CareerOS Across Your Career/, 'lifecycle view must render');
assert.match(html, /Explore Career DNA/, 'evidence exploration must be available');
assert.match(ui, /createDemoState/, 'guided demo must consume the shared default role state');
assert.match(ui, /guidedSteps/, 'guided demo must be lightweight application state');
for (const title of ['Career DNA', 'Choose a Career Direction', 'Review Current Readiness', 'Explore Career Horizon', 'Recommended Evidence', 'Review and Validate Evidence', 'Add to Career DNA', 'See What Changed', 'Explore Updated Career Intelligence']) assert.match(ui, new RegExp(title), `guided demo must include ${title}`);
assert.match(ui, /guided-back/, 'guided back control must be wired');
assert.match(ui, /guided-next/, 'guided next control must be wired');
assert.match(ui, /guided-exit/, 'guided exit control must be wired');
assert.match(ui, /confirm\('Reset active session evidence/, 'demo reset requires confirmation');
assert.match(ui, /Synthetic Build Week Demonstration loaded\. It is not a historical accomplishment\./, 'fixture must be clearly synthetic');
assert.match(ui, /escapeHtml/, 'user-controlled text must remain escaped');
assert.match(css, /prefers-reduced-motion/, 'reduced-motion preference must be respected');
assert.match(css, /focus-visible/, 'keyboard focus must be visible');
assert.match(css, /@media\(max-width:700px\)/, 'narrow layout must stack');
assert.equal(/https?:\/\//i.test(ui), false, 'the app UI must not require external network calls');
assert.equal(/openai|anthropic|api\.openai/i.test(ui), false, 'the app UI must not call an LLM or AI API');
assert.equal(growth.baseline.confidence, 78, 'ROLE-003 baseline readiness must remain deterministic at 78%');
assert.equal(growth.active.confidence, 82, 'fixture should raise active readiness to 82%');
assert.equal(growth.active_record_count, undefined, 'engine output must not invent mutable baseline metadata');
assert.equal(baseline.length + growth.timeline.length, 19, 'active Career DNA must represent 18 baseline plus one session record');
const technologyChange = growth.comparison.materially_changed.find((change) => change.requirement === 'Technology-transition planning');
assert.deepEqual([technologyChange.before_classification, technologyChange.before_confidence, technologyChange.after_classification, technologyChange.after_confidence], ['adjacent', 78, 'direct', 96], 'What Changed must reflect the deterministic transition change');
assert.equal(growth.active.groups.caution.some((item) => item.requirement === 'Honest domain-gap management'), true, 'unchanged Caution must remain visible');
assert.equal(growth.next_action.includes('direct evidence'), true, 'Next Action must come from the deterministic engine');
assert.equal(createHash('sha256').update(await readFile(new URL('data/evidence.json', root), 'utf8')).digest('hex'), baselineHash, 'reset/demo work must not mutate evidence.json');
console.log('COMPANION_EXPERIENCE_TEST=PASS guided=9 deterministic=78-to-82 privacy=preserved');
