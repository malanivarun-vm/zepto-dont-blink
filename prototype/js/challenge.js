import { calculateReward, TIERS, nextTier } from './utils/rewards.js';
import { stopScoop, currentZone } from './scoop.js';
import { session } from './session.js';

const MAX_SECONDS = 90; // ladder tops out at 90s

let blinkFrameCount = 0;
const BLINK_FRAMES_REQUIRED = 2; // 2 consecutive low-EAR frames = blink

// Debounce: require this many consecutive no-face frames before pausing (~0.3s at 30fps)
const NO_FACE_THRESHOLD = 10;
let noFaceFrameCount = 0;

let timerInterval = null;
let startTimestamp = null;
let totalPausedMs = 0;   // accumulated pause duration, excluded from elapsed
let pauseStartTime = null;
let paused = false;
let elapsed = 0; // seconds
let running = false;

// startChallenge(onBlink)
// onBlink: called with (durationSecs) when blink is detected
export function startChallenge(onBlink) {
  running        = true;
  paused         = false;
  blinkFrameCount = 0;
  noFaceFrameCount = 0;
  totalPausedMs  = 0;
  pauseStartTime = null;
  startTimestamp = Date.now();
  session.startTime = startTimestamp;

  startTimer();

  return function onFrame(frame) {
    if (!running) return;

    if (!frame.faceDetected) {
      noFaceFrameCount++;
      if (!paused && noFaceFrameCount >= NO_FACE_THRESHOLD) {
        pauseForFaceLost();
      }
      return;
    }

    // Face is back
    noFaceFrameCount = 0;
    if (paused) {
      resumeFromFaceLost();
    }

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

function pauseForFaceLost() {
  paused = true;
  pauseStartTime = Date.now();
  blinkFrameCount = 0; // clear any partial blink state before pause
  setFaceLostOverlay(true);
}

function resumeFromFaceLost() {
  paused = false;
  totalPausedMs += Date.now() - pauseStartTime;
  pauseStartTime = null;
  blinkFrameCount = 0; // clear stale blink state after gap
  setFaceLostOverlay(false);
}

function setFaceLostOverlay(show) {
  const overlay = document.getElementById('face-lost-overlay');
  if (overlay) overlay.style.display = show ? 'flex' : 'none';
  const badge = document.getElementById('blink-detection-badge');
  if (badge) badge.textContent = show ? '⏸ Align your face to resume' : 'Blink detection · active';
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (!running || paused) return;
    elapsed = (Date.now() - startTimestamp - totalPausedMs) / 1000;
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

  const durationSecs = (Date.now() - startTimestamp - totalPausedMs) / 1000;
  session.endTime      = Date.now();
  session.durationSecs = durationSecs;
  session.reward       = calculateReward(durationSecs);

  onBlink(durationSecs);
}

export function stopChallenge() {
  running = false;
  paused  = false;
  clearInterval(timerInterval);
  stopScoop();
  setFaceLostOverlay(false);
}
