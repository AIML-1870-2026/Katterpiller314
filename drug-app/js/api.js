// ─────────────────────────────────────────────────────────────────────────────
// api.js  –  All openFDA fetch logic
//
// HOW TO SET YOUR API KEY:
//   1. Get a free key at https://open.fda.gov/apis/authentication/
//   2. Replace YOUR_FDA_API_KEY_HERE below with your key.
//   Without a key the API still works but is rate-limited to ~40 req/min.
// ─────────────────────────────────────────────────────────────────────────────

const FDA_API_KEY = 'UX8Phe7YNvj00i6JpaIqcTAeBgjcpBhmDK5RQstO';
const BASE = 'https://api.fda.gov';

// Build a URL without double-encoding. All values are passed raw here;
// encodeURIComponent handles the rest so URLSearchParams isn't needed.
function buildUrl(path, params) {
  const parts = Object.entries(params).map(
    ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
  );
  if (FDA_API_KEY && FDA_API_KEY !== 'YOUR_FDA_API_KEY_HERE') {
    parts.push(`api_key=${encodeURIComponent(FDA_API_KEY)}`);
  }
  return `${BASE}${path}?${parts.join('&')}`;
}

async function fdaFetch(url) {
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('NETWORK');
  }
  if (res.status === 429) throw new Error('RATE_LIMIT');
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('API_ERROR');
  const json = await res.json();
  if (json?.error?.code === 'NOT_FOUND') return null;
  if (json?.error) throw new Error('API_ERROR');
  return json;
}

// ── Autocomplete suggestions ──────────────────────────────────────────────────

export async function searchDrugs(query) {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim();
  // Try brand name and generic name in parallel
  const [byBrand, byGeneric] = await Promise.allSettled([
    fdaFetch(buildUrl('/drug/label.json', { search: `openfda.brand_name:"${q}"`, limit: 8 })),
    fdaFetch(buildUrl('/drug/label.json', { search: `openfda.generic_name:"${q}"`, limit: 8 })),
  ]);

  const seen = new Set();
  const suggestions = [];

  for (const result of [byBrand, byGeneric]) {
    if (result.status !== 'fulfilled' || !result.value?.results) continue;
    for (const item of result.value.results) {
      const brand = item.openfda?.brand_name?.[0] || null;
      const generic = item.openfda?.generic_name?.[0] || null;
      const key = (brand || generic || '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      suggestions.push({ brand, generic });
      if (suggestions.length >= 8) break;
    }
    if (suggestions.length >= 8) break;
  }

  return suggestions;
}

// ── Drug label ────────────────────────────────────────────────────────────────

export async function getDrugLabel(drugName) {
  const attempts = [
    buildUrl('/drug/label.json', { search: `openfda.brand_name:"${drugName}"`, limit: 1 }),
    buildUrl('/drug/label.json', { search: `openfda.generic_name:"${drugName}"`, limit: 1 }),
  ];
  for (const url of attempts) {
    const data = await fdaFetch(url);
    if (data?.results?.length) return data.results[0];
  }
  return null;
}

// ── Recall history ────────────────────────────────────────────────────────────

export async function getRecalls(drugName) {
  const attempts = [
    buildUrl('/drug/enforcement.json', {
      search: `openfda.brand_name:"${drugName}"`,
      limit: 5,
      sort: 'recall_initiation_date:desc',
    }),
    buildUrl('/drug/enforcement.json', {
      search: `openfda.generic_name:"${drugName}"`,
      limit: 5,
      sort: 'recall_initiation_date:desc',
    }),
    // Broader fallback: search product description
    buildUrl('/drug/enforcement.json', {
      search: `product_description:"${drugName}"`,
      limit: 5,
      sort: 'recall_initiation_date:desc',
    }),
  ];

  for (const url of attempts) {
    const data = await fdaFetch(url);
    if (data?.results?.length) return data.results;
  }
  return [];
}

// ── Adverse events ────────────────────────────────────────────────────────────

export async function getAdverseEvents(drugName) {
  const today = new Date();
  const threeYearsAgo = new Date(today);
  threeYearsAgo.setFullYear(today.getFullYear() - 3);

  const fmt = (d) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

  // Build URL manually — the +AND+ operator must NOT be percent-encoded
  // (openFDA uses raw + as its AND syntax in Lucene queries)
  const apiKeyParam = FDA_API_KEY !== 'YOUR_FDA_API_KEY_HERE'
    ? `&api_key=${encodeURIComponent(FDA_API_KEY)}`
    : '';

  const search = encodeURIComponent(`patient.drug.medicinalproduct:"${drugName}"`)
    + `+AND+receivedate:[${fmt(threeYearsAgo)}+TO+${fmt(today)}]`;

  const url = `${BASE}/drug/event.json?search=${search}&count=patient.reaction.reactionmeddrapt.exact&limit=10${apiKeyParam}`;

  // Also try a broader search without date filter if first attempt returns nothing
  const data = await fdaFetch(url);
  if (data?.results?.length) return data.results;

  const fallbackSearch = encodeURIComponent(`patient.drug.medicinalproduct:"${drugName}"`);
  const fallbackUrl = `${BASE}/drug/event.json?search=${fallbackSearch}&count=patient.reaction.reactionmeddrapt.exact&limit=10${apiKeyParam}`;
  const fallback = await fdaFetch(fallbackUrl);
  return fallback?.results || [];
}
