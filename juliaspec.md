# Julia Set Explorer: The Fractal Deck - Technical Specification

## Project Overview

A browser-based Julia Set fractal explorer themed around playing card suits. Users explore the infinite variety of Julia sets by selecting c-parameters from a Mandelbrot navigator, browsing curated presets organized as a deck of cards, or "dealing" random fractals. Four suit-based color palettes transform each fractal into a distinct visual experience.

**Repository:** https://github.com/AIML-1870-2026/Katterpiller314
**Live Demo:** https://aiml-1870-2026.github.io/Katterpiller314/julia/
**Project Location:** `/julia/` subdirectory

---

## Concept

### Background
Julia sets are fractals generated from the complex function f(z) = z² + c, where c is a fixed complex number. For each pixel (mapped to a complex number z₀), the function is iterated repeatedly. If the sequence escapes to infinity, the point is outside the Julia set; if it remains bounded, it's inside. The *speed* of escape determines the color, creating intricate boundary patterns.

Every point on the Mandelbrot set corresponds to a unique Julia set — connected Julia sets come from c-values inside the Mandelbrot set, and dust-like Julia sets from outside. This deep mathematical connection is central to the explorer's navigation.

### Theme: The Fractal Deck
Playing card suits govern the visual and interactive experience:

| Suit | Name | Role | Color Palette |
|------|------|------|---------------|
| ♥ Hearts | *Passion* | Warm palette | Crimson, rose, gold, cream |
| ♠ Spades | *Mystery* | Cool palette | Midnight blue, silver, indigo, black |
| ♦ Diamonds | *Brilliance* | Bright palette | White, amber, electric yellow, crystal |
| ♣ Clubs | *Nature* | Earth palette | Emerald, forest green, moss, mahogany |

### Objective
Explore the infinite landscape of Julia set fractals through an elegant card-themed interface. Discover, collect, and compare fractals using curated presets, the Mandelbrot navigator, or pure chance via the "Deal" mechanic.

---

## Technical Stack

- **HTML5** - Structure and dual canvas elements
- **CSS3** - Card-styled UI, animations, grid layout, backdrop blur
- **Vanilla JavaScript** - Fractal computation and rendering
- **Canvas API** - 2D pixel-level rendering for both Julia and Mandelbrot sets

---

## Core Algorithm

### Julia Set Computation

For each pixel at screen position (px, py):

1. Map pixel to complex plane: `z = (px - width/2) / zoom + centerX + i * ((py - height/2) / zoom + centerY)`
2. Iterate: `z = z² + c` for up to `maxIterations`
3. If `|z| > 2` (escape radius), record iteration count
4. Color based on iteration count using the active suit palette

### Mandelbrot Set Computation

For the navigator thumbnail, the roles are swapped:
- Each pixel maps to a candidate c-value
- z₀ starts at 0
- Iterate `z = z² + c` and check for escape
- The Mandelbrot set is the map of all c-values; clicking it selects the c for the Julia view

### Parameters

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| c (real) | -0.7 | -2.0 to 2.0 | Real component of the c constant |
| c (imaginary) | 0.27015 | -2.0 to 2.0 | Imaginary component of the c constant |
| Max Iterations | 200 | 50 - 500 | Iteration depth (higher = more detail, slower) |
| Zoom | 1.0 | 0.5 - 100+ | Zoom level into the fractal |
| Center X | 0.0 | -2.0 to 2.0 | Pan position (real axis) |
| Center Y | 0.0 | -2.0 to 2.0 | Pan position (imaginary axis) |

---

## Card System

### The Deck: Curated Presets

13 notable Julia set c-values per suit, each named after its card rank. The 52-card deck provides a curated tour of Julia set diversity. Each card has:
- **Rank & Suit** (e.g., Queen of Spades)
- **Name** (e.g., "The Dendrite")
- **c-value** (the complex parameter)
- **Description** (one-line description of the pattern character)

#### Sample Cards (Full deck defined in implementation)

