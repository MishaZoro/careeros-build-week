const classifications = new Set(['direct', 'adjacent', 'transferable', 'caution', 'gap']);
const visibilityValues = new Set(['public_demo', 'private', 'restricted', 'excluded']);
const approvalValues = new Set(['pending', 'approved', 'rejected']);
const restrictionKeys = new Set(['public_summary_only', 'no_contact_details', 'no_private_details']);
const forbiddenKeys = /(?:local_)?path|filename|workbook|private_source|contact_details/i;
const unsafeText = [
  /(?:[a-z]:\\|file:\/\/|\.\.\\|\.\.\/)/i,
  /(?:source_documents|outputs[\\/]careeros|careeros\.xlsx|nikolay valov|@gmail\.com)/i,
  /\.(?:docx|xlsx|pdf|m4a|vtt)(?:\s|$)/i
];

const evidenceFields = [
  'id', 'title', 'summary', 'source_type', 'public_source_label', 'classification', 'confidence',
  'visibility', 'approval_status', 'approved_by', 'approved_at', 'restrictions', 'capabilities',
  'organizations', 'customers_or_agencies', 'related_role_requirements'
];

function includesUnsafeText(value) {
  return typeof value === 'string' && unsafeText.some((pattern) => pattern.test(value));
}

function hasUnsafeValue(value, fieldName = '') {
  if (fieldName === 'approved_by') return false;
  if (typeof value === 'string') return includesUnsafeText(value);
  if (Array.isArray(value)) return value.some((item) => hasUnsafeValue(item));
  if (value && typeof value === 'object') return Object.entries(value).some(([key, item]) => hasUnsafeValue(item, key));
  return false;
}

function validRestrictions(restrictions) {
  return restrictions && typeof restrictions === 'object' && !Array.isArray(restrictions)
    && Object.keys(restrictions).every((key) => restrictionKeys.has(key) && typeof restrictions[key] === 'boolean');
}

export function validateRecord(record, type = 'evidence') {
  const errors = [];
  const required = type === 'evidence'
    ? evidenceFields
    : ['id', 'title', 'summary', 'requirements', 'visibility', 'approval_status', 'approved_by', 'approved_at', 'restrictions'];

  for (const field of required) {
    if (record?.[field] === undefined || record[field] === null || record[field] === '') errors.push(`missing:${field}`);
  }
  if (!visibilityValues.has(record?.visibility)) errors.push('invalid:visibility');
  if (!approvalValues.has(record?.approval_status)) errors.push('invalid:approval_status');
  if (record?.visibility !== 'public_demo') errors.push('not_public_demo');
  if (record?.approval_status !== 'approved') errors.push('not_approved');
  if (!record?.approved_by) errors.push('missing:approved_by');
  if (!record?.approved_at) errors.push('missing:approved_at');
  if (record?.approved_at && Number.isNaN(Date.parse(record.approved_at))) errors.push('invalid:approved_at');
  if (type === 'evidence' && !classifications.has(record?.classification)) errors.push('invalid:classification');
  if (type === 'evidence' && (!Number.isInteger(record?.confidence) || record.confidence < 0 || record.confidence > 100)) errors.push('invalid:confidence');
  if (!validRestrictions(record?.restrictions)) errors.push('invalid:restrictions');
  if (Object.keys(record ?? {}).some((key) => forbiddenKeys.test(key))) errors.push('forbidden:field');
  if (hasUnsafeValue(record)) errors.push('unsafe:source_or_value');

  return { accepted: errors.length === 0, errors };
}

export function validateCollection(records, type) {
  const accepted = [];
  const rejected = [];
  for (const record of records) {
    const result = validateRecord(record, type);
    (result.accepted ? accepted : rejected).push(result.accepted ? record : { id: record?.id ?? 'unknown', errors: result.errors });
  }
  return { accepted, rejected };
}

export function inheritRestrictions(sourceRecords, output) {
  const restrictions = Object.fromEntries([...restrictionKeys].map((key) => [key, sourceRecords.some((record) => record.restrictions?.[key] === true)]));
  return { ...output, restrictions, source_record_ids: sourceRecords.map((record) => record.id) };
}
