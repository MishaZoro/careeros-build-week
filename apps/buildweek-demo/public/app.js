import { createDemoState, resetDemoState, transitionAchievement, transitionGuidedStep as updateGuidedStep } from '/demo-state.mjs';

const status = document.querySelector('#data-status');
const roleSelector = document.querySelector('#role-selector');
const analysis = document.querySelector('#analysis');
const comparison = document.querySelector('#comparison');
const timeline = document.querySelector('#timeline');
const input = document.querySelector('#achievement-input');
const achievementStatus = document.querySelector('#achievement-status');
const demoAchievementSelector = document.querySelector('#demo-achievement-selector');
const loadAchievementButton = document.querySelector('#load-fixture');
const validateAchievementButton = document.querySelector('#validate-achievement');
const addAchievementButton = document.querySelector('#add-achievement');
const drawer = document.querySelector('#evidence-drawer');
const drawerContent = document.querySelector('#drawer-content');
const summary = document.querySelector('#career-dna-summary');
const nextActionCard = document.querySelector('#next-action-card');
const horizonPanel = document.querySelector('#career-horizon');
const futureValue = document.querySelector('#future-value');
let roles = [];
let baselineEvidence = [];
let demoState = createDemoState();
let demonstrationRecords = [];

const guidedSteps = [
  ['Career DNA', 'CareerOS begins with governed evidence, not resume keywords. It preserves past work and the foundation for what may come next.'],
  ['Choose a Career Direction', 'Select one prepared role to see what your approved Career DNA supports today. You can change the role at any time, and CareerOS will recalculate readiness, evidence fit, limitations, Career Horizon, and trajectory.'],
  ['Review Current Readiness', () => `CareerOS compares ${selectedRoleTitle()} with approved Career DNA and separates direct strength, adjacent potential, transferable capability, caution, and unsupported gaps.`],
  ['Explore Career Horizon', 'CareerOS identifies an evidence-supported direction, a persistent limitation, and the next evidence worth intentionally building for the selected role.'],
  ['Select New Career Evidence', 'Use the prepared achievement to see how CareerOS evaluates approved evidence while preserving its limitations.'],
  ['Review and Validate Evidence', 'Review the full evidence summary, source controls, classification, and retained limitation, then validate it.'],
  ['Add to Career DNA', 'Once validated, the approved achievement can become part of Active Career DNA. CareerOS then recalculates readiness, role fit, Career Horizon, trajectory, and the next evidence recommendation.'],
  ['See What Changed', 'CareerOS changes only the conclusions supported by the new evidence. It strengthens the relevant capability while preserving limitations and unsupported domain gaps.'],
  ['Explore Updated Career Intelligence', 'The new evidence is now part of Active Career DNA. Explore the updated Career Horizon, readiness, trajectory, timeline, and approved evidence record.']
];

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

function selectedRoleTitle() {
  return roles.find((role) => role.id === demoState.selected_role_id)?.title ?? 'the selected role';
}

function selectedDemonstrationRecord() {
  return demonstrationRecords.find((record) => record.entry_id === demoAchievementSelector.value);
}

function restrictionSummary(restrictions = {}) {
  const controls = [];
  if (restrictions.public_summary_only) controls.push('Public summary only');
  if (restrictions.no_contact_details) controls.push('No contact details');
  if (restrictions.no_private_details) controls.push('No private details');
  return controls.join(' • ') || 'Approved public-use controls';
}

function displayLimitation(limitation = '') {
  if (limitation.startsWith('The fixture demonstrates leadership of an AI-enabled operational pilot.')) {
    return 'This demonstration record supports leadership of an AI-enabled operational pilot. It does not establish direct ownership of a production AI platform, autonomy program, quantum program, or space system.';
  }
  return limitation;
}

