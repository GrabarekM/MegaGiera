export function defineSkillRank({ name, minimumSkill, maximumSkill }) { if (!name || !Number.isInteger(minimumSkill) || !Number.isInteger(maximumSkill) || minimumSkill > maximumSkill) throw new Error('Invalid SkillRankDefinition.'); return Object.freeze({ name, minimumSkill, maximumSkill }) }
export const SKILL_RANK_DEFINITIONS = Object.freeze([
  defineSkillRank({ name: 'Untrained', minimumSkill: 0, maximumSkill: 9 }),
  defineSkillRank({ name: 'Novice', minimumSkill: 10, maximumSkill: 39 }),
  defineSkillRank({ name: 'Apprentice', minimumSkill: 40, maximumSkill: 59 }),
  defineSkillRank({ name: 'Adept', minimumSkill: 60, maximumSkill: 79 }),
  defineSkillRank({ name: 'Expert', minimumSkill: 80, maximumSkill: 89 }),
  defineSkillRank({ name: 'Master', minimumSkill: 90, maximumSkill: 99 }),
  defineSkillRank({ name: 'Grandmaster', minimumSkill: 100, maximumSkill: 100 }),
])
export const NORMAL_SKILL_CAP = 100
export const ABSOLUTE_SKILL_CAP = 120
export const getSkillRankDefinition = (name) => SKILL_RANK_DEFINITIONS.find((rank) => rank.name === name) ?? SKILL_RANK_DEFINITIONS[0]
export const getSkillRankForValue = (value) => SKILL_RANK_DEFINITIONS.find((rank) => value >= rank.minimumSkill && value <= rank.maximumSkill) ?? (value > NORMAL_SKILL_CAP ? SKILL_RANK_DEFINITIONS.at(-1) : SKILL_RANK_DEFINITIONS[0])
export const getNextSkillRank = (name) => SKILL_RANK_DEFINITIONS[SKILL_RANK_DEFINITIONS.findIndex((rank) => rank.name === name) + 1] ?? null
