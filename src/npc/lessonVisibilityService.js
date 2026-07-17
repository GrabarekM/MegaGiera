import { LESSON_VISIBILITY } from './trainerProgression.js'
import { evaluateRequirement } from './trainingRequirementSystem.js'

export function isLessonRevealed(character, lesson) {
  if (lesson.visibilityState !== LESSON_VISIBILITY.HIDDEN) return true
  return character.revealedLessonIds.includes(lesson.id)
}

export function revealEligibleLessons(character, trainers) {
  const discovered = []
  for (const trainer of trainers) for (const lesson of trainer.lessons) {
    if (lesson.visibilityState !== LESSON_VISIBILITY.HIDDEN || isLessonRevealed(character, lesson)) continue
    if ((lesson.visibilityRequirements ?? []).every((requirement) => evaluateRequirement(character, requirement).met)) {
      character.revealedLessonIds.push(lesson.id); discovered.push(lesson)
    }
  }
  return discovered
}

export function revealAllLessons(character, trainers, { developer = false } = {}) {
  if (!developer) return { ok: false, revealed: [] }
  const revealed = []
  for (const trainer of trainers) for (const lesson of trainer.lessons) if (!character.revealedLessonIds.includes(lesson.id)) { character.revealedLessonIds.push(lesson.id); revealed.push(lesson.id) }
  return { ok: true, revealed }
}

export function resetRevealedLessons(character) { character.revealedLessonIds = [] }
