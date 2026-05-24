# Don't Blink Challenge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working browser prototype of the Don't Blink Challenge — a gaze-endurance game played during a Zepto ice cream delivery wait, using MediaPipe Face Mesh for real on-device blink detection.

**Architecture:** Single-page app (vanilla HTML/CSS/JS, no build tooling) with 8 screen states managed by a central session object. MediaPipe Face Mesh loads via CDN and runs entirely on-device. All backend interactions are mocked (no real server, no real Zepto Cash API). Served from localhost using Python's built-in HTTP server (MediaPipe WASM requires HTTP, not file://).

**Tech Stack:** HTML5 · CSS3 · Vanilla JS (ES modules) · MediaPipe Face Mesh 0.4 (CDN/WASM) · Canvas 2D API (share card) · Node.js 18+ built-in test runner (pure function tests)

---

## File Map

```
prototype/
├── index.html                        # All 8 screens; hidden/shown via JS class toggle
├── css/
│   ├── brand.css                     # Zepto brand tokens (colors, type, radius, easing)
│   └── app.css                       # Screen layouts, component styles, animations
├── js/
│   ├── utils/
│   │   ├── rewards.js                # Pure: calculateReward(seconds) → ₹ int
│   │   ├── blink.js                  # Pure: calculateEAR(sixLandmarks) → float, isBlink(ear) → bool
│   │   └── zones.js                  # Pure: ZONES array, getZoneForIris(nx, ny) → zone index
│   ├── mediapipe.js                  # MediaPipe Face Mesh init + camera stream; exports startCamera(onResults)
│   ├── calibration.js                # 3-dot calibration UI; exports runCalibration() → Promise<CalibData>
│   ├── scoop.js                      # Zone positions + drift scheduler; exports startScoop(), stopScoop()
│   ├── challenge.js                  # Challenge loop: timer, EAR blink check, zone HUD, end on blink
│   ├── share.js                      # Canvas share card rendering; exports drawShareCard(canvas, data)
│   └── main.js                       # Entry point: screen transitions + top-level event listeners
├── tests/
│   ├── rewards.test.js               # Node test runner — calculateReward edge cases
│   ├── blink.test.js                 # Node test runner — calculateEAR + isBlink
│   └── zones.test.js                 # Node test runner — getZoneForIris
└── package.json                      # type:module; scripts.test = "node --test tests/"
```

**Screen IDs (used throughout):**
- `confirmation` — order confirmation + dare banner
- `rules` — rules + reward tiers
- `countdown` — 3-2-1 countdown
- `calibration` — 3-point gaze calibration
- `stare` — core gameplay
- `blinked` — challenge ended
- `reward` — Zepto Cash reveal
- `share` — share card + download

---

## Task 1: Scaffold + Git + Dev Server

**Files:**
- Create: `prototype/package.json`
- Create: `prototype/.gitignore`

- [ ] **Step 1: Git init + scaffold**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study"
git init
mkdir -p prototype/css prototype/js/utils prototype/tests prototype/assets
```

Expected: `Initialized empty Git repository in ...`

- [ ] **Step 2: Create package.json**

Create `prototype/package.json`:
```json
{
  "name": "dont-blink-prototype",
  "type": "module",
  "scripts": {
    "test": "node --test tests/"
  }
}
```

- [ ] **Step 3: Create .gitignore**

Create `prototype/.gitignore`:
```
.DS_Store
node_modules/
```

- [ ] **Step 4: Verify Node version**

```bash
node --version
```

Expected: `v18.x.x` or higher. The built-in test runner (`node:test`) requires Node 18+.
If lower than v18, install via `brew install node` or `nvm use 18`.

- [ ] **Step 5: Note how to serve**

MediaPipe WASM does not work on `file://`. Always serve from localhost:
```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study/prototype"
python3 -m http.server 8080
```
Open: `http://localhost:8080`

- [ ] **Step 6: Commit scaffold**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study"
git add prototype/
git commit -m "chore: scaffold prototype directory structure"
```

---

## Task 2: Brand CSS + App CSS

**Files:**
- Create: `prototype/css/brand.css`
- Create: `prototype/css/app.css`

- [ ] **Step 1: Create brand tokens**

Create `prototype/css/brand.css`:
```css
:root {
  /* Colors */
  --c-bg:       #0f0517;
  --c-surface:  #160924;
  --c-border:   #2a1a4e;
  --c-purple:   #7c3aed;
  --c-pink:     #ff2d6b;
  --c-gold:     #fbbf24;
  --c-white:    #ffffff;
  --c-muted:    rgba(255, 255, 255, 0.45);
  --c-dim:      rgba(255, 255, 255, 0.08);

  /* Typography */
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Radii */
  --r-sm: 12px;
  --r-md: 20px;
  --r-lg: 36px;

  /* Easing */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font);
  background: #111;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 2: Create app styles**

Create `prototype/css/app.css`:
```css
/* Phone shell — 375px wide, centred on desktop */
.phone-shell {
  width: 375px;
  min-height: 812px;
  background: var(--c-bg);
  border-radius: var(--r-lg);
  border: 1px solid var(--c-border);
  box-shadow: 0 40px 100px rgba(0,0,0,0.8);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Screen visibility toggle */
.screen { display: none; flex-direction: column; height: 100%; min-height: 812px; }
.screen.active { display: flex; }

/* --- Typography --- */
.h1   { font-size: 32px; font-weight: 900; color: var(--c-white); line-height: 1.1; }
.h2   { font-size: 22px; font-weight: 800; color: var(--c-white); }
.h3   { font-size: 16px; font-weight: 700; color: var(--c-white); }
.body { font-size: 14px; line-height: 1.55; color: var(--c-muted); }
.label {
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.09em; text-transform: uppercase;
  color: var(--c-muted);
}

/* --- Buttons --- */
.btn {
  width: 100%; padding: 17px 20px;
  border: none; border-radius: var(--r-md);
  font-family: var(--font); font-size: 15px; font-weight: 800;
  letter-spacing: 0.04em; cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.btn:active { opacity: 0.8; transform: scale(0.98); }

.btn-primary {
  background: linear-gradient(135deg, var(--c-purple), var(--c-pink));
  color: #fff;
}
.btn-ghost {
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-muted);
}

/* --- Tier row (rules screen) --- */
.tier-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px;
  background: var(--c-dim); border-radius: var(--r-sm);
  border: 1px solid var(--c-border);
}
.tier-row.reached { border-color: rgba(251,191,36,0.4); background: rgba(251,191,36,0.07); }

/* --- Progress bar --- */
.prog-track {
  width: 100%; height: 4px;
  background: var(--c-dim); border-radius: 20px;
}
.prog-fill {
  height: 100%; border-radius: 20px; width: 0%;
  background: linear-gradient(90deg, var(--c-purple), var(--c-pink));
  transition: width 0.5s linear;
}

/* --- Live badge --- */
.live-badge {
  display: flex; align-items: center; gap: 5px;
}
.live-dot {
  width: 6px; height: 6px;
  background: var(--c-pink); border-radius: 50%;
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* --- Scoop --- */
#scoop-emoji {
  position: absolute;
  font-size: 101px; /* 27% of 375px */
  line-height: 1;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 6px 24px rgba(124,58,237,0.5));
  /* drift transition applied by scoop.js */
}

/* --- Calibration dot --- */
#cal-dot {
  position: absolute;
  width: 22px; height: 22px;
  background: var(--c-pink); border-radius: 50%;
  box-shadow: 0 0 0 6px rgba(255,45,107,0.2);
  transform: translate(-50%, -50%);
  transition: left 0.7s var(--ease-out), top 0.7s var(--ease-out), opacity 0.3s;
}

/* --- Share canvas wrapper --- */
#share-canvas {
  border-radius: var(--r-md);
  width: 100%;
  max-width: 335px;
}
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study"
git add prototype/css/
git commit -m "feat: add Zepto brand CSS tokens and component styles"
```

