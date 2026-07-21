import assert from 'node:assert/strict';
import { createDemoState, resetDemoState, transitionAchievement, transitionGuidedStep } from '../lib/demo-state.mjs';

for (let run = 1; run <= 2; run += 1) {
  const state = createDemoState();
  assert.equal(state.achievement_state, 'prepared');
  assert.equal(transitionAchievement(state, 'validated'), false, 'validation before loading must fail');
  assert.equal(transitionAchievement(state, 'added'), false, 'adding before validation must fail');
  assert.equal(transitionGuidedStep(state, 8), false, 'What Changed must be gated');
  assert.equal(transitionAchievement(state, 'loaded'), true);
  assert.equal(transitionAchievement(state, 'validated'), true);
  assert.equal(transitionAchievement(state, 'added'), true);
  assert.equal(transitionAchievement(state, 'added'), false, 'duplicate additions must fail');
  state.active_session_records.push({ entry_id: 'SESSION-DEMO-AI-PILOT-001' });
  state.updated_readiness = 82;
  state.capability.after = 'Direct';
  assert.equal(transitionGuidedStep(state, 8), true);
  const reset = resetDemoState();
  assert.equal(reset.guided_step, 1);
  assert.equal(reset.selected_role_id, 'ROLE-003');
  assert.equal(reset.updated_readiness, 78);
  assert.deepEqual(reset.active_session_records, []);
  assert.equal(reset.achievement_state, 'prepared');
  assert.equal(reset.capability.after, 'Adjacent');
  assert.equal(reset.timeline_entry, null);
  assert.equal(reset.last_growth, null);
}
console.log('RESET_STATE_TEST=PASS');
