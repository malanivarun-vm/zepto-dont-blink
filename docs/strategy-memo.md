# Strategy Memo — Don't Blink Challenge
**To:** Zepto Product & Growth Leadership  
**From:** PM Candidate Submission — Varun Malani  
**Date:** May 2026  
**Re:** Competing with Blinkit's "Scream for Ice Cream" on the ice cream delivery moment

---

## The Problem

Blinkit owns the cultural conversation around quick-commerce ice cream. "Scream for Ice Cream" was a single viral mechanic — users screamed into their phone to unlock the order. It generated social content, brand recall, and a perception of fun that Zepto currently has no answer to.

The window to respond is now. Ice cream is summer's highest-velocity SKU. The next 6–8 weeks set brand associations that last through the season.

The risk is not losing a feature race. The risk is Blinkit becoming "the fun ice cream app" while Zepto stays "the fast one." Speed is table stakes. Speed + brand = defensible.

---

## Why Zepto Should Be in Ice Cream

Ice cream is not just another SKU. It is the category where quick-commerce's 10-minute promise is most emotionally legible — nobody wants to wait 45 minutes for ice cream in 40°C heat. Zepto's delivery infrastructure is uniquely suited to this: cold chain handling, dense dark store coverage, and a promise the category demands.

The competitive case is straightforward:
- **Swiggy Instamart** is broad-assortment, not fast-first. Their ice cream positioning is generic.
- **Blinkit** has the cultural moment but not the operational depth to defend the "fastest" claim at Zepto's delivery density.
- **Zepto** has the speed and needs the cultural moment. Ice cream is the category where these two things — logistics and brand — create a moat together.

The strategic entry question is not whether to enter. It is: what does Zepto-native ice cream look like in-app, and how does the brand show up at the moment that matters?

---

## Three Mechanics Considered

Three product approaches were evaluated before landing on Don't Blink:

**A — Freeze Frame:** Convert the order tracking screen into a cinematic, branded countdown — a live timer, temperature ticker, and screenshot-worthy delivery-in-progress design. Every order becomes a brand canvas. High execution quality, medium viral ceiling.

**B — Scoop Report:** A post-delivery shareable card (Spotify Wrapped for your ice cream order) — delivery time, temperature reading, witty copy. Low risk, low timing dependency, but the excitement window is over by the time the card is generated.

**C — Night Drop:** FOMO-driven flash window (9–11PM only) with curated ice cream combos available for a limited time. Builds habit, but doesn't counter Blinkit's positioning and doesn't live inside the delivery window.

**Why Don't Blink won:**
Freeze Frame was the closest runner-up. But Don't Blink does something none of the others do: it makes the 10-minute delivery window the game itself. The challenge runs out when the ice cream arrives. That structural lock-in — the mechanic is tied to Zepto's core operational promise — is not copyable by any competitor without admitting to slower delivery times. Blinkit cannot run this feature honestly. Zepto can. That asymmetry is the strategic case.

---

## The Mechanic: Don't Blink

A gaze-endurance challenge played during the delivery wait. The user stares at a moving ice cream scoop on screen without blinking. Front camera detects blinks in real time using MediaPipe Face Mesh — a WASM library that runs fully on-device, no video ever leaves the phone. The longer they hold, the more Zepto Cash they earn. Challenge ends on first blink.

**Why this works as a retention loop, not just a game:**

1. **It fills exactly the right window.** The challenge runs up to 60 seconds — calibrated so even a perfect run ends well before delivery. It reframes wait time as game time without risk of the game outlasting the order.

2. **The reward closes the loop.** Zepto Cash (₹10–₹150 based on duration, 7-day expiry) creates a standing reason to place another order. This is retention built into the mechanic, not bolted on.

3. **"Follow the scoop" is uniquely Zepto.** The scoop being the literal product being delivered is a brand detail that makes the mechanic feel native, not borrowed. Blinkit's "Scream for Ice Cream" was novelty. This is brand coherence.

4. **The share card is the campaign.** Time held, cash won, #DontBlink — the share artifact is designed for Instagram Stories and WhatsApp. We are not building a feature; we are building a content loop.

---

## Reward Structure and Calibration

| Duration Held | Zepto Cash |
|--------------|------------|
| 10 seconds   | ₹10        |
| 20 seconds   | ₹30        |
| 30 seconds   | ₹60        |
| 45 seconds   | ₹100       |
| 60+ seconds  | ₹150       |

**Why 60 seconds is the cap:**
The Guinness World Record for staring without blinking stands at 1 hour 5 minutes 11 seconds (Catalin Anghel, Bucharest, May 2024). Research confirms physical discomfort — red eyes, involuntary tearing — begins around 15 minutes. For a casual user during an ice cream delivery wait, meaningful achievement happens between 10–60 seconds. Capping rewards at 60 seconds keeps the experience playful without crossing into physical discomfort. The world record reference lives in the UI copy specifically because a 23-second hold feels significant when benchmarked against a 65-minute world record. That contrast is a deliberate creative choice — it makes every player feel like they're part of something real.