---

## Task 3: HTML Skeleton (All 8 Screens)

**Files:**
- Create: `prototype/index.html`

- [ ] **Step 1: Write index.html**

Create `prototype/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Don't Blink — Zepto</title>
  <link rel="stylesheet" href="css/brand.css">
  <link rel="stylesheet" href="css/app.css">
  <!-- MediaPipe Face Mesh via CDN — loads as globals (not ES modules) -->
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js" crossorigin="anonymous"></script>
</head>
<body>
<div class="phone-shell">

  <!-- ═══════════════════════════════════════════
       SCREEN 1 — Order Confirmation + Dare Banner
       ═══════════════════════════════════════════ -->
  <div id="screen-confirmation" class="screen active">
    <div style="flex:1; padding:28px 20px 0;">
      <p class="label" style="margin-bottom:8px; color:var(--c-pink);">Order Confirmed</p>
      <h2 class="h2" style="margin-bottom:4px;">Your ice cream is on its way 🍦</h2>
      <p class="body" style="margin-bottom:24px;">Arriving in ~10 minutes</p>
      <div style="background:var(--c-surface); border-radius:var(--r-sm); padding:16px; border:1px solid var(--c-border); margin-bottom:28px;">
        <p class="h3" style="margin-bottom:4px;">2× Vanilla Soft Serve</p>
        <p class="body">₹198 · Delivered to Home</p>
      </div>
    </div>
    <!-- Dare banner -->
    <div style="padding:0 20px 36px;">
      <div style="background:linear-gradient(135deg,rgba(124,58,237,0.18),rgba(255,45,107,0.18)); border:1px solid rgba(255,45,107,0.35); border-radius:var(--r-md); padding:20px 16px;">
        <p class="label" style="color:var(--c-pink); margin-bottom:6px;">World Record: 1 hr 5 min 11 sec</p>
        <h3 class="h3" style="margin-bottom:8px;">Think you can outlast it? 👀</h3>
        <p class="body" style="margin-bottom:18px;">Stare at the scoop. Don't blink. Win up to ₹150 in Zepto Cash.</p>
        <button class="btn btn-primary" id="btn-accept-dare">I ACCEPT THE DARE</button>
        <button class="btn btn-ghost" style="margin-top:10px;" id="btn-skip">Maybe next time</button>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════
       SCREEN 2 — Rules + Reward Tiers
       ═══════════════════════════════════ -->
  <div id="screen-rules" class="screen">
    <div style="flex:1; padding:32px 20px 0;">
      <p class="label" style="color:var(--c-pink); margin-bottom:10px;">Don't Blink Challenge</p>
      <h1 class="h1" style="margin-bottom:14px;">The rules<br>are simple.</h1>
      <p class="body" style="margin-bottom:32px;">Stare at the moving scoop. Your front camera detects every blink. First blink ends the game — earn Zepto Cash for every second you hold.</p>
      <!-- Tier rows — populated by main.js -->
      <div id="tier-list" style="display:flex; flex-direction:column; gap:8px; margin-bottom:28px;"></div>
      <p class="label" style="margin-bottom:4px;">Once per day. Your record is yours.</p>
    </div>
    <div style="padding:0 20px 36px;">
      <button class="btn btn-primary" id="btn-start">START CHALLENGE</button>
    </div>
  </div>

  <!-- ═══════════════════════════
       SCREEN 3 — Countdown 3-2-1
       ═══════════════════════════ -->
  <div id="screen-countdown" class="screen" style="align-items:center; justify-content:center; position:relative;">
    <!-- Hidden video — camera warms up during countdown; display:none is safe for MediaPipe -->
    <video id="video" autoplay muted playsinline style="display:none;"></video>
    <p class="label" style="margin-bottom:20px;">Get your stare ready…</p>
    <div id="countdown-num" style="font-size:128px; font-weight:900; color:var(--c-white); line-height:1; font-variant-numeric:tabular-nums;">3</div>
    <p class="label" style="margin-top:24px;">Hold phone at arm's length · front camera active</p>
  </div>

  <!-- ═══════════════════════════════
       SCREEN 4 — Gaze Calibration
       ═══════════════════════════════ -->
  <div id="screen-calibration" class="screen" style="align-items:center; justify-content:center; position:relative;">
    <p class="label" id="cal-instruction" style="position:absolute; top:60px;">Look at the dot</p>
    <div id="cal-dot"></div>
    <p class="body" style="position:absolute; bottom:60px; text-align:center; padding:0 40px;">Keep your eyes on the dot — don't blink</p>
  </div>

  <!-- ═══════════════════════════════════
       SCREEN 5 — Stare (Core Gameplay)
       ═══════════════════════════════════ -->
  <div id="screen-stare" class="screen" style="flex-direction:column;">
    <!-- Camera strip -->
    <div style="width:100%; height:88px; background:#000; position:relative; flex-shrink:0; overflow:hidden;">
      <video id="camera-feed" autoplay muted playsinline
        style="width:100%; height:100%; object-fit:cover; opacity:0.75; transform:scaleX(-1);"></video>
      <div style="position:absolute; top:10px; right:12px;" class="live-badge">
        <div class="live-dot"></div>
        <span class="label" style="color:var(--c-pink);">LIVE</span>
      </div>
      <p class="label" style="position:absolute; bottom:8px; left:50%; transform:translateX(-50%); white-space:nowrap;">
        Blink detection · active
      </p>
    </div>
    <!-- Scoop zone -->
    <div id="scoop-zone" style="flex:1; position:relative; overflow:hidden;">
      <div id="scoop-emoji">🍦</div>
      <!-- Gaze ring — repositioned by challenge.js to match scoop -->
      <div id="gaze-ring" style="
        position:absolute; border-radius:50%;
        width:130px; height:130px;
        border:2px dashed rgba(255,45,107,0.3);
        transform:translate(-50%,-50%);
        pointer-events:none;
        transition:left 3s var(--ease-out), top 3s var(--ease-out);
      "></div>
    </div>
    <!-- HUD -->
    <div style="padding:12px 20px 28px; flex-shrink:0;">
      <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;">
        <div id="timer-display"
          style="font-size:40px; font-weight:900; color:var(--c-white); line-height:1; font-variant-numeric:tabular-nums;">
          0:00
        </div>
        <span class="label">seconds held</span>
      </div>
      <div class="prog-track" style="margin-bottom:8px;">
        <div class="prog-fill" id="stare-progress"></div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span id="cash-now"  style="font-size:13px; font-weight:800; color:var(--c-gold);">₹0 won</span>
        <span id="cash-next" class="label">₹10 at 10s →</span>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════
       SCREEN 6 — You Blinked
       ═══════════════════════ -->
  <div id="screen-blinked" class="screen" style="align-items:center; justify-content:center; flex-direction:column; padding:48px 24px; text-align:center;">
    <div style="font-size:80px; margin-bottom:16px;">😳</div>
    <h1 class="h1" style="color:var(--c-pink); margin-bottom:10px;">YOU BLINKED</h1>
    <p id="blinked-time" class="h2" style="margin-bottom:6px;">0.0 seconds</p>
    <p id="blinked-tier" class="body" style="margin-bottom:48px;">Stare harder next time.</p>
    <button class="btn btn-primary" id="btn-see-reward" style="max-width:300px;">SEE YOUR REWARD →</button>
  </div>

  <!-- ═══════════════════════════
       SCREEN 7 — Reward Reveal
       ═══════════════════════════ -->
  <div id="screen-reward" class="screen" style="flex-direction:column;">
    <div style="flex:1; padding:36px 24px 0; text-align:center;">
      <p class="label" style="margin-bottom:14px;">Zepto Cash Credited</p>
      <div id="reward-amount"
        style="font-size:80px; font-weight:900; color:var(--c-gold); line-height:1; margin-bottom:6px;">
        ₹0
      </div>
      <p class="body" style="margin-bottom:14px;">Added to your Zepto wallet</p>
      <div style="display:inline-block; background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.25); border-radius:var(--r-sm); padding:8px 16px; margin-bottom:32px;">
        <span class="label" style="color:var(--c-gold);">Expires in 7 days</span>
      </div>
      <!-- Tier breakdown — populated by main.js -->
      <div id="tier-breakdown" style="text-align:left; display:flex; flex-direction:column; gap:6px;"></div>
    </div>
    <div style="padding:16px 24px 36px; display:flex; flex-direction:column; gap:10px;">
      <button class="btn btn-primary" id="btn-share">SHARE YOUR SCORE 🔥</button>
      <button class="btn btn-ghost" id="btn-back-home">Back to order tracking</button>
    </div>
  </div>

  <!-- ═══════════════════════════
       SCREEN 8 — Share Card
       ═══════════════════════════ -->
  <div id="screen-share" class="screen" style="flex-direction:column; align-items:center; padding:32px 20px;">
    <p class="label" style="margin-bottom:20px;">Your score card</p>
    <canvas id="share-canvas" width="335" height="480"
      style="border-radius:var(--r-md); width:100%; max-width:335px;"></canvas>
    <div style="margin-top:24px; width:100%; display:flex; flex-direction:column; gap:10px;">
      <button class="btn btn-primary" id="btn-download">SAVE IMAGE</button>
      <button class="btn btn-ghost" id="btn-back-reward">← Back</button>
    </div>
  </div>

</div><!-- .phone-shell -->

<script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Smoke test in browser**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study/prototype"
python3 -m http.server 8080
```

