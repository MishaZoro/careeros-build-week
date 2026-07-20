const status = document.querySelector('#data-status');
const roleSelector = document.querySelector('#role-selector');
const analysis = document.querySelector('#analysis');
const comparison = document.querySelector('#comparison');
const timeline = document.querySelector('#timeline');
const input = document.querySelector('#achievement-input');
const achievementStatus = document.querySelector('#achievement-status');
const drawer = document.querySelector('#evidence-drawer');
const drawerContent = document.querySelector('#drawer-content');
const summary = document.querySelector('#career-dna-summary');
const nextActionCard = document.querySelector('#next-action-card');
const horizonPanel = document.querySelector('#career-horizon');
const futureValue = document.querySelector('#future-value');
let roles = [];
let baselineEvidence = [];
let sessionEntries = [];
let lastGrowth;
let guidedStep = 0;

const guidedSteps = [
  ['Career DNA', 'CareerOS begins with governed evidence, not resume keywords. It preserves past work and the foundation for what may come next.'],
  ['Current Readiness', 'CareerOS explains what the existing evidence supports today. ROLE-003 shows the strongest before-and-after learning path.'],
  ['Career Horizon', 'CareerOS identifies an evidence-supported direction, a persistent limitation, and the next proof to intentionally build.'],
  ['Add Achievement', 'New work becomes future leverage only when responsibility, context, and result are captured. Load the Synthetic Build Week Demonstration.'],
  ['What Changed', 'Relevant evidence strengthened one requirement. It did not erase unsupported domain gaps.'],
  ['Future Value', 'CareerOS connects today\'s achievement to tomorrow\'s options without overstating what the evidence proves.'],
  ['Next Action', 'CareerOS identifies the next evidence the professional should build.'],
  ['Lifelong Companion', 'CareerOS remembers the past, explains the present, and helps build evidence required for what comes next.']
];

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

function fitLabel(result) {
  if (result.confidence >= 85) return 'Strong Direct Fit';
  if (result.confidence >= 70) return 'Strong Adjacent Fit';
  return 'Strategic Stretch';
}

function renderSummary() {
  const counts = ['direct', 'adjacent', 'transferable', 'caution'].map((name) => [name, baselineEvidence.filter((record) => record.classification === name).length]);
  const capabilityCounts = new Map();
  baselineEvidence.forEach((record) => record.capabilities.forEach((capability) => capabilityCounts.set(capability, (capabilityCounts.get(capability) ?? 0) + 1)));
  const strongest = [...capabilityCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([capability]) => capability).join(', ');
  const sourceCount = new Set(baselineEvidence.map((record) => record.source_type)).size;
  summary.innerHTML = `<article><strong>${baselineEvidence.length}</strong><span>approved baseline records</span></article><article><strong>${sessionEntries.length}</strong><span>active session records</span></article><article><strong>${counts.map(([name, count]) => `${count} ${name}`).join(' | ')}</strong><span>evidence classifications</span></article><article><strong>${sourceCount}</strong><span>public-safe source categories</span></article><article class="summary-wide"><strong>Most-supported capabilities</strong><span>${escapeHtml(strongest || 'Loading capability evidence.')}</span></article>`;
}

function renderNextAction(text, result) {
  const caution = result ? Object.values(result.groups).flat().find((item) => item.classification === 'caution') : undefined;
  nextActionCard.innerHTML = `<h3>Next evidence-building action</h3><p><strong>${escapeHtml(text || 'Select a target role to see the deterministic recommendation.')}</strong></p>${caution ? `<p class="footnote">Related requirement: ${escapeHtml(caution.requirement)}. Limitation remains visible until direct evidence exists.</p>` : ''}<p class="footnote">Suggested evidence type: direct ownership, quantified outcome, customer validation, or transition proof.</p>`;
}