| Card | Name | c-value | Character |
|------|------|---------|-----------|
| A♥ | The Basilica | c = -1.0 + 0.0i | Classic connected basilica shape |
| 2♥ | The Rabbit | c = -0.123 + 0.745i | Douady's rabbit — three-lobed spiral |
| 3♥ | The Seahorse | c = -0.75 + 0.1i | Seahorse valley tendrils |
| K♥ | The Dragon | c = -0.8 + 0.156i | Dragon curve boundary |
| A♠ | The Dendrite | c = 0.0 + 1.0i | Tree-like branching dendrite |
| A♦ | The Star | c = -0.4 + 0.6i | Star-burst explosion pattern |
| A♣ | The Fern | c = 0.285 + 0.01i | Organic fern-like spirals |
| Q♠ | The Vortex | c = -0.7269 + 0.1889i | Spiraling vortex arms |
| J♦ | The Lightning | c = -0.1 + 0.651i | Electric branching tendrils |
| K♣ | The Galaxy | c = 0.355 + 0.355i | Galactic spiral formation |

### The Deal Button

- Clicking "Deal" triggers a card-flip animation
- A random suit is chosen (setting the color palette)
- A random c-value is generated within the "interesting" region of the complex plane (near the Mandelbrot boundary, where the most visually striking Julia sets live)
- The card face is revealed showing the fractal with a randomly generated whimsical name
- Dealt cards that the user likes can be saved to their "hand"

### Your Hand (Favorites)

- A row of up to 7 saved cards displayed as a fan at the bottom of the screen
- Each card shows a small thumbnail of its fractal
- Clicking a saved card loads that fractal (c-value + palette)
- Cards can be removed from the hand by clicking an × on the card
- Stored in `localStorage` for persistence across sessions
- "Clear Hand" button to remove all saved cards

---

## Interactive Features

### Mandelbrot Navigator

- **Size:** 200×200px canvas in the controls panel
- **Purpose:** Visual c-parameter picker
- **Interaction:** Click anywhere on the Mandelbrot set to select that point as the c-value for the Julia set
- **Visual Feedback:**
  - Crosshair cursor over the navigator
  - Small red dot with white outline marks the current c-value position
  - The dot updates in real-time when c is changed by any method (sliders, presets, deal)
- **Coloring:** Uses the currently active suit palette so it visually matches the Julia view
- **Coordinates:** Mapped to real: [-2, 1], imaginary: [-1.5, 1.5] (standard Mandelbrot view)

### Julia Set Canvas

- **Size:** 600×600px (main canvas)
- **Mouse Interactions:**
  - **Click + Drag:** Pan the view (shift center)
  - **Scroll Wheel:** Zoom in/out centered on cursor position
  - **Double Click:** Center view on clicked point
- **Coordinate Display:** Show the complex coordinate under the cursor in real-time (bottom of canvas or in a status bar)

### Controls Panel

All controls are styled as a playing-card-themed panel:

- **Suit Selector:** Four suit buttons (♥ ♠ ♦ ♣) to switch color palettes
  - Active suit is highlighted with its color; others are dimmed
  - Switching suits instantly recolors the current fractal without recomputing
- **c-Value Sliders:**
  - Real part: slider from -2.0 to 2.0, step 0.001
  - Imaginary part: slider from -2.0 to 2.0, step 0.001
  - Display current values with 4 decimal places
- **Iteration Slider:** 50 to 500, step 10
- **Zoom Display:** Shows current zoom level (read-only, controlled by scroll)
- **Deal Button:** Card-styled button with a dealing animation
- **Save to Hand Button:** Adds current fractal to favorites
- **Reset View:** Resets zoom and pan to defaults (keeps current c and palette)

---

## Color Palettes

Each suit defines a gradient of colors mapped to iteration escape values. Colors are interpolated smoothly using the normalized iteration count (with smooth coloring to avoid banding).

### Smooth Coloring Algorithm

To avoid harsh color bands at integer iteration boundaries:

```
smoothed = iterations - log2(log2(|z|))
t = smoothed / maxIterations
color = palette.interpolate(t)
```

### Palette Definitions

Each palette is an array of color stops that are interpolated cyclically:

**♥ Hearts (Passion):**
- Deep crimson → Rose pink → Gold → Cream white → Deep crimson (cycle)

**♠ Spades (Mystery):**
- Black → Midnight blue → Silver → Indigo → Black (cycle)

**♦ Diamonds (Brilliance):**
- Dark amber → Electric yellow → Pure white → Crystal blue → Dark amber (cycle)

**♣ Clubs (Nature):**
- Dark mahogany → Forest green → Emerald → Pale sage → Dark mahogany (cycle)

