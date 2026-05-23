// Zone index: 0=center 1=top-left 2=top-right 3=bottom-left 4=bottom-right
// Coordinates are normalised 0–1 (fraction of video/screen)
// NOTE: iris x is already mirrored (1 - raw.x) before being passed here

export const ZONE_NAMES = ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];

// Zone boundaries [xMin, xMax, yMin, yMax]
const ZONE_BOUNDS = [
  [0.30, 0.70, 0.30, 0.70], // 0: center (checked first — overlaps corners)
  [0.00, 0.45, 0.00, 0.45], // 1: top-left
  [0.55, 1.00, 0.00, 0.45], // 2: top-right
  [0.00, 0.45, 0.55, 1.00], // 3: bottom-left
  [0.55, 1.00, 0.55, 1.00], // 4: bottom-right
];

// Returns zone index (0–4). Returns 0 (center) for points in gaps.
export function getZoneForIris(nx, ny) {
  for (let i = 0; i < ZONE_BOUNDS.length; i++) {
    const [xMin, xMax, yMin, yMax] = ZONE_BOUNDS[i];
    if (nx >= xMin && nx <= xMax && ny >= yMin && ny <= yMax) return i;
  }
  return 0; // default center for edge gaps
}
