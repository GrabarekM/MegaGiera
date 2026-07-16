export default Object.freeze({
  id: 'mongbat', name: 'Mongbat', description: 'A small flying beast.', maxHealth: 9,
  stats: Object.freeze({ might: 2, defense: 1, vitality: 2, agility: 8, magicPower: 0, wisdom: 3 }),
  preferredInitiativeStats: Object.freeze(['agility', 'wisdom']),
  skillIds: Object.freeze(['mongbat_bite', 'mongbat_dive']),
  behaviorProfile: 'mobile',
  threatRating: 2, temperament: 'Hunter',
  skillWeights: Object.freeze({ mongbat_bite: 40, mongbat_dive: 60 }),
  behaviorRules: Object.freeze([{ id: 'mongbat_low_hp', reason: 'Enemy HP at or below 30%.', conditions: Object.freeze([{ fact: 'enemyHpPercent', operator: 'lte', value: 30 }]), skillWeights: Object.freeze({ mongbat_bite: 20, mongbat_dive: 80 }) }]),
})
