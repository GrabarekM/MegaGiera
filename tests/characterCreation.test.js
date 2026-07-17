import assert from 'node:assert/strict'
import test from 'node:test'
import { ATTRIBUTE_DEFINITIONS, EQUIPMENT_SLOTS, PROFICIENCY_NAMES } from '../src/data/characterCreation.js'
import { ATTRIBUTE_POINTS, buildCharacterCreation, canStartRun, changeAttribute, createCharacterDraft, getPointsRemaining, toggleProficiency } from '../src/game/characterCreation.js'

test('all eight attributes start at one with eight points remaining', () => {
  const draft = createCharacterDraft()
  assert.equal(ATTRIBUTE_DEFINITIONS.length, 8)
  assert.ok(Object.values(draft.attributes).every((value) => value === 1))
  assert.equal(getPointsRemaining(draft.attributes), ATTRIBUTE_POINTS)
})

test('attributes cannot exceed five, fall below one or overspend points', () => {
  const draft = createCharacterDraft()
  for (let index = 0; index < 10; index += 1) changeAttribute(draft, 'strength', 1)
  assert.equal(draft.attributes.strength, 5)
  for (let index = 0; index < 10; index += 1) changeAttribute(draft, 'strength', -1)
  assert.equal(draft.attributes.strength, 1)
  for (const id of ['strength', 'defense']) for (let index = 0; index < 4; index += 1) changeAttribute(draft, id, 1)
  assert.equal(getPointsRemaining(draft.attributes), 0)
  assert.equal(changeAttribute(draft, 'vitality', 1), false)
})

test('exactly two proficiencies can be promoted to Novice', () => {
  const draft = createCharacterDraft()
  assert.equal(toggleProficiency(draft, PROFICIENCY_NAMES[0]), true)
  assert.equal(toggleProficiency(draft, PROFICIENCY_NAMES[1]), true)
  assert.equal(toggleProficiency(draft, PROFICIENCY_NAMES[2]), false)
  assert.equal(draft.noviceProficiencies.length, 2)
})

test('Start Run stays blocked while attribute points remain', () => {
  const draft = createCharacterDraft()
  draft.name = 'Lyra'; draft.startingWeaponId = 'rusty_dagger'
  toggleProficiency(draft, 'Fencing'); toggleProficiency(draft, 'Scouting')
  assert.equal(canStartRun(draft), false)
  assert.throws(() => buildCharacterCreation(draft), /incomplete/)
})

test('completed creation stores weapon, skills, ranks and empty equipment', () => {
  const draft = createCharacterDraft()
  draft.name = 'Lyra'; draft.startingWeaponId = 'rusty_dagger'
  for (const id of ['strength', 'defense']) for (let index = 0; index < 4; index += 1) changeAttribute(draft, id, 1)
  toggleProficiency(draft, 'Fencing'); toggleProficiency(draft, 'Scouting')
  const creation = buildCharacterCreation(draft)
  assert.equal(canStartRun(draft), true)
  assert.equal(creation.startingWeapon.id, 'rusty_dagger')
  assert.deepEqual(creation.startingSkills, ['player_quick_strike', 'player_strike'])
  assert.equal(creation.proficiencies.Fencing, 'Novice')
  assert.equal(creation.proficiencies.Alchemy, 'Untrained')
  assert.equal(Object.keys(creation.equipment).length, EQUIPMENT_SLOTS.length)
  assert.ok(Object.values(creation.equipment).every((slot) => slot === null))
})

test('Character Creation UI contains required sections and no class selection', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/views/MenuTwo.vue', import.meta.url), 'utf8')
  assert.match(source, /Character Name/)
  assert.match(source, /Points Remaining/)
  assert.match(source, /Proficiencies/)
  assert.match(source, /Starting Weapon/)
  assert.match(source, /Equipment Preview/)
  assert.match(source, /Character Summary/)
  assert.doesNotMatch(source, /Choose your class|characterClasses|Warrior|Mage|Scout/)
})