Open `http://localhost:8080` — confirm screen 1 (order confirmation) renders with dare banner, purple/pink gradient, both buttons visible.

- [ ] **Step 3: Commit**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study"
git add prototype/index.html
git commit -m "feat: add HTML skeleton for all 8 screens"
```

---

## Task 4: Pure Utilities + Tests

**Files:**
- Create: `prototype/js/utils/rewards.js`
- Create: `prototype/js/utils/blink.js`
- Create: `prototype/js/utils/zones.js`
- Create: `prototype/tests/rewards.test.js`
- Create: `prototype/tests/blink.test.js`
- Create: `prototype/tests/zones.test.js`

### 4A — Reward Tier Calculator

- [ ] **Step 1: Write failing tests for calculateReward**

Create `prototype/tests/rewards.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateReward, TIERS } from '../js/utils/rewards.js';

test('calculateReward: 0 seconds → ₹0', () => {
  assert.equal(calculateReward(0), 0);
});

test('calculateReward: 9 seconds → ₹0 (below first tier)', () => {
  assert.equal(calculateReward(9), 0);
});

test('calculateReward: 10 seconds → ₹10', () => {
  assert.equal(calculateReward(10), 10);
});

test('calculateReward: 19 seconds → ₹10 (still first tier)', () => {
  assert.equal(calculateReward(19), 10);
});

test('calculateReward: 20 seconds → ₹30', () => {
  assert.equal(calculateReward(20), 30);
});

test('calculateReward: 30 seconds → ₹60', () => {
  assert.equal(calculateReward(30), 60);
});

test('calculateReward: 45 seconds → ₹100', () => {
  assert.equal(calculateReward(45), 100);
});

test('calculateReward: 60 seconds → ₹150', () => {
  assert.equal(calculateReward(60), 150);
});

test('calculateReward: 120 seconds → ₹150 (max, no overflow)', () => {
  assert.equal(calculateReward(120), 150);
});

