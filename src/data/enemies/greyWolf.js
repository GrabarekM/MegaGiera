export default Object.freeze({
  id: 'grey_wolf', name: 'Grey Wolf', description: 'A lean but dangerous grey wolf.', maxHealth: 14,
  stats: Object.freeze({ might: 3, defense: 2, vitality: 5, agility: 7, magicPower: 0, wisdom: 2 }),
  preferredInitiativeStats: Object.freeze(['agility', 'vitality']),
  skillIds: Object.freeze(['enemy_bite', 'wolf_heavy_bite']),
  behaviorProfile: 'aggressive',
  threatRating: 3, temperament: 'Aggressive',
  skillWeights: Object.freeze({ enemy_bite: 70, wolf_heavy_bite: 30 }),
  behaviorRules: Object.freeze([{ id: 'wolf_low_hp', reason: 'Enemy HP at or below 50%.', conditions: Object.freeze([{ fact: 'enemyHpPercent', operator: 'lte', value: 50 }]), skillWeights: Object.freeze({ enemy_bite: 40, wolf_heavy_bite: 60 }) }]),
})
