import { spendLearningPoints } from '../game/characterProgression.js'
import { cloneCharacterState } from '../game/characterState.js'
import { evaluateLessonRequirements } from './trainingRequirementSystem.js'
import { applyReward, gainAttribute, unlockCombatSkill, upgradeProficiency } from './trainingRewardSystem.js'
import { isLessonRevealed } from './lessonVisibilityService.js'
import { evaluateTrainerLimit } from './trainerProgression.js'

export function canTrain(character, lesson, trainer = null) {
  if (character.learnedLessonIds.includes(lesson.id)) return { met: false, requirements: [], blockers: [{ type: 'already_learned', required: 'Lesson already learned', current: 'Learned' }], code: 'LESSON_ALREADY_LEARNED' }
  if (!isLessonRevealed(character, lesson)) return { met: false, requirements: [], blockers: [{ type: 'hidden', required: 'Hidden lesson', current: 'Unknown' }], code: 'LESSON_HIDDEN' }
  if (lesson.mechanicImplemented === false) return { met: false, requirements: [], blockers: [{ type: 'mechanic', required: 'Mechanic not yet implemented', current: 'Future content' }], code: 'MECHANIC_NOT_IMPLEMENTED' }
  const base = evaluateLessonRequirements(character, lesson)
  const limit = trainer ? evaluateTrainerLimit(character, trainer, lesson) : { met: true }
  const blockers = [...base.blockers, ...(!limit.met ? [{ type: 'trainer_limit', met: false, required: 'This trainer cannot teach you beyond this level.', current: `${limit.current}`, reason: limit.reason }] : [])]
  const met = base.met && limit.met
  const personalQuestBlocked = blockers.some(({ type }) => type === 'personal_quest_completed')
  return { ...base, met, blockers, trainerLimit: limit, code: met ? null : (personalQuestBlocked ? 'PERSONAL_QUEST_INCOMPLETE' : 'REQUIREMENTS_NOT_MET') }
}

export function applyLesson(character, lesson, trainer = null, context = {}) {
  const validation = canTrain(character, lesson, trainer)
  if (!validation.met) return { ok: false, validation, rewards: [] }
  const before = cloneCharacterState(character)
  character.gold -= lesson.goldCost
  const payment = spendLearningPoints(character, lesson.learningPointCost)
  if (!payment.ok && lesson.learningPointCost > 0) { Object.assign(character, before); return { ok: false, validation, rewards: [], reason: 'lp-payment-failed' } }
  const rewardContext = { ...context, sourceType: context.sourceType ?? 'lesson', sourceId: context.sourceId ?? trainer?.id ?? lesson.id }
  const rewards = lesson.rewards.map((reward) => applyReward(character, reward, rewardContext))
  const succeeded = rewards.every((result) => result.ok)
  if (!succeeded) { Object.assign(character, before); return { ok: false, validation, rewards, reason: rewards.find((result) => !result.ok)?.reason } }
  character.learnedLessonIds.push(lesson.id)
  if (trainer?.teacherType?.includes('Mentor')) character.learningRecords.push({ skillId: lesson.rewards.find((reward) => reward.skillId)?.skillId ?? null, teacherId: trainer.id, locationId: context.locationId ?? trainer.locationId ?? null, learnedAtDay: context.day ?? null, learnedAtTimestamp: context.timestamp ?? null, lessonId: lesson.id })
  return { ok: true, validation, rewards, goldSpent: lesson.goldCost, learningPointsSpent: lesson.learningPointCost }
}

export function getTrainerCompletionState(character, trainer) {
  const visible = trainer.lessons.filter((lesson) => isLessonRevealed(character, lesson))
  const hidden = trainer.lessons.filter((lesson) => !isLessonRevealed(character, lesson))
  const evaluations = visible.map((lesson) => canTrain(character, lesson, trainer))
  return {
    availableLessons: evaluations.filter((result) => result.met).length,
    lockedLessons: evaluations.filter((result) => !result.met && result.trainerLimit?.met !== false).length,
    limitReachedLessons: evaluations.filter((result) => result.trainerLimit?.met === false).length,
    hiddenLessons: hidden.length,
    hasReferral: Boolean(trainer.nextTrainerHints?.length),
  }
}

export { gainAttribute, upgradeProficiency, unlockCombatSkill }
