import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateCharacterStats } from '../src/character/characterStatCalculator.js'
import { CombatManager } from '../src/combat/combatManager.js'
import { PROFICIENCY_NAMES } from '../src/data/characterCreation.js'
import { createCharacterState, restoreCharacterState } from '../src/game/characterState.js'
import { EquipmentManager, EQUIPMENT_EVENT } from '../src/equipment/equipmentManager.js'
import { ITEM_DATABASE } from '../src/items/itemDatabase.js'
import { createItemInstance } from '../src/items/itemInstance.js'

const hero = () => createCharacterState({ id: 'equipment-hero', name: 'Hero', proficiencies: Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, ['Camping', 'Swordsmanship'].includes(name) ? 'Novice' : 'Untrained'])), startingWeapon: { id: 'legacy', displayName: 'Legacy Weapon', requiredAttribute: 'strength', requiredAttributeValue: 1, requiredProficiency: 'Swordsmanship', baseDamage: 0, combatSkills: ['player_strike'] }, startingSkills: ['player_strike'] })

test('Equip validates slot and stores only ItemInstance references', () => {
  const character = hero(); const manager = new EquipmentManager(character); const club = createItemInstance('club')
  assert.equal(manager.canEquip(club, 'mainHand').ok, true)
  assert.equal(manager.canEquip(club, 'chest').code, 'ITEM_NOT_ALLOWED_IN_SLOT')
  assert.equal(manager.equip(club, 'mainHand').ok, true)
  assert.equal(character.equipment.mainHand.definitionId, 'club'); assert.equal(character.equipment.mainHand.instanceId, club.instanceId)
  assert.equal('finalStats' in character, false)
})

test('Requirements block Equip without mutating base stats or slot state', () => {
  const character = hero(); const manager = new EquipmentManager(character); const before = { ...character.stats }
  const result = manager.equip(createItemInstance('platemail_armor'), 'chest')
  assert.equal(result.code, 'ITEM_REQUIREMENTS_NOT_MET'); assert.equal(character.equipment.chest, null); assert.deepEqual(character.stats, before)
  character.stats.strength = 8
  assert.equal(manager.equip(createItemInstance('platemail_armor'), 'chest').ok, true)
})

test('Unequip returns the instance and clears its slot', () => {
  const character = hero(); const manager = new EquipmentManager(character)
  manager.equip(createItemInstance('club'), 'mainHand')
  const result = manager.unequip('mainHand')
  assert.equal(result.ok, true); assert.equal(result.item, ITEM_DATABASE.club); assert.equal(character.equipment.mainHand, null)
})

test('Swap moves compatible accessory instances between Ring slots', () => {
  const character = hero(); const manager = new EquipmentManager(character)
  manager.equip(createItemInstance('plain_ring'), 'ringLeft'); manager.equip(createItemInstance('warded_ring'), 'ringRight')
  assert.equal(manager.swap('ringLeft', 'ringRight').ok, true)
  assert.equal(character.equipment.ringLeft.definitionId, 'warded_ring'); assert.equal(character.equipment.ringRight.definitionId, 'plain_ring')
})

test('queries expose equipped items, weapon, armor and slot references', () => {
  const character = hero(); character.stats.strength = 8; const manager = new EquipmentManager(character)
  manager.equip(createItemInstance('club'), 'mainHand'); manager.equip(createItemInstance('platemail_armor'), 'chest')
  assert.equal(manager.getEquippedItems().length, 2); assert.equal(manager.getItemInSlot('mainHand').definitionId, 'club')
  assert.equal(manager.getEquippedWeapon().item.id, 'club'); assert.deepEqual(manager.getEquippedArmor().map(({ item }) => item.id), ['platemail_armor'])
})

test('EquipmentManager emits equipped, unequipped and changed events without knowing consumers', async () => {
  const character = hero(); const manager = new EquipmentManager(character); const events = []
  manager.on(EQUIPMENT_EVENT.ITEM_EQUIPPED, () => events.push('equipped')); manager.on(EQUIPMENT_EVENT.ITEM_UNEQUIPPED, () => events.push('unequipped')); manager.on(EQUIPMENT_EVENT.EQUIPMENT_CHANGED, () => events.push('changed'))
  manager.equip(createItemInstance('club'), 'mainHand'); manager.unequip('mainHand')
  assert.deepEqual(events, ['equipped', 'changed', 'unequipped', 'changed'])
  const source = await (await import('node:fs/promises')).readFile(new URL('../src/equipment/equipmentManager.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /CombatManager|HUD|MenuThree/)
})

test('CharacterStatCalculator dynamically sums Armor Rating, Resistances and effects', () => {
  const character = hero(); character.stats.strength = 8; const base = { ...character.stats }; const manager = new EquipmentManager(character)
  manager.equip(createItemInstance('platemail_armor'), 'chest'); manager.equip(createItemInstance('warded_ring'), 'ringLeft')
  const calculated = calculateCharacterStats(character)
  assert.equal(calculated.armorRating, 8); assert.equal(calculated.resistances.slashing, 5); assert.equal(calculated.resistances.magic, 2)
  assert.deepEqual(character.stats, base); assert.equal('finalStats' in character, false)
})

test('calculator exposes equipped weapon data and light-source effects', () => {
  const character = hero(); const manager = new EquipmentManager(character); manager.equip(createItemInstance('short_bow'), 'mainHand')
  const calculated = calculateCharacterStats(character)
  assert.equal(calculated.equippedWeapon.id, 'short_bow'); assert.equal(calculated.weaponCategory, 'Bow'); assert.equal(calculated.equippedWeapon.handsRequired, 2)
  assert.equal(calculated.activeLightSource, null)
})

test('Combat receives player stats, weapon and Armor Rating from CharacterStatCalculator', () => {
  const character = hero(); let calls = 0
  const statCalculator = () => { calls += 1; return { finalStats: { ...character.stats, defense: 9 }, maximumHealth: 21, armorRating: 7, resistances: { fire: 2 }, equippedWeapon: { ...character.startingWeapon }, equippedItems: [], equipmentEffects: [], weaponCategory: 'Sword', activeLightSource: null } }
  const manager = new CombatManager({ statCalculator }); const result = manager.startCombat({ character })
  assert.equal(result.ok, true); assert.equal(calls, 1); assert.equal(manager.activeCombat.player.stats.defense, 9); assert.equal(manager.activeCombat.player.armorRating, 7); assert.equal(manager.activeCombat.player.maxHealth, 21)
})

test('equipment ItemInstance references survive Character save cloning and loading', () => {
  const character = hero(); const manager = new EquipmentManager(character); manager.equip(createItemInstance('club'), 'mainHand')
  const loaded = restoreCharacterState(JSON.parse(JSON.stringify(character)), hero())
  assert.equal(loaded.equipment.mainHand.definitionId, 'club'); assert.equal(typeof loaded.equipment.mainHand.instanceId, 'string'); assert.equal('finalStats' in loaded, false)
})

test('Character UI and HUD render calculated data and equipment controls', async () => {
  const source = await (await import('node:fs/promises')).readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(source, /calculateCharacterStats\(characterState\)/); assert.match(source, /calculatedCharacter\.armorRating/)
  assert.match(source, /calculatedCharacter\.resistances/); assert.match(source, /Equip Selected/); assert.match(source, /unequipSlot/)
})
