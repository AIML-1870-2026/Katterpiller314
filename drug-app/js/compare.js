// ─────────────────────────────────────────────────────────────────────────────
// compare.js  –  Overlap analysis logic
// ─────────────────────────────────────────────────────────────────────────────

// Medical concepts to scan for in warning/contraindication text.
// Grouped into "serious" (triggers high severity) and "general" (moderate).
const SERIOUS_CONCEPTS = [
  'liver damage', 'hepatotoxicity', 'liver failure', 'hepatic failure',
  'liver disease', 'renal failure', 'kidney failure', 'renal impairment',
  'kidney disease', 'heart failure', 'cardiac arrest', 'QT prolongation',
  'arrhythmia', 'irregular heartbeat', 'stroke', 'blood clot', 'thrombosis',
  'pulmonary embolism', 'internal bleeding', 'hemorrhage', 'gastrointestinal bleeding',
  'suicidal thoughts', 'suicidal ideation', 'suicide', 'anaphylaxis',
  'anaphylactic reaction', 'severe allergic reaction', 'Stevens-Johnson',
  'toxic epidermal necrolysis', 'agranulocytosis', 'aplastic anemia',
  'respiratory depression', 'respiratory failure', 'seizure', 'convulsion',
  'fatal', 'death', 'life-threatening',
];

// General: specific medical conditions / drug interaction classes only.
// Do NOT include generic symptoms (nausea, dizziness, headache, etc.) —
// those appear on almost every label and produce meaningless matches.
const GENERAL_CONCEPTS = [
  // Cardiovascular conditions
  'hypertension', 'high blood pressure', 'hypotension', 'low blood pressure',
  'heart disease', 'coronary artery disease', 'atrial fibrillation',
  // Metabolic conditions
  'diabetes', 'hypoglycemia', 'hyperglycemia', 'blood sugar',
  'hypothyroidism', 'hyperthyroidism', 'thyroid disease', 'adrenal insufficiency',
  // Organ impairment (specific phrases, not bare organ names)
  'renal impairment', 'kidney impairment', 'kidney disease',
  'hepatic impairment', 'liver disease', 'liver problems',
  // Respiratory conditions
  'asthma', 'COPD', 'chronic obstructive pulmonary disease', 'lung disease',
  // Psychiatric conditions
  'depression', 'bipolar disorder', 'schizophrenia', 'anxiety disorder',
  'psychiatric disorder', 'serotonin syndrome',
  // Drug interaction classes
  'blood thinners', 'anticoagulant', 'anticoagulation', 'warfarin',
  'MAO inhibitor', 'MAOI', 'serotonergic', 'CNS depressant',
  'CYP3A4', 'CYP2D6', 'enzyme inhibitor',
  // Electrolyte imbalances (clinically significant)
  'hypokalemia', 'hyperkalemia', 'hyponatremia', 'hypernatremia', 'electrolyte imbalance',
  // Allergy / hypersensitivity (specific)
  'hypersensitivity reaction', 'allergic reaction', 'drug hypersensitivity',
  // Other specific conditions
  'glaucoma', 'angle-closure glaucoma', 'urinary retention', 'benign prostatic',
  'immunocompromised', 'immunosuppressed',
  'myasthenia gravis', 'porphyria', 'pheochromocytoma',
  // Pregnancy / reproductive (genuine risk categories)
  'pregnancy', 'breastfeeding',
  // Alcohol (genuine drug interaction)
  'alcohol',
];

function extractText(label) {
  const fields = [
    label.warnings,
    label.contraindications,
    label.warnings_and_cautions,
    label.boxed_warning,
    label.precautions,
    label.drug_interactions,
  ];
  return fields
    .filter(Boolean)
    .map((f) => (Array.isArray(f) ? f.join(' ') : String(f)))
    .join(' ')
    .toLowerCase();
}

function findConcepts(text, concepts) {
  return concepts.filter((c) => text.includes(c.toLowerCase()));
}

// ── a. Shared warnings / contraindications ────────────────────────────────────

export function compareWarnings(labelA, labelB) {
  const textA = extractText(labelA);
  const textB = extractText(labelB);

  if (!textA || !textB) return { shared: [], hasSerious: false };

  const seriousA = new Set(findConcepts(textA, SERIOUS_CONCEPTS));
  const seriousB = new Set(findConcepts(textB, SERIOUS_CONCEPTS));
  const sharedSerious = [...seriousA].filter((c) => seriousB.has(c));

  const generalA = new Set(findConcepts(textA, GENERAL_CONCEPTS));
  const generalB = new Set(findConcepts(textB, GENERAL_CONCEPTS));
  const sharedGeneral = [...generalA].filter((c) => generalB.has(c));

  const allShared = [...new Set([...sharedSerious, ...sharedGeneral])];

  return {
    shared: allShared,
    serious: sharedSerious,
    hasSerious: sharedSerious.length > 0,
  };
}

// ── b. Shared active ingredients ──────────────────────────────────────────────

export function compareIngredients(labelA, labelB) {
  const parse = (label) => {
    const raw = [
      label.active_ingredient,
      label.active_ingredients,
      label.spl_product_data_elements,
    ]
      .filter(Boolean)
      .map((f) => (Array.isArray(f) ? f.join(' ') : String(f)))
      .join(' ');

    // Split on common delimiters and clean up each entry
    return raw
      .toLowerCase()
      .split(/[,;\n•]+/)
      .map((s) =>
        s
          .replace(/\d+(\.\d+)?\s*(mg|mcg|g|ml|%|iu|units?)\b/gi, '') // strip dosages
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter((s) => s.length > 3);
  };

  const ingA = parse(labelA);
  const ingB = parse(labelB);

  const matches = [];
  for (const a of ingA) {
    for (const b of ingB) {
      if (a === b || a.includes(b) || b.includes(a)) {
        const canonical = a.length <= b.length ? a : b;
        if (canonical.length > 3 && !matches.some((m) => m.includes(canonical) || canonical.includes(m))) {
          matches.push(canonical);
        }
      }
    }
  }

  return matches;
}

// ── c. Shared adverse reactions ───────────────────────────────────────────────

export function compareReactions(reactionsA, reactionsB) {
  const setA = new Set(reactionsA.map((r) => r.term.toLowerCase()));
  return reactionsB
    .map((r) => r.term.toLowerCase())
    .filter((t) => setA.has(t));
}

// ── Overall severity scoring ──────────────────────────────────────────────────

export function scoreSeverity({ sharedWarnings, sharedIngredients, sharedReactions }) {
  if (sharedIngredients.length > 0 || sharedWarnings.hasSerious) return 'high';
  if (sharedWarnings.shared.length >= 2 || sharedReactions.length >= 3) return 'moderate';
  if (sharedWarnings.shared.length > 0 || sharedReactions.length > 0) return 'moderate';
  return 'low';
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function analyzeOverlap(labelA, labelB, reactionsA, reactionsB) {
  const sharedWarnings = compareWarnings(labelA, labelB);
  const sharedIngredients = compareIngredients(labelA, labelB);
  const sharedReactions = compareReactions(reactionsA, reactionsB);
  const severity = scoreSeverity({ sharedWarnings, sharedIngredients, sharedReactions });

  return { sharedWarnings, sharedIngredients, sharedReactions, severity };
}
