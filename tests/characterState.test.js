import assert from 'node:assert/strict'
import test from 'node:test'
import { cloneCharacterState, createCharacterState, isValidCharacterState, restoreCharacterState } from '../src/game/characterState.js'

const character = createCharacterState({ id: 'character-test', name: 'Hero', characterClass: 'warrior' })

test('creates a complete character state with identity and progression defaults', () => {
  assert.equal(character.id, 'character-test')
  assert.equal(character.name, 'Hero')
  assert.equal(character.class, 'warrior')
  assert.equal(character.level, 1)
  assert.equal(character.experience, 0)
  assert.equal(isValidCharacterState(character), true)
})

test('new character starts with 18 current and maximum HP and zero gold', () => {
  assert.deepEqual(character.health, { current: 18, max: 18 })
  assert.equal(character.gold, 0)
})

test('all four base stats start at exactly three', () => {
  assert.deepEqual(character.stats, { might: 3, agility: 3, wits: 3, will: 3 })
})

test('inventory, statuses, flags and equipment slots start empty', () => {
  assert.deepEqual(character.inventory, [])
  assert.deepEqual(character.statuses, [])
  assert.deepEqual(character.flags, {})
  assert.deepEqual(character.equipment, { weapon: null, armor: null, accessory: null })
})

test('cloning and restoring character state does not share mutable collections', () => {
  const clone = cloneCharacterState(character)
  clone.inventory.push('future-item')
  clone.flags.changed = true
  assert.deepEqual(character.inventory, [])
  assert.deepEqual(character.flags, {})
  assert.deepEqual(restoreCharacterState(clone, character), clone)
})
