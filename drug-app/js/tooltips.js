// ─────────────────────────────────────────────────────────────────────────────
// tooltips.js  –  Tooltip init and behavior (pure CSS + JS, no library)
// ─────────────────────────────────────────────────────────────────────────────

export const TOOLTIPS = {
  contraindications:
    'Situations where this drug should NOT be used — for example, if you have a certain condition or are taking another medication.',
  'adverse-events':
    "These are side effects reported by patients or doctors. They don't necessarily mean the drug caused them — just that they were reported while taking it.",
  'recall-class':
    'Class I = most serious risk of harm. Class II = may cause temporary health problems. Class III = unlikely to cause harm but violates FDA rules.',
  faers:
    'FDA Adverse Event Reporting System — a database of voluntary reports from patients and healthcare providers.',
  indications:
    'The medical conditions or symptoms this drug is officially approved to treat.',
  'drug-interactions':
    'Other drugs, foods, or supplements that may change how this drug works or increase side effects.',
  warnings:
    'Important safety information you should know before taking this drug.',
  dosage:
    'The recommended amount and schedule for taking this drug. Always follow your doctor\'s specific instructions.',
};

let activeTooltip = null;

function closeActive() {
  if (activeTooltip) {
    activeTooltip.classList.remove('tooltip-visible');
    activeTooltip = null;
  }
}

export function initTooltips(root = document) {
  root.querySelectorAll('[data-tooltip]').forEach((btn) => {
    // Skip if already initialized
    if (btn.dataset.tooltipInit) return;
    btn.dataset.tooltipInit = '1';

    const key = btn.dataset.tooltip;
    const text = TOOLTIPS[key];
    if (!text) return;

    // Build popover as a CHILD of the button so position:absolute works
    const popover = document.createElement('span');
    popover.className = 'tooltip-popover';
    popover.setAttribute('role', 'tooltip');
    popover.textContent = text;
    btn.appendChild(popover);

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (popover.classList.contains('tooltip-visible')) {
        closeActive();
      } else {
        if (activeTooltip) closeActive();
        // Decide whether to show above or below based on space
        const rect = btn.getBoundingClientRect();
        const spaceAbove = rect.top;
        if (spaceAbove > 120) {
          popover.classList.add('above');
          popover.classList.remove('below');
        } else {
          popover.classList.add('below');
          popover.classList.remove('above');
        }
        popover.classList.add('tooltip-visible');
        activeTooltip = popover;
      }
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
      if (e.key === 'Escape') closeActive();
    });
  });

  document.addEventListener('click', closeActive);
}

export function refreshTooltips(root) {
  initTooltips(root);
}
