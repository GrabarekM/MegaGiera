export const LEARNING_POINTS_PER_LEVEL = 5
export const BASE_REQUIRED_EXPERIENCE = 100

export function getRequiredExperience(level) {
  return BASE_REQUIRED_EXPERIENCE * Math.max(1, level)
}

export function gainLearningPoints(character, amount) {
  const gained = Math.max(0, Math.trunc(Number(amount) || 0))
  character.learningPoints += gained
  character.lifetimeLearningPointsEarned += gained
  return { gained, current: character.learningPoints }
}

export function canSpendLearningPoints(character, amount) {
  const cost = Math.max(0, Math.trunc(Number(amount) || 0))
  return cost > 0 && character.learningPoints >= cost
}

export function spendLearningPoints(character, amount) {
  const spent = Math.max(0, Math.trunc(Number(amount) || 0))
  if (!canSpendLearningPoints(character, spent)) return { ok: false, spent: 0, current: character.learningPoints }
  character.learningPoints -= spent
  character.lifetimeLearningPointsSpent += spent
  return { ok: true, spent, current: character.learningPoints }
}

export function gainExperience(character, amount) {
  character.experience += Math.max(0, Math.trunc(Number(amount) || 0))
  const levelUps = []
  while (character.experience >= character.requiredExperience) {
    character.experience -= character.requiredExperience
    character.level += 1
    character.requiredExperience = getRequiredExperience(character.level)
    gainLearningPoints(character, LEARNING_POINTS_PER_LEVEL)
    levelUps.push({ level: character.level, learningPointsGained: LEARNING_POINTS_PER_LEVEL, currentLearningPoints: character.learningPoints })
  }
  return { levelUps, level: character.level, experience: character.experience, requiredExperience: character.requiredExperience }
}
