# Don't Blink Challenge — V2 Design Spec
**Date:** 2026-05-25  
**Status:** Approved for implementation  
**Prototype:** https://prototype-smoky-ten.vercel.app

---

## Overview

This spec covers six changes to the Don't Blink Challenge prototype:

1. New home screen (Screen 0) with a challenge discovery banner
2. T&C bottom sheet triggered by the banner
3. "Follow the cone" onboarding instruction on the stare screen
4. Cone moves from game start (not abruptly)
5. Reward ladder extended to 90 seconds
6. Moonshot: break the world record → free ice cream for life

---

## Screen 0 — Home Screen (new)

### Purpose
Introduces the Don't Blink Challenge before the user has placed an order. The banner acts as a teaser that drives ice cream purchases by making the challenge the reward for ordering.

### Design reference
Matches the real Zepto home screen from screenshots:
- **Top bar:** Delivery ETA ("⚡ 8 minutes"), location with dropdown, Zepto Cash badge, avatar
- **Store tabs:** zepto | Summer's Store | Super Mall. | cafe
- **Search bar:** campaign-tagged placeholder ("Search for ice cream, kulfi…")
- **Category pills:** All | Ice Cream | Fresh | Home | Fashion (horizontal scroll)
- **Feed:** hero banner slot → Don't Blink Challenge banner
- **Shop by category grid:** Tubs | Sticks | Cones | Cakes | Dairy | Drinks
- **Bottom delivery bar:** "Unlock free delivery · Shop for ₹99"
- **Bottom nav:** Home | Categories | Buy Again | Cafe

### Hero banner (within feed)
- Background: dark purple gradient (`#0d0220` → `#2d1060`), matching game theme
- Tag pill: "🍦 NEW · FOR YOU"
- Headline: "Don't Blink Challenge"
- Subtext: "Order ₹99+ of ice cream · Win up to ₹150 Cash"
- Reward tier pills: 10s/₹10 · 30s/₹60 · 60s/₹100 · 90s/₹150 (gold highlight on 90s)
- CTA button: "See rules & T&C ›" (does NOT say "Play" — sets expectation that ordering comes first)
- Ice cream cone emoji anchored top-right of banner
- Privacy line at bottom: "🔒 No video is recorded or stored"
- Tap → T&C bottom sheet slides up

### State
This screen shows the banner in **teaser state** (before order). The existing order confirmation screen (Screen 1) with its challenge bottom sheet handles the **unlocked state** (after order).

---

## T&C Bottom Sheet (new)

### Trigger
Tapping the hero banner on the home screen. Slides up from the bottom, dims the home screen behind it (overlay: `rgba(0,0,0,0.5)`).

### Visual style
Matches existing challenge sheet: dark purple gradient (`#140528` → `#1e0a3c`), sheet handle, same border radius and padding.

### Content (top to bottom)

**Tag pill:** "🍦 DON'T BLINK CHALLENGE"

**Title:** "Rules & How to Win"

**World record line:** "World record: 1 hr 5 min 11 sec · Catalin Anghel, Bucharest"

**Unlock condition bar:**
> 🛒 Order ₹99+ of ice cream on Zepto to unlock the challenge. Available once per day.

**Reward ladder (labelled "Your reward ladder"):**

| Time | Reward |
|------|--------|
| 10s  | ₹10    |
| 30s  | ₹60    |
| 60s  | ₹100   |
| 90s  | ₹150   |

**Moonshot callout (gold-bordered card):**
- Tag: "🏆 MOONSHOT"
- Headline: "Break the world record? Ice cream for life. 🍦"
- Body: "If you beat 1 hr 5 min 11 sec without blinking, Zepto will send you free ice cream every month — for life."
- Footer: "Current record: Catalin Anghel, Bucharest · 2003"

**Rules list (bullet points):**
- Your front camera watches for blinks — no video is ever recorded or stored.
- Follow the moving ice cream cone with your eyes. First blink ends the game.
- Zepto Cash is credited instantly to your wallet after the challenge.
- One attempt per day per account.