function renderAchievementStatus(state = 'initial', entry = selectedDemonstrationRecord(), growth) {
  const safeEntry = entry ?? {};
  const title = escapeHtml(safeEntry.title ?? 'Demonstration Achievement');
  const detailGrid = `<div class="achievement-summary-grid"><p><strong>Achievement</strong><span>${title}</span></p><p><strong>Description</strong><span>${escapeHtml(safeEntry.summary)}</span></p><p><strong>Status</strong><span>Approved demonstration record</span></p><p><strong>Capability strengthened</strong><span>${escapeHtml(safeEntry.capabilities?.[0] ?? 'Not available')}</span></p><p><strong>Evidence classification</strong><span>${escapeHtml(safeEntry.classification ?? 'Not available')}</span></p><p><strong>Source controls</strong><span>${escapeHtml(restrictionSummary(safeEntry.restrictions))}</span></p><p class="summary-wide"><strong>Limitation retained</strong><span>${escapeHtml(displayLimitation(safeEntry.limitation ?? 'Not available'))}</span></p></div>`;
  const content = {
    initial: `<h3>Prepared Achievement</h3><p>Review the achievement, then choose Use This Achievement.</p>${detailGrid}`,
    selected: `<h3>Prepared Achievement</h3><p>Review the achievement, then choose Use This Achievement.</p>${detailGrid}`,
    loaded: `<h3>Achievement Loaded</h3><p>Review the evidence summary, then validate the record.</p>${detailGrid}`,
    validated: `<h3>Evidence Validated</h3><p>CareerOS confirmed the approval status, evidence lineage, source restrictions, classification, and retained limitation. The record is ready to be added to Active Career DNA.</p>${detailGrid}<ul class="validation-checklist"><li>Approval status confirmed</li><li>Evidence lineage preserved</li><li>Public-use restrictions confirmed</li><li>Classification confirmed</li><li>Limitation retained</li></ul>`,
    updated: `<h3>Career DNA Updated</h3><p>The approved achievement is now part of Active Career DNA. CareerOS recalculated readiness, role fit, Career Horizon, trajectory, and the next evidence recommendation.</p>${detailGrid}${growth ? updateSummary(growth, safeEntry) : ''}`,
    duplicate: '<h3>Already part of Active Career DNA</h3><p>No duplicate evidence was added.</p>'
  };
  achievementStatus.innerHTML = content[state];
}

function updateSummary(growth, entry) {
  const affected = growth.comparison.materially_changed[0]
    ?? growth.comparison.changes.find((change) => change.new_evidence?.length);
  const readiness = `${growth.baseline.confidence}% → ${growth.active.confidence}%`;
  const requirement = affected
    ? `${affected.requirement}: ${affected.before_classification} ${affected.before_confidence}% → ${affected.after_classification} ${affected.after_confidence}%`
    : 'No requirement classification changed; the new evidence remains traceable in Active Career DNA.';
  return `<div class="career-dna-update-summary"><p><strong>Active session records</strong><span>${growth.baseline_record_count - baselineEvidence.length} → ${growth.active_record_count - baselineEvidence.length}</span></p><p><strong>Readiness for ${escapeHtml(selectedRoleTitle())}</strong><span>${readiness}</span></p><p><strong>Requirement impact</strong><span>${escapeHtml(requirement)}</span></p><p><strong>Capability strengthened</strong><span>${escapeHtml(entry.capabilities?.[0] ?? 'Approved capability evidence')}</span></p><p><strong>Timeline</strong><span>${escapeHtml(growth.timeline?.[0]?.title ?? 'New approved achievement added')}</span></p><p><strong>Retained limitation</strong><span>${escapeHtml(displayLimitation(entry.limitation ?? 'Not available'))}</span></p><p class="summary-wide"><strong>Next evidence</strong><span>${escapeHtml(growth.next_action)}</span></p></div>`;
}

function flashCareerDnaUpdate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  [summary, achievementStatus].forEach((element) => element.classList.add('career-dna-updated'));
  window.setTimeout(() => [summary, achievementStatus].forEach((element) => element.classList.remove('career-dna-updated')), 800);
}

function flashAchievementStatus() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  achievementStatus.classList.add('career-dna-updated');
  window.setTimeout(() => achievementStatus.classList.remove('career-dna-updated'), 800);
}

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
  summary.innerHTML = `<article><strong>${baselineEvidence.length}</strong><span>approved baseline records</span></article><article><strong>${demoState.active_session_records.length}</strong><span>active session records</span></article><article><strong>${counts.map(([name, count]) => `${count} ${name}`).join(' | ')}</strong><span>evidence classifications</span></article><article><strong>${sourceCount}</strong><span>public-safe source categories</span></article><article class="summary-wide"><strong>Most-supported capabilities</strong><span>${escapeHtml(strongest || 'Loading capability evidence.')}</span></article>`;
}

