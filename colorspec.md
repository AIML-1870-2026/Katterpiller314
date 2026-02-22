# colorspec.md — RGB Color Studio

**Live URL:** https://aiml-1870-2026.github.io/Katterpiller314/Colors/
**File:** `Colors/index.html`
**Stack:** Vanilla HTML / CSS / JavaScript (no dependencies)

---

## Overview

RGB Color Studio is a single-page, browser-based color tool. It lets you mix a color using RGB sliders or a hex input, inspect its properties across multiple color spaces, check its accessibility contrast, and instantly generate four types of color palettes derived from it.

---

## Features

### 1. RGB Mixer

| Control | Description |
|---|---|
| R slider | Integer 0–255, red channel |
| G slider | Integer 0–255, green channel |
| B slider | Integer 0–255, blue channel |
| Hex input | 6-digit hex code (`#rrggbb`), synced bidirectionally with sliders |
| Color preview | Full-width live preview block, updates on every change |

**Slider track behavior:** Each slider's gradient track updates dynamically to reflect the current values of the other two channels, so the visible color range is always accurate to the current mix.

**Hex input behavior:** Syncs to sliders as you type (validates on each keystroke against `/^#[0-9a-fA-F]{6}$/`). On blur, the field normalizes to the canonical hex of the current slider values.

---

### 2. Color Info Panel

Displays computed values for the active color across three sections:

#### RGB
| Field | Range |
|---|---|
| Red | 0–255 |
| Green | 0–255 |
| Blue | 0–255 |

#### HSL
Converted from RGB using standard HSL formulae.

| Field | Range |
|---|---|
| Hue | 0°–360° |
| Saturation | 0%–100% |
| Lightness | 0%–100% |

#### Relative Luminance
Computed per the WCAG 2.1 formula (see Contrast section below). Displayed as a 4-decimal float (0.0000–1.0000).

---

### 3. Contrast Checker (Active Color)

Tests the active color as foreground text against two standard backgrounds:

- **On white** (`#ffffff`)
- **On black** (`#000000`)

Each card shows:
- A live text preview (`Aa` headline + sample sentence) rendered in the active color on the respective background
- The computed contrast ratio (e.g. `4.58:1`)
- **AA** badge — pass/fail
- **AAA** badge — pass/fail

#### WCAG 2.1 Thresholds (normal text)

| Level | Minimum Ratio |
|---|---|
| AA | 4.5 : 1 |
| AAA | 7.0 : 1 |

#### Luminance Formula

```
linearize(c):
  if c/255 <= 0.03928 → c / 255 / 12.92
  else                → ((c/255 + 0.055) / 1.055) ^ 2.4

L = 0.2126·R_lin + 0.7152·G_lin + 0.0722·B_lin

contrast(L1, L2) = (max(L1,L2) + 0.05) / (min(L1,L2) + 0.05)
```

---

### 4. Palette Generation

All four palettes are derived from the active color's HSL representation and update in real time as the mixer changes. Each palette contains **5 swatches**.

#### Complementary
Pairs the base color with its opposite on the color wheel (hue + 180°), including lightness variations of both.

| Swatch | Description |
|---|---|
| 1 | Base color, lightness − 20 |
| 2 | Base color |
| 3 | Base color, lightness + 20 |
| 4 | Complement, lightness + 15 |
| 5 | Complement at base lightness |

#### Analogous
Colors adjacent to the base on the color wheel, stepping ±30° and ±60°.

| Swatch | Hue offset |
|---|---|
| 1 | −60° |
| 2 | −30° |
| 3 | Base (0°) |
| 4 | +30° |
| 5 | +60° |

#### Triadic
Three colors evenly spaced 120° apart on the color wheel, with a lightness variant.

| Swatch | Description |
|---|---|
| 1 | Base (hue) |
| 2 | Base, lightness + 20 |
| 3 | Hue + 120° |
| 4 | Hue + 240° |
| 5 | Hue + 240°, lightness + 20 |

#### Monochromatic
Five fixed lightness steps across the base hue and saturation.

| Swatch | Lightness |
|---|---|
| 1 | 20% |
| 2 | 35% |
| 3 | 50% |
| 4 | 65% |
| 5 | 80% |

> Lightness is clamped to 5–95% across all palettes to avoid pure black or white swatches.

---

### 5. Swatch Interaction

**Hover:** Reveals an overlay on each swatch showing:
- The swatch's hex code
- Four mini contrast badges: `AA▪W`, `AAA▪W`, `AA▪B`, `AAA▪B`
  - `W` = tested against white background
  - `B` = tested against black background
  - Green = pass, red = fail

**Click:** Copies the swatch's hex code to the clipboard. A toast notification confirms the copied value (auto-dismisses after 1.8 seconds).

---

## Layout

```
┌─────────────────────────────────────────────┐
│              RGB Color Studio               │
├───────────────────┬─────────────────────────┤
│   Mixer           │   Info Panel            │
│   [preview]       │   RGB values            │
│   R ──────────    │   HSL values            │
│   G ──────────    │   Relative Luminance    │
│   B ──────────    │                         │
│   Hex: #______    │                         │
├───────────────────┴─────────────────────────┤
│   Contrast Checker                          │
│   [Color on White]   [Color on Black]       │
├─────────────────────────────────────────────┤
│   Palettes                                  │
│   Complementary   │   Analogous             │
│   □ □ □ □ □       │   □ □ □ □ □             │
│   Triadic         │   Monochromatic         │
│   □ □ □ □ □       │   □ □ □ □ □             │
└─────────────────────────────────────────────┘
```

Responsive: collapses to single-column at viewport widths ≤ 640px.

---

## Color Space Conversions

All conversions are implemented in pure JavaScript with no external libraries.

| Function | Input → Output |
|---|---|
| `rgbToHex(r,g,b)` | RGB integers → `#rrggbb` string |
| `hexToRgb(hex)` | `#rrggbb` string → `{r, g, b}` |
| `rgbToHsl(r,g,b)` | RGB integers → `{h, s, l}` |
| `hslToRgb(h,s,l)` | HSL values → `{r, g, b}` |
| `hslToHex(h,s,l)` | HSL values → `#rrggbb` string |
| `relativeLuminance(r,g,b)` | RGB integers → float 0–1 |
| `contrastRatio(lum1,lum2)` | Two luminance values → ratio float |
