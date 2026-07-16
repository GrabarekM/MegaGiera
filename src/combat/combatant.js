import { COMBATANT_TYPE } from './combatConstants.js'

export function createPlayerCombatant(character, skills, requirements = null) {
  return {
    id: `combatant-${character.id}`, name: character.name, type: COMBATANT_TYPE.PLAYER,
    currentHealth: character.health.current, maxHealth: character.health.max,
    currentBlock: 0,
    stats: { ...character.stats }, skills: skills.map((skill) => ({ ...skill })),
    proficiencies: { ...character.proficiencies },
    weapon: character.startingWeapon ? { ...character.startingWeapon, combatSkills: [...character.startingWeapon.combatSkills] } : null,
    weaponRequirements: requirements,
    statuses: character.statuses.map((status) => typeof status === 'object' ? { ...status } : status),
    alive: character.health.current > 0, sourceRef: { type: 'character', id: character.id },
  }
}

export function createEnemyCombatant(template, instanceId, skillCatalog) {
  return {
    id: instanceId, name: template.name, type: COMBATANT_TYPE.ENEMY,
    currentHealth: template.maxHealth, maxHealth: template.maxHealth,
    currentBlock: 0,
    stats: { ...template.stats }, skills: template.skillIds.map((id) => ({ ...skillCatalog[id], remainingCooldown: 0 })),
    statuses: [], alive: true, sourceRef: { type: 'enemy_template', id: template.id },
    description: template.description,
    behaviorProfile: template.behaviorProfile ?? 'default',
    behaviorRules: (template.behaviorRules ?? []).map((rule) => ({ ...rule, conditions: rule.conditions.map((condition) => ({ ...condition })), skillWeights: { ...rule.skillWeights } })),
    skillWeights: { ...(template.skillWeights ?? {}) },
    preferredInitiativeStats: [...(template.preferredInitiativeStats ?? [])],
    threatRating: template.threatRating,
    temperament: template.temperament,
  }
}