**Privacy line:**
> 🔒 No video is recorded, stored, or shared. Detection happens entirely on your device.

**CTA button:** "ORDER ICE CREAM & UNLOCK →" (gradient: purple → pink)

---

## Stare Screen — "Follow the cone" instruction

### Placement
Just below the "Blink detection · active" label in the camera strip at the top of the stare screen.

### Behaviour
- Text: "👀 Follow the cone"
- Appears immediately when the stare screen loads
- Stays visible for **5 seconds**
- Fades out (opacity transition, ~0.5s)
- Does not reappear during the session

### Implementation note
Add a `<div id="follow-hint">` below the blink detection label. On `startStareChallenge()`, set a timeout: after 5000ms, add a CSS class that transitions opacity from 1 to 0, then set `display:none`.

---

## Cone Movement — starts from game load

### Current behaviour
Cone appears stationary at a fixed position when the stare screen loads. Movement begins when `startScoop()` is called.

### New behaviour
Cone begins drifting **immediately when the stare screen loads**, before the challenge timer starts. Movement starts at the same low speed as the current drift pattern. No change to speed curve during gameplay — this purely removes the abrupt initial static state.

### Implementation note
Call `startScoop()` before `startChallenge()` in `startStareChallenge()` in `main.js`, or trigger the first drift animation on screen mount rather than on challenge start.

---

## Reward Ladder — extended to 90 seconds

### Updated tiers (replaces existing TIERS in `utils/rewards.js`)

| seconds | reward | label        |
|---------|--------|--------------|
| 10      | ₹10    | Just warming up |
| 30      | ₹60    | Getting serious  |
| 60      | ₹100   | Iron eyes        |
| 90      | ₹150   | Legendary        |

### Screens affected
- `utils/rewards.js` — TIERS array
- Screen 1 (challenge bottom sheet) — tier pills
- Screen 2 (rules screen) — tier list
- Screen 5 (stare HUD) — progress bar max, cash-next label
- T&C bottom sheet — reward table
- Home screen banner — tier pills

---

## Moonshot — world record = free ice cream for life

### Scope for this prototype
Displayed as copy only in two places:
1. T&C bottom sheet (gold-bordered moonshot card — spec above)
2. Rules screen (Screen 2) — add a brief moonshot mention below the tier list

### Not in scope
No backend verification, no redemption flow. This is a marketing claim for the prototype demo only.

---

## Flow summary (complete)

```
Screen 0 (Home)
  → tap banner
  → T&C bottom sheet slides up
  → tap "Order Ice Cream & Unlock"
  → user browses, adds ₹99+ ice cream, places order
  → Screen 1 (Order Confirmation + challenge bottom sheet)
  → tap "I Accept the Dare"
  → Screen 2 (Rules)
  → tap "Start Challenge"
  → Screen 3 (Countdown 3-2-1, camera warms up)
  → Screen 4 (Calibration)
  → Screen 5 (Stare — cone moving, "Follow the cone" hint fades after 5s)
  → blink detected
  → Screen 6 (You Blinked)
  → Screen 7 (Reward Reveal)
  → Screen 8 (Share Card)
```

---

## Out of scope

- Backend order verification (min ₹99 is copy-only in prototype)
- World record verification or redemption
- Auto-trigger variant (challenge starts without user opting in) — V2
- Repeat attempts / streak tracking
- Push notifications

---

## Files to change

| File | Change |
|------|--------|
| `index.html` | Add Screen 0 (home screen), add `follow-hint` div to stare screen |
| `js/main.js` | Add home screen logic, T&C sheet open/close, follow-hint fade timer, start cone on screen load |
| `js/utils/rewards.js` | Update TIERS array (add 90s tier) |
| `css/app.css` | Home screen styles, T&C sheet styles, follow-hint styles |
| `js/scoop.js` | Confirm cone starts on screen load not on challenge start |