**Goal-setting psychology in the reward reveal:**
Screen 6 doesn't just show what the user earned. It shows what they almost earned: "You were 7 seconds from ₹60." This is intentional. The gap creates a specific, achievable target for tomorrow's challenge. It converts a game into a daily pull.

---

## Trigger Design

**V1: Opt-in banner** ("I ACCEPT THE DARE") on the order confirmation screen. Dismissible. The user has to choose to enter.

**V2 consideration: Auto-start** (3 seconds after confirmation, with a skip option) — triggers the challenge as an event happening to the user, not a promotion they're considering. Research suggests the "dare" framing drives recording behavior: users react to being challenged. The auto-start approach maximizes viral surface area because every ice cream order becomes a potential share moment.

V1 ships opt-in because it is lower NPS risk at launch and allows the team to validate share rate before committing to an experience every user encounters. If share rate and opt-in rate exceed targets at Week 2 read, the V2 decision is straightforward.

---

## Delivery Feasibility

| Component | Complexity | Notes |
|-----------|-----------|-------|
| Blink detection (front camera) | Low | MediaPipe Face Mesh, on-device. No video transmitted. DPDP Act 2023 compliant. |
| Scoop animation + gaze zones | Low | Zone-based, not pixel-precise. 27% screen width scoop = large tolerance margin. |
| 3-point calibration | Low | ~8 seconds, creates personal gaze baseline per session. Also builds pre-game ritual. |
| Order confirmation banner | Low | Single opt-in CTA, dismissible. |
| Zepto Cash integration | Medium | Uses existing wallet/payment API — no new loyalty infrastructure needed. |
| Anti-cheat layer | Medium | Server-side scoop trajectory + HMAC event chain. V1.1, post-launch. |
| Session backend | Medium | Redis daily limits + PostgreSQL session records — standard Zepto infrastructure. |

**MVP path:** Blink detection + scoop animation + Zepto Cash credit. Anti-cheat is added before at-scale volume makes it a meaningful fraud vector. The working prototype validates the full client-side stack — MediaPipe, zone-based gaze tracking, real blink detection — all functioning in a browser today.

**Privacy:** MediaPipe runs on-device. Only floating-point landmark coordinates are processed — transiently, not stored. No video or biometric data leaves the device. DPDP Act 2023 compliant.

**A working prototype exists.** Built in vanilla JS with real MediaPipe blink detection — not a static mockup. Available at https://prototype-smoky-ten.vercel.app. The full 8-screen flow works: order confirmation → rules → countdown → 3-point calibration → stare → blink detection → reward reveal → share card.

---

## What We Are Not Building (V1)

- Native iOS/ARKit implementation (V2, post-validation — would improve gaze accuracy via Face ID hardware)
- Loyalty points or streaks (Zepto Cash uses existing wallet; no new program needed)
- Multiplayer or competitive leaderboard modes
- Ice cream flavour personalisation
- Push notification reminder ("You haven't used your challenge today")

V1 is a focused bet: prove the mechanic drives re-orders before investing in depth.

---

## GTM Phasing

**Week 0–2: Soft launch, 10% of ice cream orders**
- Instrument every touchpoint: banner impression → opt-in rate → completion rate → share rate → cash redemption → D+7 re-order
- No paid amplification yet — validate organic share loop first
- Watch for fraud anomalies before scaling reward volume

**Week 2 read: Go/pause decision**
- If opt-in ≥15% and share rate ≥20%: full rollout + PR push (#DontBlink campaign with influencer seeding)
- If opt-in <10%: copy test on banner, evaluate auto-start trigger
- If share rate <10%: share card redesign before broader push

**Week 4+: Scale and deepen**
- Add anti-cheat layer (HMAC event chain) before full rollout
- Evaluate auto-start trigger (V2) based on opt-in data
- Consider streak mechanic ("3-day streak = bonus ₹50") if D+7 data is strong

---

## Recommendation

Ship Don't Blink as Zepto's answer to "Scream for Ice Cream" — this summer, not next.

The mechanic is ready. The prototype is built and deployed. The integration surface is narrow (existing wallet, existing camera permissions, no new infrastructure). The viral loop is designed in. The competitive asymmetry is structural — Blinkit cannot run this challenge honestly.

**The ask:** Green-light a 4-week sprint to production. Instrument the funnel. Take the 2-week interim read seriously. The cost of waiting is ceding the "fun ice cream brand" position to Blinkit for the rest of the season.

---

## Key Metrics (Launch Dashboard)

| Metric | Target (Week 2 Read) |
|--------|---------------------|
| Opt-in rate (banner → start) | ≥15% of ice cream orders |
| Completion rate (start → blink event) | ≥60% |
| Share rate (completed → shared) | ≥20% |
| Zepto Cash redemption rate | ≥40% within 7 days |
| D+7 order rate (redeemers vs. control) | +8pp lift |

---

*Supporting materials: Design Specification (docs/specs/2026-05-23-dont-blink-design.md) · Implementation Plan (docs/plans/2026-05-24-dont-blink-implementation.md) · Working Prototype (https://prototype-smoky-ten.vercel.app)*