test('TIERS: has 5 entries with correct structure', () => {
  assert.equal(TIERS.length, 5);
  for (const t of TIERS) {
    assert.ok('seconds' in t && 'reward' in t && 'label' in t);
  }
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study/prototype"
node --test tests/rewards.test.js
```

Expected: `Error [ERR_MODULE_NOT_FOUND]` (file does not exist yet).

- [ ] **Step 3: Implement rewards.js**

Create `prototype/js/utils/rewards.js`:
```js
export const TIERS = [
  { seconds: 10, reward: 10,  label: '₹10 at 10s'  },
  { seconds: 20, reward: 30,  label: '₹30 at 20s'  },
  { seconds: 30, reward: 60,  label: '₹60 at 30s'  },
  { seconds: 45, reward: 100, label: '₹100 at 45s' },
  { seconds: 60, reward: 150, label: '₹150 at 60s' },
];

// Returns ₹ reward for a given duration in seconds.
export function calculateReward(seconds) {
  let reward = 0;
  for (const tier of TIERS) {
    if (seconds >= tier.seconds) reward = tier.reward;
    else break;
  }
  return reward;
}

// Returns the next tier the user hasn't reached yet, or null if maxed.
export function nextTier(seconds) {
  return TIERS.find(t => t.seconds > seconds) ?? null;
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study/prototype"
node --test tests/rewards.test.js
```

Expected: all 10 tests `pass`.

### 4B — EAR Blink Detector

- [ ] **Step 5: Write failing tests for calculateEAR + isBlink**

Create `prototype/tests/blink.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateEAR, isBlink, EAR_THRESHOLD } from '../js/utils/blink.js';

// Helpers — build fake landmark objects with x,y only
function pt(x, y) { return { x, y, z: 0 }; }

// Open eye: clear vertical separation between lids
const openEye = [
  pt(0.10, 0.50), // p1 left corner
  pt(0.25, 0.39), // p2 upper inner
  pt(0.37, 0.37), // p3 upper outer
  pt(0.50, 0.50), // p4 right corner
  pt(0.37, 0.63), // p5 lower outer
  pt(0.25, 0.61), // p6 lower inner
];

// Closed eye: lids nearly touching
const closedEye = [
  pt(0.10, 0.50),
  pt(0.25, 0.49),
  pt(0.37, 0.49),
  pt(0.50, 0.50),
  pt(0.37, 0.51),
  pt(0.25, 0.51),
];

test('calculateEAR: open eye returns value above threshold (> 0.20)', () => {
  const ear = calculateEAR(openEye);
  assert.ok(ear > EAR_THRESHOLD, `expected > ${EAR_THRESHOLD}, got ${ear}`);
});

test('calculateEAR: closed eye returns value at or below threshold (<= 0.20)', () => {
  const ear = calculateEAR(closedEye);
  assert.ok(ear <= EAR_THRESHOLD, `expected <= ${EAR_THRESHOLD}, got ${ear}`);
});

test('calculateEAR: symmetric open eye returns value around 0.3', () => {
  const ear = calculateEAR(openEye);
  assert.ok(ear > 0.25 && ear < 0.50, `expected 0.25-0.50, got ${ear}`);
});

test('isBlink: returns true when EAR at or below threshold', () => {
  assert.equal(isBlink(EAR_THRESHOLD), true);
  assert.equal(isBlink(0.10), true);
});

test('isBlink: returns false when EAR above threshold', () => {
  assert.equal(isBlink(EAR_THRESHOLD + 0.01), false);
  assert.equal(isBlink(0.40), false);
});
```

- [ ] **Step 6: Run tests — confirm they fail**

```bash
node --test tests/blink.test.js
```

Expected: `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 7: Implement blink.js**

Create `prototype/js/utils/blink.js`:
```js
export const EAR_THRESHOLD = 0.20; // EAR below this = blink

// euclidean distance between two landmark points {x, y}
function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// calculateEAR: six-element array of landmark points in order:
//   [p1=left-corner, p2=upper-inner, p3=upper-outer,
//    p4=right-corner, p5=lower-outer, p6=lower-inner]
// Returns Eye Aspect Ratio. Lower value = more closed.
export function calculateEAR(pts) {
  const A = dist(pts[1], pts[5]); // upper-inner ↔ lower-inner
  const B = dist(pts[2], pts[4]); // upper-outer ↔ lower-outer
  const C = dist(pts[0], pts[3]); // left-corner ↔ right-corner
  return (A + B) / (2.0 * C);
}

// isBlink: returns true if the EAR value indicates a closed eye
export function isBlink(ear) {
  return ear <= EAR_THRESHOLD;
}
```

- [ ] **Step 8: Run tests — confirm they pass**

```bash
node --test tests/blink.test.js
```

Expected: all 5 tests `pass`.

### 4C — Zone Detection

- [ ] **Step 9: Write failing tests for getZoneForIris**

Create `prototype/tests/zones.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getZoneForIris, ZONE_NAMES } from '../js/utils/zones.js';

test('center iris (0.5, 0.5) → zone 0 (center)', () => {
  assert.equal(getZoneForIris(0.5, 0.5), 0);
});

test('top-left iris (0.15, 0.20) → zone 1 (top-left)', () => {
  assert.equal(getZoneForIris(0.15, 0.20), 1);
});

test('top-right iris (0.85, 0.20) → zone 2 (top-right)', () => {
  assert.equal(getZoneForIris(0.85, 0.20), 2);
});

test('bottom-left iris (0.15, 0.80) → zone 3 (bottom-left)', () => {
  assert.equal(getZoneForIris(0.15, 0.80), 3);
});

test('bottom-right iris (0.85, 0.80) → zone 4 (bottom-right)', () => {
  assert.equal(getZoneForIris(0.85, 0.80), 4);
});

test('ZONE_NAMES has 5 entries', () => {
  assert.equal(ZONE_NAMES.length, 5);
});
```

- [ ] **Step 10: Run tests — confirm they fail**

```bash
node --test tests/zones.test.js
```

Expected: `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 11: Implement zones.js**

Create `prototype/js/utils/zones.js`:
```js
// Zone index: 0=center 1=top-left 2=top-right 3=bottom-left 4=bottom-right
// Coordinates are normalised 0–1 (fraction of video/screen)
// NOTE: iris x is already mirrored (1 - raw.x) before being passed here

export const ZONE_NAMES = ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];

// Zone boundaries [xMin, xMax, yMin, yMax]
const ZONE_BOUNDS = [
  [0.30, 0.70, 0.30, 0.70], // 0: center (checked first — overlaps corners)
  [0.00, 0.45, 0.00, 0.45], // 1: top-left
  [0.55, 1.00, 0.00, 0.45], // 2: top-right
  [0.00, 0.45, 0.55, 1.00], // 3: bottom-left
  [0.55, 1.00, 0.55, 1.00], // 4: bottom-right
];

// Returns zone index (0–4). Returns 0 (center) for points in gaps.
export function getZoneForIris(nx, ny) {
  for (let i = 0; i < ZONE_BOUNDS.length; i++) {
    const [xMin, xMax, yMin, yMax] = ZONE_BOUNDS[i];
    if (nx >= xMin && nx <= xMax && ny >= yMin && ny <= yMax) return i;
  }
  return 0; // default center for edge gaps
}
```

- [ ] **Step 12: Run tests — confirm they pass**

```bash
node --test tests/zones.test.js
```

Expected: all 6 tests `pass`.

- [ ] **Step 13: Run all tests**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study/prototype"
node --test tests/
```

Expected: 21 tests, all `pass`.

- [ ] **Step 14: Commit**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study"
git add prototype/js/utils/ prototype/tests/
git commit -m "feat: add reward tiers, EAR blink detector, and zone detection with tests"
```

---

## Task 5: MediaPipe Camera Setup

**Files:**
- Create: `prototype/js/mediapipe.js`

MediaPipe Face Mesh is loaded as a global script (CDN, not ES module). The `FaceMesh` and `Camera` globals are available on `window` when this module runs.

MediaPipe iris landmarks require `refineLandmarks: true`. Left iris center = landmark index 468, right iris center = landmark index 473.

Left eye EAR landmarks (by index): `[33, 160, 158, 133, 153, 144]`  
Right eye EAR landmarks (by index): `[362, 385, 387, 263, 373, 380]`

- [ ] **Step 1: Write mediapipe.js**

Create `prototype/js/mediapipe.js`:
```js
import { calculateEAR, isBlink } from './utils/blink.js';
import { getZoneForIris } from './utils/zones.js';

// MediaPipe landmark indices for eye EAR
const LEFT_EYE  = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
// Iris center landmarks (requires refineLandmarks: true)
const LEFT_IRIS_IDX  = 468;
const RIGHT_IRIS_IDX = 473;

let faceMesh = null;
let camera   = null;

// startCamera(videoEl, onFrame)
// videoEl — HTMLVideoElement (must be visible or have non-zero dimensions)
// onFrame — called each frame with { leftEAR, rightEAR, avgEAR, isBlink, irisZone }
export function startCamera(videoEl, onFrame) {
  faceMesh = new window.FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces:    1,
    refineLandmarks: true,   // enables iris landmarks 468-477
    minDetectionConfidence: 0.6,
    minTrackingConfidence:  0.6,
  });

  faceMesh.onResults((results) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
    const lm = results.multiFaceLandmarks[0];

    const leftEAR  = calculateEAR(LEFT_EYE.map(i => lm[i]));
    const rightEAR = calculateEAR(RIGHT_EYE.map(i => lm[i]));
    const avgEAR   = (leftEAR + rightEAR) / 2;

    // Mirror iris x: camera feed is mirrored in CSS, so flip x to match screen space
    const irisX = 1 - lm[LEFT_IRIS_IDX].x;
    const irisY = lm[LEFT_IRIS_IDX].y;
    const irisZone = getZoneForIris(irisX, irisY);

    onFrame({
      leftEAR,
      rightEAR,
      avgEAR,
      blink: isBlink(avgEAR),
      irisZone,
      irisX,
      irisY,
    });
  });

  camera = new window.Camera(videoEl, {
    onFrame: async () => {
      await faceMesh.send({ image: videoEl });
    },
    width: 320,
    height: 240,
    facingMode: 'user',
  });

  camera.start();
}

