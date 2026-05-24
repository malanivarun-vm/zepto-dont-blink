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
