import { analyzeRole } from './analysis-engine.mjs';
import { nextAction } from './next-action-engine.mjs';

const rank = { gap: 0, caution: 1, transferable: 2, adjacent: 3, direct: 4 };

export function compareAnalyses(before, after, sessionEvidence) {
  const prior = Object.values(before.groups).flat().reduce((map, item) => map.set(item.requirement, item), new Map());
  const current = Object.values(after.groups).flat();
  const changes = current.map((item) => {
    const previous = prior.get(item.requirement);
    const newReferences = item.evidence_references.filter((reference) => sessionEvidence.some((record) => record.id === reference.id));
    return { requirement: item.requirement, before_classification: previous.classification, after_classification: item.classification, before_confidence: previous.confidence, after_confidence: item.confidence, changed: previous.classification !== item.classification || previous.confidence !== item.confidence, new_evidence: newReferences, reason: newReferences.length ? `${newReferences[0].title} adds explicit capability evidence for this requirement.` : 'No new session evidence materially changed this requirement.', limitation: newReferences[0] ? sessionEvidence.find((record) => record.id === newReferences[0].id).limitation : undefined, restrictions: item.restrictions };
  });
  return { changes, materially_changed: changes.filter((item) => item.changed && item.new_evidence.length), unchanged: changes.filter((item) => !item.changed), readiness_changed: after.confidence !== before.confidence };
}

export function runGrowthLoop(role, baselineEvidence, entries, transform) {
  const baseline = analyzeRole(role, baselineEvidence);
  const sessionEvidence = entries.map(transform);
  const active = analyzeRole(role, [...baselineEvidence, ...sessionEvidence]);
  const comparison = compareAnalyses(baseline, active, sessionEvidence);
  const next = nextAction(active, sessionEvidence);
  return { baseline, active, comparison, next_action: next.action, next_action_detail: next, timeline: sessionEvidence.map((record) => ({ achievement_date: record.achievement_date, created_at: record.created_at, title: record.title, capabilities_added: record.capabilities, evidence_status: record.evidence_status, visibility: record.visibility, approval_status: record.approval_status, related_role: record.related_role_id, related_role_requirements: record.related_role_requirements, requirement_impact: comparison.changes.filter((change) => change.new_evidence.some((evidence) => evidence.id === record.id)).map((change) => change.requirement), readiness_changed: comparison.readiness_changed, lineage: record.lineage })) };
}