export function stopCamera() {
  camera?.stop();
  faceMesh?.close();
  camera = null;
  faceMesh = null;
}
```

- [ ] **Step 2: Quick manual smoke test**

In `prototype/js/main.js` (create as a temporary stub for now), add:
```js
import { startCamera } from './mediapipe.js';

const video = document.getElementById('video');
startCamera(video, (frame) => {
  console.log('EAR:', frame.avgEAR.toFixed(3), 'Blink:', frame.blink, 'Zone:', frame.irisZone);
});
```

Serve and open `http://localhost:8080`. Allow camera access. Open DevTools console. Confirm frames log at ~15-30fps with EAR values > 0.20 when eyes open and ≤ 0.20 when blinking.

If MediaPipe fails to load: check browser console for CORS errors. Confirm the `<script>` tags in `index.html` include `crossorigin="anonymous"`.

- [ ] **Step 3: Clear main.js stub** (replace with empty module for now)

Replace `prototype/js/main.js` content with:
```js
// Entry point — wired up in Task 11
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study"
git add prototype/js/mediapipe.js prototype/js/main.js
git commit -m "feat: add MediaPipe Face Mesh camera integration"
```

---

## Task 6: Scoop Animator

**Files:**
- Create: `prototype/js/scoop.js`

The scoop emoji is positioned with CSS `top` / `left` percentages inside `#scoop-zone`. CSS transitions handle smooth easing (3.5s duration, var(--ease-out)). The animator cycles through a pre-set drift sequence, waiting 12 seconds per zone before moving.

- [ ] **Step 1: Write scoop.js**

Create `prototype/js/scoop.js`:
```js
// Zone positions: [top%, left%] as percentage of #scoop-zone
// 0=center 1=top-left 2=top-right 3=bottom-left 4=bottom-right
const ZONE_POSITIONS = [
  ['48%', '50%'],   // 0: center
  ['18%', '18%'],   // 1: top-left
  ['18%', '82%'],   // 2: top-right
  ['82%', '18%'],   // 3: bottom-left
  ['82%', '82%'],   // 4: bottom-right
];

// Drift sequences — one is chosen randomly each session.
// Each entry is a zone index sequence (loops).
const SEQUENCES = [
  [0, 1, 3, 2, 4, 0],
  [1, 2, 0, 4, 3, 1],
  [2, 4, 0, 1, 3, 2],
  [4, 2, 1, 0, 3, 4],
];

const ZONE_PAUSE_MS  = 12_000; // hold per zone (10–15s range, we use 12s)
const DRIFT_DURATION = 3_500;  // CSS transition duration in ms (3–4s spec)

let scoopEl    = null;
let gazeRingEl = null;
let sequence   = [];
let stepIndex  = 0;
let zoneTimer  = null;
let currentZoneIndex = 0;

export function startScoop(onZoneChange) {
  scoopEl    = document.getElementById('scoop-emoji');
  gazeRingEl = document.getElementById('gaze-ring');

  // Apply drift transition to both scoop and ring
  scoopEl.style.transition    = `top ${DRIFT_DURATION}ms var(--ease-out), left ${DRIFT_DURATION}ms var(--ease-out)`;
  gazeRingEl.style.transition = `top ${DRIFT_DURATION}ms var(--ease-out), left ${DRIFT_DURATION}ms var(--ease-out)`;

  sequence  = SEQUENCES[Math.floor(Math.random() * SEQUENCES.length)];
  stepIndex = 0;

  moveToZone(sequence[0], onZoneChange);
  scheduleNext(onZoneChange);
}

export function stopScoop() {
  clearTimeout(zoneTimer);
  zoneTimer = null;
}

export function currentZone() {
  return currentZoneIndex;
}

function moveToZone(zoneIdx, onZoneChange) {
  currentZoneIndex = zoneIdx;
  const [top, left] = ZONE_POSITIONS[zoneIdx];
  scoopEl.style.top    = top;
  scoopEl.style.left   = left;
  gazeRingEl.style.top  = top;
  gazeRingEl.style.left = left;
  onZoneChange?.(zoneIdx);
}

function scheduleNext(onZoneChange) {
  zoneTimer = setTimeout(() => {
    stepIndex = (stepIndex + 1) % sequence.length;
    moveToZone(sequence[stepIndex], onZoneChange);
    scheduleNext(onZoneChange);
  }, ZONE_PAUSE_MS);
}
```

- [ ] **Step 2: Wire up quick visual test in main.js**

Replace `prototype/js/main.js` content with:
```js
import { startScoop } from './scoop.js';
import { showScreen } from './session.js';

showScreen('stare');
startScoop((zone) => console.log('Zone:', zone));
```

And create `prototype/js/session.js` with just the `showScreen` function:
```js
export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`screen-${id}`);
  if (el) el.classList.add('active');
}
```

Serve and open `http://localhost:8080`. Confirm:
- Screen 5 (stare) is shown
- Scoop emoji visible in centre initially
- After 12s, scoop smoothly drifts to a new zone over ~3.5s
- Dashed gaze ring moves with the scoop

- [ ] **Step 3: Reset main.js stub**

Replace `prototype/js/main.js` content with:
```js
// Entry point — wired up in Task 11
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study"
git add prototype/js/scoop.js prototype/js/session.js
git commit -m "feat: scoop drift animation with zone scheduler and gaze ring"
```

---

## Task 7: Calibration Phase

**Files:**
- Create: `prototype/js/calibration.js`

3-point calibration: show a dot at centre → top-left → top-right. At each point, record the average iris (x, y) position over 60 frames (~2 seconds). The result is a `CalibData` object used by the challenge to interpret iris position.

For the prototype, calibration is mostly ritual — we use the recorded center point as a baseline and apply a simple linear offset mapping to zone detection.

- [ ] **Step 1: Write calibration.js**

Create `prototype/js/calibration.js`:
```js
// Cal dot positions: [left%, top%] within #screen-calibration
const CAL_POINTS = [
  { left: '50%', top: '50%', label: 'Look at the dot' },
  { left: '18%', top: '22%', label: 'Eyes on the dot…' },
  { left: '82%', top: '22%', label: 'Almost done…' },
];

const FRAMES_PER_POINT = 60; // ~2 seconds at 30fps

// runCalibration(getIris) → Promise<{ centerX, centerY }>
// getIris: callback that returns the current iris {x, y} from mediapipe
export function runCalibration(getIris) {
  return new Promise((resolve) => {
    const dotEl    = document.getElementById('cal-dot');
    const labelEl  = document.getElementById('cal-instruction');

    let pointIdx    = 0;
    let frameCount  = 0;
    let samples     = { x: [], y: [] };
    let centerPoint = { x: 0.5, y: 0.5 };
    let rafId       = null;

    function showPoint(idx) {
      const p = CAL_POINTS[idx];
      dotEl.style.left = p.left;
      dotEl.style.top  = p.top;
      dotEl.style.opacity = '1';
      labelEl.textContent = p.label;
      frameCount = 0;
      samples = { x: [], y: [] };
    }

    function tick() {
      const iris = getIris();
      if (iris) {
        samples.x.push(iris.x);
        samples.y.push(iris.y);
        frameCount++;
      }

      if (frameCount >= FRAMES_PER_POINT) {
        const avgX = samples.x.reduce((a, b) => a + b, 0) / samples.x.length;
        const avgY = samples.y.reduce((a, b) => a + b, 0) / samples.y.length;

        if (pointIdx === 0) {
          // Record center baseline
          centerPoint = { x: avgX, y: avgY };
        }

        pointIdx++;

        if (pointIdx >= CAL_POINTS.length) {
          dotEl.style.opacity = '0';
          cancelAnimationFrame(rafId);
          resolve({ centerX: centerPoint.x, centerY: centerPoint.y });
          return;
        }

        showPoint(pointIdx);
      }

      rafId = requestAnimationFrame(tick);
    }

    showPoint(0);
    rafId = requestAnimationFrame(tick);
  });
}
```

