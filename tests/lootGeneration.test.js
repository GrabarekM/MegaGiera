import assert from 'node:assert/strict'
import test from 'node:test'
import { defineLootDefinition, LOOT_SOURCE_TYPE } from '../src/loot/lootDefinition.js'
import { applyRegionLootModifier, generateLoot } from '../src/loot/lootGenerator.js'
import { LOOT_DEFINITIONS, REGION_LOOT_MODIFIERS } from '../src/data/lootDefinitions.js'
import { ENEMY_TEMPLATES } from '../src/data/enemyTemplates.js'
import { createCharacterState } from '../src/game/characterState.js'
import { PROFICIENCY_NAMES } from '../src/data/characterCreation.js'
import { InventoryManager } from '../src/inventory/inventoryManager.js'
import { claimLootReward, leaveLootReward, LOOT_REWARD_TYPE, takeLootReward } from '../src/inventory/lootReward.js'
import { acquireWardwood, createWardwoodMerchantState, DEAD_WARDWOOD_RESOURCE, refreshWardwoodMerchantStock, WARDWOOD_MERCHANT_STOCK } from '../src/world/wardwoodEconomy.js'
import { getItemDefinition } from '../src/items/itemDatabase.js'

const hero = () => createCharacterState({ id: 'loot-hero', name: 'Hero', proficiencies: Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, ['Camping', 'Swordsmanship'].includes(name) ? 'Novice' : 'Untrained'])), startingWeapon: { id: 'test', combatSkills: [] } })

test('LootDefinition validates source type and freezes Loot Bundles', () => {
  const definition = defineLootDefinition({ id: 'test_loot', sourceType: LOOT_SOURCE_TYPE.ENEMY, bundles: [{ id: 'resource', chance: 20, choices: [{ type: 'item', itemId: 'raw_meat' }] }], modifierHooks: ['luck'] })
  assert.equal(definition.bundles[0].chance, 20); assert.equal(Object.isFrozen(definition.bundles), true); assert.deepEqual(definition.modifierHooks, ['luck'])
})

test('enemy may leave no loot and Enemy Templates reference central definitions', () => {
  const reward = generateLoot(LOOT_DEFINITIONS.grey_wolf_loot, { random: () => 0.99 })
  assert.equal(reward.entries.length, 0)
  assert.equal(ENEMY_TEMPLATES.grey_wolf.lootDefinitionId, 'grey_wolf_loot')
})

test('Loot Bundles select logical content and Region Modifier changes bundle chance', () => {
  const definition = defineLootDefinition({ id: 'region_test', sourceType: LOOT_SOURCE_TYPE.POI, bundles: [{ id: 'resources', chance: 80, choices: [{ type: 'item', itemId: 'wolf_hide' }] }] })
  assert.equal(generateLoot(definition, { random: () => 0.9 }).entries.length, 0)
  const modified = applyRegionLootModifier(definition, { bundleMultipliers: { resources: 2 } })
  assert.equal(modified.bundles[0].chance, 100)
  assert.equal(generateLoot(definition, { regionModifier: { bundleMultipliers: { resources: 2 } }, random: () => 0.9 }).entries[0].displayName, 'Wolf Hide')
})

test('Boss Rewards contain guaranteed item and Gold bundles', () => {
  const reward = generateLoot(LOOT_DEFINITIONS.meadows_boss_loot, { sourceName: 'Boss defeated', random: () => 0 })
  assert.deepEqual(reward.entries.map(({ type }) => type), [LOOT_REWARD_TYPE.ITEM_INSTANCE, LOOT_REWARD_TYPE.GOLD])
})

test('Loot Rewards support Take All, Take Selected and Leave', () => {
  const reward = generateLoot(LOOT_DEFINITIONS.meadows_boss_loot, { random: () => 0 })
  const first = hero(); const firstInventory = new InventoryManager(first)
  assert.equal(claimLootReward(reward, [0], first, firstInventory).ok, true); assert.equal(first.inventory.length, 1); assert.equal(first.gold, 0)
  const second = hero(); assert.equal(takeLootReward(reward, second, new InventoryManager(second)).ok, true); assert.equal(second.inventory.length, 1); assert.ok(second.gold > 0)
  const third = hero(); assert.equal(leaveLootReward(reward).claimed, false); assert.equal(third.inventory.length, 0); assert.equal(third.gold, 0)
})

test('Wardwood is finite per source, persists in CharacterState and is not time-refreshed', () => {
  const character = hero(); assert.equal(acquireWardwood(character, 2, 'ancient-oak-1').ok, true); assert.equal(acquireWardwood(character, 2, 'ancient-oak-1').code, 'SOURCE_DEPLETED')
  const saved = JSON.parse(JSON.stringify(character)); assert.equal(saved.wardwood, 2); assert.deepEqual(saved.flags.wardwoodSourcesCollected, ['ancient-oak-1'])
})

test('Merchant Wardwood stock refreshes only through a unique world Event', () => {
  const merchant = createWardwoodMerchantState(0); assert.equal(merchant.wardwoodStock, 0); assert.equal(WARDWOOD_MERCHANT_STOCK.refreshPolicy, 'world_event')
  assert.equal(refreshWardwoodMerchantStock(merchant, { type: 'time_passed', id: 'day-2' }).ok, false)
  assert.equal(refreshWardwoodMerchantStock(merchant, { type: 'wardwood_supply_restored', id: 'supply-event-1' }).ok, true)
  assert.equal(merchant.wardwoodStock, 3); assert.equal(refreshWardwoodMerchantStock(merchant, { type: 'wardwood_supply_restored', id: 'supply-event-1' }).ok, false)
})

test('Dead Wardwood has separate data and cannot protect against demons', () => {
  assert.equal(DEAD_WARDWOOD_RESOURCE.protectsFromDemons, false); assert.equal(DEAD_WARDWOOD_RESOURCE.decayImplemented, false)
  assert.equal(getItemDefinition('dead_wardwood').displayName, 'Dead Wardwood')
  assert.notEqual(getItemDefinition('dead_wardwood').id, getItemDefinition('wardwood').id)
})