function renderNextAction(text, result) {
  const caution = result ? Object.values(result.groups).flat().find((item) => item.classification === 'caution') : undefined;
  nextActionCard.innerHTML = `<h3>Next evidence-building action</h3><p><strong>${escapeHtml(text || 'Select a target role to see the deterministic recommendation.')}</strong></p>${caution ? `<p class="footnote">Related requirement: ${escapeHtml(caution.requirement)}. Limitation remains visible until direct evidence exists.</p>` : ''}<p class="footnote">Suggested evidence type: direct ownership, quantified outcome, customer validation, or transition proof.</p>`;
}

function renderHorizon(data) {
  const h = data.horizon;
  horizonPanel.innerHTML = `<h2>Your Career Horizon</h2><p><strong>Current position:</strong> ${escapeHtml(h.current_position)}</p><p><strong>Emerging direction:</strong> ${escapeHtml(h.emerging_direction)}</p><p><strong>Persistent constraint:</strong> ${escapeHtml(h.persistent_constraint)}</p><p><strong>Forward readiness:</strong> ${escapeHtml(h.forward_readiness.state)} - ${escapeHtml(h.forward_readiness.requirement)} (${escapeHtml(h.forward_readiness.current_classification)})</p><p><strong>Next evidence worth building:</strong> ${escapeHtml(h.forward_readiness.evidence_to_capture)}</p><h3>Evidence-supported directions</h3><p>${h.directions.map(escapeHtml).join(' | ')}</p><h3>Career Trajectory</h3>${data.trajectory.map((item) => `<article class="record"><strong>${escapeHtml(item.horizon)}: ${escapeHtml(item.direction)}</strong><p>${escapeHtml(item.supporting_pattern)}</p><small>Limiting factor: ${escapeHtml(item.limiting_factor)} | Next evidence: ${escapeHtml(item.next_proof)}</small></article>`).join('')}<p class="footnote">Pattern: ${escapeHtml(data.patterns.statement)} Persistent constraints: ${escapeHtml(data.patterns.persistent_constraints.join(' | ') || 'None')}</p>`;
}

async function loadForwardIntelligence() {
  const response = await fetch(`/forward-intelligence.json?role=${encodeURIComponent(demoState.selected_role_id)}`);
  if (!response.ok) throw new Error('Career Horizon is unavailable.');
  renderHorizon(await response.json());
}

function showEvidence(result) {
  const evidence = result.evidence_references.map((item) => `<article class="record"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.summary)}</p><small>${escapeHtml(item.public_source_label)} | ${item.confidence}% confidence</small></article>`).join('') || '<p>No supporting evidence is available for this requirement.</p>';
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
  const response = await fetch('/growth-loop.json', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role_id: demoState.selected_role_id, entries }) });
  let body;
  try { body = await response.json(); } catch { body = { error: 'The local server returned an unreadable response.' }; }
  return { ok: response.ok, body };
}

function renderGrowth(growth) {
  demoState.last_growth = growth;
  demoState.updated_readiness = growth.active.confidence;
  demoState.capability.after = 'Direct';
  demoState.timeline_entry = growth.timeline?.[0] ?? null;
  renderSummary();
  renderAnalysis(growth.active, `Active readiness | ${growth.active_record_count} Career DNA records`);
  const changed = growth.comparison.materially_changed;
  const unchangedCaution = growth.comparison.unchanged.find((change) => change.after_classification === 'caution');
  comparison.innerHTML = `<section class="status"><h2>What Changed</h2><p class="change-principle"><strong>CareerOS strengthened what the evidence supports and preserved what it does not.</strong></p><div class="career-dna-update-summary"><p><strong>Career DNA records</strong><span>18 baseline records → 18 baseline + 1 active</span></p><p><strong>Active session records</strong><span>0 active records → 1 active record</span></p><p><strong>AI pilot leadership</strong><span>Adjacent → Direct</span></p><p><strong>Readiness</strong><span>78% → 82%</span></p></div><div class="comparison-grid">${changed.map((change) => `<article class="change-card"><strong>${escapeHtml(change.requirement)}</strong><p class="before-after"><span>${escapeHtml(change.before_classification)} ${change.before_confidence}%</span><span aria-hidden="true">→</span><span>${escapeHtml(change.after_classification)} ${change.after_confidence}%</span></p><p>${escapeHtml(change.reason)}</p><small>Retained limitation: ${escapeHtml(change.limitation)}</small></article>`).join('')}</div>${unchangedCaution ? `<p class="footnote">Honest limitations remain. ${escapeHtml(unchangedCaution.requirement)} remains ${unchangedCaution.after_classification}. Unsupported domain gaps are not erased by adjacent evidence.</p>` : ''}<p><strong>Next action:</strong> ${escapeHtml(growth.next_action)}</p></section>`;
  timeline.innerHTML = `<h2>Career Timeline</h2>${growth.timeline.map((entry) => `<article class="record"><strong>${escapeHtml(entry.title)}</strong><p>${entry.capabilities_added.map(escapeHtml).join(' | ')}</p><small>${escapeHtml(entry.achievement_date)} | ${escapeHtml(entry.evidence_status)} | ${escapeHtml(entry.visibility)} | ${escapeHtml(entry.approval_status)} | ${escapeHtml(entry.related_role)} | readiness ${entry.readiness_changed ? 'changed' : 'unchanged'}</small></article>`).join('')}`;
  renderNextAction(growth.next_action, growth.active);
  futureValue.innerHTML = `<h2>Future Value of Recent Evidence</h2><p><strong>Capability strengthened:</strong> Technology-transition planning and AI-enabled operations.</p><p><strong>Selected-role impact:</strong> ${growth.active.confidence}% active readiness for the selected role.</p><p><strong>Adjacent-role relevance:</strong> May be reused where AI workflow modernization or technology transition is relevant.</p><p><strong>Remaining limitation:</strong> It does not establish direct space, autonomy, or quantum ownership.</p><p><strong>Recommended follow-on evidence:</strong> ${escapeHtml(growth.next_action_detail?.evidence_to_capture ?? 'Direct ownership, customer context, and quantified operational outcome.')}</p>`;
}

