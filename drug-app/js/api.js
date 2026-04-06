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

function buildUrl(path, params) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  if (FDA_API_KEY && FDA_API_KEY !== 'YOUR_FDA_API_KEY_HERE') {
    url.searchParams.set('api_key', FDA_API_KEY);
  }
  return url.toString();
}

async function fdaFetch(url) {
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('NETWORK');
  }

  if (res.status === 429) throw new Error('RATE_LIMIT');
  if (res.status === 404) return null; // not found is expected, not an error
  if (!res.ok) throw new Error('API_ERROR');

  const json = await res.json();
  if (json.error) {
    if (json.error.code === 'NOT_FOUND') return null;
    throw new Error('API_ERROR');
  }
  return json;
}

// ── Autocomplete suggestions ──────────────────────────────────────────────────

export async function searchDrugs(query) {
  if (!query || query.trim().length < 2) return [];

  const q = encodeURIComponent(query.trim());
  // Try brand name first, then generic name
  const urls = [
    buildUrl('/drug/label.json', { search: `openfda.brand_name:${q}`, limit: 8 }),
    buildUrl('/drug/label.json', { search: `openfda.generic_name:${q}`, limit: 8 }),
  ];

  const results = await Promise.allSettled(urls.map(fdaFetch));
  const seen = new Set();
  const suggestions = [];

  for (const r of results) {
    if (r.status !== 'fulfilled' || !r.value?.results) continue;
    for (const item of r.value.results) {
      const brand = item.openfda?.brand_name?.[0];
      const generic = item.openfda?.generic_name?.[0];
      const key = (brand || generic || '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      suggestions.push({ brand: brand || null, generic: generic || null });
      if (suggestions.length >= 8) break;
    }
    if (suggestions.length >= 8) break;
  }

  return suggestions;
}

// ── Drug label ────────────────────────────────────────────────────────────────

export async function getDrugLabel(drugName) {
  const q = `"${drugName}"`;
  // Try brand name, then generic
  const urls = [
    buildUrl('/drug/label.json', { search: `openfda.brand_name:${q}`, limit: 1 }),
    buildUrl('/drug/label.json', { search: `openfda.generic_name:${q}`, limit: 1 }),
  ];

  for (const url of urls) {
    const data = await fdaFetch(url);
    if (data?.results?.length) return data.results[0];
  }
  return null;
}

// ── Recall history ────────────────────────────────────────────────────────────

export async function getRecalls(drugName) {
  const q = `"${drugName}"`;
  const urls = [
    buildUrl('/drug/enforcement.json', {
      search: `openfda.brand_name:${q}`,
      limit: 5,
      sort: 'recall_initiation_date:desc',
    }),
    buildUrl('/drug/enforcement.json', {
      search: `openfda.generic_name:${q}`,
      limit: 5,
      sort: 'recall_initiation_date:desc',
    }),
  ];

  for (const url of urls) {
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

  const search =
    `patient.drug.medicinalproduct:"${drugName}"` +
    `+AND+receivedate:[${fmt(threeYearsAgo)}+TO+${fmt(today)}]`;

  const url = buildUrl('/drug/event.json', {
    search,
    count: 'patient.reaction.reactionmeddrapt.exact',
    limit: 10,
  });

  const data = await fdaFetch(url);
  return data?.results || [];
}
