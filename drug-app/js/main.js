// ─────────────────────────────────────────────────────────────────────────────
// main.js  –  App entry point: event wiring, state, UI rendering
// ─────────────────────────────────────────────────────────────────────────────

import { searchDrugs, getDrugLabel, getRecalls, getAdverseEvents } from './api.js';
import { analyzeOverlap } from './compare.js';
import { initTooltips, refreshTooltips } from './tooltips.js';

// ── App state ─────────────────────────────────────────────────────────────────

const state = {
  a: { name: null, label: null, recalls: null, reactions: null },
  b: { name: null, label: null, recalls: null, reactions: null },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function tooltipBtn(key) {
  return `<button class="tooltip-btn" data-tooltip="${key}" aria-label="Help" type="button">?</button>`;
}

function fieldText(label, field) {
  const val = label[field];
  if (!val) return null;
  return Array.isArray(val) ? val[0] : String(val);
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function formatDate(str) {
  if (!str || str.length < 8) return str || '—';
  return `${str.slice(4, 6)}/${str.slice(6, 8)}/${str.slice(0, 4)}`;
}

// ── Error message renderer ────────────────────────────────────────────────────

function errorHTML(code, drugName = '') {
  const msgs = {
    NOT_FOUND: `No FDA records found for "<strong>${esc(drugName)}</strong>". Try a generic name or check spelling.`,
    RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
    NETWORK: 'Unable to reach the FDA database. Please check your connection and try again.',
    API_CONFIG: 'API configuration error. Please check setup.',
    API_ERROR: 'Unable to reach the FDA database. Please check your connection and try again.',
  };
  return `<div class="error-msg">${msgs[code] || msgs.API_ERROR}</div>`;
}

// ── Drug card rendering ───────────────────────────────────────────────────────

function renderLabelCard(label, drugName) {
  if (!label) return errorHTML('NOT_FOUND', drugName);

  const fields = [
    { key: 'indications_and_usage', label: 'What it\'s used for', tooltip: 'indications' },
    { key: 'warnings', label: 'Warnings', tooltip: 'warnings' },
    { key: 'drug_interactions', label: 'Known drug interactions', tooltip: 'drug-interactions' },
    { key: 'contraindications', label: 'When not to use', tooltip: 'contraindications' },
    { key: 'dosage_and_administration', label: 'Dosage information', tooltip: 'dosage' },
    { key: 'active_ingredient', label: 'Active ingredient(s)', tooltip: null },
    { key: 'purpose', label: 'Purpose', tooltip: null },
  ];

  const brand = label.openfda?.brand_name?.[0] || drugName;
  const generic = label.openfda?.generic_name?.[0] || '';

  let html = `<div class="drug-name-header">
    <span class="brand-name">${esc(brand)}</span>
    ${generic ? `<span class="generic-name">${esc(generic)}</span>` : ''}
  </div>`;

  for (const { key, label: uiLabel, tooltip } of fields) {
    const text = fieldText(label, key);
    if (!text) continue;
    const truncated = text.length > 400 ? text.slice(0, 400) + '…' : text;
    html += `
      <div class="label-field">
        <div class="field-title">
          ${esc(uiLabel)}
          ${tooltip ? tooltipBtn(tooltip) : ''}
        </div>
        <div class="field-body">${esc(truncated)}</div>
      </div>`;
  }

  return html;
}

function recallClassBadge(cls) {
  const map = { 'Class I': 'sev-high', 'Class II': 'sev-mod', 'Class III': 'sev-low' };
  const css = map[cls] || '';
  return `<span class="recall-class ${css}">${esc(cls || '—')}</span>`;
}

function renderRecallsCard(recalls) {
  if (!recalls || recalls.length === 0) {
    return `<div class="no-recalls">&#10003; No recalls on record for this drug.</div>`;
  }

  return recalls.map((r) => `
    <div class="recall-item">
      <div class="recall-row">
        <span class="recall-label">Date</span>
        <span>${esc(formatDate(r.recall_initiation_date))}</span>
      </div>
      <div class="recall-row">
        <span class="recall-label">
          Severity ${tooltipBtn('recall-class')}
        </span>
        ${recallClassBadge(r.classification)}
      </div>
      <div class="recall-row">
        <span class="recall-label">Status</span>
        <span>${esc(r.status || '—')}</span>
      </div>
      <div class="recall-row">
        <span class="recall-label">Reason</span>
        <span>${esc(r.reason_for_recall || '—')}</span>
      </div>
      <div class="recall-row">
        <span class="recall-label">Product</span>
        <span>${esc((r.product_description || '').slice(0, 200))}</span>
      </div>
    </div>
  `).join('<hr class="recall-divider">');
}

function renderReactionsCard(reactions) {
  if (!reactions || reactions.length === 0) {
    return `<div class="no-data">No reported side effect data available for the last 3 years.</div>`;
  }

  const max = reactions[0]?.count || 1;
  const total = reactions.reduce((s, r) => s + r.count, 0);

  const bars = reactions.map((r) => {
    const pct = Math.round((r.count / max) * 100);
    return `
      <div class="reaction-row">
        <span class="reaction-term">${esc(r.term)}</span>
        <div class="reaction-bar-wrap">
          <div class="reaction-bar" style="width:${pct}%"></div>
        </div>
        <span class="reaction-count">${r.count.toLocaleString()}</span>
      </div>`;
  }).join('');

  return `
    <div class="reactions-meta">
      ${total.toLocaleString()} total reports (last 3 years)
      ${tooltipBtn('adverse-events')}
      &nbsp;<span class="faers-note">${tooltipBtn('faers')} FAERS data</span>
    </div>
    ${bars}`;
}

// ── Overlap panel ─────────────────────────────────────────────────────────────

function renderOverlap(overlap, nameA, nameB) {
  const { sharedWarnings, sharedIngredients, sharedReactions, severity } = overlap;

  const sevClass = { high: 'sev-high', moderate: 'sev-mod', low: 'sev-low' }[severity];
  const sevIcon  = { high: '⚠', moderate: '⚠', low: '✓' }[severity];
  const sevLabel = { high: 'High overlap detected', moderate: 'Moderate overlap detected', low: 'No significant overlap found' }[severity];

  let html = `
    <div class="overlap-badge ${sevClass}">
      <span class="sev-icon">${sevIcon}</span>
      ${esc(sevLabel)}
    </div>
    <p class="overlap-subtitle">Comparing <strong>${esc(nameA)}</strong> and <strong>${esc(nameB)}</strong></p>`;

  // Shared ingredients
  html += `<div class="overlap-section">
    <div class="overlap-section-title">Shared Active Ingredients</div>`;
  if (sharedIngredients.length) {
    html += `<ul class="overlap-list sev-high-text">` +
      sharedIngredients.map((i) => `<li>${esc(i)}</li>`).join('') +
      `</ul><p class="overlap-note">⚠ Shared active ingredients significantly increase the risk of overdose or duplicate effects. Consult your doctor.</p>`;
  } else {
    html += `<span class="sev-low-text">✓ No shared active ingredients found.</span>`;
  }
  html += `</div>`;

  // Shared warnings
  const serious = sharedWarnings.serious || [];
  const allWarnTerms = sharedWarnings.shared || [];
  const generalOnly = allWarnTerms.filter((w) => !serious.includes(w));

  html += `<div class="overlap-section">
    <div class="overlap-section-title">Shared Warnings &amp; Contraindications</div>`;
  if (allWarnTerms.length) {
    if (serious.length) {
      html += `<p class="overlap-note" style="margin-bottom:.4rem">⚠ Serious shared concerns:</p>
        <ul class="overlap-list sev-high-text">` +
        serious.map((w) => `<li>${esc(w)}</li>`).join('') +
        `</ul>`;
    }
    if (generalOnly.length) {
      html += `<p style="font-size:.8rem;color:var(--text-muted);margin:${serious.length ? '.6rem' : '0'} 0 .25rem">General shared warnings:</p>
        <ul class="overlap-list sev-mod-text">` +
        generalOnly.map((w) => `<li>${esc(w)}</li>`).join('') +
        `</ul>`;
    }
    if (serious.length) {
      html += `<p class="overlap-note" style="margin-top:.5rem">Discuss these overlapping risks with your healthcare provider before taking both drugs.</p>`;
    }
  } else {
    html += `<span class="sev-low-text">✓ No significant shared warning concepts found.</span>`;
  }
  html += `</div>`;

  // Shared reactions
  html += `<div class="overlap-section">
    <div class="overlap-section-title">Shared Reported Side Effects</div>`;
  if (sharedReactions.length) {
    html += `<ul class="overlap-list sev-mod-text">` +
      sharedReactions.map((r) => `<li>${esc(r)}</li>`).join('') +
      `</ul>`;
  } else {
    html += `<span class="sev-low-text">✓ No shared top-10 reported side effects.</span>`;
  }
  html += `</div>`;

  html += `<p class="overlap-disclaimer">This analysis is automated and educational only. It does not replace professional medical advice.</p>`;

  return html;
}

// ── Loading / skeleton state ──────────────────────────────────────────────────

function setCardLoading(side, section) {
  const el = document.querySelector(`[data-card="${side}-${section}"]`);
  if (el) el.innerHTML = `<div class="skeleton-loader"></div><div class="skeleton-loader short"></div>`;
}

function setCardContent(side, section, html) {
  const el = document.querySelector(`[data-card="${side}-${section}"]`);
  if (el) {
    el.innerHTML = html;
    refreshTooltips(el);
  }
}

// ── Drug loading orchestration ────────────────────────────────────────────────

async function loadDrug(side, drugName) {
  state[side] = { name: drugName, label: null, recalls: null, reactions: null };

  // Show the dashboard
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('overlap-panel').classList.add('hidden');

  // Update chip
  const chip = document.getElementById(`chip-${side}`);
  chip.innerHTML = `<span class="chip-name">${esc(drugName)}</span>
    <button class="chip-clear" aria-label="Clear ${esc(drugName)}" data-side="${side}">×</button>`;
  chip.classList.remove('hidden');

  // Clear section inputs
  ['label', 'recalls', 'reactions'].forEach((s) => setCardLoading(side, s));

  let label = null;
  try {
    label = await getDrugLabel(drugName);
    state[side].label = label;
    setCardContent(side, 'label', renderLabelCard(label, drugName));
  } catch (e) {
    setCardContent(side, 'label', errorHTML(e.message, drugName));
  }

  try {
    const recalls = await getRecalls(drugName);
    state[side].recalls = recalls;
    setCardContent(side, 'recalls', renderRecallsCard(recalls));
  } catch (e) {
    setCardContent(side, 'recalls', errorHTML(e.message, drugName));
  }

  try {
    const reactions = await getAdverseEvents(drugName);
    state[side].reactions = reactions;
    setCardContent(side, 'reactions', renderReactionsCard(reactions));
  } catch (e) {
    setCardContent(side, 'reactions', errorHTML(e.message, drugName));
  }

  maybeRunOverlap();
}

function maybeRunOverlap() {
  const { a, b } = state;
  if (!a.name || !b.name) return;
  if (!a.label && !b.label) return; // both errored, nothing to compare

  const labelA = a.label || {};
  const labelB = b.label || {};
  const reactA = a.reactions || [];
  const reactB = b.reactions || [];

  const overlap = analyzeOverlap(labelA, labelB, reactA, reactB);
  const panel = document.getElementById('overlap-panel');
  panel.innerHTML = renderOverlap(overlap, a.name, b.name);
  panel.classList.remove('hidden');
  refreshTooltips(panel);
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearDrug(side) {
  state[side] = { name: null, label: null, recalls: null, reactions: null };

  document.getElementById(`chip-${side}`).classList.add('hidden');
  document.getElementById(`search-${side}`).value = '';
  document.getElementById(`autocomplete-${side}`).innerHTML = '';
  document.getElementById(`autocomplete-${side}`).classList.add('hidden');

  ['label', 'recalls', 'reactions'].forEach((s) => {
    const el = document.querySelector(`[data-card="${side}-${s}"]`);
    if (el) el.innerHTML = `<div class="card-placeholder">Search for a drug above to see ${s} information.</div>`;
  });

  // Hide panels if one side cleared
  if (!state.a.name && !state.b.name) {
    document.getElementById('dashboard').classList.add('hidden');
  }
  document.getElementById('overlap-panel').classList.add('hidden');
}

// ── Common drugs shown before anything is typed ───────────────────────────────

const COMMON_DRUGS = [
  { brand: 'Advil',      generic: 'ibuprofen' },
  { brand: 'Tylenol',    generic: 'acetaminophen' },
  { brand: 'Lipitor',    generic: 'atorvastatin' },
  { brand: 'Zoloft',     generic: 'sertraline' },
  { brand: 'Metformin',  generic: 'metformin' },
  { brand: 'Lisinopril', generic: 'lisinopril' },
  { brand: 'Amoxicillin',generic: 'amoxicillin' },
  { brand: 'Xanax',      generic: 'alprazolam' },
  { brand: 'Synthroid',  generic: 'levothyroxine' },
  { brand: 'Aspirin',    generic: 'aspirin' },
];

function renderItems(results) {
  return results.map((r) => {
    const display = r.brand && r.generic && r.brand.toLowerCase() !== r.generic.toLowerCase()
      ? `<span class="ac-brand">${esc(r.brand)}</span> <span class="ac-generic">(${esc(r.generic)})</span>`
      : `<span class="ac-brand">${esc(r.brand || r.generic)}</span>`;
    const val = r.brand || r.generic;
    return `<div class="ac-item" tabindex="0" data-value="${esc(val)}">${display}</div>`;
  }).join('');
}

// ── Autocomplete ──────────────────────────────────────────────────────────────

function buildAutoComplete(side) {
  const input = document.getElementById(`search-${side}`);
  const dropdown = document.getElementById(`autocomplete-${side}`);
  const btn = document.getElementById(`search-btn-${side}`);

  function showCommon() {
    dropdown.innerHTML =
      `<div class="ac-section-label">Common drugs</div>` +
      renderItems(COMMON_DRUGS);
    dropdown.classList.remove('hidden');
  }

  const doSearch = debounce(async (query) => {
    if (!query || query.trim().length < 2) {
      showCommon();
      return;
    }
    try {
      const results = await searchDrugs(query);
      if (!results.length) {
        dropdown.innerHTML = '<div class="ac-item ac-empty">No suggestions found</div>';
        dropdown.classList.remove('hidden');
        return;
      }
      dropdown.innerHTML = renderItems(results);
      dropdown.classList.remove('hidden');
    } catch {
      dropdown.innerHTML = '';
      dropdown.classList.add('hidden');
    }
  }, 400);

  input.addEventListener('focus', () => { if (!input.value.trim()) showCommon(); });
  input.addEventListener('input', () => doSearch(input.value));

  function selectDrug(name) {
    input.value = name;
    dropdown.innerHTML = '';
    dropdown.classList.add('hidden');
    loadDrug(side, name);
  }

  dropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.ac-item[data-value]');
    if (item) selectDrug(item.dataset.value);
  });

  dropdown.addEventListener('keydown', (e) => {
    const item = e.target.closest('.ac-item[data-value]');
    if (item && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      selectDrug(item.dataset.value);
    }
  });

  // Keyboard nav through dropdown
  input.addEventListener('keydown', (e) => {
    const items = [...dropdown.querySelectorAll('.ac-item[data-value]')];
    if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); items[0].focus(); }
    if (e.key === 'Enter') { e.preventDefault(); selectDrug(input.value.trim()); }
    if (e.key === 'Escape') { dropdown.classList.add('hidden'); }
  });

  dropdown.addEventListener('keydown', (e) => {
    const items = [...dropdown.querySelectorAll('.ac-item[data-value]')];
    const idx = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' && idx < items.length - 1) { e.preventDefault(); items[idx + 1].focus(); }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx <= 0) input.focus();
      else items[idx - 1].focus();
    }
    if (e.key === 'Escape') { dropdown.classList.add('hidden'); input.focus(); }
  });

  btn.addEventListener('click', () => {
    const val = input.value.trim();
    if (val) selectDrug(val);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  buildAutoComplete('a');
  buildAutoComplete('b');

  // Chip clear buttons (delegated)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip-clear');
    if (btn) clearDrug(btn.dataset.side);
  });

  // Init static tooltips
  initTooltips(document);
});