async function loadRoleAnalysis() {
  if (!demoState.selected_role_id) { renderAnalysis(); return; }
  const response = await fetch(`/analysis.json?role=${encodeURIComponent(demoState.selected_role_id)}`);
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
  document.querySelector('#evidence-list').innerHTML = data.evidence.map((item) => `<article class="record evidence-card"><div><span class="badge ${escapeHtml(item.classification)}">${escapeHtml(item.classification)}</span><strong>${escapeHtml(item.title)}</strong></div><p>${escapeHtml(item.summary)}</p><dl><div><dt>Supported capability</dt><dd>${escapeHtml(item.capabilities?.[0] ?? item.matched_capabilities?.[0] ?? 'Not available')}</dd></div><div><dt>Source category</dt><dd>${escapeHtml(item.public_source_label)}</dd></div><div><dt>Approval status</dt><dd>${escapeHtml(item.approval_status ?? 'approved')}</dd></div><div><dt>Restriction</dt><dd>${escapeHtml(restrictionSummary(item.restrictions))}</dd></div></dl></article>`).join('');
  const analyses = await Promise.all(data.roles.map(async (role) => ({ role, result: await (await fetch(`/analysis.json?role=${encodeURIComponent(role.id)}`)).json() })));
  document.querySelector('#role-list').innerHTML = analyses.map(({ role, result }) => `<article class="record"><strong>${escapeHtml(role.title)}</strong><p>${escapeHtml(fitLabel(result))} | ${result.confidence}% readiness</p><small>${escapeHtml(role.requirements.join(' | '))}</small></article>`).join('');
  status.textContent = 'Approved Career DNA loaded. Every conclusion is traceable to public-safe evidence.';
  await loadDemonstrationRecords();
  renderSummary(); await loadRoleAnalysis();
  await loadForwardIntelligence();
}

async function loadDemonstrationRecords() {
  const response = await fetch('/growth-fixture.json');
  if (!response.ok) throw new Error('Prepared demonstration achievement is unavailable.');
  demonstrationRecords = [await response.json()];
  demoAchievementSelector.replaceChildren(...demonstrationRecords.map((record) => new Option(record.title, record.entry_id)));
  demoAchievementSelector.disabled = false;
  document.querySelector('.growth-panel').classList.toggle('single-demo-record', demonstrationRecords.length === 1);
  renderAchievementStatus('selected');
}

