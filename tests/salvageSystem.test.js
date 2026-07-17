import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import { PROFICIENCY_NAMES } from '../src/data/characterCreation.js'
import { createCharacterState, cloneCharacterState, restoreCharacterState } from '../src/game/characterState.js'
import { EquipmentManager } from '../src/equipment/equipmentManager.js'
import { InventoryManager } from '../src/inventory/inventoryManager.js'
import { claimLootReward, leaveLootReward, takeLootReward } from '../src/inventory/lootReward.js'
import { ITEM_DATABASE, defineItem } from '../src/items/itemDatabase.js'
import { createItemInstance } from '../src/items/itemInstance.js'
import { ITEM_QUALITY, ITEM_TYPE } from '../src/items/itemConstants.js'
import { defineSalvage, SALVAGE_DEFINITIONS } from '../src/salvage/salvageDefinitions.js'
import { QUALITY_SALVAGE_MODIFIERS, SALVAGE_RESULT } from '../src/salvage/salvageConstants.js'
import { createSalvageRandomSource, isPotentiallySalvageable, SalvageService } from '../src/salvage/salvageService.js'

const hero = () => createCharacterState({ id: 'salvage-hero', name: 'Hero', proficiencies: Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, 'Untrained'])), startingWeapon: { id: 'test', combatSkills: [] } })
const sequence = (...values) => { let index = 0; return () => values[Math.min(index++, values.length - 1)] }
const setup = (definitionId = 'rusty_sword', options = {}, randomSource = sequence(0, 0.99, 0, 0.99)) => { const character = hero(); const inventory = new InventoryManager(character); const instance = createItemInstance(definitionId, options); inventory.add(instance); return { character, inventory, instance, service: new SalvageService({ character, inventoryManager: inventory, randomSource, getWorldTime: () => ({ day: 3, hour: 14 }) }) } }

test('SalvageDefinition is immutable, data-driven and items opt into it', () => {
  assert.equal(ITEM_DATABASE.rusty_sword.salvageDefinitionId, 'metal_weapon'); assert.equal(ITEM_DATABASE.rusty_sword.salvageable, true)
  assert.equal(Object.isFrozen(SALVAGE_DEFINITIONS.metal_weapon.materialEntries), true)
  assert.equal(isPotentiallySalvageable(ITEM_DATABASE.leather_armor), true); assert.equal(isPotentiallySalvageable(ITEM_DATABASE.wooden_shield), true)
})

test('Weapon, Armor and Shield with definitions are salvageable; Accessory defaults to false', () => {
  for (const id of ['rusty_sword', 'leather_armor', 'wooden_shield']) { const context = setup(id); assert.equal(context.service.preview(context.instance.instanceId).ok, true) }
  assert.equal(ITEM_DATABASE.plain_ring.salvageable, false); assert.equal(isPotentiallySalvageable(ITEM_DATABASE.plain_ring), false)
})

test('items without a definition and forbidden types are controlled failures', () => {
  for (const [id, code] of [['club', SALVAGE_RESULT.ITEM_NOT_SALVAGEABLE], ['bandage', SALVAGE_RESULT.ITEM_NOT_SALVAGEABLE], ['metal_scrap', SALVAGE_RESULT.ITEM_NOT_SALVAGEABLE], ['basic_archery_manual', SALVAGE_RESULT.ITEM_NOT_SALVAGEABLE], ['archery_skill_scroll', SALVAGE_RESULT.ITEM_NOT_SALVAGEABLE], ['wardwood', SALVAGE_RESULT.ITEM_NOT_SALVAGEABLE], ['dead_wardwood', SALVAGE_RESULT.ITEM_NOT_SALVAGEABLE], ['sealed_contract', SALVAGE_RESULT.QUEST_ITEM], ['holy_lantern', SALVAGE_RESULT.KEY_ITEM]]) {
    const context = setup(id); assert.equal(context.service.preview(context.instance.instanceId).code, code)
  }
})

