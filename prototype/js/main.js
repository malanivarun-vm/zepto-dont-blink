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
