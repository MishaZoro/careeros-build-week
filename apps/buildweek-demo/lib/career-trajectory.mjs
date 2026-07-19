export function careerTrajectory(analysis) {
  const all = Object.values(analysis.groups).flat();
  const caution = all.find((item) => item.classification === 'caution');
  return [
    { horizon: 'Now', direction: 'Federal Capture and Defense Technology Growth Leadership', supporting_pattern: 'Capture, customer alignment, cybersecurity, mission systems, and strategic growth.', limiting_factor: 'Maintain current quantified evidence and verified outcomes.', next_proof: 'Capture current customer, authority, and outcome details.' },
    { horizon: 'Next', direction: 'Advanced Technology Portfolio or Market Growth Leadership', supporting_pattern: 'Technology-transition and AI-enabled workflow evidence.', limiting_factor: caution?.requirement ?? 'Direct advanced-technology transition ownership.', next_proof: 'Lead or materially own an advanced-technology pilot or transition.' },
    { horizon: 'Later', direction: 'Enterprise Emerging-Technology Strategy and Growth Executive', supporting_pattern: 'Cross-functional growth, transition planning, and executive communication.', limiting_factor: 'Broader direct domain and operational-adoption proof.', next_proof: 'Document scope, authority, acquisition path, and quantified operational impact.' }
  ];
}
