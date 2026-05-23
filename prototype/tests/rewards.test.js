import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateReward, TIERS } from '../js/utils/rewards.js';

test('calculateReward: 0 seconds → ₹0', () => {
  assert.equal(calculateReward(0), 0);
});

test('calculateReward: 9 seconds → ₹0 (below first tier)', () => {
  assert.equal(calculateReward(9), 0);
});

test('calculateReward: 10 seconds → ₹10', () => {
  assert.equal(calculateReward(10), 10);
});

test('calculateReward: 19 seconds → ₹10 (still first tier)', () => {
  assert.equal(calculateReward(19), 10);
});

test('calculateReward: 20 seconds → ₹30', () => {
  assert.equal(calculateReward(20), 30);
});

test('calculateReward: 30 seconds → ₹60', () => {
  assert.equal(calculateReward(30), 60);
});

test('calculateReward: 45 seconds → ₹100', () => {
  assert.equal(calculateReward(45), 100);
});

test('calculateReward: 60 seconds → ₹150', () => {
  assert.equal(calculateReward(60), 150);
});

test('calculateReward: 120 seconds → ₹150 (max, no overflow)', () => {
  assert.equal(calculateReward(120), 150);
});

test('TIERS: has 5 entries with correct structure', () => {
  assert.equal(TIERS.length, 5);
  for (const t of TIERS) {
    assert.ok('seconds' in t && 'reward' in t && 'label' in t);
  }
});
