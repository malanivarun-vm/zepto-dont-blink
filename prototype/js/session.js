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
