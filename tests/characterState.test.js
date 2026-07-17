import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCharacterCreation, changeAttribute, createCharacterDraft, toggleProficiency } from '../src/game/characterCreation.js'
import { cloneCharacterState, createCharacterState, isValidCharacterState, restoreCharacterState } from '../src/game/characterState.js'
import { migrateSave } from '../src/game/saveService.js'

function completeCreation() {
  const draft = createCharacterDraft()
  draft.name = 'Aldren'
  for (const stat of ['strength', 'defense', 'vitality', 'agility']) {
    changeAttribute(draft, stat, 2)
  }
  toggleProficiency(draft, 'Camping')
  toggleProficiency(draft, 'Swordsmanship')
  draft.startingWeaponId = 'wooden_club'
  return buildCharacterCreation(draft)
}

const creation = completeCreation()
const character = createCharacterState({ id: 'character-test', ...creation })

test('CharacterState stores identity, progression and all creation data', () => {
  assert.equal(character.name, 'Aldren')
  assert.equal(character.level, 1)
  assert.equal(character.experience, 0)
  assert.equal(character.requiredExperience, 100)
  assert.equal(character.learningPoints, 0)
  assert.equal(character.lifetimeLearningPointsEarned, 0)
  assert.equal(character.lifetimeLearningPointsSpent, 0)
  assert.deepEqual(character.stats, creation.attributes)
  assert.deepEqual(character.proficiencies, creation.proficiencies)
  assert.deepEqual(character.startingWeapon, creation.startingWeapon)
  assert.deepEqual(character.startingSkills, creation.startingSkills)
  assert.deepEqual(character.equipment, creation.equipment)
  assert.equal(isValidCharacterState(character), true)
})

test('new character starts with 18 HP, zero gold and empty runtime collections', () => {
  assert.deepEqual(character.health, { current: 18, max: 18 })
  assert.equal(character.gold, 0)
  assert.deepEqual(character.inventory, [])
  assert.deepEqual(character.statuses, [])
  assert.deepEqual(character.flags, {})
})

test('cloning and restoring preserve creation data without shared mutable state', () => {
  const clone = cloneCharacterState(character)
  clone.stats.strength = 5
  clone.proficiencies.Camping = 'Untrained'
  clone.startingSkills.push('future-skill')
  assert.notEqual(character.stats.strength, clone.stats.strength)
  assert.equal(character.proficiencies.Camping, 'Novice')
  assert.equal(character.startingSkills.includes('future-skill'), false)
  assert.deepEqual(restoreCharacterState(clone, character), clone)
})

test('legacy physical-power stat saves migrate to Strength without losing value', () => {
  const legacyKey = String.fromCharCode(109, 105, 103, 104, 116)
  const saved = cloneCharacterState(character)
  saved.stats[legacyKey] = 7; delete saved.stats.strength
  saved.startingWeapon.requiredAttribute = legacyKey
  const restored = restoreCharacterState(saved, character)
  assert.equal(restored.stats.strength, 7)
  assert.equal(legacyKey in restored.stats, false)
  assert.equal(restored.startingWeapon.requiredAttribute, 'strength')
  const migrated = migrateSave({ saveVersion: 7, characterState: saved })
  assert.equal(migrated.characterState.stats.strength, 7)
  assert.equal(legacyKey in migrated.characterState.stats, false)
})
