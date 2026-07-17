export default Object.freeze({
  id: 'starved_wild_dog', name: 'Starved Wild Dog', description: 'A gaunt, starving dog.', maxHealth: 8,
  stats: Object.freeze({ strength: 1, defense: 1, vitality: 2, agility: 6, magicPower: 0, wisdom: 1 }),
  preferredInitiativeStats: Object.freeze(['agility']),
  skillIds: Object.freeze(['dog_quick_bite', 'dog_growl']),
  behaviorProfile: 'very_cautious',
  lootDefinitionId: 'wild_dog_loot',
  threatRating: 1, temperament: 'Coward',
  skillWeights: Object.freeze({ dog_quick_bite: 80, dog_growl: 20 }),
  behaviorRules: Object.freeze([{ id: 'dog_low_hp', reason: 'Enemy HP at or below 50%.', conditions: Object.freeze([{ fact: 'enemyHpPercent', operator: 'lte', value: 50 }]), skillWeights: Object.freeze({ dog_quick_bite: 40, dog_growl: 60 }) }]),
})
