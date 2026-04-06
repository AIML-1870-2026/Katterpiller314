// ─────────────────────────────────────────────────────────────────────────────
// compare.js  –  Overlap analysis logic
// ─────────────────────────────────────────────────────────────────────────────

// Keywords that indicate a "serious" warning when shared
const SERIOUS_WARNING_KEYWORDS = [
  'death', 'fatal', 'liver', 'hepatic', 'cardiac', 'heart failure',
  'stroke', 'bleeding', 'hemorrhage', 'seizure', 'suicidal', 'suicide',
  'anaphylaxis', 'anaphylactic', 'renal failure', 'kidney', 'QT prolongation',
  'arrhythmia', 'respiratory', 'agranulocytosis', 'thrombocytopenia',
  'Stevens-Johnson', 'toxic epidermal',
];

function tokenize(text) {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
}

function extractText(labelField) {
  if (!labelField) return '';
  return Array.isArray(labelField) ? labelField.join(' ') : String(labelField);
}

// ── a. Shared warnings / contraindications ────────────────────────────────────

export function compareWarnings(labelA, labelB) {
  const fieldsA = [
    extractText(labelA.warnings),
    extractText(labelA.contraindications),
    extractText(labelA.warnings_and_cautions),
    extractText(labelA.boxed_warning),
  ].join(' ');

  const fieldsB = [
    extractText(labelB.warnings),
    extractText(labelB.contraindications),
    extractText(labelB.warnings_and_cautions),
    extractText(labelB.boxed_warning),
  ].join(' ');

  const tokensA = tokenize(fieldsA);
  const tokensB = tokenize(fieldsB);

  const shared = [...tokensA].filter((t) => tokensB.has(t));

  // Filter to only medically meaningful terms (longer, not common stop words)
  const STOP = new Set([
    'with', 'this', 'that', 'have', 'been', 'from', 'they', 'will', 'your',
    'when', 'than', 'more', 'also', 'other', 'used', 'using', 'dose', 'drug',
    'take', 'patients', 'should', 'including', 'following', 'information',
    'based', 'risk', 'risks', 'treatment', 'therapy', 'drugs', 'medication',
    'medications', 'medical', 'clinical', 'adverse', 'effects', 'serious',
  ]);
  const meaningful = shared.filter((w) => w.length >= 5 && !STOP.has(w));

  // Flag any that are "serious"
  const hasSerious = meaningful.some((w) =>
    SERIOUS_WARNING_KEYWORDS.some((kw) => w.includes(kw.toLowerCase()) || kw.toLowerCase().includes(w))
  );

  return { shared: meaningful.slice(0, 20), hasSerious };
}

// ── b. Shared active ingredients ──────────────────────────────────────────────

export function compareIngredients(labelA, labelB) {
  const parse = (label) => {
    const raw = extractText(
      label.active_ingredient || label.active_ingredients || label.spl_product_data_elements
    );
    return raw
      .toLowerCase()
      .split(/[,;\n]+/)
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter((s) => s.length > 2);
  };

  const ingA = parse(labelA);
  const ingB = parse(labelB);

  const matches = [];
  for (const a of ingA) {
    for (const b of ingB) {
      // Partial match: one contains the other (catches dosage variations)
      if (a.includes(b) || b.includes(a)) {
        // Use shorter one as the canonical match label
        const label = a.length <= b.length ? a : b;
        if (!matches.some((m) => m.includes(label) || label.includes(m))) {
          matches.push(label);
        }
      }
    }
  }

  return matches;
}

// ── c. Shared adverse reactions ───────────────────────────────────────────────

export function compareReactions(reactionsA, reactionsB) {
  const namesA = new Set(reactionsA.map((r) => r.term.toLowerCase()));
  const namesB = new Set(reactionsB.map((r) => r.term.toLowerCase()));
  return [...namesA].filter((t) => namesB.has(t));
}

// ── Overall severity scoring ──────────────────────────────────────────────────

export function scoreSeverity({ sharedWarnings, sharedIngredients, sharedReactions }) {
  const { shared: warnTerms, hasSerious } = sharedWarnings;

  if (sharedIngredients.length > 0 || hasSerious) {
    return 'high';
  }
  if (warnTerms.length >= 3 || sharedReactions.length >= 3) {
    return 'moderate';
  }
  if (warnTerms.length > 0 || sharedReactions.length > 0) {
    return 'moderate';
  }
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
