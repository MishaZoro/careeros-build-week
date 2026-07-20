import assert from 'node:assert/strict';
import { evidenceRecords, invalidEvidenceRecords, targetRoles } from '../data/synthetic-fixtures.mjs';
import { inheritRestrictions, validateCollection, validateRecord } from '../lib/public-demo-validator.mjs';

assert.equal(validateRecord(evidenceRecords[0]).accepted, true, 'approved public record should be accepted');
assert.equal(validateRecord(invalidEvidenceRecords[0]).errors.includes('not_approved'), true, 'missing approval should reject');
assert.equal(validateRecord(invalidEvidenceRecords[1]).errors.includes('not_public_demo'), true, 'private visibility should reject');
assert.equal(validateRecord(invalidEvidenceRecords[2]).errors.includes('unsafe:source_or_value'), true, 'local path should reject');
assert.equal(validateRecord(invalidEvidenceRecords[3]).errors.includes('unsafe:source_or_value'), true, 'unsafe filename should reject');
assert.equal(validateRecord(invalidEvidenceRecords[4]).errors.includes('invalid:classification'), true, 'invalid classification should reject');

const inherited = inheritRestrictions([evidenceRecords[0], evidenceRecords[1]], { kind: 'synthetic recommendation' });
assert.deepEqual(inherited.restrictions, evidenceRecords[0].restrictions, 'derived output must inherit source restrictions');
assert.deepEqual(inherited.source_record_ids, ['SYN-E-001', 'SYN-E-002']);

const evidence = validateCollection([...evidenceRecords, ...invalidEvidenceRecords], 'evidence');
const roles = validateCollection(targetRoles, 'role');
assert.equal(evidence.accepted.length, 6, 'six synthetic evidence records should be approved');
assert.equal(evidence.rejected.length, 5, 'invalid evidence records should be rejected');
assert.equal(roles.accepted.length, 3, 'three synthetic target roles should be approved');
console.log('VALIDATOR_TEST=PASS accepted=9 rejected=5');
