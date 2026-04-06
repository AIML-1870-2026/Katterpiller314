# DrugCheck – FDA Drug Safety Comparison Tool

A client-side educational tool for comparing two drugs side-by-side using live data from the openFDA API. Surfaces drug labeling, recall history, and adverse event reports, with an automated overlap analysis.

---

## Getting Started

### 1. Get a free openFDA API key (optional but recommended)

Without a key, the API works but is rate-limited (~40 requests/minute, shared).

1. Visit <https://open.fda.gov/apis/authentication/>
2. Request a free API key — it will be emailed to you.

### 2. Add your API key

1. Open `js/api.js`
2. Find this line near the top:
   ```js
   const FDA_API_KEY = 'YOUR_FDA_API_KEY_HERE';
   ```
3. Replace `YOUR_FDA_API_KEY_HERE` with your key:
   ```js
   const FDA_API_KEY = 'abc123yourkeyhere';
   ```

### 3. Open the app

Because the app uses ES modules (`type="module"`), it must be served over HTTP — **not** opened directly as a `file://` URL.

**Quickest option — Python:**
```bash
cd /path/to/drugz
python3 -m http.server 8080
# then open http://localhost:8080
```

**Or with Node (npx):**
```bash
npx serve .
```

---

## File Structure

```
drugz/
├── index.html          # Single-page app shell
├── css/
│   └── styles.css      # All styles (Inter via Google Fonts)
├── js/
│   ├── api.js          # openFDA fetch logic — set API key here
│   ├── compare.js      # Overlap analysis (warnings, ingredients, reactions)
│   ├── tooltips.js     # Tooltip init and behavior
│   └── main.js         # Entry point: event wiring, state, rendering
└── README.md
```

---

## Optional: Environment variable approach (if adding a build tool later)

If you later add Vite or another bundler:

1. Create a `.env` file at the project root:
   ```
   VITE_FDA_API_KEY=your_key_here
   ```
2. Update `api.js` to read:
   ```js
   const FDA_API_KEY = import.meta.env.VITE_FDA_API_KEY;
   ```
3. Add `.env` to `.gitignore` before committing.

---

## Data Sources

| Data | openFDA Endpoint |
|---|---|
| Drug label / autocomplete | `/drug/label.json` |
| Recall history | `/drug/enforcement.json` |
| Reported side effects | `/drug/event.json` |

Full API documentation: <https://open.fda.gov/apis/>

---

## Disclaimer

This tool is for **educational purposes only** and does not constitute medical advice. Data is sourced from the openFDA API. This product is not endorsed by or affiliated with the U.S. Food and Drug Administration.
