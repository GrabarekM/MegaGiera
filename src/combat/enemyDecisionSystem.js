const OPERATORS = Object.freeze({
  lt: (actual, expected) => actual < expected,
  lte: (actual, expected) => actual <= expected,
  eq: (actual, expected) => actual === expected,
  gte: (actual, expected) => actual >= expected,
  gt: (actual, expected) => actual > expected,
})

const TEMPERAMENT_TAG_MULTIPLIERS = Object.freeze({
  Aggressive: Object.freeze({ heavy: 1.35, melee: 1.1, guard: 0.75 }),
  Defensive: Object.freeze({ guard: 1.5, heavy: 0.85 }),
  Coward: Object.freeze({ guard: 1.6, heavy: 0.7 }),
  Hunter: Object.freeze({ quick: 1.25, mobile: 1.2 }),
  Berserker: Object.freeze({ heavy: 1.5, guard: 0.6 }),
})

function getBehaviorFacts(enemy, player, context) {
  return {
    enemyHpPercent: enemy.maxHealth > 0 ? (enemy.currentHealth / enemy.maxHealth) * 100 : 0,
    playerHpPercent: player.maxHealth > 0 ? (player.currentHealth / player.maxHealth) * 100 : 0,
    currentRound: context.round ?? 1,
    skillCooldowns: context.skillCooldowns ?? {},
  }
}

export function evaluateBehaviorRules(enemy, player, context = {}) {
  const facts = getBehaviorFacts(enemy, player, context)
  const activeRules = (enemy.behaviorRules ?? []).filter((rule) => rule.conditions.every((condition) => {
    const compare = OPERATORS[condition.operator]
    return Boolean(compare && compare(facts[condition.fact], condition.value))
  }))
  const finalWeights = { ...(enemy.skillWeights ?? {}) }
  for (const rule of activeRules) Object.assign(finalWeights, rule.skillWeights)
  return { facts, activeRules, finalWeights }
}

function conditionsPass(conditions, facts) {
  return (conditions ?? []).every((condition) => {
    const compare = OPERATORS[condition.operator]
    return Boolean(compare && compare(facts[condition.fact], condition.value))
  })
}

function applyTemperament(weights, skills, temperament) {
  const multipliers = TEMPERAMENT_TAG_MULTIPLIERS[temperament] ?? {}
  return Object.fromEntries(Object.entries(weights).map(([skillId, weight]) => {
    const skill = skills.find((item) => item.id === skillId)
    const multiplier = (skill?.tags ?? []).reduce((value, tag) => value * (multipliers[tag] ?? 1), 1)
    return [skillId, Math.max(0, Number(weight) || 0) * multiplier]
  }))
}

export function selectEnemyAction(enemy, player, random = Math.random, context = {}) {
  const behavior = evaluateBehaviorRules(enemy, player, context)
  const rejectedSkills = []
  const available = enemy.skills.filter((item) => {
    let reason = null
    if (!item.available) reason = 'Skill is unavailable.'
    else if ((item.remainingCooldown ?? 0) > 0) reason = `Cooldown: ${item.remainingCooldown} round(s) remaining.`
    else if (!conditionsPass(item.conditions, behavior.facts)) reason = 'Usage conditions are not met.'
    if (reason) rejectedSkills.push({ skillId: item.id, skillName: item.name, reason })
    return !reason
  })
  if (available.length === 0) return null
  const finalWeights = applyTemperament(behavior.finalWeights, enemy.skills, enemy.temperament)
  const totalWeight = available.reduce((total, skill) => total + Math.max(0, Number(finalWeights[skill.id]) || 0), 0)
  let skill = available[0]
  if (totalWeight > 0) {
    let threshold = random() * totalWeight
    skill = available.find((item) => {
      threshold -= Math.max(0, Number(finalWeights[item.id]) || 0)
      return threshold < 0
    }) ?? available.at(-1)
  }
  const targetIds = skill.actionType === 'guard' ? [enemy.id] : [player.id]
  const baseReason = behavior.activeRules.at(-1)?.reason ?? `Base ${enemy.behaviorProfile} behavior.`
  const reason = `${baseReason} ${skill.name} available. Cooldown ready. Temperament: ${enemy.temperament}.`
  return {
    combatantId: enemy.id, skillId: skill.id, skill, targetIds,
    aiDecision: {
      behaviorProfile: enemy.behaviorProfile,
      temperament: enemy.temperament,
      threatRating: enemy.threatRating,
      finalWeights,
      activeRules: behavior.activeRules.map((rule) => ({ id: rule.id, reason: rule.reason })),
      cooldowns: Object.fromEntries(enemy.skills.map((item) => [item.id, item.remainingCooldown ?? 0])),
      availableSkills: available.map((item) => ({ id: item.id, name: item.name })),
      rejectedSkills,
      selectedSkillId: skill.id,
      selectedSkillName: skill.name,
      reason,
    },
  }
}

export { chooseInitiativeAttribute } from './chooseInitiativeAttribute.js'