function renderHorizon(data) {
  const h = data.horizon;
  horizonPanel.innerHTML = `<h2>Your Career Horizon</h2><p><strong>Current position:</strong> ${escapeHtml(h.current_position)}</p><p><strong>Emerging direction:</strong> ${escapeHtml(h.emerging_direction)}</p><p><strong>Persistent constraint:</strong> ${escapeHtml(h.persistent_constraint)}</p><p><strong>Forward readiness:</strong> ${escapeHtml(h.forward_readiness.state)} - ${escapeHtml(h.forward_readiness.requirement)} (${escapeHtml(h.forward_readiness.current_classification)})</p><p><strong>Next evidence to build:</strong> ${escapeHtml(h.forward_readiness.evidence_to_capture)}</p><h3>Evidence-supported directions</h3><p>${h.directions.map(escapeHtml).join(' | ')}</p><h3>Career Trajectory</h3>${data.trajectory.map((item) => `<article class="record"><strong>${escapeHtml(item.horizon)}: ${escapeHtml(item.direction)}</strong><p>${escapeHtml(item.supporting_pattern)}</p><small>Limiting factor: ${escapeHtml(item.limiting_factor)} | Next proof: ${escapeHtml(item.next_proof)}</small></article>`).join('')}<p class="footnote">Pattern: ${escapeHtml(data.patterns.statement)} Persistent constraints: ${escapeHtml(data.patterns.persistent_constraints.join(' | ') || 'None')}</p>`;
}

async function loadForwardIntelligence() {
  const response = await fetch(`/forward-intelligence.json?role=${encodeURIComponent(roleSelector.value || 'ROLE-003')}`);
  if (!response.ok) throw new Error('Career Horizon is unavailable.');
  renderHorizon(await response.json());
}

function showEvidence(result) {
  const evidence = result.evidence_references.map((item) => `<article class="record"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.summary)}</p><small>${escapeHtml(item.id)} | ${escapeHtml(item.public_source_label)} | ${item.confidence}% confidence</small></article>`).join('') || '<p>No supporting evidence is available for this requirement.</p>';
  drawerContent.innerHTML = `<h2>${escapeHtml(result.requirement)}</h2><p>${escapeHtml(result.explanation)}</p>${evidence}<p class="footnote">Evidence details are public-safe. Restrictions are inherited; contact and private details are not shown.</p>`;
  drawer.showModal();
}

function renderAnalysis(result, title = 'Baseline readiness') {
  if (!result?.groups) {
    analysis.innerHTML = '<section class="status"><h2>Analysis unavailable</h2><p>Select a prepared target role to load deterministic evidence analysis.</p></section>';
    return;
  }
  analysis.replaceChildren();
  analysis.insertAdjacentHTML('beforeend', `<section class="status"><h2>${escapeHtml(title)}</h2><p><strong>${result.confidence}%</strong> deterministic evidence confidence | ${escapeHtml(fitLabel(result))}</p><p class="footnote">${escapeHtml(result.deterministic_method)}</p></section>`);
  for (const [classification, requirements] of Object.entries(result.groups)) {
    const section = document.createElement('section');
    section.className = `analysis-group ${classification}`;
    section.innerHTML = `<h3>${classification === 'gap' ? 'Gap / Unsupported' : classification} <span class="badge ${classification}">${classification}</span></h3>`;
    if (!requirements.length) section.insertAdjacentHTML('beforeend', '<p class="footnote">No requirement in this group.</p>');
    requirements.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'requirement-card';
      card.innerHTML = `<h4>${escapeHtml(item.requirement)}</h4><p>${item.confidence}% confidence</p><p>${escapeHtml(item.explanation)}</p>`;
      const button = document.createElement('button');
      button.textContent = 'Why?'; button.setAttribute('aria-label', `Why ${item.requirement}`); button.onclick = () => showEvidence(item);
      card.append(button); section.append(card);
    });
    analysis.append(section);
  }
}

async function requestGrowth(entries) {
  const response = await fetch('/growth-loop.json', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role_id: roleSelector.value, entries }) });
  let body;
  try { body = await response.json(); } catch { body = { error: 'The local server returned an unreadable response.' }; }
  return { ok: response.ok, body };
}

