export const DEFAULT_PRACTICE_GAIN = 0.01

const defineRange = (minimumSkill, maximumSkill, chance, skillGain = DEFAULT_PRACTICE_GAIN) => Object.freeze({ minimumSkill, maximumSkill, chance, skillGain })

export const SKILL_PROGRESSION_DEFINITIONS = Object.freeze([
  defineRange(0, 10, 0.20),
  defineRange(10, 20, 0.12),
  defineRange(20, 40, 0.07),
  defineRange(40, 60, 0.04),
  defineRange(60, 80, 0.02),
  defineRange(80, 90, 0.01),
  defineRange(90, 100, 0.005),
  defineRange(100, 120.01, 0.002),
])

export const PRACTICE_ANTI_GRIND_HOOKS = Object.freeze([
  'diminishingReturns', 'minimumTargetLevel', 'targetVariety', 'minimumSuccessLevel', 'macroPrevention',
])

export function getSkillProgressionDefinition(baseSkill) {
  return SKILL_PROGRESSION_DEFINITIONS.find(({ minimumSkill, maximumSkill }) => baseSkill >= minimumSkill && baseSkill < maximumSkill) ?? null
}