async function validateDraft() {
  if (demoState.achievement_state !== 'loaded') return { ok: false, body: { error: 'Load the prepared achievement before validation.' } };
  try {
    const entry = JSON.parse(input.value);
    const result = await requestGrowth([entry]);
    if (result.ok) {
      transitionAchievement(demoState, 'validated');
      validateAchievementButton.textContent = 'Validated';
      validateAchievementButton.disabled = true;
      addAchievementButton.disabled = false;
      renderAchievementStatus('validated', entry);
      flashAchievementStatus();
      if (demoState.guided_active) { transitionGuidedStep(7); renderGuided(); }
    } else {
      achievementStatus.innerHTML = `<h3>Validation Failed</h3><p>${escapeHtml(result.body.validations?.[0]?.errors?.join(', ') ?? result.body.error ?? 'Unknown validation error.')}</p>`;
    }
    return result;
  } catch { achievementStatus.innerHTML = '<h3>Validation Failed</h3><p>Load a prepared demonstration record or enter valid structured evidence.</p>'; return { ok: false }; }
}

function resetEvidenceWorkbench() {
  input.value = '';
  demoAchievementSelector.selectedIndex = 0;
  document.querySelector('.technical-evidence-record').open = false;
  loadAchievementButton.disabled = false;
  loadAchievementButton.textContent = 'Use This Achievement';
  validateAchievementButton.textContent = 'Validate Evidence';
  addAchievementButton.textContent = 'Add to Career DNA';
  validateAchievementButton.disabled = true;
  addAchievementButton.disabled = true;
  renderAchievementStatus('selected');
}

async function resetGuidedDemo({ keepPanel = false } = {}) {
  demoState = resetDemoState();
  roleSelector.value = demoState.selected_role_id;
  comparison.replaceChildren();
  timeline.innerHTML = '<h2>Career Timeline</h2><p class="footnote">Session reset restored baseline analysis. Approved baseline evidence remains read-only.</p>';
  resetEvidenceWorkbench();
  renderSummary(); futureValue.innerHTML = '<h2>Future Value of Recent Evidence</h2><p class="footnote">No session evidence is active. Add a validated achievement to see future value without changing the approved baseline.</p>'; await loadRoleAnalysis(); await loadForwardIntelligence();
  if (!keepPanel) endGuidedDemo();
}

demoAchievementSelector.onchange = () => {
  demoState.achievement_state = 'prepared';
  input.value = '';
  validateAchievementButton.disabled = true;
  addAchievementButton.disabled = true;
  loadAchievementButton.disabled = false;
  loadAchievementButton.textContent = 'Use This Achievement';
  validateAchievementButton.textContent = 'Validate Evidence';
  addAchievementButton.textContent = 'Add to Career DNA';
  renderAchievementStatus('selected');
};

function loadDemoAchievement() {
  if (!transitionAchievement(demoState, 'loaded')) return false;
  const entry = selectedDemonstrationRecord();
  if (!entry) return false;
  input.value = JSON.stringify(entry, null, 2);
  validateAchievementButton.disabled = false;
  addAchievementButton.disabled = true;
  loadAchievementButton.textContent = 'Achievement Loaded';
  loadAchievementButton.disabled = true;
  validateAchievementButton.textContent = 'Validate Evidence';
  addAchievementButton.textContent = 'Add to Career DNA';
  renderAchievementStatus('loaded', entry);
  flashAchievementStatus();
  if (demoState.guided_active) { transitionGuidedStep(6); renderGuided(); }
  // Regression compatibility: Synthetic Build Week Demonstration loaded. It is not a historical accomplishment.
  return true;
}
document.querySelector('#load-fixture').onclick = loadDemoAchievement;
document.querySelector('#validate-achievement').onclick = validateDraft;
async function addDemoAchievementToCareerDNA() {
  if (demoState.achievement_state !== 'validated' || demoState.added) return false;
  const entry = JSON.parse(input.value);
  if (demoState.active_session_records.some((item) => item.entry_id === entry.entry_id)) { renderAchievementStatus('duplicate'); return false; }
  const growth = await requestGrowth([entry]);
  if (!growth.ok) { achievementStatus.innerHTML = `<h3>Career DNA Update Failed</h3><p>${escapeHtml(growth.body.error ?? 'Local validation failed.')}</p>`; return false; }
  if (!transitionAchievement(demoState, 'added')) return false;
  demoState.active_session_records.push(entry);
  renderGrowth(growth.body);
  addAchievementButton.disabled = true;
  addAchievementButton.textContent = 'Added to Career DNA';
  renderAchievementStatus('updated', entry, growth.body);
  flashCareerDnaUpdate();
  transitionGuidedStep(8);
  window.setTimeout(() => { revealGuidedSection('#comparison'); renderGuided(); }, 400);
  return true;
}
document.querySelector('#add-achievement').onclick = addDemoAchievementToCareerDNA;
document.querySelector('#reset-session').onclick = resetGuidedDemo;
async function selectDemoRole() { demoState.selected_role_id = roleSelector.value; }
async function analyzeSelectedRole() { await selectDemoRole(); await loadRoleAnalysis(); await loadForwardIntelligence(); if (demoState.guided_active) transitionGuidedStep(3); }
roleSelector.onchange = selectDemoRole;
document.querySelector('#close-drawer').onclick = () => drawer.close();

