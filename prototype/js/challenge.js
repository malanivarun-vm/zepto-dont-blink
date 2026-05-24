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
