import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import { createCharacterState, cloneCharacterState, restoreCharacterState } from '../src/game/characterState.js'
import { InventoryManager } from '../src/inventory/inventoryManager.js'
import { createItemInstance } from '../src/items/itemInstance.js'
import { BookService, BOOK_MESSAGE } from '../src/books/bookService.js'
import { ItemUseService } from '../src/items/itemUseService.js'

const setup = (definitionId = 'basic_archery_manual') => {
  const character = createCharacterState({ id: 'book-hero', name: 'Reader', startingWeapon: { id: 'test', combatSkills: [] } })
  const inventory = new InventoryManager(character)
  const item = createItemInstance(definitionId, { instanceId: `test-${definitionId}` })
  inventory.add(item)
  const books = new BookService({ character, inventoryManager: inventory })
  const uses = new ItemUseService({ character, inventoryManager: inventory, wardwoodService: null, bookService: books })
  return { character, inventory, item, books, use: () => uses.useItem(character.id, item.instanceId, { time: { day: 1, hour: 6 }, isCombatActive: false }) }
}

test('Inventory routes a Skill Manual through ItemUseService and consumes it after applying Base Skill gain', () => { const { character, use } = setup(); assert.equal(use().ok, true); assert.equal(character.proficiencySkills.Archery.baseValue, 1); assert.equal(character.inventory.length, 0) })
test('Book Quality applies fractional manual gains', () => { const poor = setup('poor_basic_archery_manual'); poor.use(); assert.equal(poor.character.proficiencySkills.Archery.baseValue, 0.5); const excellent = setup('excellent_basic_archery_manual'); excellent.use(); assert.equal(excellent.character.proficiencySkills.Archery.baseValue, 1.5) })
test('Manual tier and Current Rank Cap block use without consuming the item', () => { const tier = setup('journeyman_archery_manual'); assert.equal(tier.use().code, 'MANUAL_TIER_INVALID'); assert.equal(tier.character.inventory.length, 1); const cap = setup(); cap.character.proficiencySkills.Archery.baseValue = 9; assert.equal(cap.use().code, 'CURRENT_RANK_CAP_REACHED'); assert.equal(cap.character.inventory.length, 1) })
test('Knowledge Book becomes Known, persists in Inventory and cannot grant twice', () => { const context = setup('history_of_the_old_kingdom'); assert.equal(context.use().code, 'BOOK_USED'); assert.deepEqual(context.character.discoveredKnowledge, ['old_kingdom_history']); assert.equal(context.character.inventory[0].state.known, true); assert.equal(context.use().code, 'BOOK_ALREADY_STUDIED'); assert.equal(context.character.inventory.length, 1); const restored = restoreCharacterState(JSON.parse(JSON.stringify(cloneCharacterState(context.character))), context.character); assert.equal(restored.inventory[0].state.known, true) })
test('Knowledge Scroll grants Knowledge once and is consumed', () => { const context = setup('old_kingdom_knowledge_scroll'); assert.equal(context.use().ok, true); assert.equal(context.character.inventory.length, 0); assert.deepEqual(context.character.discoveredKnowledge, ['old_kingdom_history']) })
test('Master Treatise and Legendary Tome raise only Maximum Cap', () => { const treatise = setup('archery_master_treatise'); treatise.character.proficiencies.Archery = 'Grandmaster'; treatise.character.proficiencySkills.Archery = { baseValue: 100, currentRank: 'Grandmaster', currentRankCap: 100, maximumCap: 100 }; assert.equal(treatise.use().ok, true); assert.equal(treatise.character.proficiencySkills.Archery.baseValue, 100); assert.equal(treatise.character.proficiencySkills.Archery.maximumCap, 105); const tome = setup('legendary_archery_tome'); tome.character.proficiencySkills.Archery.maximumCap = 105; assert.equal(tome.use().ok, true); assert.equal(tome.character.proficiencySkills.Archery.maximumCap, 110) })
test('Book requirements produce the standard message and preserve inventory', () => { const context = setup(); const definition = { bookData: { kind: 'skill_manual', affectedSkill: 'Archery', minimumBaseSkill: 0, maximumBaseSkill: 20, skillGain: 1, requirements: [{ type: 'wisdom', minimum: 5 }] }, quality: 'Normal' }; const response = context.books.useBook(context.item, definition, {}); assert.equal(response.messages[0], BOOK_MESSAGE.CANNOT_UNDERSTAND); assert.equal(context.character.inventory.length, 1) })
test('Map and Ritual scroll placeholders are safe and are not consumed', () => { for (const id of ['meadows_map_scroll', 'ritual_scroll_placeholder']) { const context = setup(id); assert.equal(context.use().code, 'BOOK_EFFECT_NOT_IMPLEMENTED'); assert.equal(context.character.inventory.length, 1) } })
test('Inventory UI exposes Use rather than a reading modal for Books and Scrolls', () => { const source = fs.readFileSync(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8'); assert.doesNotMatch(source, /readInventoryItem/); assert.match(source, /useInventoryItem\(entry\)/) })
