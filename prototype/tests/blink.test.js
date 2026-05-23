import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateEAR, isBlink, EAR_THRESHOLD } from '../js/utils/blink.js';

// Helpers — build fake landmark objects with x,y only
function pt(x, y) { return { x, y, z: 0 }; }

// Open eye: clear vertical separation between lids
// Horizontal span 0.10→0.70 (C=0.60), vertical gap ±0.09 → EAR ≈ 0.30
const openEye = [
  pt(0.10, 0.50), // p1 left corner
  pt(0.27, 0.41), // p2 upper inner
  pt(0.43, 0.41), // p3 upper outer
  pt(0.70, 0.50), // p4 right corner
  pt(0.43, 0.59), // p5 lower outer
  pt(0.27, 0.59), // p6 lower inner
];

// Closed eye: lids nearly touching (same horizontal span)
const closedEye = [
  pt(0.10, 0.50),
  pt(0.27, 0.49),
  pt(0.43, 0.49),
  pt(0.70, 0.50),
  pt(0.43, 0.51),
  pt(0.27, 0.51),
];

test('calculateEAR: open eye returns value above threshold (> 0.20)', () => {
  const ear = calculateEAR(openEye);
  assert.ok(ear > EAR_THRESHOLD, `expected > ${EAR_THRESHOLD}, got ${ear}`);
});

test('calculateEAR: closed eye returns value at or below threshold (<= 0.20)', () => {
  const ear = calculateEAR(closedEye);
  assert.ok(ear <= EAR_THRESHOLD, `expected <= ${EAR_THRESHOLD}, got ${ear}`);
});

test('calculateEAR: symmetric open eye returns value around 0.3', () => {
  const ear = calculateEAR(openEye);
  assert.ok(ear > 0.25 && ear < 0.50, `expected 0.25-0.50, got ${ear}`);
});

test('isBlink: returns true when EAR at or below threshold', () => {
  assert.equal(isBlink(EAR_THRESHOLD), true);
  assert.equal(isBlink(0.10), true);
});

test('isBlink: returns false when EAR above threshold', () => {
  assert.equal(isBlink(EAR_THRESHOLD + 0.01), false);
  assert.equal(isBlink(0.40), false);
});
