import assert from 'node:assert/strict'
import test from 'node:test'
import { PROFICIENCY_NAMES } from '../src/data/characterCreation.js'
import { LESSONS, TRAINERS } from '../src/data/trainers.js'
import { createCharacterState, restoreCharacterState } from '../src/game/characterState.js'
import { revealAllLessons, revealEligibleLessons } from '../src/npc/lessonVisibilityService.js'
import { applyLesson, canTrain, getTrainerCompletionState } from '../src/npc/trainerSystem.js'
import { evaluateTrainerLimit, TRAINER_TIER } from '../src/npc/trainerProgression.js'

const hero = () => createCharacterState({ id: 'tier-hero', name: 'Hero', proficiencies: Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, ['Camping', 'Fencing'].includes(name) ? 'Novice' : 'Untrained'])), startingSkills: ['player_strike'] })

test('Trainer Tier and specific proficiency limits cap teaching', () => {
  const character = hero(); character.proficiencies.Archery = 'Apprentice'
  assert.equal(TRAINERS.village_hunter.trainerTier, TRAINER_TIER.APPRENTICE)
  assert.equal(evaluateTrainerLimit(character, TRAINERS.village_hunter, LESSONS.hunter_archery).met, false)
  character.proficiencies['Animal Lore'] = 'Novice'
  assert.equal(evaluateTrainerLimit(character, TRAINERS.village_hunter, LESSONS.hunter_animal_lore).met, false)
})

test('attribute limit blocks training without taking Gold or LP', () => {
  const character = hero(); character.stats.agility = 4; character.gold = 100; character.learningPoints = 10
  const before = { gold: character.gold, lp: character.learningPoints }
  assert.equal(applyLesson(character, LESSONS.hunter_agility, TRAINERS.village_hunter).ok, false)
  assert.deepEqual({ gold: character.gold, lp: character.learningPoints }, before)
})

test('Known and Hidden lessons expose separate visibility and training states', () => {
  const character = hero(); const hidden = LESSONS.hunter_archery_apprentice
  assert.equal(TRAINERS.village_hunter.lessons.includes(LESSONS.hunter_agility), true)
  assert.equal(character.revealedLessonIds.includes(hidden.id), false)
  character.level = 2; character.stats.agility = 3; character.proficiencies.Archery = 'Novice'
  assert.deepEqual(revealEligibleLessons(character, [TRAINERS.village_hunter]).map(({ id }) => id), [hidden.id])
  character.level = 1
  assert.equal(character.revealedLessonIds.includes(hidden.id), true)
  assert.equal(canTrain(character, hidden, TRAINERS.village_hunter).met, false)
  assert.equal(revealEligibleLessons(character, [TRAINERS.village_hunter]).length, 0)
})

test('revealed lessons restore safely and legacy state defaults to empty', () => {
  const fallback = hero(); const saved = { ...fallback, revealedLessonIds: ['hunter_archery_apprentice'] }
  assert.deepEqual(restoreCharacterState(saved, fallback).revealedLessonIds, ['hunter_archery_apprentice'])
  delete saved.revealedLessonIds
  assert.deepEqual(restoreCharacterState(saved, fallback).revealedLessonIds, [])
})

test('developer reveal requires explicit developer mode', () => {
  const character = hero()
  assert.equal(revealAllLessons(character, [TRAINERS.village_hunter]).ok, false)
  assert.equal(revealAllLessons(character, [TRAINERS.village_hunter], { developer: true }).ok, true)
})

test('completion state distinguishes available, locked, hidden, limits and referrals', () => {
  const character = hero(); character.gold = 100; character.learningPoints = 10
  const state = getTrainerCompletionState(character, TRAINERS.village_hunter)
  assert.ok(state.availableLessons > 0)
  assert.ok(state.hiddenLessons > 0)
  assert.equal(state.hasReferral, true)
})

test('Training UI separates lesson types, hidden placeholders, tier and chain hint', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/components/TrainerScreen.vue', import.meta.url), 'utf8')
  assert.match(source, /lessonSections/); assert.match(source, /Hidden Lessons/); assert.match(source, /Unknown Lesson/)
  assert.match(source, /trainer\.trainerTier/); assert.match(source, /trainer\.nextTrainerHints/)
})
