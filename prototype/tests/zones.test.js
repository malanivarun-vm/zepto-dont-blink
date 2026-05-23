import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getZoneForIris, ZONE_NAMES } from '../js/utils/zones.js';

test('center iris (0.5, 0.5) → zone 0 (center)', () => {
  assert.equal(getZoneForIris(0.5, 0.5), 0);
});

test('top-left iris (0.15, 0.20) → zone 1 (top-left)', () => {
  assert.equal(getZoneForIris(0.15, 0.20), 1);
});

test('top-right iris (0.85, 0.20) → zone 2 (top-right)', () => {
  assert.equal(getZoneForIris(0.85, 0.20), 2);
});

test('bottom-left iris (0.15, 0.80) → zone 3 (bottom-left)', () => {
  assert.equal(getZoneForIris(0.15, 0.80), 3);
});

test('bottom-right iris (0.85, 0.80) → zone 4 (bottom-right)', () => {
  assert.equal(getZoneForIris(0.85, 0.80), 4);
});

test('ZONE_NAMES has 5 entries', () => {
  assert.equal(ZONE_NAMES.length, 5);
});
