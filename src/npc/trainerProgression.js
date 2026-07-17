import { PROFICIENCY_RANKS } from '../data/characterCreation.js'
import { calculateProficiency } from '../skills/proficiencySystem.js'

export const TRAINER_TIER = Object.freeze({ NOVICE: 'Novice', APPRENTICE: 'Apprentice', ADEPT: 'Adept', EXPERT: 'Expert', MASTER: 'Master', GRANDMASTER: 'Grandmaster' })
export const TRAINER_TIERS = Object.freeze(Object.values(TRAINER_TIER))
export const LESSON_VISIBILITY = Object.freeze({ KNOWN: 'Known', HIDDEN: 'Hidden' })
export const LESSON_UNLOCK_STATE = Object.freeze({ LOCKED: 'Locked', AVAILABLE: 'Available', LEARNED: 'Learned' })

export const TRAINING_COSTS = Object.freeze({
  proficiency: Object.freeze({ Untrained: 1, Novice: 2, Apprentice: 3, Adept: 4, Expert: 5, Master: 7 }),
  attribute: Object.freeze([{ maximum: 3, lp: 1 }, { maximum: 6, lp: 2 }, { maximum: Infinity, lp: 3 }]),
})

export const getTierRankIndex = (tier) => PROFICIENCY_RANKS.indexOf(tier)

export function getTrainerLimit(trainer, reward) {
  if (reward?.type === 'increase_attribute') return trainer.attributeLimits?.[reward.attribute] ?? Infinity
  if (reward?.type === 'upgrade_proficiency') return trainer.proficiencyLimits?.[reward.proficiency] ?? trainer.trainerTier
  if (reward?.type === 'unlock_combat_skill') return trainer.combatSkillLimits?.includes(reward.skillId) ?? true
  return null
}

export function evaluateTrainerLimit(character, trainer, lesson) {
  const reward = lesson.rewards[0]
  const limit = getTrainerLimit(trainer, reward)
  if (reward?.type === 'increase_attribute') return { met: character.stats[reward.attribute] < limit, limit, current: character.stats[reward.attribute], reason: 'Trainer limit reached' }
  if (reward?.type === 'upgrade_proficiency') { const skill = calculateProficiency(character, reward.proficiency); return { met: PROFICIENCY_RANKS.indexOf(skill.currentRank) < PROFICIENCY_RANKS.indexOf(limit), limit, current: skill.currentRank, baseValue: skill.baseValue, reason: 'Trainer limit reached' } }
  if (reward?.type === 'unlock_combat_skill') return { met: Boolean(limit), limit, current: character.startingSkills.includes(reward.skillId), reason: 'Trainer cannot teach this skill' }
  return { met: true, limit: null, current: null }
}
