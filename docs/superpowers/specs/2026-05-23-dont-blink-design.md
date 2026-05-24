# Don't Blink Challenge — Design Spec

**Project:** Zepto Ice Cream Case Study (Builder Series Brief №01, 2026)  
**Author:** Varun Malani (independent candidate submission)  
**Date:** 2026-05-23  
**Status:** Locked — ready for implementation

---

## 1. Problem & Strategic Context

Blinkit ran "Scream for Ice Cream" — a viral mechanic where users scream into their phone to order ice cream. It occupied the cultural conversation around quick-commerce ice cream delivery. Zepto needs a brand moment that is equally talkable but distinctly Zepto, and that occupies the 10-minute delivery window productively (rather than just a novelty unlock).

**Our answer:** Don't Blink Challenge. A gaze-endurance game played during the delivery wait — stare at a moving ice cream scoop on screen without blinking. The longer you hold, the more Zepto Cash you earn. It converts dead wait time into an active branded moment.

**Strategic logic:**
- Occupies the 10-minute window (same duration as delivery, so game ends when ice cream arrives)
- Zepto Cash reward creates a retention hook (7-day expiry, redeemable on next order)
- Share-worthy score card drives organic social spread (#DontBlink)
- "Follow the scoop" mechanic is uniquely Zepto — tied directly to the product being delivered

---

## 2. Mechanic Overview

**Name:** Don't Blink Challenge  
**Trigger:** Opt-in banner on order confirmation screen ("I ACCEPT THE DARE")  
**Core loop:** User stares at a moving ice cream scoop. Front camera detects blinks in real time. Challenge ends on first blink. Reward is proportional to duration held.  
**Frequency:** Once per day, server-enforced  
**Reward:** Zepto Cash credited instantly to wallet

### Reward Tiers

| Duration | Reward |
|----------|--------|
| 10 seconds | ₹10 |
| 20 seconds | ₹30 |
| 30 seconds | ₹60 |
| 45 seconds | ₹100 |
| 60 seconds+ | ₹150 |

Zepto Cash expires in 7 days. This is an integration with Zepto's existing wallet/payment infrastructure — not a new loyalty program.

---

## 3. User Flow (7 Screens)

### Screen 1 — Order Confirmation + Challenge Banner
- Standard order confirmation (ETA, items)
- Banner at bottom: "Think you can beat the world record? 1 hr 5 min 11 sec. Don't Blink." + "I ACCEPT THE DARE" CTA
- Dismissible; challenge is opt-in only

### Screen 2 — Rules + Reward Preview
- Brief rules: "Stare at the scoop. Don't blink. Earn Zepto Cash."
- Reward tier table shown
- "START CHALLENGE" CTA
- World record reference sets aspirational bar

### Screen 3 — Countdown
- Full-screen 3-2-1 countdown
- Front camera activates during countdown (user sees themselves)
- Transition into stare screen

### Screen 4 — Stare Screen (core gameplay)
- Front camera feed (top strip, not full screen)
- Ice cream scoop emoji (27% of screen width) drifting across screen
- Dashed ring showing gaze detection zone
- Live timer (seconds held)
- Progress bar showing tier progression
- Live Zepto Cash amount ("₹30 won · ₹60 at 30s →")
- LIVE badge + "Blink detection · active" label

### Screen 5 — You Blinked
- Challenge ends
- Score frozen: time held + tier reached
- "YOU BLINKED" headline
- Reward amount shown

### Screen 6 — Reward Reveal
- Zepto Cash credited confirmation
- 7-day expiry displayed
- Tier breakdown (how much per tier, what was reached)
- "CLAIM REWARD" CTA

### Screen 7 — Share Card
- Score: time held
- Cash won
- #DontBlink hashtag
- World record reference (social context)
- Zepto branding
- Share to Instagram/WhatsApp CTA

---

## 4. Scoop Movement

The scoop drifts between 4–5 screen zones (top-left, top-right, centre, bottom-left, bottom-right):

- **Per-zone pause:** 10–15 seconds
- **Drift duration between zones:** 3–4 seconds (smooth easing, not a jump)
- **Hard constraint:** Scoop must never cross the full screen in under 2 seconds — gaze detection has ~150ms processing latency; movements faster than this cause gaze lock loss

The scoop's entire trajectory is pre-computed server-side before the session begins. The client receives only the current frame's target position. This is a core anti-cheat mechanism (see Section 6).

---

## 5. Gaze Tracking — Technical Approach

**Library:** MediaPipe Face Mesh (WASM, runs fully on-device)  
**Landmarks used:** 468 facial landmarks; 10 specific to iris (468-477 range)

### Blink Detection
- Eye Aspect Ratio (EAR) = ratio of eye height to eye width, computed per frame
- EAR < 0.20 for 2+ consecutive frames = blink event → session ends
- Robust at normal holding distances (30–50cm)

### Gaze Tracking (Follow the Scoop)
- Iris centroid extracted from MediaPipe iris landmarks
- Accuracy: ±60–80px at 30–50cm holding distance
- **Zone-based, not pixel-precise:** screen divided into 4–5 large regions
- Gaze must be in the same zone as the scoop within 1.5 seconds of scoop arriving in a zone
- 27% scoop size was chosen specifically to stay comfortably within gaze detection tolerance

### Calibration (Setup Phase)
- 3-point gaze calibration before challenge begins (~8 seconds total)
- "Look at the dot" at centre → top-left → top-right
- Creates personal gaze mapping for the session (improves zone accuracy)
- Also functions as ritual/drama to build anticipation

### Privacy
- No video data leaves the device
- Only landmark coordinates (floating-point numbers) are processed on-device
- Landmark data is not stored; only session events (timestamps, zone matches) are logged
- Session event logs deleted after 30 days
- Compliant with India DPDP Act 2023 (facial landmark floats ≠ biometric data when used transiently)

---

## 6. Anti-Cheat Architecture

Three layered mechanisms, each targeting a different attack vector:

### Layer 1 — Passive: Micro-Movement Variance
- Real faces have constant sub-pixel micro-movements (breathing, pulse)
- Rolling 90-frame (~3 second) window on 15 key landmarks
- Variance below threshold = static source detected → session killed silently
- Targets: printed photo, phone photo, mannequin

### Layer 2 — Active: Server-Issued Scoop Trajectory
- Scoop path is computed server-side before session starts
- Client receives only current frame position (not full path)
- Server validates client-reported gaze zone events against the known trajectory
- A static photo cannot follow a moving target whose position sequence is unknown to the client

### Layer 3 — Cryptographic: HMAC Event Chain
- Server issues a per-session signing key at session start
- Every client event (blink check, zone match) is HMAC-SHA256 signed
- Each event includes a chained hash of the previous event
- Modifying any event in the chain breaks the signature → server rejects entire session
- Prevents: replay attacks, fabricated event logs, modified client posting fake scores

### Fraud Review Queue
- Anomalous sessions (e.g., 60s+ holds, suspicious event timing patterns) flagged for async human review before reward is credited
- Applies to <1% of sessions at scale

---

## 7. Backend Architecture

Three new lightweight services, integrated into existing infrastructure:

### Session Service
- Generates scoop trajectory (server-side, pre-computed)
- Issues per-session HMAC signing key
- Validates events in real time
- Enforces daily limit via Redis (TTL = midnight IST)
- Stores session records in PostgreSQL

### Reward Service
- Calculates tier based on validated session duration
- Credits Zepto Cash to user wallet (existing payment API)
- Enforces 7-day expiry
- Triggers Kafka event for analytics pipeline

### Fraud Anomaly Detector
- Consumes event stream from Kafka
- Flags sessions with anomalous patterns
- Writes to fraud review queue in PostgreSQL

### Data Layer
- **Redis:** Daily limit counters, active session tokens, rate limiting
- **PostgreSQL:** Session records, event log hashes, fraud review queue
- **Kafka:** Event stream to analytics

All three services integrate with infrastructure a company at Zepto's scale would already operate. No novel external dependencies required for backend.

---

## 8. Prototype Scope

The working prototype is a standalone web app — no backend required for the demo.

**In scope:**
- MediaPipe Face Mesh running in browser (WASM)
- Real blink detection via EAR calculation
- Scoop drift animation across screen zones
- Zone-based gaze tracking (mocked or simplified)
- Timer + progress bar + live reward display
- "You Blinked" end screen with score
- Reward reveal screen (mocked Zepto Cash credit)
- Share card generation
- Zepto brand system applied throughout

**Out of scope (mocked/stubbed):**
- Real backend session service (scoop trajectory hardcoded client-side for prototype)
- HMAC signing (no server key issuance)
- Actual Zepto Cash wallet integration
- Daily limit enforcement
- Fraud detection pipeline

**Tech stack:**
- Vanilla HTML/CSS/JS or React (TBD at implementation planning)
- MediaPipe Face Mesh via CDN
- No build tooling required if vanilla

---

## 9. Out of Scope (V1)

- Loyalty program or points system (Zepto Cash integration uses existing wallet infra)
- ARKit native iOS implementation (V2, for higher gaze accuracy via Face ID hardware)
- Multiplayer / competitive modes
- Ice cream flavour personalisation
- Push notification reminder ("You haven't used your challenge today")
- Streak mechanics

---

## 10. Success Criteria

For the case study submission, success is evaluated against the brief's criteria:

1. **Brand moment:** Does the mechanic feel native to Zepto, not generic?
2. **10-minute window occupancy:** Does it fill the delivery wait meaningfully?
3. **Viral potential:** Is the share artifact share-worthy? Is the mechanic talkable?
4. **Technical credibility:** Is the prototype working (not a static mockup)?
5. **Strategic coherence:** Does the one-page memo make a defensible argument?

For a real V1 launch, key metrics would be:
- Opt-in rate (banner → challenge start)
- Completion rate (start → blink event)
- Share rate (share card shared / challenge completed)
- Zepto Cash redemption rate (7-day window)
- D+7 order rate for users who redeemed cash (retention signal)
