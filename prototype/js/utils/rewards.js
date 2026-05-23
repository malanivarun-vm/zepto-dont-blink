export const TIERS = [
  { seconds: 10, reward: 10,  label: '₹10 at 10s'  },
  { seconds: 20, reward: 30,  label: '₹30 at 20s'  },
  { seconds: 30, reward: 60,  label: '₹60 at 30s'  },
  { seconds: 45, reward: 100, label: '₹100 at 45s' },
  { seconds: 60, reward: 150, label: '₹150 at 60s' },
];

// Returns ₹ reward for a given duration in seconds.
export function calculateReward(seconds) {
  let reward = 0;
  for (const tier of TIERS) {
    if (seconds >= tier.seconds) reward = tier.reward;
    else break;
  }
  return reward;
}

// Returns the next tier the user hasn't reached yet, or null if maxed.
export function nextTier(seconds) {
  return TIERS.find(t => t.seconds > seconds) ?? null;
}