- [ ] **Step 2: Update session.js to store calibration data**

Edit `prototype/js/session.js` — add calibration storage:
```js
export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`screen-${id}`);
  if (el) el.classList.add('active');
}

// Session state — shared between challenge.js, main.js, share.js
export const session = {
  startTime:    null,
  endTime:      null,
  durationSecs: 0,
  reward:       0,
  calibration:  { centerX: 0.5, centerY: 0.5 },
};
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study"
git add prototype/js/calibration.js prototype/js/session.js
git commit -m "feat: 3-point gaze calibration phase with iris baseline recording"
```

---

## Task 8: Challenge Loop

**Files:**
- Create: `prototype/js/challenge.js`

The challenge loop runs during Screen 5 (stare). It:
1. Starts the timer
2. Each frame from MediaPipe: checks EAR for blink (2 consecutive frames required)
3. Updates HUD: timer display, progress bar, cash label
4. On blink: stops everything and calls `onBlink(durationSecs)`

Zone tracking is a visual indicator only in the prototype: the gaze ring turns red when the user's gaze is out of the scoop's zone.

- [ ] **Step 1: Write challenge.js**

Create `prototype/js/challenge.js`:
```js
import { calculateReward, TIERS, nextTier } from './utils/rewards.js';
import { startScoop, stopScoop, currentZone } from './scoop.js';
import { session } from './session.js';

const MAX_SECONDS = 65; // stop auto-awarding after 65s

let blinkFrameCount = 0;
const BLINK_FRAMES_REQUIRED = 2; // 2 consecutive low-EAR frames = blink

let timerInterval = null;
let startTimestamp = null;
let elapsed = 0; // seconds
let running = false;

// startChallenge(onBlink)
// onBlink: called with (durationSecs) when blink is detected
export function startChallenge(onBlink) {
  running      = true;
  blinkFrameCount = 0;
  startTimestamp = Date.now();
  session.startTime = startTimestamp;

  startScoop(null); // zone changes don't stop the challenge — visual only
  startTimer();

  return function onFrame(frame) {
    if (!running) return;

    // Blink detection — require 2 consecutive frames
    if (frame.blink) {
      blinkFrameCount++;
      if (blinkFrameCount >= BLINK_FRAMES_REQUIRED) {
        endChallenge(onBlink);
        return;
      }
    } else {
      blinkFrameCount = 0;
    }

    // Visual zone feedback — ring turns pink (in zone) or dim (out of zone)
    const gazeRingEl = document.getElementById('gaze-ring');
    if (gazeRingEl) {
      const inZone = frame.irisZone === currentZone();
      gazeRingEl.style.borderColor = inZone
        ? 'rgba(255, 45, 107, 0.5)'
        : 'rgba(255, 255, 255, 0.12)';
    }
  };
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (!running) return;
    elapsed = (Date.now() - startTimestamp) / 1000;
    updateHUD(elapsed);
  }, 100); // 10fps is enough for display
}

function updateHUD(secs) {
  const mins      = Math.floor(secs / 60);
  const secsDisp  = Math.floor(secs % 60);
  const timerEl   = document.getElementById('timer-display');
  const progEl    = document.getElementById('stare-progress');
  const cashNowEl = document.getElementById('cash-now');
  const cashNextEl = document.getElementById('cash-next');

  if (timerEl) {
    timerEl.textContent = `${mins}:${String(secsDisp).padStart(2, '0')}`;
  }

  const reward = calculateReward(secs);
  const next   = nextTier(secs);
  const maxReward = TIERS[TIERS.length - 1].reward;

  if (progEl) {
    const pct = Math.min((reward / maxReward) * 100, 100);
    progEl.style.width = `${pct}%`;
  }

  if (cashNowEl) {
    cashNowEl.textContent = reward > 0 ? `₹${reward} won` : '₹0 won';
  }

  if (cashNextEl) {
    cashNextEl.textContent = next
      ? `₹${next.reward} at ${next.seconds}s →`
      : '🏆 Max reward!';
  }
}

function endChallenge(onBlink) {
  if (!running) return;
  running = false;
  clearInterval(timerInterval);
  stopScoop();

  const durationSecs = (Date.now() - startTimestamp) / 1000;
  session.endTime      = Date.now();
  session.durationSecs = durationSecs;
  session.reward       = calculateReward(durationSecs);

  onBlink(durationSecs);
}

export function stopChallenge() {
  running = false;
  clearInterval(timerInterval);
  stopScoop();
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study"
git add prototype/js/challenge.js
git commit -m "feat: challenge loop with blink detection, HUD updates, and zone visual feedback"
```

---

## Task 9: End Screens (You Blinked + Reward Reveal)

**Files:**
- Create: `prototype/js/main.js` (full version, replaces stub)

The "You Blinked" and "Reward Reveal" screens are populated from `session` state. This task also wires all screen transitions via `main.js`.

- [ ] **Step 1: Populate tier list on Rules screen**

Rules screen tier list (`#tier-list`) is injected by JS so it stays in sync with `TIERS`. Add this function to `main.js`:

```js
function buildTierList() {
  const el = document.getElementById('tier-list');
  if (!el) return;
  el.innerHTML = TIERS.map(t => `
    <div class="tier-row">
      <span class="body" style="color:var(--c-white);">${t.seconds} seconds</span>
      <span style="font-size:14px; font-weight:800; color:var(--c-gold);">₹${t.reward}</span>
    </div>
  `).join('');
}
```

- [ ] **Step 2: Populate blinked screen**

```js
function populateBlinkedScreen() {
  const timeEl = document.getElementById('blinked-time');
  const tierEl = document.getElementById('blinked-tier');
  const secs   = session.durationSecs;
  const reward = session.reward;

  timeEl.textContent = `${secs.toFixed(1)} seconds`;

  if (reward > 0) {
    tierEl.textContent = `You earned ₹${reward} in Zepto Cash!`;
    tierEl.style.color = 'var(--c-gold)';
  } else {
    tierEl.textContent = `Hold for 10 seconds to earn your first reward.`;
  }
}
```

- [ ] **Step 3: Populate reward screen**

