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
