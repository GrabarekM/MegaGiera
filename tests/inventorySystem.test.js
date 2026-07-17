import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import { createCharacterState, cloneCharacterState, restoreCharacterState } from '../src/game/characterState.js'
import { PROFICIENCY_NAMES } from '../src/data/characterCreation.js'
import { createItemInstance } from '../src/items/itemInstance.js'
import { InventoryManager, INVENTORY_FILTER, INVENTORY_SORT } from '../src/inventory/inventoryManager.js'
import { createLootReward, createLootRewardEntry, LOOT_REWARD_TYPE, takeLootReward } from '../src/inventory/lootReward.js'

const hero = () => createCharacterState({ id: 'inventory-hero', name: 'Hero', proficiencies: Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, ['Camping', 'Swordsmanship'].includes(name) ? 'Novice' : 'Untrained'])), startingWeapon: { id: 'test', combatSkills: [] } })

test('Inventory adds and removes ItemInstances while Gold remains outside Inventory', () => {
  const character = hero(); const inventory = new InventoryManager(character)
  const sword = createItemInstance('rusty_sword')
  assert.equal(inventory.add(sword).ok, true)
  assert.equal(character.inventory[0].definitionId, 'rusty_sword')
  assert.equal(character.inventory.some((item) => item.definitionId === 'gold'), false)
  assert.equal(inventory.remove(sword.instanceId).ok, true)
  assert.equal(character.inventory.length, 0)
})

test('stackable items respect ItemDefinition Stack Size and equipment does not stack', () => {
  const character = hero(); const inventory = new InventoryManager(character)
  inventory.add(createItemInstance('wardwood', { quantity: 130 }))
  assert.deepEqual(character.inventory.map(({ quantity }) => quantity), [100, 30])
  inventory.add(createItemInstance('rusty_sword', { quantity: 2 }))
  assert.equal(character.inventory.filter(({ definitionId }) => definitionId === 'rusty_sword').length, 2)
})

test('search, filters and sorting operate on resolved ItemDefinitions', () => {
  const character = hero(); const inventory = new InventoryManager(character)
  inventory.add(createItemInstance('club', { acquiredAt: '2026-01-01T00:00:00Z' }))
  inventory.add(createItemInstance('warded_ring', { acquiredAt: '2026-01-02T00:00:00Z' }))
  inventory.add(createItemInstance('silver_cup', { acquiredAt: '2026-01-03T00:00:00Z' }))
  assert.deepEqual(inventory.query({ search: 'ring' }).map((entry) => entry.definition.id), ['warded_ring'])
  assert.deepEqual(inventory.query({ filter: INVENTORY_FILTER.ACCESSORIES }).map((entry) => entry.definition.id), ['warded_ring'])
  assert.equal(inventory.query({ sort: INVENTORY_SORT.NAME })[0].definition.displayName, 'Club')
  assert.equal(inventory.query({ sort: INVENTORY_SORT.GOLD_VALUE })[0].definition.id, 'silver_cup')
  assert.equal(inventory.query({ sort: INVENTORY_SORT.NEWEST })[0].definition.id, 'silver_cup')
})

test('Favorite can be toggled and protects an item from Destroy', () => {
  const character = hero(); const inventory = new InventoryManager(character); const item = createItemInstance('club')
  inventory.add(item); inventory.setFavorite(item.instanceId, true)
  assert.equal(character.inventory[0].favorite, true)
  assert.equal(inventory.destroy(item.instanceId).code, 'FAVORITE_ITEM_PROTECTED')
  inventory.setFavorite(item.instanceId, false)
  assert.equal(inventory.destroy(item.instanceId).ok, true)
})

test('Quest Items cannot be destroyed', () => {
  const character = hero(); const inventory = new InventoryManager(character); const item = createItemInstance('sealed_contract')
  inventory.add(item)
  assert.equal(inventory.destroy(item.instanceId).code, 'QUEST_ITEM_PROTECTED')
  assert.equal(character.inventory.length, 1)
})

test('LootReward transfers ItemInstances and Gold directly to Character', () => {
  const character = hero(); const inventory = new InventoryManager(character)
  const reward = createLootReward({ sourceName: 'Wolf defeated', itemInstances: [createItemInstance('wolf_hide'), createItemInstance('raw_meat', { quantity: 2 })], gold: 12, learningPoints: 5 })
  const result = takeLootReward(reward, character, inventory)
  assert.equal(result.ok, true); assert.equal(character.gold, 12); assert.equal(character.inventory.length, 2)
  assert.equal(character.learningPoints, 0)
})

test('LootReward model supports future typed rewards without applying their effects', () => {
  const character = hero(); const inventory = new InventoryManager(character)
  const futureTypes = [LOOT_REWARD_TYPE.LEARNING_POINTS, LOOT_REWARD_TYPE.KNOWLEDGE, LOOT_REWARD_TYPE.COMBAT_SKILL, LOOT_REWARD_TYPE.PASSIVE_SKILL, LOOT_REWARD_TYPE.SPECIALIZATION, LOOT_REWARD_TYPE.QUEST_REWARD, LOOT_REWARD_TYPE.REPUTATION, LOOT_REWARD_TYPE.TITLE, LOOT_REWARD_TYPE.UNLOCK]
  const entries = futureTypes.map((type) => createLootRewardEntry({ type, displayName: `Future ${type}`, description: 'Reserved for a future resolver.', quantity: 2, source: 'test', rarity: 'placeholder', payload: { id: type } }))
  const reward = createLootReward({ sourceName: 'Universal Reward', entries })
  const result = takeLootReward(reward, character, inventory)
  assert.equal(reward.entries.length, futureTypes.length)
  assert.equal(result.deferredCount, futureTypes.length)
  assert.equal(character.gold, 0); assert.equal(character.learningPoints, 0); assert.equal(character.inventory.length, 0)
  assert.equal(Object.isFrozen(reward.entries), true)
})

test('Character save cloning and restore preserve ItemInstance stack and Favorite state', () => {
  const character = hero(); const inventory = new InventoryManager(character)
  inventory.add(createItemInstance('wardwood', { quantity: 5, favorite: true, instanceId: 'saved-stack' }))
  const saved = JSON.parse(JSON.stringify(cloneCharacterState(character)))
  const restored = restoreCharacterState(saved, hero())
  assert.deepEqual(restored.inventory.map(({ definitionId, quantity, favorite, instanceId }) => ({ definitionId, quantity, favorite, instanceId })), [{ definitionId: 'wardwood', quantity: 5, favorite: true, instanceId: 'saved-stack' }])
})

test('Inventory UI exposes filters, search, sorting, context actions, Inspect and Loot Rewards', () => {
  const source = fs.readFileSync(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  for (const text of ['Inventory', 'Search', 'Filter', 'Sort', 'Favorite', 'Inspect', 'Destroy', 'Loot Rewards', 'Take All']) assert.match(source, new RegExp(text))
  assert.doesNotMatch(source, />Drop</)
})
