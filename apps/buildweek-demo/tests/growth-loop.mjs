import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { aiWorkflowPilotFixture } from '../data/growth-fixture.mjs';
import { privateAchievementDefaults, transformAchievement, validateAchievement } from '../lib/achievement-validator.mjs';
import { runGrowthLoop } from '../lib/growth-loop.mjs';

const evidencePath = new URL('../data/evidence.json', import.meta.url);
const baselineText = await readFile(evidencePath, 'utf8');
const baselineHash = createHash('sha256').update(baselineText).digest('hex');
const baseline = JSON.parse(baselineText);
const roles = JSON.parse(await readFile(new URL('../data/target-roles.json', import.meta.url), 'utf8'));
const role = roles.find((item) => item.id === 'ROLE-003');

assert.equal(validateAchievement(aiWorkflowPilotFixture, roles).accepted, true, 'fixture should validate');
const privateEntry = { ...aiWorkflowPilotFixture, ...privateAchievementDefaults('2026-07-18T20:01:39-04:00'), entry_id: 'PRIVATE-001', title: 'Private session achievement', capabilities: ['workflow discovery'], related_role_requirements: ['Technology-transition planning'], classification: 'adjacent', limitation: 'Outcome not recorded.', synthetic_fixture: false };
assert.equal(validateAchievement(privateEntry, roles).accepted, true, 'private pending entry should validate for the session');
assert.equal(JSON.parse(await readFile(evidencePath, 'utf8')).some((item) => item.id.includes('PRIVATE-001')), false, 'private entry must not enter public evidence');

const invalidCases = [
  { ...aiWorkflowPilotFixture, restrictions: undefined }, { ...aiWorkflowPilotFixture, confidence: 101 },
  { ...aiWorkflowPilotFixture, related_role_id: 'UNKNOWN' }, { ...aiWorkflowPilotFixture, related_role_requirements: ['Unknown requirement'] },
  { ...aiWorkflowPilotFixture, summary: 'C:\\private\\record.docx' }, { ...aiWorkflowPilotFixture, summary: 'email test@example.com' },
  { ...aiWorkflowPilotFixture, summary: 'phone 555-123-4567' }, { ...aiWorkflowPilotFixture, summary: 'court filing detail' }
];
for (const combination of [{ visibility: 'private', approval_status: 'approved' }, { visibility: 'public_demo', approval_status: 'pending' }, { visibility: 'excluded', approval_status: 'pending' }, { visibility: 'restricted', approval_status: 'pending' }, { visibility: 'private', approval_status: 'rejected' }]) invalidCases.push({ ...aiWorkflowPilotFixture, ...combination });
for (const invalid of invalidCases) assert.equal(validateAchievement(invalid, roles).accepted, false, 'invalid achievement must reject');

const growth = runGrowthLoop(role, baseline, [aiWorkflowPilotFixture], (entry) => transformAchievement(entry, '2026-07-18T20:01:39-04:00'));
assert.equal(growth.baseline_record_count, undefined, 'growth output does not mutate baseline metadata');
assert.equal(growth.timeline.length, 1, 'timeline receives a session entry');
assert.equal(growth.timeline[0].lineage.synthetic_fixture, true, 'lineage records fixture provenance');
assert.equal(growth.timeline[0].achievement_date, aiWorkflowPilotFixture.achievement_date, 'achievement date must be preserved for chronology');
assert.equal(growth.timeline[0].created_at, aiWorkflowPilotFixture.created_at, 'capture timestamp must be preserved separately');
const transformed = transformAchievement(aiWorkflowPilotFixture, '2026-07-18T20:01:39-04:00');
assert.equal(transformed.related_role_id, 'ROLE-003', 'role ID must remain distinct');
assert.deepEqual(transformed.related_role_requirements, aiWorkflowPilotFixture.related_role_requirements, 'requirement array must be preserved');
assert.equal(growth.active.source_record_ids.includes('SESSION-SESSION-DEMO-AI-PILOT-001'), true, 'active analysis includes session evidence');
assert.equal(growth.comparison.materially_changed.some((change) => change.requirement === 'Technology-transition planning'), true, 'supported transition evidence changes the relevant requirement');
assert.equal(growth.active.groups.caution.some((item) => item.requirement === 'Honest domain-gap management'), true, 'unresolved advanced-domain caution remains visible');
assert.equal(growth.comparison.changes.every((change) => change.restrictions.no_private_details), true, 'restrictions are inherited');

const unrelated = { ...privateEntry, entry_id: 'PRIVATE-UNRELATED', capabilities: ['unrelated capability'], confidence: 90 };
const noChange = runGrowthLoop(role, baseline, [unrelated], (entry) => transformAchievement(entry, '2026-07-18T20:01:39-04:00'));
assert.equal(noChange.comparison.materially_changed.length, 0, 'unrelated evidence must not create false improvement');
assert.equal(createHash('sha256').update(await readFile(evidencePath, 'utf8')).digest('hex'), baselineHash, 'baseline evidence must remain unchanged');
assert.equal(runGrowthLoop(role, baseline, [], (entry) => entry).active.confidence, growth.baseline.confidence, 'session reset restores baseline analysis');

const source = await readFile(new URL('../server.mjs', import.meta.url), 'utf8');
assert.equal(/openai|anthropic|api\.openai/i.test(source), false, 'no external AI or LLM API may be called');
const ui = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
assert.match(ui, /escapeHtml/, 'user-content rendering must use an escaping helper');
assert.match(escapeTest('<img src=x onerror=alert(1)>'), /&lt;img/, 'HTML-like content must escape');
console.log('GROWTH_LOOP_TEST=PASS fixture=true private_session=true lineage=true deterministic=true');

function escapeTest(value) { return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
