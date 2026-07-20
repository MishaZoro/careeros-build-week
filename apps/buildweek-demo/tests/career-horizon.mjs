import assert from 'node:assert/strict'; import { careerHorizon } from '../lib/career-horizon.mjs';
const horizon = careerHorizon({ groups: { caution: [{ requirement: 'Advanced technology domain leadership', classification: 'caution' }] } }, { action: 'Build proof.', evidence_to_capture: 'Scope and outcome.' });
assert.equal(horizon.forward_readiness.state, 'Build direct ownership evidence'); assert.match(horizon.persistent_constraint, /Advanced technology/); console.log('CAREER_HORIZON_TEST=PASS');
