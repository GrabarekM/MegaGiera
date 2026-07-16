export const PROFICIENCY_RANK_EFFECTS = Object.freeze({
  Untrained: Object.freeze({ missChance: 0.3, damageMultiplier: 0.85, advancedSkills: false }),
  Novice: Object.freeze({ missChance: 0, damageMultiplier: 1, advancedSkills: true }),
  Apprentice: Object.freeze({ missChance: 0, damageMultiplier: 1, advancedSkills: true }),
  Adept: Object.freeze({ missChance: 0, damageMultiplier: 1, advancedSkills: true }),
  Expert: Object.freeze({ missChance: 0, damageMultiplier: 1, advancedSkills: true }),
  Master: Object.freeze({ missChance: 0, damageMultiplier: 1, advancedSkills: true }),
  Grandmaster: Object.freeze({ missChance: 0, damageMultiplier: 1, advancedSkills: true }),
})

export const ATTRIBUTE_REQUIREMENT_DAMAGE_MULTIPLIER = 0.85

export function resolveWeaponRequirements(character, weapon) {
  if (!weapon) return { applies: false, hit: true, missChance: 0, damageMultiplier: 1, advancedSkills: true }
  const currentAttribute = Number(character.stats?.[weapon.requiredAttribute] ?? 0)
  const currentRank = character.proficiencies?.[weapon.requiredProficiency] ?? 'Untrained'
  const rankEffects = PROFICIENCY_RANK_EFFECTS[currentRank] ?? PROFICIENCY_RANK_EFFECTS.Untrained
  const attributeMet = currentAttribute >= weapon.requiredAttributeValue
  return {
    applies: true, weaponId: weapon.id, weaponName: weapon.displayName,
    requiredAttribute: weapon.requiredAttribute, requiredAttributeValue: weapon.requiredAttributeValue, currentAttribute, attributeMet,
    requiredProficiency: weapon.requiredProficiency, currentRank,
    attributeDamageMultiplier: attributeMet ? 1 : ATTRIBUTE_REQUIREMENT_DAMAGE_MULTIPLIER,
    proficiencyDamageMultiplier: rankEffects.damageMultiplier,
    damageMultiplier: (attributeMet ? 1 : ATTRIBUTE_REQUIREMENT_DAMAGE_MULTIPLIER) * rankEffects.damageMultiplier,
    missChance: rankEffects.missChance, advancedSkills: rankEffects.advancedSkills,
  }
}

export function resolveHitCheck(requirements, random = Math.random) {
  const roll = random()
  const hit = roll >= requirements.missChance
  return { hit, roll, missChance: requirements.missChance, reason: hit ? null : 'insufficient proficiency' }
}

export function isWeaponSkillAvailable(skill, requirements) {
  return skill.proficiencyTier !== 'advanced' || requirements.advancedSkills
}
