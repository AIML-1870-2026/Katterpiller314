# Boidspec - Under The Sea

## Overview

**Under The Sea** is a self-contained, single-file Boids simulation built as an interactive mini-lab. It implements Craig Reynolds' classic flocking algorithm with extended features for exploration and experimentation. The entire application runs in the browser with no dependencies.

**File:** `index.html`
**Tech:** Vanilla HTML + CSS + JavaScript (Canvas 2D)

---

## Architecture

### Core Classes

#### `Vector`
Immutable-style 2D vector math utility used for all physics calculations.

| Method | Description |
|---|---|
| `add(v)` | Returns the sum of two vectors |
| `sub(v)` | Returns the difference of two vectors |
| `mult(n)` | Scalar multiplication |
| `div(n)` | Scalar division (safe, returns zero vector if `n === 0`) |
| `mag()` | Returns the magnitude (length) |
| `normalize()` | Returns a unit vector in the same direction |
| `limit(max)` | Caps the magnitude at `max` |
| `heading()` | Returns the angle in radians (`atan2`) |
| `static random()` | Returns a random unit vector |

#### `Boid`
Represents a single agent in the simulation.

| Property | Type | Description |
|---|---|---|
| `position` | `Vector` | Current position on canvas |
| `velocity` | `Vector` | Current velocity |
| `acceleration` | `Vector` | Accumulated forces for current frame |
| `isLeader` | `boolean` | Whether this boid acts as a leader |
| `isPredator` | `boolean` | Whether this boid acts as a predator |
| `neighborCount` | `number` | Number of neighbors detected last frame |

**Key methods:**

| Method | Description |
|---|---|
| `applyForce(force)` | Adds a steering force to the acceleration accumulator |
| `inPerceptionCone(other)` | Returns `true` if `other` is within this boid's field of view |
| `getNeighbors(allBoids)` | Finds all boids within `radius` that pass the FOV check |
| `separation(neighbors)` | Calculates steering away from close neighbors (within 50% of radius) |
| `alignment(neighbors)` | Calculates steering to match average neighbor velocity |
| `cohesion(neighbors)` | Calculates steering toward the average neighbor position |
| `avoidObstacles()` | Steers away from all obstacles within detection range |
| `followLeader()` | Steers toward the leader boid (if enabled, within 3x radius) |
| `evadePredator()` | Steers away from the predator boid (if enabled, within 2x radius) |
| `update(allBoids)` | Runs one simulation step: accumulates forces, updates velocity/position |
| `handleBoundary()` | Applies wrap or bounce at canvas edges |
| `draw()` | Renders the boid as a directional triangle, optionally with perception cone |

---

## Simulation Parameters

| Parameter | Slider ID | Range | Default | Description |
|---|---|---|---|---|
| Separation Weight | `separation` | 0 - 5 | 1.5 | Strength of avoidance from nearby flockmates |
| Alignment Weight | `alignment` | 0 - 5 | 1.0 | Strength of velocity matching with neighbors |
| Cohesion Weight | `cohesion` | 0 - 5 | 1.0 | Strength of steering toward neighbor center |
| Neighbor Radius | `radius` | 10 - 150 px | 50 | Perception distance for detecting neighbors |
| Max Speed | `maxSpeed` | 1 - 10 | 4 | Maximum velocity magnitude |
| Max Steering Force | `maxForce` | 0.01 - 0.5 | 0.1 | Maximum force applied per frame (controls agility) |
| Boid Count | `boidCountSlider` | 10 - 300 | 100 | Number of regular boids (triggers re-init on change) |
| Field of View | `fov` | 30 - 360 deg | 270 | Angular width of perception cone |

---

## Features

### 1. Behavior Presets

Three preset buttons snap all parameters to predefined values:

| Preset | Separation | Alignment | Cohesion | Radius | Max Speed | Behavior |
|---|---|---|---|---|---|---|
| Schooling | 1.0 | 2.5 | 1.5 | 60 | 3.5 | Coordinated, fish-like movement |
| Chaotic | 2.0 | 0.3 | 0.3 | 25 | 6.0 | Scattered, erratic motion |
| Cluster | 1.2 | 1.0 | 3.0 | 80 | 3.0 | Tight, cohesive grouping |

### 2. Instrumentation (Live Readouts)

| Stat | Update Rate | Description |
|---|---|---|
| FPS | Every 1 second | Frames rendered per second |
| Boid Count | Every frame | Total agents (boids + leader + predator) |
| Avg Speed | Every frame | Mean velocity magnitude across all regular boids |
| Avg Neighbors | Every frame | Mean neighbor count across all regular boids |

### 3. Simulation Controls

| Control | Action |
|---|---|
| Pause / Resume | Toggles the simulation loop (rendering stops; FPS counter continues) |
| Reset | Re-initializes all boids with random positions and velocities |

### 4. Boundary Modes

| Mode | Behavior |
|---|---|
| **Wrap** (default) | Boids exiting one edge reappear on the opposite edge |
| **Bounce** | Boids reflect off walls; a visible red boundary is drawn at 20px margin |

Toggled via two mutually exclusive buttons.

### 5. Perception Cone (Field of View)

- **Toggle:** Checkbox enables/disables FOV filtering
- **FOV slider:** Adjusts the cone angle (30-360 degrees)
- **Visualization:** Optional checkbox overlays each boid's perception cone on the canvas
- When disabled (or set to 360), boids sense omnidirectionally
- When enabled, only neighbors within the forward-facing cone are considered for separation, alignment, and cohesion

### 6. Obstacle Avoidance

- Obstacles are circular with radius 30-50px (randomized on placement)
- Rendered as pufferfish emoji (🐡) scaled to obstacle size
- Avoidance force scales inversely with distance and is 3x the normal max force
- **Add:** Click the "Add" button, then click the canvas to place
- **Clear:** Removes all obstacles
- **Toggle:** Checkbox enables/disables avoidance calculations

### 7. Leader & Predator

| Role | Color | Behavior | Interaction |
|---|---|---|---|
| **Leader** | Green (`#00ff88`) | Wanders randomly | Regular boids steer toward it (within 3x radius, 0.5x force) |
| **Predator** | Red (`#ff4444`) | Chases nearest non-leader boid (1.2x speed) | Regular boids flee (within 2x radius, 2x force) |

- Each is toggled via checkbox
- Click the canvas to reposition the active leader or predator
- Leader and predator are larger (12px vs 8px) for visual distinction

---

## Rendering

- **Canvas:** Responsive, max 1000x800px, dark background (`#0f0f23`)
- **Boid shape:** Directional triangle pointing along velocity heading
- **Color coding:**
  - Normal boid: cyan (`#00d9ff`)
  - Leader: green (`#00ff88`)
  - Predator: red (`#ff4444`)
  - Obstacles: 🐡 emoji
  - Bounce boundary: translucent red stroke

---

## Layout

The UI is split into two regions:

- **Sidebar (320px):** All controls, stats, presets, toggles, and legend
- **Main area:** The simulation canvas, centered with padding

The sidebar is scrollable to accommodate all controls on smaller screens.

---

## Simulation Loop

```
Each frame:
  1. Calculate FPS (once per second)
  2. If paused, skip to next frame
  3. Clear canvas
  4. Draw boundary indicator (if bounce mode)
  5. Draw obstacles
  6. For each boid: accumulate forces -> update velocity/position -> handle boundary
  7. For each boid: draw
  8. Update stat readouts
```

---

## How to Run

Open `index.html` in any modern browser:

```bash
open index.html
```

No build step, no dependencies, no server required.