```js
function populateRewardScreen() {
  document.getElementById('reward-amount').textContent = `₹${session.reward}`;

  const breakdownEl = document.getElementById('tier-breakdown');
  const secs = session.durationSecs;
  breakdownEl.innerHTML = TIERS.map(t => {
    const reached = secs >= t.seconds;
    return `
      <div class="tier-row ${reached ? 'reached' : ''}">
        <span class="body">${t.label}</span>
        <span style="font-size:13px; font-weight:800; color:${reached ? 'var(--c-gold)' : 'var(--c-muted)'};">
          ${reached ? '✓' : '—'}
        </span>
      </div>
    `;
  }).join('');
}
```

- [ ] **Step 4: Write full main.js**

Create `prototype/js/main.js`:
```js
import { showScreen, session } from './session.js';
import { TIERS } from './utils/rewards.js';
import { startCamera, stopCamera } from './mediapipe.js';
import { runCalibration } from './calibration.js';
import { startChallenge } from './challenge.js';
import { drawShareCard } from './share.js';

let latestFrame = null; // most recent MediaPipe frame, used by calibration

// ── Tier list on rules screen ──────────────────────────────────────────────
function buildTierList() {
  const el = document.getElementById('tier-list');
  if (!el) return;
  el.innerHTML = TIERS.map(t => `
    <div class="tier-row">
      <span class="body" style="color:var(--c-white);">${t.seconds} seconds</span>
      <span style="font-size:14px; font-weight:800; color:var(--c-gold);">₹${t.reward}</span>
    </div>
  `).join('');
}

// ── Blinked screen ─────────────────────────────────────────────────────────
function populateBlinkedScreen() {
  const secs   = session.durationSecs;
  const reward = session.reward;
  document.getElementById('blinked-time').textContent = `${secs.toFixed(1)} seconds`;
  const tierEl = document.getElementById('blinked-tier');
  if (reward > 0) {
    tierEl.textContent = `You earned ₹${reward} in Zepto Cash!`;
    tierEl.style.color = 'var(--c-gold)';
  } else {
    tierEl.textContent = 'Hold for 10 seconds to earn your first reward.';
  }
}

// ── Reward screen ──────────────────────────────────────────────────────────
function populateRewardScreen() {
  document.getElementById('reward-amount').textContent = `₹${session.reward}`;
  const breakdownEl = document.getElementById('tier-breakdown');
  const secs = session.durationSecs;
  breakdownEl.innerHTML = TIERS.map(t => {
    const reached = secs >= t.seconds;
    return `
      <div class="tier-row ${reached ? 'reached' : ''}">
        <span class="body">${t.label}</span>
        <span style="font-size:13px; font-weight:800; color:${reached ? 'var(--c-gold)' : 'var(--c-muted)'};">
          ${reached ? '✓ Unlocked' : '—'}
        </span>
      </div>`;
  }).join('');
}

// ── Countdown 3-2-1 → calibration ─────────────────────────────────────────
async function runCountdown() {
  showScreen('countdown');
  const numEl   = document.getElementById('countdown-num');
  const videoEl = document.getElementById('video');

  // Start camera during countdown so MediaPipe warms up
  startCamera(videoEl, (frame) => { latestFrame = frame; });

  for (let n = 3; n >= 1; n--) {
    numEl.textContent = n;
    await delay(900);
  }

  await runCalibrationPhase();
}

async function runCalibrationPhase() {
  showScreen('calibration');
  // Swap MediaPipe to operate on the hidden video (already running)
  const calib = await runCalibration(() => latestFrame
    ? { x: latestFrame.irisX, y: latestFrame.irisY }
    : null
  );
  session.calibration = calib;
  startStareChallenge();
}

// ── Stare challenge ────────────────────────────────────────────────────────
function startStareChallenge() {
  showScreen('stare');
  stopCamera(); // stop camera instance running on hidden countdown video

  const videoEl = document.getElementById('camera-feed');

  const onFrame = startChallenge((durationSecs) => {
    stopCamera();
    showScreen('blinked');
    populateBlinkedScreen();
  });

  // Fresh camera instance on the visible stare-screen video element
  startCamera(videoEl, (frame) => {
    latestFrame = frame;
    onFrame(frame);
  });
}

// ── Utility ────────────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Event listeners ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildTierList();

  // Screen 1: dare banner
  document.getElementById('btn-accept-dare').addEventListener('click', () => {
    showScreen('rules');
  });
  document.getElementById('btn-skip').addEventListener('click', () => {
    // In prototype: just loop back to confirmation
    showScreen('confirmation');
  });

  // Screen 2: start challenge
  document.getElementById('btn-start').addEventListener('click', () => {
    runCountdown();
  });

  // Screen 6 (blinked): see reward
  document.getElementById('btn-see-reward').addEventListener('click', () => {
    populateRewardScreen();
    showScreen('reward');
  });

  // Screen 7 (reward): share card
  document.getElementById('btn-share').addEventListener('click', () => {
    showScreen('share');
    const canvas = document.getElementById('share-canvas');
    drawShareCard(canvas, {
      durationSecs: session.durationSecs,
      reward: session.reward,
    });
  });

  // Screen 7 (reward): back home
  document.getElementById('btn-back-home').addEventListener('click', () => {
    showScreen('confirmation');
  });

  // Screen 8 (share): download
  document.getElementById('btn-download').addEventListener('click', () => {
    const canvas = document.getElementById('share-canvas');
    const link   = document.createElement('a');
    link.download = 'dont-blink-score.png';
    link.href     = canvas.toDataURL('image/png');
    link.click();
  });

  // Screen 8 (share): back to reward
  document.getElementById('btn-back-reward').addEventListener('click', () => {
    showScreen('reward');
  });
});
```

- [ ] **Step 5: Test screen flow manually**

Serve from localhost. Walk through the flow:
1. Screen 1 — click "I ACCEPT THE DARE" → goes to rules ✓
2. Screen 2 — tier list populated ✓, click "START CHALLENGE" → countdown ✓
3. Countdown 3-2-1 → calibration ✓ (dot moves three positions)
4. Calibration done → stare screen ✓ (camera feed visible, scoop appears, timer starts)
5. Blink deliberately → "YOU BLINKED" screen ✓ with correct duration
6. Click "SEE YOUR REWARD" → reward reveal ✓ with correct ₹ amount
7. Click "SHARE" → share screen (canvas blank until Task 10) ✓

