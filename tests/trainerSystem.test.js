import assert from 'node:assert/strict'
import test from 'node:test'
import { PROFICIENCY_NAMES } from '../src/data/characterCreation.js'
import { LESSONS, TRAINER_LIST, TRAINERS } from '../src/data/trainers.js'
import { gainLearningPoints } from '../src/game/characterProgression.js'
import { createCharacterState } from '../src/game/characterState.js'
import { applyLesson, canTrain } from '../src/npc/trainerSystem.js'
import { evaluateRequirement } from '../src/npc/trainingRequirementSystem.js'
import { gainAttribute, unlockCombatSkill, upgradeProficiency } from '../src/npc/trainingRewardSystem.js'

function character() {
  const proficiencies = Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, ['Camping', 'Fencing'].includes(name) ? 'Novice' : 'Untrained']))
  return createCharacterState({ id: 'trainer-hero', name: 'Hero', attributes: { strength: 2, magicPower: 2 }, proficiencies, startingSkills: ['player_strike'] })
}

test('all trainer types are data entities and expose lesson lists', () => {
  assert.deepEqual(TRAINER_LIST.slice(0, 8).map(({ trainerType }) => trainerType), ['Farmer', 'Hunter', 'Mercenary', 'Knight', 'Mage', 'Scholar', 'Priest', 'Blacksmith'])
  assert.ok(TRAINERS.farmer_trainer.lessons.includes(LESSONS.farmer_strength))
})

test('Requirement System validates level, gold and Learning Points', () => {
  const hero = character(); hero.gold = 12; hero.learningPoints = 3
  assert.equal(evaluateRequirement(hero, { type: 'character_level', minimum: 2 }).met, false)
  assert.equal(evaluateRequirement(hero, { type: 'gold', minimum: 10 }).met, true)
  assert.equal(evaluateRequirement(hero, { type: 'learning_points', minimum: 5 }).met, false)
})

test('Requirement System validates attributes, proficiency ranks and combat skills', () => {
  const hero = character()
  assert.equal(evaluateRequirement(hero, { type: 'attribute', attribute: 'strength', minimum: 2 }).met, true)
  assert.equal(evaluateRequirement(hero, { type: 'proficiency_rank', proficiency: 'Fencing', minimumRank: 'Novice' }).met, true)
  assert.equal(evaluateRequirement(hero, { type: 'combat_skill', skillId: 'player_strike', known: true }).met, true)
  assert.equal(evaluateRequirement(hero, { type: 'combat_skill', skillId: 'player_guard', known: true }).met, false)
})

test('Reward System increases attributes, upgrades proficiency and unlocks combat skill', () => {
  const hero = character()
  assert.equal(gainAttribute(hero, 'strength', 1).value, 3)
  assert.equal(upgradeProficiency(hero, 'Scouting').rank, 'Novice')
  assert.equal(unlockCombatSkill(hero, 'player_guard').ok, true)
  assert.ok(hero.startingSkills.includes('player_guard'))
})

test('ApplyLesson atomically spends costs and updates CharacterState', () => {
  const hero = character(); hero.gold = 20; gainLearningPoints(hero, 5)
  const beforeSpent = hero.lifetimeLearningPointsSpent
  const result = applyLesson(hero, LESSONS.farmer_strength)
  assert.equal(result.ok, true)
  assert.equal(hero.stats.strength, 3)
  assert.equal(hero.gold, 10)
  assert.equal(hero.learningPoints, 3)
  assert.equal(hero.lifetimeLearningPointsSpent, beforeSpent + 2)
})

test('CanTrain and ApplyLesson expose visible blockers without spending resources', () => {
  const hero = character()
  const validation = canTrain(hero, LESSONS.farmer_strength)
  assert.equal(validation.met, false)
  assert.ok(validation.blockers.some(({ type }) => type === 'gold'))
  assert.equal(applyLesson(hero, LESSONS.farmer_strength).ok, false)
  assert.equal(hero.stats.strength, 2)
})

test('Training UI uses one lesson card design and refreshes reactive Character bindings', async () => {
  const { readFile } = await import('node:fs/promises')
  const trainer = await readFile(new URL('../src/components/TrainerScreen.vue', import.meta.url), 'utf8')
  const menu = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(trainer, /v-for="card in section.cards"/)
  assert.match(trainer, /Blocked:/)
  assert.match(trainer, /:disabled="!card\.validation\.met"/)
  assert.match(menu, /applyLesson\(characterState, lesson, activeTrainer\.value,/)
  assert.match(menu, /characterState\.learningPoints/)
  assert.match(menu, /calculatedCharacter\.finalStats\[attribute\.id\]/)
})

test('Developer Panel exposes trainers, Gold, LP and Level Up controls', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  for (const label of ['Open Farmer', 'Open Hunter', 'Open Mercenary', 'Open Mage', 'Open Blacksmith', 'Give 100 Gold', 'Learning Points: +5', 'Character: Level Up']) assert.ok(source.includes(label))
})
