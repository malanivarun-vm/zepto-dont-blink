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
