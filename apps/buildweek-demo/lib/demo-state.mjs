export const DEFAULT_ROLE_ID = 'ROLE-003';
export const ACHIEVEMENT_STATES = Object.freeze(['prepared', 'loaded', 'validated', 'added']);

export function createDemoState() {
  return {
    guided_step: 1,
    selected_role_id: DEFAULT_ROLE_ID,
    achievement_state: 'prepared',
    validation: { valid: false, message: '' },
    added: false,
    baseline_readiness: 78,
    updated_readiness: 78,
    active_session_records: [],
    capability: { name: 'AI pilot leadership', before: 'Adjacent', after: 'Adjacent' },
    timeline_entry: null,
    last_growth: null,
    guided_active: false
  };
}

export function resetDemoState() { return createDemoState(); }

export function transitionAchievement(state, next) {
  const allowed = { prepared: 'loaded', loaded: 'validated', validated: 'added' };
  if (allowed[state.achievement_state] !== next) return false;
  state.achievement_state = next;
  state.validation.valid = next === 'validated' || next === 'added';
  state.added = next === 'added';
  return true;
}

export function transitionGuidedStep(state, next) {
  if (!Number.isInteger(next) || next < 1 || next > 9) return false;
  const required = { 6: 'loaded', 7: 'validated', 8: 'added', 9: 'added' };
  const minimum = required[next];
  if (minimum && ACHIEVEMENT_STATES.indexOf(state.achievement_state) < ACHIEVEMENT_STATES.indexOf(minimum)) return false;
  state.guided_step = next;
  return true;
}