**Interior Color:** Points that never escape (inside the Julia set) are rendered as a deep, solid version of the suit's darkest color.

---

## UI Layout

### Structure

```
┌──────────────────────────────────────────────┐
│  ♠♥♦♣  THE FRACTAL DECK  ♣♦♥♠              │  Header
├────────────────────────┬─────────────────────┤
│                        │  Suit Selector      │
│                        │  [♥] [♠] [♦] [♣]   │
│                        │                     │
│    Julia Set Canvas    │  c-value Controls   │
│      (600×600)         │  Real: ────●────    │
│                        │  Imag: ────●────    │
│                        │                     │
│                        │  Mandelbrot Nav     │
│                        │  ┌──────────┐       │
│                        │  │  (200×200)│       │
│                        │  └──────────┘       │
│                        │                     │
│                        │  Iterations: ──●──  │
│                        │  [Deal] [Save] [Reset]│
├────────────────────────┴─────────────────────┤
│  Your Hand: [card] [card] [card] ...  [Clear]│  Favorites bar
└──────────────────────────────────────────────┘
```

### Visual Theme

- **Background:** Deep green felt texture (CSS gradient simulating a card table)
  - Radial gradient: dark green center (#1a472a) fading to near-black edges (#0a1f12)
- **Cards/Panels:** White or off-white (#f5f0e8) with rounded corners, subtle drop shadow, thin gold border
  - Inspired by the back of playing cards
- **Header:** Ornate styling with suit symbols as decorative elements
- **Typography:**
  - Card names and headers: Serif font (Georgia or similar) for elegance
  - Values and labels: Clean sans-serif (system font stack)
- **Suit Colors:**
  - ♥ Hearts: #DC143C (crimson)
  - ♠ Spades: #1B1B2F (midnight)
  - ♦ Diamonds: #FFB300 (amber)
  - ♣ Clubs: #2E7D32 (forest green)
- **Buttons:** Styled as miniature playing cards with rounded corners and suit symbols
- **Animations:**
  - Card flip: CSS 3D transform for the Deal reveal (0.6s)
  - Suit switch: Smooth color transition (0.3s)
  - Hand cards: Slight overlap and rotation to create a fan effect

### Responsive Design
- Below 1024px: Single column, canvas above controls
- Controls panel scrollable on smaller screens
- Hand bar wraps if needed

---

## Card-Flip Animation

When the user clicks "Deal":

1. A card-back element appears over the canvas (CSS 3D flip)
2. Card back shows an ornate design with all four suits
3. After 0.3s, the card flips (rotateY transform)
4. The card face reveals:
   - The suit symbol and color
   - A whimsical generated name (e.g., "7♦ The Spark")
   - The c-value
5. Simultaneously, the Julia set begins rendering behind the card
6. Card fades out after 1.5s, revealing the fully rendered fractal

---

## File Structure

```
julia/
└── index.html    # Complete application (single file)
```

---

## Key Functions

| Function | Purpose |
|----------|---------|
| `computeJulia()` | Calculate Julia set for current c, zoom, center |
| `computeMandelbrot()` | Calculate Mandelbrot set for navigator |
| `renderJulia()` | Draw Julia set to main canvas using active palette |
| `renderMandelbrot()` | Draw Mandelbrot navigator with c-position marker |
| `smoothColor(iterations, z)` | Compute smooth iteration count for anti-banding |
| `interpolatePalette(t, palette)` | Map normalized value to RGB color from palette |
| `switchSuit(suit)` | Change active palette and recolor without recomputing |
| `deal()` | Generate random c-value, pick suit, trigger card animation |
| `saveToHand()` | Save current state to localStorage favorites |
| `loadFromHand(index)` | Restore a saved fractal from favorites |
| `removeFromHand(index)` | Remove a card from favorites |
| `renderHand()` | Draw the favorites bar with card thumbnails |
| `onCanvasMouseDown/Move/Up()` | Handle panning via click-drag |
| `onCanvasWheel()` | Handle zooming via scroll wheel |
| `onMandelbrotClick()` | Pick c-value from Mandelbrot navigator click |
| `loadPreset(rank, suit)` | Load a curated card from the deck |
| `generateName()` | Create a whimsical name for dealt fractals |
| `updateCoordinateDisplay()` | Show complex coordinate under cursor |
| `initApp()` | Set up canvases, event listeners, initial render |

---

## Performance Considerations

### Canvas 2D Optimization
- Use `ImageData` and direct pixel manipulation (avoid `fillRect` per pixel)
- Compute in a single pass, write to `ImageData` buffer, then `putImageData` once
- For smooth interaction, render at reduced resolution during pan/zoom, then re-render at full resolution on mouse-up (progressive refinement)
- Mandelbrot navigator only re-renders when palette changes (it's static geometry)

### Progressive Rendering
During pan or zoom interactions:
1. Render at 1/4 resolution (150×150 stretched to 600×600) for instant feedback
2. On interaction end (mouseup / scroll stop after 200ms debounce), render at full 600×600

### Palette Switching
When the user switches suits, avoid recomputing the fractal:
- Store the raw iteration counts in a buffer
- Re-map iteration counts to the new palette's colors
- This makes suit switching instant

---

## Interaction Flow

### First Load
1. App initializes with the Ace of Hearts preset (c = -1.0 + 0.0i, Hearts palette)
2. Julia set renders on the main canvas
3. Mandelbrot navigator renders with the c-position dot
4. Hand bar is empty (or loaded from localStorage if returning user)
5. A subtle "Click the Mandelbrot map or press Deal to explore" hint appears

### Typical Session
1. User clicks on the Mandelbrot navigator → Julia set updates in real-time
2. User scrolls to zoom into an interesting area
3. User switches to ♠ Spades palette → fractal instantly recolors
4. User clicks "Save" → card appears in the hand bar
5. User clicks "Deal" → card flip animation → random fractal revealed
6. User browses preset deck by clicking card-rank buttons

---

## Browser Compatibility

- **Requirements:** HTML5 Canvas, ES6 JavaScript, CSS 3D Transforms, localStorage
- **Tested On:** Modern browsers (Chrome, Firefox, Safari, Edge) on desktop
- **Performance Note:** Deep zooms (zoom > 50×) with high iteration counts may be slow on Canvas 2D; this is expected and documented

---

## Future Enhancement Ideas

- WebGL/GPU rendering for real-time deep zooming
- Animated c-parameter paths (morphing fractals along curves in the complex plane)
- Export fractal as PNG with card-styled border and metadata
- Share cards via URL parameters (encode c-value + suit in hash)
- Sound design: subtle tones mapped to fractal complexity
- Touch gestures for mobile (pinch to zoom, swipe to deal)
- "Poker Hand" mode: deal 5 cards and rate the visual "hand"
- Fullscreen mode for the Julia canvas
- Higher resolution rendering via Web Workers (off-main-thread computation)
- Color palette editor (custom suits)

---

## Development Notes

### Design Decisions

1. **Card Table Aesthetic:** The green felt background immediately establishes the card-game metaphor without being kitschy. The white card panels float above it naturally.

2. **Suit = Palette:** Mapping suits to color palettes creates a simple, memorable system. Users quickly learn "Hearts = warm, Spades = cool" and develop favorites.

3. **Mandelbrot as Navigator:** This is mathematically rigorous and deeply satisfying — every click on the Mandelbrot set reveals the corresponding Julia set, making the connection between these two fundamental fractals tangible and interactive.

4. **Progressive Rendering:** Canvas 2D is slow for 600×600 fractal computation, but progressive rendering (low-res during interaction, full-res on release) keeps the app feeling responsive without WebGL complexity.

5. **Iteration Buffer Separation:** Storing raw iteration counts separately from colors means palette switching is instant (O(n) color remap vs. O(n × maxIter) recomputation). This makes suit switching feel magical.

6. **localStorage for Hand:** Consistent with the other projects in this repo. Simple, zero-dependency persistence.

7. **Single File Architecture:** Matches the turing-explorer pattern. Everything in one index.html keeps deployment to GitHub Pages trivial.

---

## Credits

- **Development:** Claude
- **Mathematical Foundation:** Gaston Julia and Pierre Fatou (Julia sets, 1918), Benoit Mandelbrot (visualization and the Mandelbrot set, 1978)
- **Theme Concept:** User-requested card suits theme
- **Repository Owner:** AIML-1870-2026

---

## License

This project is part of an educational assignment. No formal license specified.
