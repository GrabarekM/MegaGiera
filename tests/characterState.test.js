import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCharacterCreation, changeAttribute, createCharacterDraft, toggleProficiency } from '../src/game/characterCreation.js'
import { cloneCharacterState, createCharacterState, isValidCharacterState, restoreCharacterState } from '../src/game/characterState.js'

function completeCreation() {
  const draft = createCharacterDraft()
  draft.name = 'Aldren'
  for (const stat of ['might', 'defense', 'vitality', 'agility']) {
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
  clone.stats.might = 5
  clone.proficiencies.Camping = 'Untrained'
  clone.startingSkills.push('future-skill')
  assert.notEqual(character.stats.might, clone.stats.might)
  assert.equal(character.proficiencies.Camping, 'Novice')
  assert.equal(character.startingSkills.includes('future-skill'), false)
  assert.deepEqual(restoreCharacterState(clone, character), clone)
})