function revealGuidedSection(selector) {
  const section = document.querySelector(selector);
  if (!section) return;
  const detail = section.matches('details') ? section : section.closest('details');
  if (detail) detail.open = true;
  section.classList.add('guided-target');
  window.setTimeout(() => section.classList.remove('guided-target'), 1200);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  window.setTimeout(() => {
    const panel = document.querySelector('#guided-panel.guided-active');
    if (!panel) return;
    const target = section.getBoundingClientRect();
    const panelWidth = panel.getBoundingClientRect().width;
    const gap = 20;
    panel.style.top = `${Math.max(16, Math.min(target.top, window.innerHeight - panel.offsetHeight - 16))}px`;
    panel.style.left = target.right + panelWidth + gap < window.innerWidth ? `${target.right + gap}px` : `${Math.max(16, target.left - panelWidth - gap)}px`;
  }, reduceMotion ? 0 : 350);
}

function renderGuided() {
  const [title, copySource] = guidedSteps[demoState.guided_step - 1];
  const copy = typeof copySource === 'function' ? copySource() : copySource;
  document.querySelector('#guided-panel').hidden = false;
  document.querySelector('#guided-progress').textContent = `Guided Demo | Step ${demoState.guided_step} of ${guidedSteps.length}`;
  document.querySelector('#guided-title').textContent = title;
  document.querySelector('#guided-copy').innerHTML = escapeHtml(copy).replace(/\n\n/g, '<br><br>');
  document.querySelector('#guided-back').disabled = demoState.guided_step === 1;
  const next = document.querySelector('#guided-next');
  const actionSteps = [2, 5, 6, 7];
  next.hidden = actionSteps.includes(demoState.guided_step);
  next.textContent = demoState.guided_step === 9 ? 'Finish' : 'Continue';
  const targets = ['#career-dna-summary', '#role-readiness-card', '#analysis', '#career-horizon', '#achievement-status', '#achievement-status', '#add-achievement', '#comparison', '#career-horizon'];
  if (demoState.guided_step === 9) {
    const careerDnaDetails = document.querySelector('#career-dna-details');
    if (careerDnaDetails) careerDnaDetails.open = false;
  }
  revealGuidedSection(targets[demoState.guided_step - 1]);
  if (demoState.guided_step === 9) document.querySelector('#guided-status').textContent = 'Guided demo complete. Explore the updated Career DNA or restart the demonstration session.';
}
async function startGuidedDemo() {
  await resetGuidedDemo({ keepPanel: true });
  demoState.guided_active = true;
  document.querySelector('#guided-panel').classList.add('guided-active');
  renderGuided();
}

function endGuidedDemo() {
  const panel = document.querySelector('#guided-panel');
  panel.hidden = true;
  panel.classList.remove('guided-active');
}

document.querySelector('#start-guided').onclick = startGuidedDemo;
document.querySelector('#analyze-role').onclick = async () => { await analyzeSelectedRole(); renderGuided(); };
document.querySelector('#guided-next').onclick = () => { if (demoState.guided_step < 9 && updateGuidedStep(demoState, demoState.guided_step + 1)) renderGuided(); else if (demoState.guided_step === 9) endGuidedDemo(); };
document.querySelector('#guided-back').onclick = () => { if (updateGuidedStep(demoState, demoState.guided_step - 1)) renderGuided(); };
document.querySelector('#guided-exit').onclick = endGuidedDemo;
document.querySelector('#reset-demo').onclick = async () => {
  if (confirm('Reset active session evidence and restart the guided demo?')) { await resetGuidedDemo(); document.querySelector('#guided-status').textContent = 'Demo reset. Approved Career DNA remains unchanged.'; }
};

loadBaseline().catch((error) => { status.textContent = `CareerOS could not load the local demo: ${error.message}`; renderAnalysis(); });