function renderGrowth(growth) {
  lastGrowth = growth;
  renderSummary();
  renderAnalysis(growth.active, `Active readiness | ${growth.active_record_count} Career DNA records`);
  const changed = growth.comparison.materially_changed;
  const unchangedCaution = growth.comparison.unchanged.find((change) => change.after_classification === 'caution');
  comparison.innerHTML = `<section class="status"><h2>What Changed</h2><p>${changed.length ? `Relevant evidence changed ${changed.length} role requirement${changed.length === 1 ? '' : 's'}.` : 'This achievement was added to Career DNA but did not materially change readiness for this target role.'}</p><div class="comparison-grid">${changed.map((change) => `<article class="change-card"><strong>${escapeHtml(change.requirement)}</strong><p>${escapeHtml(change.before_classification)} ${change.before_confidence}% -> ${escapeHtml(change.after_classification)} ${change.after_confidence}%</p><p>${escapeHtml(change.reason)}</p><small>${escapeHtml(change.new_evidence[0]?.id)} | ${escapeHtml(change.limitation)}</small></article>`).join('')}</div>${unchangedCaution ? `<p class="footnote">Still caution: ${escapeHtml(unchangedCaution.requirement)} remains ${unchangedCaution.after_classification}. Unsupported domain gaps are not erased.</p>` : ''}<p><strong>Next action:</strong> ${escapeHtml(growth.next_action)}</p></section>`;
  timeline.innerHTML = `<h2>Career Timeline</h2>${growth.timeline.map((entry) => `<article class="record"><strong>${escapeHtml(entry.title)}</strong><p>${entry.capabilities_added.map(escapeHtml).join(' | ')}</p><small>${escapeHtml(entry.achievement_date)} | ${escapeHtml(entry.evidence_status)} | ${escapeHtml(entry.visibility)} | ${escapeHtml(entry.approval_status)} | ${escapeHtml(entry.related_role)} | readiness ${entry.readiness_changed ? 'changed' : 'unchanged'}</small></article>`).join('')}`;
  renderNextAction(growth.next_action, growth.active);
  futureValue.innerHTML = `<h2>Future Value of Recent Evidence</h2><p><strong>Capability strengthened:</strong> Technology-transition planning and AI-enabled operations.</p><p><strong>Selected-role impact:</strong> ${growth.active.confidence}% active readiness for the selected role.</p><p><strong>Adjacent-role relevance:</strong> May be reused where AI workflow modernization or technology transition is relevant.</p><p><strong>Remaining limitation:</strong> It does not establish direct space, autonomy, or quantum ownership.</p><p><strong>Recommended follow-on evidence:</strong> ${escapeHtml(growth.next_action_detail?.evidence_to_capture ?? 'Direct ownership, customer context, and quantified operational outcome.')}</p>`;
}

async function loadRoleAnalysis() {
  if (!roleSelector.value) { renderAnalysis(); return; }
  const response = await fetch(`/analysis.json?role=${encodeURIComponent(roleSelector.value)}`);
  if (!response.ok) throw new Error('Analysis is unavailable for the selected role.');
  const result = await response.json();
  renderAnalysis(result);
  renderNextAction('Add direct evidence for the visible caution or gap before treating it as a strength.', result);
}

async function loadBaseline() {
  const response = await fetch('/demo-data.json?dataset=career-dna');
  if (!response.ok) throw new Error('Approved Career DNA could not be loaded.');
  const data = await response.json();
  if (!Array.isArray(data.evidence) || !Array.isArray(data.roles)) throw new Error('Approved Career DNA response is malformed.');
  baselineEvidence = data.evidence; roles = data.roles;
  roleSelector.replaceChildren(...roles.map((role) => new Option(role.title, role.id)));
  document.querySelector('#approved-count').textContent = `(${data.evidence.length})`;
  document.querySelector('#role-count').textContent = `(${data.roles.length})`;
  document.querySelector('#evidence-list').innerHTML = data.evidence.map((item) => `<article class="record"><span class="badge ${escapeHtml(item.classification)}">${escapeHtml(item.classification)}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.summary)}</p><small>${item.confidence}% confidence | ${escapeHtml(item.public_source_label)}</small></article>`).join('');
  const analyses = await Promise.all(data.roles.map(async (role) => ({ role, result: await (await fetch(`/analysis.json?role=${encodeURIComponent(role.id)}`)).json() })));
  document.querySelector('#role-list').innerHTML = analyses.map(({ role, result }) => `<article class="record"><strong>${escapeHtml(role.title)}</strong><p>${escapeHtml(fitLabel(result))} | ${result.confidence}% readiness</p><small>${escapeHtml(role.requirements.join(' | '))}</small></article>`).join('');
  status.textContent = 'Approved Career DNA loaded. Every conclusion is traceable to public-safe evidence.';
  renderSummary(); await loadRoleAnalysis();
  await loadForwardIntelligence();
}

async function validateDraft() {
  try {
    const entry = JSON.parse(input.value);
    const result = await requestGrowth([entry]);
    achievementStatus.textContent = result.ok ? 'Achievement validated. It has not yet been added to Active Career DNA.' : `Validation failed: ${result.body.validations?.[0]?.errors?.join(', ') ?? result.body.error ?? 'Unknown validation error.'}`;
    return result;
  } catch { achievementStatus.textContent = 'Validation failed: enter valid JSON or load the prepared fixture.'; return { ok: false }; }
}