test('Favorite, Protected and equipped items are blocked by SalvageService', () => {
  let context = setup('rusty_sword', { favorite: true }); assert.equal(context.service.preview(context.instance.instanceId).code, SALVAGE_RESULT.ITEM_FAVORITE)
  context = setup('rusty_sword', { state: { protected: true } }); assert.equal(context.service.preview(context.instance.instanceId).code, SALVAGE_RESULT.ITEM_PROTECTED)
  context = setup('rusty_sword'); context.character.equipment.mainHand = context.instance
  const blocked = context.service.preview(context.instance.instanceId); assert.equal(blocked.code, SALVAGE_RESULT.ITEM_EQUIPPED); assert.match(blocked.message, /Unequip/)
  context.character.equipment.mainHand = null; assert.equal(context.service.preview(context.instance.instanceId).ok, true)
})

test('Preview exposes possible materials and quality without removing the source', () => {
  const context = setup(); const before = context.character.inventory.length; const preview = context.service.preview(context.instance.instanceId)
  assert.equal(preview.ok, true); assert.equal(preview.possibleMaterials[0].materialItemDefinitionId, 'metal_scrap'); assert.equal(preview.quality, ITEM_QUALITY.POOR)
  assert.equal(context.character.inventory.length, before); assert.equal(context.inventory.find(context.instance.instanceId).instanceId, context.instance.instanceId)
})

test('execution removes source and creates a Loot Reward rather than directly granting materials', () => {
  const context = setup(); const result = context.service.execute(context.instance.instanceId)
  assert.equal(result.ok, true); assert.equal(result.code, SALVAGE_RESULT.SUCCESS); assert.equal(context.inventory.find(context.instance.instanceId), null)
  assert.equal(result.generatedMaterials[0].definitionId, 'metal_scrap'); assert.equal(context.character.inventory.some(({ definitionId }) => definitionId === 'metal_scrap'), false)
  assert.equal(result.reward.sourceName, 'Salvage Results')
})

test('empty salvage is valid, destroys source and returns a readable result', () => {
  const context = setup('wooden_staff', {}, sequence(0.99, 0.99)); const result = context.service.execute(context.instance.instanceId)
  assert.equal(result.ok, true); assert.equal(result.code, SALVAGE_RESULT.EMPTY_RESULT); assert.equal(result.empty, true); assert.equal(result.reward.entries.length, 0)
  assert.match(result.message, /Nothing usable/); assert.equal(context.inventory.find(context.instance.instanceId), null)
})

test('Quality modifiers produce integer ranges and Masterwork exceeds Broken', () => {
  const low = setup('rusty_sword', { state: { quality: ITEM_QUALITY.BROKEN } }); const high = setup('rusty_sword', { state: { quality: ITEM_QUALITY.MASTERWORK } })
  const lowPreview = low.service.preview(low.instance.instanceId); const highPreview = high.service.preview(high.instance.instanceId)
  assert.equal(Number.isInteger(lowPreview.possibleMaterials[0].maximumQuantity), true); assert.equal(Number.isInteger(highPreview.possibleMaterials[0].maximumQuantity), true)
  assert.ok(highPreview.possibleMaterials[0].maximumQuantity > lowPreview.possibleMaterials[0].maximumQuantity)
  assert.equal(QUALITY_SALVAGE_MODIFIERS.Masterwork.quantityMultiplier, 1.5)
})

test('mixed Studded Armor can generate Leather and Metal from one definition', () => {
  const context = setup('studded_armor', {}, sequence(0, 0.99, 0, 0.99)); const result = context.service.execute(context.instance.instanceId)
  assert.deepEqual(result.generatedMaterials.map(({ definitionId }) => definitionId), ['leather_scrap', 'metal_scrap'])
})

test('Take All, Take Selected and Leave reuse Loot Rewards semantics', () => {
  let context = setup('studded_armor', {}, sequence(0, 0.99, 0, 0.99)); let result = context.service.execute(context.instance.instanceId)
  takeLootReward(result.reward, context.character, context.inventory); assert.equal(context.character.inventory.some(({ definitionId }) => definitionId === 'leather_scrap'), true); assert.equal(context.character.inventory.some(({ definitionId }) => definitionId === 'metal_scrap'), true)
  context = setup('studded_armor', {}, sequence(0, 0.99, 0, 0.99)); result = context.service.execute(context.instance.instanceId)
  claimLootReward(result.reward, [0], context.character, context.inventory); assert.equal(context.character.inventory.some(({ definitionId }) => definitionId === 'leather_scrap'), true); assert.equal(context.character.inventory.some(({ definitionId }) => definitionId === 'metal_scrap'), false)
  context = setup(); result = context.service.execute(context.instance.instanceId); leaveLootReward(result.reward); assert.equal(context.character.inventory.some(({ definitionId }) => definitionId === 'metal_scrap'), false)
})

