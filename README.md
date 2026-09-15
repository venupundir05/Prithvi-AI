# PRITHVI AI
### Intelligent Environmental Monitoring, Early Warning & Disaster Response Training System

**Sense. Predict. Alert. Respond.**

PRITHVI AI is a browser-based prototype that fuses simulated environmental sensor data (flood, forest fire, pollution) into a single early-warning risk score — and pairs that warning with a **practice layer**: playable evacuation drills, animated safety briefings, scenario-based quizzes, and a preparedness score that tracks improvement over time.

Built for Smart India Hackathon (SIH) as a software-first prototype, ready for future ESP32 sensor + ML model integration.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [Roadmap](#roadmap)
- [Notes for Judges / Reviewers](#notes-for-judges--reviewers)

---

## Features

### 📊 Environmental Intelligence Dashboard
- Live-updating hazard cards for **Flood**, **Forest Fire**, and **Pollution**
- Overall system risk strip: Normal → Warning → High Risk → Critical
- **Demo Mode** — toggle to watch sensor values evolve and escalate in real time
- Sparkline trends per metric, active early-warning alert feed

### 📈 Live Monitoring
- Dual-series time-series charts per hazard (drawn on plain HTML5 Canvas — no charting library)
- Raw sensor feed table with per-channel status

### ⚠️ Early Warning Center
- Full detail per hazard: current conditions, affected area, trend, recommended action, nearest safe zone

### 🎮 Disaster Drill Center — three playable 2D games
Built on one shared canvas game engine (movement physics, tile collision, camera follow, dynamic hazard grid, item pickups, timer, health, scoring):
- **Rising Waters** (Flood) — outrun a rising water level to high ground
- **Escape the Fire** (Forest Fire) — evacuate crosswind as fire spreads with shifting wind
- **Beat the AQI** (Pollution) — cross a smog-choked city to filtered-air shelter

### 🎬 Disaster Safety Academy
Per-hazard training modules covering what's happening, why it's dangerous, what to do/avoid, and where to go.

### ❓ Quiz Center
Scenario-based multiple-choice quizzes per hazard with explanations, topic-wise mistake tracking, and improvement recommendations.

### 🏆 Preparedness Score (Performance Analytics)
Aggregates every drill and quiz result into an overall score, a 5-part skill breakdown (response time, decision making, route selection, hazard awareness, safety knowledge), unlockable badges, and session history.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Structure | Plain HTML5 |
| Styling | Plain CSS3 (Flexbox, Grid, CSS variables, glassmorphism via `backdrop-filter`) |
| Logic | Vanilla JavaScript (ES6, no frameworks) |
| Graphics | HTML5 Canvas 2D API (charts, sparklines, drill-game engine) |
| Data | Simulated sensor engine + browser `localStorage` for progress |

**No paid APIs. No paid assets. No build step. No backend required.** Everything runs client-side in the browser.

---

## Project Structure

```
prithvi-ai/
├── index.html                  # App shell — all views live in one page
├── css/
│   ├── base.css                # Design tokens, resets, typography
│   ├── layout.css               # App shell: header, side nav, main layout
│   ├── components.css           # Reusable UI: cards, buttons, badges, tables
│   ├── views.css                 # Dashboard / monitoring / academy / quiz / performance styles
│   ├── games.css                 # Drill game canvas + HUD styling
│   └── drills-visual.css         # Interactive drill-visualizer theme system
├── js/
│   ├── state.js                  # Global app state + localStorage persistence
│   ├── content.js                # Shared static copy (alert text, hazard labels)
│   ├── nav.js                    # View switching, clock, demo-mode toggle
│   ├── sensors.js                # Simulated sensor engine + risk scoring
│   ├── dashboard.js              # Dashboard rendering
│   ├── monitoring.js             # Live Monitoring charts + raw feed table
│   ├── warnings.js               # Early Warning Center rendering
│   ├── game-engine.js            # Shared 2D canvas drill-game engine
│   ├── game-flood.js             # "Rising Waters" scenario config
│   ├── game-fire.js              # "Escape the Fire" scenario config
│   ├── game-pollution.js         # "Beat the AQI" scenario config
│   ├── drills.js                 # Drill hub UI wiring (HUD, overlays, results)
│   ├── drill-visual-core.js      # Shared engine for interactive drill visualizers
│   ├── drill-fire.js             # Fire drill visualizer content/steps
│   ├── drill-flood.js            # Flood drill visualizer content/steps
│   ├── drill-pollution.js        # Pollution drill visualizer content/steps
│   ├── drills-visual-wire.js     # Wires "Watch Module" buttons to training videos
│   ├── quiz.js                   # Quiz Center logic + question banks
│   ├── performance.js            # Preparedness score aggregation + badges
│   └── app.js                    # Final bootstrap
└── README.md
```

---

## Getting Started

No installation or build step required.

### Option 1 — Just open it
Double-click `index.html` and it will open in your default browser.

### Option 2 — Live Server (recommended)
1. Open the project folder in [VS Code](https://code.visualstudio.com/)
2. Install the **Live Server** extension (by Ritwick Dey)
3. Right-click `index.html` → **Open with Live Server**

### Deploying
This is a static site — deploy the contents of this folder (not the zipped folder itself) to any static host:
- **Netlify Drop** — drag the folder's contents onto [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel** — set **Root Directory** to this folder's name in Project Settings → Build & Deployment if it lives in a subfolder of your repo
- **GitHub Pages** — ensure `index.html` sits at the repository root (or configure the Pages source folder accordingly)

---

## How It Works

```
Environmental Sensors (future: ESP32) → Filtering → Feature Extraction
        → Anomaly Detection → AI Prediction → Early Risk Score → Alert
        → Actionable Response → Disaster Drill (practice loop)
```

In the current prototype, `sensors.js` **simulates** the sensor-to-risk-score pipeline with a rule-based scoring model over realistic mock data (with a scripted "Demo Mode" event system), so the full dashboard → alert → drill loop can be demonstrated end-to-end before hardware is connected.

Each hazard's raw metrics are normalized into a 0–100 risk score and bucketed into **Normal → Warning → High Risk → Critical**. The drill games represent their world as a grid of tiles carrying a hazard-intensity value (0–1) that evolves every frame — rising row by row for flood, spreading via neighbor-influenced rules pushed by wind for fire, and drifting from moving sources for pollution — and the player's health drains based on the tile they're standing on.

---

## Roadmap

- [ ] Replace rule-based risk scoring with a trained anomaly-detection/prediction model
- [ ] Connect real ESP32 sensor nodes (via USB to a laptop acting as edge gateway)
- [ ] GIS-based real shelter/route mapping (replacing placeholder locations)
- [ ] Backend + accounts so preparedness scores persist beyond a single browser

---


**PRITHVI AI** · SIH Prototype · Edge-AI Early Warning System
