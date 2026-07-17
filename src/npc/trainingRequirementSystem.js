import { PROFICIENCY_RANKS } from '../data/characterCreation.js'
import { hasKnowledge } from '../game/knowledgeService.js'

const rankIndex = (rank) => PROFICIENCY_RANKS.indexOf(rank)
const formatStat = (value) => value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())

const evaluators = Object.freeze({
  character_level: (character, requirement) => ({ met: character.level >= requirement.minimum, required: `Level ${requirement.minimum}`, current: `Level ${character.level}` }),
  learning_points: (character, requirement) => ({ met: character.learningPoints >= requirement.minimum, required: `${requirement.minimum} Learning Points`, current: `${character.learningPoints} Learning Points` }),
  gold: (character, requirement) => ({ met: character.gold >= requirement.minimum, required: `${requirement.minimum} Gold`, current: `${character.gold} Gold` }),
  attribute: (character, requirement) => {
    const value = character.stats[requirement.attribute] ?? 0
    const minimumMet = requirement.minimum === undefined || value >= requirement.minimum
    const maximumMet = requirement.maximum === undefined || value <= requirement.maximum
    return { met: minimumMet && maximumMet, required: `${formatStat(requirement.attribute)} ${requirement.minimum ?? `at most ${requirement.maximum}`}`, current: `${formatStat(requirement.attribute)} ${value}` }
  },
  proficiency_rank: (character, requirement) => {
    const currentRank = character.proficiencies[requirement.proficiency] ?? 'Untrained'
    const minimumMet = requirement.minimumRank === undefined || rankIndex(currentRank) >= rankIndex(requirement.minimumRank)
    const maximumMet = requirement.maximumRank === undefined || rankIndex(currentRank) < rankIndex(requirement.maximumRank)
    return { met: minimumMet && maximumMet, required: `${requirement.proficiency}: ${requirement.minimumRank ?? `below ${requirement.maximumRank}`}`, current: `${requirement.proficiency}: ${currentRank}` }
  },
  combat_skill: (character, requirement) => {
    const known = character.startingSkills.includes(requirement.skillId)
    return { met: known === requirement.known, required: `${requirement.known ? 'Know' : 'Do not know'} ${requirement.skillId}`, current: known ? 'Known' : 'Not known' }
  },
  character_flag: (character, requirement) => ({ met: character.flags?.[requirement.flag] === (requirement.value ?? true), required: `Flag: ${requirement.flag}`, current: String(character.flags?.[requirement.flag] ?? false) }),
  previous_lesson: (character, requirement) => ({ met: character.learnedLessonIds.includes(requirement.lessonId), required: `Lesson: ${requirement.lessonId}`, current: character.learnedLessonIds.includes(requirement.lessonId) ? 'Learned' : 'Not learned' }),
  personal_quest_completed: (character, requirement) => ({ met: character.mentorProgress?.[requirement.mentorId]?.personalQuestState === 'completed', required: 'Personal Quest Completed', current: character.mentorProgress?.[requirement.mentorId]?.personalQuestState ?? 'unavailable' }),
  knowledge: (character, requirement) => {
    const ids = requirement.knowledgeIds ?? [requirement.knowledgeId]
    const discovered = ids.filter((id) => hasKnowledge(character, id))
    const met = requirement.match === 'any' ? discovered.length > 0 : discovered.length === ids.length
    return { met, required: 'Required Knowledge', current: met ? 'Discovered' : `${discovered.length}/${ids.length} discovered`, knowledgeIds: ids }
  },
})

export function evaluateRequirement(character, requirement) {
  const evaluator = evaluators[requirement.type]
  return evaluator ? { type: requirement.type, status: 'supported', ...evaluator(character, requirement) } : { type: requirement.type, met: false, status: 'notYetIntegrated', required: `Not yet integrated: ${requirement.type}`, current: 'Unavailable' }
}

export function evaluateLessonRequirements(character, lesson) {
  const requirements = [
    ...lesson.requirements,
    { type: 'learning_points', minimum: lesson.learningPointCost },
    { type: 'gold', minimum: lesson.goldCost },
  ].map((requirement) => evaluateRequirement(character, requirement))
  return { met: requirements.every((result) => result.met), requirements, blockers: requirements.filter((result) => !result.met) }
}
