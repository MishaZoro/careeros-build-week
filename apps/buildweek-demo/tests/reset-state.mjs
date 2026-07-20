import assert from 'node:assert/strict'; import { createDemoState, resetDemoState } from '../lib/demo-state.mjs';
const state = createDemoState(); state.session_entries.push('fixture'); assert.deepEqual(resetDemoState(), { session_entries: [], guided_step: 0 }); console.log('RESET_STATE_TEST=PASS');
