import assert from 'node:assert/strict'
import test from 'node:test'
import { EQUIPMENT_SLOTS, PROFICIENCY_NAMES } from '../src/data/characterCreation.js'
import { createCharacterState } from '../src/game/characterState.js'
import { ARMOR_CATEGORY, ITEM_QUALITY, ITEM_TYPE, RESISTANCE_KEYS, WEAPON_CATEGORY } from '../src/items/itemConstants.js'
import { ITEM_DATABASE, ITEM_LIST, defineItem, getItemDefinition, getItemsByType } from '../src/items/itemDatabase.js'
import { createItemInstance, resolveItemInstance } from '../src/items/itemInstance.js'
import { canEquipItem, evaluateItemRequirements } from '../src/items/itemRequirementService.js'
import { createItemTooltipModel } from '../src/items/itemTooltip.js'

const hero = () => createCharacterState({ id: 'item-hero', name: 'Hero', proficiencies: Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, ['Camping', 'Swordsmanship'].includes(name) ? 'Novice' : 'Untrained'])), startingWeapon: { id: 'test', combatSkills: [] }, startingSkills: [] })

test('Item Database loads immutable data-driven ItemDefinitions', () => {
  assert.equal(ITEM_LIST.length, 54)
  assert.equal(getItemDefinition('rusty_sword'), ITEM_DATABASE.rusty_sword)
  assert.equal(getItemsByType(ITEM_TYPE.ARMOR).length, 10)
  assert.equal(Object.isFrozen(ITEM_DATABASE.rusty_sword), true)
  assert.equal(getItemDefinition('missing'), null)
})

test('ItemInstance stores only a definition reference and resolves it', () => {
  const instance = createItemInstance('club')
  assert.equal(instance.definitionId, 'club')
  assert.equal(instance.quantity, 1)
  assert.equal(instance.favorite, false)
  assert.equal(resolveItemInstance(instance), ITEM_DATABASE.club)
  assert.equal(createItemInstance('missing').code, 'ITEM_DEFINITION_NOT_FOUND')
})

test('Weapon and Armor requirements use only Strength and ignore combat effectiveness systems', () => {
  const character = hero()
  assert.equal(evaluateItemRequirements(character, ITEM_DATABASE.platemail_armor).met, false)
  character.stats.defense = 10; character.stats.agility = 10; character.stats.magicPower = 10; character.stats.wisdom = 10; character.stats.perception = 10; character.stats.luck = 10
  character.proficiencies.Archery = 'Grandmaster'; character.startingSkills.push('future_skill')
  assert.equal(evaluateItemRequirements(character, ITEM_DATABASE.platemail_armor).met, false)
  character.stats.strength = 8
  assert.equal(canEquipItem(character, ITEM_DATABASE.platemail_armor).met, true)
  character.stats.strength = 1; character.proficiencies.Archery = 'Untrained'; character.startingSkills = []
  assert.equal(canEquipItem(character, ITEM_DATABASE.short_bow).met, true)
  for (const item of ITEM_LIST.filter(({ itemType }) => [ITEM_TYPE.WEAPON, ITEM_TYPE.ARMOR].includes(itemType))) assert.equal(item.requirements.every(({ type, attribute }) => type === 'attribute' && attribute === 'strength'), true)
  assert.throws(() => defineItem({ id: 'invalid_weapon', displayName: 'Invalid', itemType: ITEM_TYPE.WEAPON, requirements: [{ type: 'proficiency_rank', proficiency: 'Archery', minimumRank: 'Novice' }] }), /only define a Strength requirement/)
})

test('Armor definitions preserve armor, HP and all resistance data', () => {
  const armor = ITEM_DATABASE.platemail_armor
  assert.equal(armor.category, ARMOR_CATEGORY.PLATEMAIL)
  assert.equal(armor.armorStats.armorRating, 8); assert.equal(armor.armorStats.maximumHpBonus, 0)
  for (const resistance of RESISTANCE_KEYS) assert.equal(Number.isFinite(armor.armorStats.resistances[resistance]), true)
  assert.equal(armor.armorStats.resistances.slashing, 5)
})

test('Weapon definitions preserve every weapon stat', () => {
  const weapon = ITEM_DATABASE.short_bow
  assert.equal(weapon.category, WEAPON_CATEGORY.BOW)
  assert.deepEqual(weapon.weaponStats, { baseDamage: 3, damageType: 'Piercing', attackRange: 6, attackSpeed: 0.9, weaponCategory: 'Bow', handsRequired: 2 })
})

test('Quality, stack size, value, tags and placeholder icon are data', () => {
  assert.equal(ITEM_DATABASE.rusty_sword.quality, ITEM_QUALITY.POOR)
  assert.equal(ITEM_DATABASE.wardwood.stackSize, 100)
  assert.equal(ITEM_DATABASE.torch.stackSize, 20)
  assert.equal(ITEM_DATABASE.club.stackSize, 1)
  assert.equal(ITEM_DATABASE.platemail_armor.value, 96)
  assert.equal(typeof ITEM_DATABASE.bone_armor.iconId, 'string')
})

test('shared tooltip model renders definition data without item-specific logic', () => {
  const model = createItemTooltipModel(ITEM_DATABASE.platemail_armor)
  assert.equal(model.name, 'Platemail Armor'); assert.equal(model.itemType, 'Armor'); assert.equal(model.category, 'Platemail Armor')
  assert.equal(model.quality, 'Normal'); assert.equal(model.value, 96)
  assert.deepEqual(model.requirements, ['Strength 8']); assert.equal(model.armorRating, 8); assert.equal(model.resistances.slashing, 5); assert.deepEqual(model.effects, [])
})

test('equipment slots include hands and exclude Belt', () => {
  const ids = EQUIPMENT_SLOTS.map(({ id }) => id)
  assert.equal(ids.includes('mainHand'), true); assert.equal(ids.includes('offHand'), true)
  assert.equal(ids.includes('belt'), false); assert.equal(ids.filter((id) => id.startsWith('ring')).length, 2)
})

test('Item UI exposes database, placeholder icons and shared tooltip', async () => {
  const { readFile } = await import('node:fs/promises')
  const menu = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  const tooltip = await readFile(new URL('../src/components/ItemTooltip.vue', import.meta.url), 'utf8')
  assert.match(menu, /Item Database Preview/); assert.match(menu, /v-for="item in ITEM_LIST"/); assert.match(menu, /<ItemTooltip/)
  for (const label of ['Requirements', 'Effects', 'Value', 'Armor Rating', 'Resistances']) assert.match(tooltip, new RegExp(label))
  assert.match(tooltip, /data-icon-id="model\.iconId"/)
})
