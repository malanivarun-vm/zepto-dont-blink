import { calculateEAR, isBlink } from './utils/blink.js';
import { getZoneForIris } from './utils/zones.js';

// MediaPipe landmark indices for eye EAR
const LEFT_EYE  = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
// Iris center landmarks (requires refineLandmarks: true)
const LEFT_IRIS_IDX  = 468;
const RIGHT_IRIS_IDX = 473;

let faceMesh = null;
let camera   = null;

// startCamera(videoEl, onFrame)
// videoEl — HTMLVideoElement (must be visible or have non-zero dimensions)
// onFrame — called each frame with { leftEAR, rightEAR, avgEAR, isBlink, irisZone }
export function startCamera(videoEl, onFrame) {
  faceMesh = new window.FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces:    1,
    refineLandmarks: true,   // enables iris landmarks 468-477
    minDetectionConfidence: 0.6,
    minTrackingConfidence:  0.6,
  });

  faceMesh.onResults((results) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      onFrame({ faceDetected: false });
      return;
    }
    const lm = results.multiFaceLandmarks[0];

    // Nose tip (lm[1]) must be within the visible guide box region.
    // Bounds are intentionally generous on x, tighter on y — laptop cameras show
    // a wider crop so the visible vertical range is roughly y 0.33–0.67.
    const noseX = 1 - lm[1].x; // mirrored to match display
    const noseY = lm[1].y;
    if (noseX < 0.2 || noseX > 0.8 || noseY < 0.30 || noseY > 0.72) {
      onFrame({ faceDetected: false });
      return;
    }

    const leftEAR  = calculateEAR(LEFT_EYE.map(i => lm[i]));
    const rightEAR = calculateEAR(RIGHT_EYE.map(i => lm[i]));
    const avgEAR   = (leftEAR + rightEAR) / 2;

    // Mirror iris x: camera feed is mirrored in CSS, so flip x to match screen space
    const irisX = 1 - lm[LEFT_IRIS_IDX].x;
    const irisY = lm[LEFT_IRIS_IDX].y;
    const irisZone = getZoneForIris(irisX, irisY);

    onFrame({
      faceDetected: true,
      leftEAR,
      rightEAR,
      avgEAR,
      blink: isBlink(avgEAR),
      irisZone,
      irisX,
      irisY,
    });
  });

  camera = new window.Camera(videoEl, {
    onFrame: async () => {
      await faceMesh.send({ image: videoEl });
    },
    width: 320,
    height: 240,
    facingMode: 'user',
  });

  camera.start();
}

export function stopCamera() {
  camera?.stop();
  faceMesh?.close();
  camera = null;
  faceMesh = null;
}
