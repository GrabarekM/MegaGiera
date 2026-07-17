import assert from 'node:assert/strict'
import test from 'node:test'
import { PROFICIENCY_NAMES } from '../src/data/characterCreation.js'
import { MENTOR_LESSONS, MENTORS } from '../src/data/mentors.js'
import { TRAINERS } from '../src/data/trainers.js'
import { createCharacterState, restoreCharacterState } from '../src/game/characterState.js'
import { isLessonRevealed, revealEligibleLessons } from '../src/npc/lessonVisibilityService.js'
import { advanceMentorDiscovery, canOpenMentor, getMentorPresentation, MENTOR_DISCOVERY, PERSONAL_QUEST_STATE, setPersonalQuestState } from '../src/npc/mentorSystem.js'
import { applyLesson, canTrain } from '../src/npc/trainerSystem.js'
import { evaluateRequirement } from '../src/npc/trainingRequirementSystem.js'

const hero = () => createCharacterState({ id: 'mentor-hero', name: 'Hero', proficiencies: Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, ['Camping', 'Swordsmanship'].includes(name) ? 'Novice' : 'Untrained'])), startingSkills: ['player_strike'] })

test('Mentor is a data-driven teacher using the shared Lesson and Training services', () => {
  const mentor = MENTORS.sword_master
  assert.equal(mentor.teacherType, 'Mentor')
  assert.equal(typeof applyLesson, 'function')
  assert.equal(mentor.lessons.includes(MENTOR_LESSONS.disciplined_student), true)
  assert.equal(TRAINERS.city_mercenary.trainerChainId, mentor.trainerChainId)
})

test('discovery presentation is private, progressive and never regresses', () => {
  const character = hero(); const mentor = MENTORS.sword_master
  assert.equal(getMentorPresentation(character, mentor), null)
  assert.equal(canOpenMentor(character, mentor).code, 'MENTOR_NOT_DISCOVERED')
  advanceMentorDiscovery(character, mentor, MENTOR_DISCOVERY.RUMORED)
  const rumor = getMentorPresentation(character, mentor)
  assert.equal(rumor.canOpen, false); assert.equal('lessons' in rumor, false)
  advanceMentorDiscovery(character, mentor, MENTOR_DISCOVERY.DISCOVERED)
  assert.equal(getMentorPresentation(character, mentor).discoveryState, MENTOR_DISCOVERY.DISCOVERED)
  advanceMentorDiscovery(character, mentor, MENTOR_DISCOVERY.MET)
  assert.equal(canOpenMentor(character, mentor).ok, true)
  assert.equal(advanceMentorDiscovery(character, mentor, MENTOR_DISCOVERY.RUMORED).code, 'DISCOVERY_STATE_CANNOT_REGRESS')
})

test('first meeting creates one journal entry and records the mentor', () => {
  const character = hero(); const mentor = MENTORS.sword_master
  advanceMentorDiscovery(character, mentor, MENTOR_DISCOVERY.MET)
  advanceMentorDiscovery(character, mentor, MENTOR_DISCOVERY.MET)
  assert.deepEqual(character.metMentorIds, [mentor.id])
  assert.equal(character.mentorJournalEntries.length, 1)
  assert.equal(character.mentorJournalEntries[0].specializations.includes('Swordsmanship'), true)
})

test('personal quest independently blocks and permanently reveals a hidden lesson', () => {
  const character = hero(); const mentor = MENTORS.sword_master; const hidden = MENTOR_LESSONS.whirlwind
  advanceMentorDiscovery(character, mentor, MENTOR_DISCOVERY.MET)
  assert.equal(isLessonRevealed(character, hidden), false)
  assert.equal(evaluateRequirement(character, hidden.requirements[0]).met, false)
  setPersonalQuestState(character, mentor, PERSONAL_QUEST_STATE.COMPLETED)
  assert.deepEqual(revealEligibleLessons(character, [mentor]).map(({ id }) => id), [hidden.id])
  setPersonalQuestState(character, mentor, PERSONAL_QUEST_STATE.AVAILABLE)
  assert.equal(isLessonRevealed(character, hidden), true)
  assert.equal(canTrain(character, hidden, mentor).met, false)
})

test('unsupported integrations return a controlled notYetIntegrated requirement', () => {
  const result = evaluateRequirement(hero(), { type: 'inventory_item', itemId: 'future_item' })
  assert.equal(result.met, false); assert.equal(result.status, 'notYetIntegrated')
})

