import { inheritRestrictions } from './public-demo-validator.mjs';

const matcher = {
  'Full-lifecycle capture leadership': ['full-lifecycle capture', 'capture leadership', 'business development'],
  'Federal opportunity qualification': ['qualification', 'capture operations', 'federal capture'],
  'Customer and stakeholder shaping': ['stakeholder shaping', 'full-lifecycle capture', 'solution shaping'],
  'Partner and teaming strategy': ['partner strategy', 'partner alignment', 'channel development'],
  'Competitive positioning': ['competitive positioning', 'win strategy'],
  'Proposal and pricing alignment': ['proposal strategy', 'proposal alignment'],
  'Pipeline governance': ['pipeline management', 'capture governance'],
  'Executive communication': ['executive communication', 'market intelligence'],
  'Defense-market strategy': ['Army mission communications', 'federal capture', 'mission integration'],
  'Product-to-mission translation': ['product strategy', 'mission translation', 'mission integration'],
  'Partner ecosystem development': ['partner strategy', 'partner alignment', 'channel development'],
  'Technology transition pathways': ['pilot-to-transition', 'technology transition', 'rapid acquisition'],
  'Federal capture leadership': ['capture leadership', 'federal capture', 'full-lifecycle capture'],
  'Mission communications and secure-network fluency': ['tactical communications', 'secure networking', 'tactical networks'],
  'Executive storytelling': ['executive communication', 'market intelligence'],
  'Pipeline development': ['pipeline management', 'capture operations', 'account growth'],
  'Emerging-technology market strategy': ['emerging technology', 'AI strategy', 'market intelligence'],
  'Federal growth leadership': ['account growth', 'business development', 'capture leadership'],
  'Rapid-acquisition fluency': ['rapid acquisition', 'innovation pathways', 'pilot-to-transition'],
  'AI and cybersecurity positioning': ['AI strategy', 'AI-enabled operations', 'cybersecurity'],
  'Partner-led market entry': ['partner strategy', 'channel development', 'go-to-market'],
  'Technology-transition planning': ['technology transition', 'transition planning', 'pilot-to-transition', 'workflow design'],
  'Honest domain-gap management': ['evidence boundaries', 'risk framing', 'adjacent technology positioning']
};

const order = ['direct', 'adjacent', 'transferable', 'caution'];
const phrase = (value) => String(value).toLowerCase();

function matchesFor(requirement, evidence) {
  const terms = matcher[requirement] ?? [];
  const capabilities = evidence.capabilities.map(phrase);
  return terms.filter((term) => capabilities.some((capability) => capability.includes(phrase(term))));
}

function reference(evidence, matchedCapabilities) {
  return {
    id: evidence.id,
    title: evidence.title,
    summary: evidence.summary,
    public_source_label: evidence.public_source_label,
    classification: evidence.classification,
    confidence: evidence.confidence,
    matched_capabilities: matchedCapabilities,
    restrictions: evidence.restrictions
  };
}

export function analyzeRole(role, evidenceRecords) {
  const requirementResults = role.requirements.map((requirement) => {
    const matches = evidenceRecords
      .map((evidence) => ({ evidence, matchedCapabilities: matchesFor(requirement, evidence) }))
      .filter((entry) => entry.matchedCapabilities.length > 0)
      .sort((a, b) => b.evidence.confidence - a.evidence.confidence || order.indexOf(a.evidence.classification) - order.indexOf(b.evidence.classification));

    if (matches.length === 0) {
      return { requirement, classification: 'gap', confidence: 0, explanation: 'No approved Career DNA record matches this requirement.', evidence_references: [], restrictions: { public_summary_only: true, no_contact_details: true, no_private_details: true }, source_record_ids: [] };
    }

    const strongest = matches[0];
    const output = {
      requirement,
      classification: strongest.evidence.classification,
      confidence: strongest.evidence.confidence,
      explanation: `${strongest.evidence.title} matches ${strongest.matchedCapabilities.join(', ')}.`,
      evidence_references: matches.slice(0, 3).map((match) => reference(match.evidence, match.matchedCapabilities))
    };
    return inheritRestrictions(matches.map((match) => match.evidence), output);
  });

  const groups = Object.fromEntries([...order, 'gap'].map((classification) => [classification, requirementResults.filter((result) => result.classification === classification)]));
  const confidence = Math.round(requirementResults.reduce((total, result) => total + result.confidence, 0) / requirementResults.length);
  return inheritRestrictions(evidenceRecords.filter((record) => requirementResults.some((result) => result.source_record_ids.includes(record.id))), {
    role: { id: role.id, title: role.title, summary: role.summary },
    confidence,
    groups,
    deterministic_method: 'Capability phrase matching against approved Career DNA only.'
  });
}
