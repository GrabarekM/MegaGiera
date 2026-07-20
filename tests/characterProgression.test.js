import assert from 'node:assert/strict'
import test from 'node:test'
import { createRandomCharacterCreation } from '../src/game/characterCreation.js'
import { canSpendLearningPoints, gainExperience, gainLearningPoints, LEARNING_POINTS_PER_LEVEL, spendLearningPoints } from '../src/game/characterProgression.js'
import { cloneCharacterState, createCharacterState } from '../src/game/characterState.js'

const createProgressionCharacter = () => createCharacterState({ id: 'progression-hero', name: 'Hero' })

test('level up grants exactly five current and lifetime Learning Points', () => {
  const character = createProgressionCharacter()
  const result = gainExperience(character, character.requiredExperience)
  assert.equal(LEARNING_POINTS_PER_LEVEL, 5)
  assert.equal(character.level, 2)
  assert.equal(character.learningPoints, 5)
  assert.equal(character.lifetimeLearningPointsEarned, 5)
  assert.equal(character.lifetimeLearningPointsSpent, 0)
  assert.deepEqual(result.levelUps[0], { level: 2, learningPointsGained: 5, currentLearningPoints: 5 })
})

test('GainLearningPoints updates current and lifetime values', () => {
  const character = createProgressionCharacter()
  gainLearningPoints(character, 10)
  assert.equal(character.learningPoints, 10)
  assert.equal(character.lifetimeLearningPointsEarned, 10)
})

test('SpendLearningPoints and CanSpendLearningPoints are ready for Trainer systems', () => {
  const character = createProgressionCharacter()
  gainLearningPoints(character, 5)
  assert.equal(canSpendLearningPoints(character, 6), false)
  assert.equal(spendLearningPoints(character, 6).ok, false)
  assert.equal(spendLearningPoints(character, 3).ok, true)
  assert.equal(character.learningPoints, 2)
  assert.equal(character.lifetimeLearningPointsSpent, 3)
})

test('Learning Point progression persists in cloned CharacterState', () => {
  const character = createProgressionCharacter()
  gainLearningPoints(character, 5)
  assert.deepEqual(cloneCharacterState(character), character)
})

test('Quick Start creates a complete randomized character configuration', () => {
  const creation = createRandomCharacterCreation(() => 0)
  assert.ok(creation.name)
  assert.equal(Object.values(creation.attributes).reduce((sum, value) => sum + value, 0), 16)
  assert.equal(Object.values(creation.proficiencies).filter((rank) => rank === 'Novice').length, 2)
  assert.ok(creation.startingWeapon)
  assert.ok(creation.startingSkills.length > 0)
})

test('HUD, Character Sheet, popup and Debug Panel expose LP progression', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(source, /LP <strong>\{\{ characterState\.learningPoints \}\}/)
  assert.match(source, /Lifetime LP Earned/)
  assert.match(source, /Lifetime LP Spent/)
  assert.match(source, /Level Up!/)
  assert.match(source, /Learning Points: \+1/)
  assert.match(source, /Character: Level Up/)
})

test('Main Menu provides Quick Start through the shared run creation flow', async () => {
  const { readFile } = await import('node:fs/promises')
  const menu = await readFile(new URL('../src/views/MainMenu.vue', import.meta.url), 'utf8')
  const app = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
  assert.match(menu, /label="New Game"/)
  assert.match(menu, /label="Quick Start \(DEV\)"/)
  assert.match(menu, /:disabled="busy \|\| !saveInfo"/)
  assert.match(app, /createRunForCharacter\(createRandomCharacterCreation\(\)\)/)
  assert.match(app, /@back="returnToMainMenu"/)
})
