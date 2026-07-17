export default Object.freeze({
  id: 'giant_rat', name: 'Giant Rat', description: 'A quick, oversized scavenger.', maxHealth: 7,
  stats: Object.freeze({ strength: 1, defense: 0, vitality: 2, agility: 7, magicPower: 0, wisdom: 1 }),
  preferredInitiativeStats: Object.freeze(['agility']),
  skillIds: Object.freeze(['rat_bite', 'rat_scratch']),
  behaviorProfile: 'very_fast',
  lootDefinitionId: 'small_beast_loot',
  threatRating: 1, temperament: 'Hunter',
  skillWeights: Object.freeze({ rat_bite: 30, rat_scratch: 70 }),
  behaviorRules: Object.freeze([]),
})