test('salvage materials stack through the existing InventoryManager', () => {
  const context = setup(); context.inventory.add(createItemInstance('metal_scrap', { quantity: 4, instanceId: 'existing-scrap' })); const result = context.service.execute(context.instance.instanceId); takeLootReward(result.reward, context.character, context.inventory)
  const stacks = context.character.inventory.filter(({ definitionId }) => definitionId === 'metal_scrap'); assert.equal(stacks.length, 1); assert.ok(stacks[0].quantity > 4)
})

test('controlled seeded RNG is repeatable and SalvageRecord stores debug facts', () => {
  const first = setup('rusty_sword', {}, createSalvageRandomSource(42)); const second = setup('rusty_sword', {}, createSalvageRandomSource(42))
  const a = first.service.execute(first.instance.instanceId); const b = second.service.execute(second.instance.instanceId)
  assert.deepEqual(a.generatedMaterials.map(({ definitionId, quantity }) => ({ definitionId, quantity })), b.generatedMaterials.map(({ definitionId, quantity }) => ({ definitionId, quantity })))
  assert.equal(a.record.sourceItemDefinitionId, 'rusty_sword'); assert.equal(a.record.sourceQuality, ITEM_QUALITY.POOR); assert.equal(a.record.worldDay, 3); assert.equal(a.record.worldTime, 14); assert.equal(a.record.generatedMaterials.length, a.generatedMaterials.length)
})

test('invalid IDs and bad RNG return controlled errors', () => {
  const context = setup(); assert.equal(context.service.execute('missing').code, SALVAGE_RESULT.ITEM_NOT_FOUND)
  context.service.randomSource = () => Number.NaN; assert.equal(context.service.execute(context.instance.instanceId).code, SALVAGE_RESULT.FAILED); assert.notEqual(context.inventory.find(context.instance.instanceId), null)
})

test('a newly injected SalvageDefinition requires no SalvageService modification', () => {
  const custom = defineSalvage({ id: 'custom_test', displayName: 'Custom', materialEntries: [{ materialItemDefinitionId: 'wood_scrap', minimumQuantity: 1, maximumQuantity: 1, chance: 1, optionalRequiredTags: [], optionalBlockedTags: [] }] })
  const customItem = defineItem({ id: 'custom_item', displayName: 'Custom Item', itemType: ITEM_TYPE.ACCESSORY, salvageDefinitionId: 'custom_test', salvageable: true })
  const character = hero(); const inventory = new InventoryManager(character)
  const instance = Object.freeze({ instanceId: 'custom-instance', definitionId: customItem.id, quantity: 1, favorite: false, state: Object.freeze({}) })
  character.inventory.push(instance)
  const service = new SalvageService({ character, inventoryManager: inventory, definitions: { custom_test: custom }, itemResolver: (id) => id === customItem.id ? customItem : ITEM_DATABASE[id] })
  assert.equal(service.getDefinition('custom_test'), custom); assert.equal(service.preview(instance.instanceId).ok, true)
})

test('recovered materials survive Character save and restore', () => {
  const context = setup(); const result = context.service.execute(context.instance.instanceId); takeLootReward(result.reward, context.character, context.inventory)
  const restored = restoreCharacterState(JSON.parse(JSON.stringify(cloneCharacterState(context.character))), hero())
  assert.deepEqual(restored.inventory.filter(({ definitionId }) => definitionId === 'metal_scrap').map(({ quantity }) => quantity), context.character.inventory.filter(({ definitionId }) => definitionId === 'metal_scrap').map(({ quantity }) => quantity))
})

test('Inventory UI presents Salvage preview, confirmation, Loot Rewards and developer controls', () => {
  const source = fs.readFileSync(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  for (const text of ['Salvage Preview', 'Possible Materials', 'This item will be permanently destroyed', 'Take Selected', 'Take All', 'Give Rusty Sword', 'Force Empty Salvage', 'Show Quality Modifier']) assert.match(source, new RegExp(text))
  assert.doesNotMatch(source, /merchantService\.salvage/)
})
