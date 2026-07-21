import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inheritRestrictions, validateCollection, validateRecord } from '../lib/public-demo-validator.mjs';

const evidenceRecords = JSON.parse(await readFile(new URL('../data/evidence.json', import.meta.url), 'utf8'));
const targetRoles = JSON.parse(await readFile(new URL('../data/target-roles.json', import.meta.url), 'utf8'));
const validRecord = evidenceRecords[0];
const invalidEvidenceRecords = [
  { ...validRecord, approval_status: 'pending' },
  { ...validRecord, visibility: 'private' },
  { ...validRecord, summary: 'C:\\private\\record.docx' },
  { ...validRecord, summary: 'candidate-evidence.pdf' },
  { ...validRecord, classification: 'unverified' }
];

assert.equal(validateRecord(evidenceRecords[0]).accepted, true, 'approved public record should be accepted');
assert.equal(validateRecord(invalidEvidenceRecords[0]).errors.includes('not_approved'), true, 'unapproved record should reject');
assert.equal(validateRecord(invalidEvidenceRecords[1]).errors.includes('not_public_demo'), true, 'private visibility should reject');
assert.equal(validateRecord(invalidEvidenceRecords[2]).errors.includes('unsafe:source_or_value'), true, 'local path should reject');
assert.equal(validateRecord(invalidEvidenceRecords[3]).errors.includes('unsafe:source_or_value'), true, 'unsafe filename should reject');
assert.equal(validateRecord(invalidEvidenceRecords[4]).errors.includes('invalid:classification'), true, 'invalid classification should reject');

const inherited = inheritRestrictions([evidenceRecords[0], evidenceRecords[1]], { kind: 'synthetic recommendation' });
assert.deepEqual(inherited.restrictions, evidenceRecords[0].restrictions, 'derived output must inherit source restrictions');
assert.deepEqual(inherited.source_record_ids, ['DNA-001', 'DNA-002']);

const evidence = validateCollection([...evidenceRecords, ...invalidEvidenceRecords], 'evidence');
const roles = validateCollection(targetRoles, 'role');
assert.equal(evidence.accepted.length, 18, 'all tracked baseline evidence records should be approved');
assert.equal(evidence.rejected.length, 5, 'invalid evidence records should be rejected');
assert.equal(roles.accepted.length, 3, 'three tracked target roles should be approved');
console.log('VALIDATOR_TEST=PASS accepted=21 rejected=5');