async function resetSession() {
  sessionEntries = []; lastGrowth = undefined; comparison.replaceChildren();
  timeline.innerHTML = '<h2>Career Timeline</h2><p class="footnote">Session reset restored baseline analysis. Approved baseline evidence remains read-only.</p>';
  achievementStatus.textContent = 'Session evidence cleared. The approved baseline was never changed.';
  renderSummary(); futureValue.innerHTML = '<h2>Future Value of Recent Evidence</h2><p class="footnote">No session evidence is active. Add a validated achievement to see future value without changing the approved baseline.</p>'; await loadRoleAnalysis(); await loadForwardIntelligence();
}

document.querySelector('#load-fixture').onclick = async () => {
  try { input.value = JSON.stringify(await (await fetch('/growth-fixture.json')).json(), null, 2); achievementStatus.textContent = 'Synthetic Build Week Demonstration loaded. It is not a historical accomplishment.'; }
  catch { achievementStatus.textContent = 'Fixture load failed. Reset Demo and try again.'; }
};
document.querySelector('#validate-achievement').onclick = validateDraft;
document.querySelector('#add-achievement').onclick = async () => {
  const draft = await validateDraft(); if (!draft.ok) return;
  const entry = JSON.parse(input.value);
  if (sessionEntries.some((item) => item.id === entry.id)) { achievementStatus.textContent = 'Duplicate achievement: this entry is already in Active Career DNA.'; return; }
  sessionEntries.push(entry);
  const growth = await requestGrowth(sessionEntries);
  if (!growth.ok) { sessionEntries.pop(); achievementStatus.textContent = `Achievement was not added: ${growth.body.error ?? 'local validation failed.'}`; return; }
  renderGrowth(growth.body); achievementStatus.textContent = 'CareerOS updated Active Career DNA. The approved baseline remains unchanged.';
};
document.querySelector('#reset-session').onclick = resetSession;
roleSelector.onchange = async () => { await resetSession(); };
document.querySelector('#close-drawer').onclick = () => drawer.close();

function revealGuidedSection(selector) {
  const section = document.querySelector(selector);
  if (!section) return;
  section.open = true;
  section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

function renderGuided() {
  const [title, copy] = guidedSteps[guidedStep];
  document.querySelector('#guided-panel').hidden = false;
  document.querySelector('#guided-progress').textContent = `Guided Demo | Step ${guidedStep + 1} of ${guidedSteps.length}`;
  document.querySelector('#guided-title').textContent = title;
  document.querySelector('#guided-copy').textContent = copy;
  document.querySelector('#guided-back').disabled = guidedStep === 0;
  document.querySelector('#guided-next').textContent = guidedStep === guidedSteps.length - 1 ? 'Finish' : 'Next';
  if (guidedStep === 1 && roleSelector.value !== 'ROLE-003') { roleSelector.value = 'ROLE-003'; resetSession(); }
  if ([3, 4, 5].includes(guidedStep)) revealGuidedSection('#evidence-workbench-details');
  if (guidedStep === 3) document.querySelector('#load-fixture').focus();
  if (guidedStep === 7) document.querySelector('#guided-status').textContent = 'Guided demo complete. Explore Career DNA or restart the synthetic session.';
}
document.querySelector('#start-guided').onclick = () => { guidedStep = 0; renderGuided(); };
document.querySelector('#guided-next').onclick = () => { if (guidedStep < guidedSteps.length - 1) { guidedStep += 1; renderGuided(); } else document.querySelector('#guided-panel').hidden = true; };
document.querySelector('#guided-back').onclick = () => { if (guidedStep) { guidedStep -= 1; renderGuided(); } };
document.querySelector('#guided-exit').onclick = () => document.querySelector('#guided-panel').hidden = true;
document.querySelector('#reset-demo').onclick = async () => {
  if (confirm('Reset active session evidence and restart the guided demo?')) { await resetSession(); guidedStep = 0; document.querySelector('#guided-panel').hidden = true; document.querySelector('#guided-status').textContent = 'Demo reset. Approved Career DNA remains unchanged.'; }
};

loadBaseline().catch((error) => { status.textContent = `CareerOS could not load the local demo: ${error.message}`; renderAnalysis(); });