test('mentor rewards persist passive skills, specializations and learning records', () => {
  const character = hero(); const mentor = MENTORS.sword_master
  character.level = 2; character.gold = 100; character.learningPoints = 10; character.flags.mentor_test_access = true
  assert.equal(applyLesson(character, MENTOR_LESSONS.disciplined_student, mentor, { day: 3, locationId: 'tower' }).ok, true)
  assert.equal(applyLesson(character, MENTOR_LESSONS.blade_disciple, mentor, { day: 3 }).ok, true)
  assert.deepEqual(character.passiveSkills, ['disciplined_student'])
  assert.deepEqual(character.specializations, ['blade_disciple'])
  assert.deepEqual(character.learningRecords.map(({ teacherId, lessonId }) => ({ teacherId, lessonId })), [{ teacherId: mentor.id, lessonId: 'mentor_disciplined_student' }, { teacherId: mentor.id, lessonId: 'mentor_blade_disciple' }])
  assert.equal(character.learningRecords[0].locationId, 'tower')
})

test('a unique combat skill unlocks once and cannot be purchased twice', () => {
  const character = hero(); character.gold = 50; character.learningPoints = 5
  const lesson = { id: 'unique_test', lessonType: 'unique_combat_skill', visibilityState: 'Known', requirements: [], rewards: [{ type: 'unlock_combat_skill', skillId: 'unique_test_skill' }], goldCost: 5, learningPointCost: 1, mechanicImplemented: true }
  assert.equal(applyLesson(character, lesson, MENTORS.sword_master).ok, true)
  const second = applyLesson(character, lesson, MENTORS.sword_master)
  assert.equal(second.ok, false); assert.equal(second.validation.code, 'LESSON_ALREADY_LEARNED')
})

test('future mechanics are blocked and failed rewards never spend Gold or LP', () => {
  const character = hero(); character.gold = 200; character.learningPoints = 20
  assert.equal(canTrain(character, MENTOR_LESSONS.whirlwind, MENTORS.sword_master).code, 'LESSON_HIDDEN')
  character.revealedLessonIds.push(MENTOR_LESSONS.whirlwind.id)
  assert.equal(canTrain(character, MENTOR_LESSONS.whirlwind, MENTORS.sword_master).code, 'MECHANIC_NOT_IMPLEMENTED')
  const before = [character.gold, character.learningPoints, character.lifetimeLearningPointsSpent]
  const invalid = { id: 'bad_reward', visibilityState: 'Known', requirements: [], rewards: [{ type: 'future_reward' }], goldCost: 20, learningPointCost: 2 }
  assert.equal(applyLesson(character, invalid, MENTORS.sword_master).ok, false)
  assert.deepEqual([character.gold, character.learningPoints, character.lifetimeLearningPointsSpent], before)
})

test('mentor save fields restore and legacy saves receive safe defaults', () => {
  const character = hero(); advanceMentorDiscovery(character, MENTORS.sword_master, MENTOR_DISCOVERY.MET); character.specializations.push('blade_disciple')
  const restored = restoreCharacterState(JSON.parse(JSON.stringify(character)), hero())
  assert.equal(restored.mentorProgress.sword_master.discoveryState, MENTOR_DISCOVERY.MET); assert.deepEqual(restored.specializations, ['blade_disciple'])
  const legacy = { ...character }; delete legacy.mentorProgress; delete legacy.metMentorIds; delete legacy.specializations; delete legacy.passiveSkills; delete legacy.learningRecords; delete legacy.mentorJournalEntries
  const migrated = restoreCharacterState(legacy, hero())
  assert.deepEqual(migrated.mentorProgress, {}); assert.deepEqual(migrated.learningRecords, [])
})

test('shared UI distinguishes mentors, hidden lessons, quests and developer commands', async () => {
  const { readFile } = await import('node:fs/promises')
  const screen = await readFile(new URL('../src/components/TrainerScreen.vue', import.meta.url), 'utf8')
  const menu = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(screen, /trainer-screen--mentor/); assert.match(screen, /Personal Quest/); assert.match(screen, /Mechanic not yet implemented/); assert.match(screen, /Unknown Lesson/)
  assert.match(menu, /Reveal Sword Master Rumor/); assert.match(menu, /Complete Personal Quest/); assert.match(menu, /Mentors Met/); assert.match(menu, /Learning History/)
})