- [ ] **Step 6: Commit**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study"
git add prototype/js/main.js
git commit -m "feat: full screen flow wiring, end screens, and countdown→calibration→stare sequence"
```

---

## Task 10: Share Card (Canvas)

**Files:**
- Create: `prototype/js/share.js`

Draws the score card on a `<canvas>` element using the Canvas 2D API. The card is portrait (335×480px), dark background, Zepto brand colors, shareable as PNG.

- [ ] **Step 1: Write share.js**

Create `prototype/js/share.js`:
```js
// drawShareCard(canvas, { durationSecs, reward })
// Renders the full share card onto the given <canvas> element.
export function drawShareCard(canvas, { durationSecs, reward }) {
  const ctx = canvas.getContext('2d');
  const W   = canvas.width;   // 335
  const H   = canvas.height;  // 480

  // ── Background gradient ──────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,   '#0f0517');
  bg.addColorStop(0.5, '#160924');
  bg.addColorStop(1,   '#0a0310');
  ctx.fillStyle = bg;
  ctx.roundRect(0, 0, W, H, 24);
  ctx.fill();

  // ── Border ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(124, 58, 237, 0.4)';
  ctx.lineWidth   = 1.5;
  ctx.roundRect(0, 0, W, H, 24);
  ctx.stroke();

  // ── Glow blob ─────────────────────────────────────────────────────────────
  const glow = ctx.createRadialGradient(W/2, H*0.45, 20, W/2, H*0.45, 200);
  glow.addColorStop(0,   'rgba(124, 58, 237, 0.25)');
  glow.addColorStop(1,   'rgba(124, 58, 237, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Wordmark ──────────────────────────────────────────────────────────────
  ctx.font         = '700 13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle    = 'rgba(255,255,255,0.5)';
  ctx.letterSpacing = '0.1em';
  ctx.textAlign    = 'center';
  ctx.fillText('ZEPTO', W/2, 44);

  // ── Scoop emoji ───────────────────────────────────────────────────────────
  ctx.font      = '84px serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('🍦', W/2, 160);

  // ── "DON'T BLINK" headline ────────────────────────────────────────────────
  ctx.font      = '900 28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.letterSpacing = '0.04em';
  ctx.fillText("DON'T BLINK", W/2, 206);

  // ── Duration ──────────────────────────────────────────────────────────────
  ctx.font      = '900 56px -apple-system, BlinkMacSystemFont, sans-serif';

  // Gradient text via clip
  const textGrad = ctx.createLinearGradient(W*0.2, 0, W*0.8, 0);
  textGrad.addColorStop(0, '#7c3aed');
  textGrad.addColorStop(1, '#ff2d6b');
  ctx.fillStyle = textGrad;
  ctx.letterSpacing = '0em';
  ctx.fillText(`${durationSecs.toFixed(1)}s`, W/2, 278);

  ctx.font      = '700 13px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.letterSpacing = '0.08em';
  ctx.fillText('SECONDS HELD', W/2, 300);

  // ── Cash pill ─────────────────────────────────────────────────────────────
  if (reward > 0) {
    const pillW = 180, pillH = 40, pillX = (W - pillW)/2, pillY = 318;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth   = 1;
    roundRect(ctx, pillX, pillY, pillW, pillH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font      = '800 16px -apple-system, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.letterSpacing = '0em';
    ctx.fillText(`₹${reward} Zepto Cash`, W/2, pillY + 26);
  } else {
    ctx.font      = '600 13px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('Try for 10s to earn Zepto Cash', W/2, 346);
  }

  // ── World record callout ───────────────────────────────────────────────────
  ctx.font      = '600 11px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.letterSpacing = '0em';
  ctx.fillText('World record: 1 hr 5 min 11 sec', W/2, 386);

  // ── Hashtag ────────────────────────────────────────────────────────────────
  ctx.font      = '800 16px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(124,58,237,0.8)';
  ctx.letterSpacing = '0.02em';
  ctx.fillText('#DontBlink', W/2, 420);

  // ── Divider line ────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(40, 402); ctx.lineTo(W-40, 402);
  ctx.stroke();

  // ── Footer ──────────────────────────────────────────────────────────────────
  ctx.font      = '600 11px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText('zepto.team · 10-min delivery', W/2, 460);
}

// Helper: Canvas roundRect polyfill for older environments
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
```

- [ ] **Step 2: Test share card**

Walk full flow → reach Share screen. Confirm canvas renders:
- Dark gradient background with purple border glow
- "ZEPTO" wordmark at top
- 🍦 emoji
- "DON'T BLINK" headline
- Duration in gradient text (purple → pink)
- Gold Zepto Cash pill (if reward > 0)
- World record reference
- #DontBlink in purple
- "SAVE IMAGE" downloads a PNG

- [ ] **Step 3: Commit**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study"
git add prototype/js/share.js
git commit -m "feat: Canvas share card with gradient text, cash pill, and #DontBlink branding"
```

---

## Task 11: Final Polish + Smoke Test

**Files:**
- Modify: `prototype/css/app.css` (minor fixes as needed after full-flow test)

- [ ] **Step 1: Full end-to-end smoke test**

Walk the complete flow with the camera:
1. Confirmation screen → tap "I ACCEPT THE DARE" → Rules ✓
2. Rules → tier list correct (₹10/₹30/₹60/₹100/₹150) → "START CHALLENGE" ✓
3. Countdown 3-2-1 with camera warming ✓
4. Calibration dots move centre → top-left → top-right ✓
5. Stare screen: camera feed visible (mirrored), scoop animating ✓
6. Hold for 15–20 seconds without blinking → timer increments, progress bar moves, cash label updates ✓
7. Deliberately blink → "YOU BLINKED" appears with correct duration and tier ✓
8. "SEE YOUR REWARD" → reward reveal with correct ₹, tier breakdown, expiry ✓
9. "SHARE YOUR SCORE" → share card renders ✓
10. "SAVE IMAGE" → PNG downloads ✓
11. "Back to order tracking" → confirmation screen ✓

- [ ] **Step 2: Fix any rendering issues found in Step 1**

Common issues to watch for:
- Camera stream not appearing on stare screen: ensure `videoEl.srcObject` is cloned correctly in `main.js`
- Scoop off-screen: check ZONE_POSITIONS percentages in `scoop.js`
- EAR not triggering blink: console.log `frame.avgEAR` during challenge; adjust EAR_THRESHOLD in `blink.js` if needed (try 0.22 if 0.20 is too sensitive)
- Canvas letterSpacing not supported in older Chrome: remove `ctx.letterSpacing` lines if text renders incorrectly

- [ ] **Step 3: Run all tests one final time**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study/prototype"
node --test tests/
```

Expected: 21 tests, all `pass`.

- [ ] **Step 4: Final commit**

```bash
cd "/Users/varunmalani/Desktop/Projects/Zepto Ice Cream Case Study"
git add -p  # stage only intentional changes
git commit -m "feat: complete Don't Blink Challenge prototype — all screens + blink detection + share card"
```

---

## Spec Coverage Check

| Spec section | Implemented in |
|---|---|
| Dare banner + "I ACCEPT THE DARE" | Screen 1, `main.js` |
| Rules + world record reference + tier table | Screen 2, `main.js:buildTierList()` |
| 3-2-1 countdown with camera warmup | Screen 3, `main.js:runCountdown()` |
| 3-point gaze calibration | Screen 4, `calibration.js` |
| 27% scoop + drifting zones | Screen 5, `scoop.js` (101px = 27% of 375px) |
| Dashed gaze ring | `#gaze-ring` in HTML + `scoop.js` |
| Live camera feed strip | Screen 5, `<video id="camera-feed">` |
| Live timer + progress bar + cash display | `challenge.js:updateHUD()` |
| EAR blink detection (2 consecutive frames) | `blink.js`, `challenge.js` |
| Zone-based gaze tracking visual feedback | `challenge.js` (ring color change) |
| Reward tiers ₹10/₹30/₹60/₹100/₹150 | `rewards.js` |
| "YOU BLINKED" screen with score | Screen 6, `main.js:populateBlinkedScreen()` |
| Zepto Cash reward reveal + 7-day expiry | Screen 7, `main.js:populateRewardScreen()` |
| Tier breakdown on reward screen | `main.js:populateRewardScreen()` |
| Share card: score, cash, record, #DontBlink | `share.js:drawShareCard()` |
| PNG download | `main.js` btn-download handler |
| Zepto brand system (purple/pink/gold/dark) | `brand.css` |
| All interactions mocked (no backend) | Throughout |
