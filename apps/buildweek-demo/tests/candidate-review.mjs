import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const curatedRoot = join(appRoot, 'data');
const candidates = JSON.parse(await readFile(join(curatedRoot, 'candidate-approval-review.json'), 'utf8'));
const roles = JSON.parse(await readFile(join(curatedRoot, 'target-roles.json'), 'utf8'));
const evidence = JSON.parse(await readFile(join(curatedRoot, 'evidence.json'), 'utf8'));
const { validateCollection } = await import('../lib/public-demo-validator.mjs');
const ids = new Set(candidates.map((candidate) => candidate.candidate_id));
const roleIds = new Set(roles.map((role) => role.id));
const unsafe = /(?:[a-z]:\\|file:\/\/|\.\.\\|\.\.\/|@|\b\d{3}[-.)\s]\d{3}[-.\s]\d{4}\b|\.docx\b|\.xlsx\b|\.pdf\b)/i;

assert.equal(candidates.length, 18, 'candidate package should contain 18 strong candidates');
assert.equal(ids.size, candidates.length, 'candidate IDs must be unique');
assert.equal(roleIds.size, roles.length, 'target-role IDs must be unique');
assert.equal(existsSync(join(curatedRoot, 'evidence.json')), true, 'approved records should be exported to evidence.json');
for (const candidate of candidates) {
  assert.equal(unsafe.test(JSON.stringify(candidate)), false, 'candidate package must not expose a path, filename, email, or phone');
  for (const roleId of candidate.target_roles_supported) assert.equal(roleIds.has(roleId), true, 'candidate role references must resolve');
}
for (const role of roles) assert.equal(role.approval_status, 'approved', 'approved role inputs must be app-loadable');
assert.equal(validateCollection(evidence, 'evidence').accepted.length, 18, 'all approved evidence records must validate');
assert.equal(validateCollection(evidence, 'evidence').rejected.length, 0, 'no failed record may be exported');
assert.equal(validateCollection(roles, 'role').accepted.length, 3, 'all approved target roles must validate');
for (const record of evidence) assert.equal(unsafe.test(JSON.stringify(record)), false, 'exported evidence must not expose a path, filename, email, or phone');
assert.equal(evidence.find((record) => record.id === 'DNA-002').confidence, 90, 'approved revision for DNA-002 must be retained');
assert.equal(evidence.find((record) => record.id === 'DNA-006').customers_or_agencies[0], 'Department of War', 'approved revision for DNA-006 must be retained');
assert.match(evidence.find((record) => record.id === 'DNA-012').summary, /proposal-development efficiency/, 'approved revision for DNA-012 must be retained');
console.log('CANDIDATE_REVIEW_TEST=PASS candidates=18 approved_evidence=18 roles=3');
