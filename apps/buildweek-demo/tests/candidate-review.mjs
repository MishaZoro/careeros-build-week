import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const curatedRoot = join(appRoot, 'data');
const roles = JSON.parse(await readFile(join(curatedRoot, 'target-roles.json'), 'utf8'));
const evidencePath = join(curatedRoot, 'evidence.json');
const baselineText = await readFile(evidencePath, 'utf8');
const baselineHash = createHash('sha256').update(baselineText).digest('hex');
const evidence = JSON.parse(baselineText);
const candidates = evidence.map((record) => ({
  candidate_id: `CANDIDATE-${record.id}`,
  source_record_id: record.id,
  title: record.title,
  summary: record.summary,
  target_roles_supported: record.related_role_requirements,
  visibility: record.visibility,
  approval_status: record.approval_status
}));
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
  assert.equal(candidate.visibility, 'public_demo', 'candidate review input must remain public-demo safe');
  assert.equal(candidate.approval_status, 'approved', 'candidate review input must derive only from approved evidence');
  for (const roleId of candidate.target_roles_supported) assert.equal(roleIds.has(roleId), true, 'candidate role references must resolve');
}
for (const role of roles) assert.equal(role.approval_status, 'approved', 'approved role inputs must be app-loadable');
assert.equal(validateCollection(evidence, 'evidence').accepted.length, 18, 'all approved evidence records must validate');
assert.equal(validateCollection(evidence, 'evidence').rejected.length, 0, 'no failed record may be exported');
assert.equal(validateCollection(roles, 'role').accepted.length, 3, 'all approved target roles must validate');

const rejectedCandidate = { ...candidates[0], candidate_id: 'CANDIDATE-REJECTED-DNA-001', approval_status: 'rejected' };
const rejectedEvidence = { ...evidence[0], id: 'REJECTED-DNA-001', approval_status: rejectedCandidate.approval_status };
const reviewResult = validateCollection([rejectedEvidence], 'evidence');
const activeCareerDna = validateCollection([...evidence, rejectedEvidence], 'evidence').accepted;
assert.equal(rejectedCandidate.approval_status === 'approved', false, 'rejected candidate must not be treated as approved');
assert.equal(rejectedCandidate.source_record_id, 'DNA-001', 'rejected candidate must retain source-record traceability');
assert.equal(rejectedCandidate.approval_status, 'rejected', 'rejected candidate must retain its review state');
assert.equal(reviewResult.accepted.length, 0, 'rejected candidate evidence must not bypass approval validation');
assert.deepEqual(reviewResult.rejected, [{ id: 'REJECTED-DNA-001', errors: ['not_approved'] }], 'rejection must remain traceable to the approval control');
assert.equal(activeCareerDna.length, evidence.length, 'rejected candidate evidence must not expand Active Career DNA');
assert.equal(activeCareerDna.some((record) => record.id === rejectedEvidence.id), false, 'rejected candidate evidence must not enter Active Career DNA');
assert.equal(createHash('sha256').update(await readFile(evidencePath, 'utf8')).digest('hex'), baselineHash, 'candidate rejection review must not alter the approved baseline');

for (const record of evidence) assert.equal(unsafe.test(JSON.stringify(record)), false, 'exported evidence must not expose a path, filename, email, or phone');
assert.equal(evidence.find((record) => record.id === 'DNA-002').confidence, 90, 'approved revision for DNA-002 must be retained');
assert.equal(evidence.find((record) => record.id === 'DNA-006').customers_or_agencies[0], 'Department of War', 'approved revision for DNA-006 must be retained');
assert.match(evidence.find((record) => record.id === 'DNA-012').summary, /proposal-development efficiency/, 'approved revision for DNA-012 must be retained');
console.log('CANDIDATE_REVIEW_TEST=PASS candidates=18 approved_evidence=18 rejected=1 roles=3');
