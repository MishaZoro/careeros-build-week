export function detectPatterns(roles, analyses, evidence) {
  const requirementCounts = new Map();
  roles.forEach((role) => role.requirements.forEach((requirement) => requirementCounts.set(requirement, (requirementCounts.get(requirement) ?? 0) + 1)));
  const persistent = Object.values(analyses).flatMap((analysis) => Object.values(analysis.groups).flat()).filter((item) => item.classification === 'caution' || item.classification === 'gap').map((item) => item.requirement);
  const reusable = evidence.filter((record) => record.related_role_requirements?.length > 1).map((record) => record.id);
  return { shared_requirements: [...requirementCounts].filter(([, count]) => count > 1).map(([requirement]) => requirement), persistent_constraints: [...new Set(persistent)], reusable_evidence: reusable, statement: `Strategic capture and technology-transition evidence is reused across ${roles.length} prepared role directions.` };
}
