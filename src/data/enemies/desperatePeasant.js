export default Object.freeze({
  id: 'desperate_peasant', name: 'Desperate Peasant', description: 'A desperate person armed with a crude tool.', maxHealth: 12,
  stats: Object.freeze({ strength: 3, defense: 3, vitality: 3, agility: 1, magicPower: 0, wisdom: 2 }),
  preferredInitiativeStats: Object.freeze(['strength', 'defense']),
  skillIds: Object.freeze(['peasant_club_swing', 'peasant_desperate_strike']),
  behaviorProfile: 'chaotic',
  lootDefinitionId: 'humanoid_loot',
  threatRating: 2, temperament: 'Berserker',
  skillWeights: Object.freeze({ peasant_club_swing: 60, peasant_desperate_strike: 40 }),
  behaviorRules: Object.freeze([{ id: 'peasant_desperate', reason: 'Enemy HP at or below 30%.', conditions: Object.freeze([{ fact: 'enemyHpPercent', operator: 'lte', value: 30 }]), skillWeights: Object.freeze({ peasant_club_swing: 20, peasant_desperate_strike: 80 }) }]),
})
