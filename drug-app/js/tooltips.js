// ─────────────────────────────────────────────────────────────────────────────
// tooltips.js  –  Tooltip init and behavior (pure CSS + JS, no library)
// ─────────────────────────────────────────────────────────────────────────────

export const TOOLTIPS = {
  contraindications:
    'Situations where this drug should NOT be used — for example, if you have a certain condition or are taking another medication.',
  'adverse-events':
    'These are side effects reported by patients or doctors. They don\'t necessarily mean the drug caused them — just that they were reported while taking it.',
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

function openTooltip(popover, btn) {
  if (activeTooltip && activeTooltip !== popover) closeActive();

  popover.classList.add('tooltip-visible');

  // Position: prefer below, flip above if not enough space
  const rect = btn.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  if (spaceBelow < 120) {
    popover.style.bottom = '2rem';
    popover.style.top = 'auto';
  } else {
    popover.style.top = '2rem';
    popover.style.bottom = 'auto';
  }

  activeTooltip = popover;
}

export function initTooltips(root = document) {
  root.querySelectorAll('[data-tooltip]').forEach((btn) => {
    const key = btn.dataset.tooltip;
    const text = TOOLTIPS[key];
    if (!text) return;

    // Build popover if not already built
    let popover = btn.nextElementSibling;
    if (!popover || !popover.classList.contains('tooltip-popover')) {
      popover = document.createElement('span');
      popover.className = 'tooltip-popover';
      popover.setAttribute('role', 'tooltip');
      popover.textContent = text;
      btn.insertAdjacentElement('afterend', popover);
    }

    // Keyboard + click
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (popover.classList.contains('tooltip-visible')) {
        closeActive();
      } else {
        openTooltip(popover, btn);
      }
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
      if (e.key === 'Escape') closeActive();
    });
  });

  // Close when clicking outside any tooltip
  document.addEventListener('click', closeActive);
}

// Call after dynamic content is injected
export function refreshTooltips(root) {
  initTooltips(root);
}
