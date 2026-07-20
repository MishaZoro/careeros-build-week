import assert from 'node:assert/strict'; import { careerTrajectory } from '../lib/career-trajectory.mjs';
const result = careerTrajectory({ groups: { caution: [{ requirement: 'Domain ownership' }] } }); assert.deepEqual(result.map((item) => item.horizon), ['Now', 'Next', 'Later']); assert.ok(result.every((item) => item.limiting_factor)); console.log('CAREER_TRAJECTORY_TEST=PASS');
