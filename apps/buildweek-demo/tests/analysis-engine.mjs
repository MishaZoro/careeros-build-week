import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analyzeRole } from '../lib/analysis-engine.mjs';

const evidence = JSON.parse(await readFile(new URL('../data/evidence.json', import.meta.url), 'utf8'));
const roles = JSON.parse(await readFile(new URL('../data/target-roles.json', import.meta.url), 'utf8'));

for (const role of roles) {
  const first = analyzeRole(role, evidence);
  const second = analyzeRole(role, evidence);
  assert.deepEqual(first, second, 'analysis must be deterministic');
  assert.equal(first.role.id, role.id);
  assert.equal(first.restrictions.no_private_details, true, 'analysis must inherit restrictions');
  for (const result of Object.values(first.groups).flat()) {
    assert.equal(result.restrictions.public_summary_only, true, 'each result must inherit restrictions');
    for (const reference of result.evidence_references) assert.equal(evidence.some((record) => record.id === reference.id), true, 'every reference must resolve to approved evidence');
  }
}
console.log('ANALYSIS_ENGINE_TEST=PASS roles=3 deterministic=true traceable=true');
