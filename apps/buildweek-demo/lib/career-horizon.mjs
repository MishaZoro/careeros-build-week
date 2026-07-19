export function careerHorizon(analysis, next) {
  const all = Object.values(analysis.groups).flat();
  const caution = all.find((item) => item.classification === 'caution') ?? all.find((item) => item.classification === 'gap');
  return {
    current_position: 'Federal capture and defense-technology growth leadership supported by repeated opportunity leadership, customer alignment, cybersecurity, C5ISR, and strategic-growth evidence.',
    emerging_direction: 'Based on current Career DNA and selected direction, evidence is converging around advanced-technology growth leadership where AI, cybersecurity, mission systems, and acquisition intersect.',
    persistent_constraint: caution ? `${caution.requirement}: current evidence does not yet establish direct advanced-domain ownership.` : 'No persistent constraint identified in the prepared role set.',
    forward_readiness: caution ? { state: 'Build direct ownership evidence', requirement: caution.requirement, current_classification: caution.classification, action: next.action, evidence_to_capture: next.evidence_to_capture } : { state: 'Ready to pursue', requirement: 'Current role requirements', current_classification: 'direct', action: next.action, evidence_to_capture: next.evidence_to_capture },
    directions: ['Near-term: Defense Technology Business Development Director', 'Emerging: Advanced Technology Growth Executive']
  };
}
