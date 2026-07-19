export function nextAction(after, sessionEvidence) {
  const results = Object.values(after.groups).flat();
  const caution = results.find((result) => result.classification === 'caution');
  const gap = results.find((result) => result.classification === 'gap');
  const target = caution ?? gap;
  if (!target) return { action: 'Convert the strongest evidence into a concise interview story with situation, action, result, and verified outcome.', requirement: 'Evidence communication', evidence_to_capture: 'Situation, personal action, verified result, and limitation.', avoid: 'Claims that exceed the documented evidence.' };
  return { action: `Add direct evidence addressing the limitation attached to ${target.requirement}.`, requirement: target.requirement, evidence_to_capture: 'Customer or mission context, personal authority, transition stage, quantified outcome, and operational result.', avoid: 'Claims of direct advanced-domain ownership until supported by evidence.' };
}
