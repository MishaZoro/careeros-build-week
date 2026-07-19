const visibility = new Set(['public_demo', 'private', 'restricted', 'excluded']);
const approval = new Set(['pending', 'approved', 'rejected']);
const classifications = new Set(['direct', 'adjacent', 'transferable', 'caution', 'gap']);
const required = ['entry_id', 'title', 'achievement_date', 'summary', 'action_taken', 'capabilities', 'evidence_source_label', 'confidence', 'visibility', 'approval_status', 'restrictions', 'created_at'];
const unsafe = [/[a-z]:\\|file:\/\/|\.\.\\|\.\.\//i, /\.(?:docx|xlsx|pdf|m4a|vtt)(?:\s|$)/i, /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i, /\b\d{3}[-.)\s]\d{3}[-.\s]\d{4}\b/i, /\b(recruiter|interviewer|court|legal|financial|bank account|social security|personal address)\b/i, /source_documents|outputs[\\/]careeros|careeros\.xlsx/i];

export function privateAchievementDefaults(now) {
  return { visibility: 'private', approval_status: 'pending', restrictions: { public_summary_only: false, no_contact_details: true, no_private_details: true }, created_at: now };
}

export function validateAchievement(entry, roles) {
  const errors = [];
  for (const field of required) if (entry?.[field] === undefined || entry[field] === null || entry[field] === '') errors.push(`missing:${field}`);
  if (!visibility.has(entry?.visibility)) errors.push('invalid:visibility');
  if (!approval.has(entry?.approval_status)) errors.push('invalid:approval_status');
  const admitted = (entry?.visibility === 'private' && entry?.approval_status === 'pending') || (entry?.visibility === 'public_demo' && entry?.approval_status === 'approved' && entry?.synthetic_fixture === true && entry?.approved_by === 'Synthetic Build Week Fixture' && entry?.approved_at);
  if (!admitted) errors.push('invalid:session_admission');
  if (!Number.isInteger(entry?.confidence) || entry.confidence < 0 || entry.confidence > 100) errors.push('invalid:confidence');
  if (!entry?.restrictions || typeof entry.restrictions !== 'object') errors.push('missing:restrictions');
  if (!Array.isArray(entry?.capabilities) || !entry.capabilities.length) errors.push('invalid:capabilities');
  if (entry?.classification && !classifications.has(entry.classification)) errors.push('invalid:classification');
  if (!roles.some((role) => role.id === entry?.related_role_id)) errors.push('unknown:role_id');
  const role = roles.find((item) => item.id === entry?.related_role_id);
  if (role && (!Array.isArray(entry.related_role_requirements) || entry.related_role_requirements.some((requirement) => !role.requirements.includes(requirement)))) errors.push('unknown:role_requirement');
  if (unsafe.some((rule) => rule.test(JSON.stringify(entry)))) errors.push('unsafe:content');
  if (entry?.visibility === 'public_demo' && !admitted) errors.push('unauthorized:public_approval');
  return { accepted: errors.length === 0, errors };
}

export function transformAchievement(entry, timestamp) {
  return {
    id: `SESSION-${entry.entry_id}`, title: entry.title, summary: entry.summary, source_type: 'achievement_entry',
    public_source_label: entry.visibility === 'public_demo' ? entry.evidence_source_label : 'User-owned Career DNA workspace achievement',
    classification: entry.classification ?? (entry.confidence >= 80 ? 'direct' : 'adjacent'), confidence: entry.confidence,
    visibility: entry.visibility, approval_status: entry.approval_status, approved_by: entry.approved_by ?? '', approved_at: entry.approved_at ?? '',
    restrictions: entry.restrictions, capabilities: entry.capabilities, organizations: entry.organizations ?? [], customers_or_agencies: entry.customers_or_agencies ?? [],
    related_role_id: entry.related_role_id, related_role_requirements: [...entry.related_role_requirements], achievement_date: entry.achievement_date, created_at: entry.created_at, evidence_status: 'session', limitation: entry.limitation ?? 'Outcome or limitation not recorded.',
    lineage: { source_entry_id: entry.entry_id, source_type: 'achievement_entry', transformation_timestamp: timestamp, validator_version: 'Milestone 5 achievement validator', validator_result: 'accepted', baseline_or_session: 'session', originating_role_id: entry.related_role_id, synthetic_fixture: entry.synthetic_fixture === true }
  };
}
