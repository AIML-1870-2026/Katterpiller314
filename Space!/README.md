# NEO Dashboard

A single-page web dashboard that pulls live Near-Earth Object (NEO) data from NASA's NeoWs API and visualises each object as a floating 3D marker around an interactive, Animal Crossing–styled Earth rendered with Three.js.

## How to run

```bash
cd AIAIAICLASS/space
npx serve .
```

Or open with **VS Code Live Server** (right-click `index.html` → Open with Live Server).

## Adding a NASA API Key

For higher rate limits, get a free key at **https://api.nasa.gov/** then open `index.html` and change line:

```js
const NASA_API_KEY = "DEMO_KEY";
```

to:

```js
const NASA_API_KEY = "YOUR_KEY_HERE";
```

That's the only change needed.

## What is a Lunar Distance (LD)?

**1 LD ≈ 384,400 km** — the average distance from Earth to the Moon. NEO miss distances are shown in LD so you can instantly judge how close each object came relative to our Moon. The Moon in the 3D scene sits at exactly 1 LD, acting as a visual ruler.
