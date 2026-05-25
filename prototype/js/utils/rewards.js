export const TIERS = [
  { seconds: 10, reward: 10,  label: 'Just warming up' },
  { seconds: 30, reward: 60,  label: 'Getting serious'  },
  { seconds: 60, reward: 100, label: 'Iron eyes'        },
  { seconds: 90, reward: 150, label: 'Legendary'        },
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
