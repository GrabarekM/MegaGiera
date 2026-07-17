import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterState, restoreCharacterState } from '../src/game/characterState.js'
import { InventoryManager } from '../src/inventory/inventoryManager.js'
import { createItemInstance } from '../src/items/itemInstance.js'
import { CraftingService } from '../src/crafting/craftingService.js'
import { RecipeUnlockService } from '../src/crafting/recipeUnlockService.js'
import { getRecipe, RECIPE_LIST, validateRecipeDatabase } from '../src/crafting/recipeDatabase.js'
import { RECIPE_CATEGORY, STATION_TYPE } from '../src/crafting/craftingConstants.js'
import { PROFICIENCY_NAMES } from '../src/data/characterCreation.js'
import { REWARD_TYPE } from '../src/rewards/rewardDefinitions.js'
import { RewardService } from '../src/rewards/rewardService.js'

const hero = () => createCharacterState({ id: 'crafter', name: 'Crafter', proficiencies: Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, ['Camping', 'Cooking'].includes(name) ? 'Novice' : 'Untrained'])), startingWeapon: { id: 'test', combatSkills: [] } })
const setup = () => { const character = hero(); const inventory = new InventoryManager(character); const recipes = new RecipeUnlockService(character); return { character, inventory, recipes, crafting: new CraftingService({ character, inventoryManager: inventory, recipeUnlockService: recipes, getWorldTime: () => ({ day: 4, hour: 18 }) }) } }
const add = (inventory, id, quantity) => inventory.add(createItemInstance(id, { quantity }))

test('recipe database is valid, data-driven and contains no Carpentry or ammunition', () => {
  assert.equal(validateRecipeDatabase().valid, true)
  assert.ok(RECIPE_LIST.every((recipe) => Object.values(RECIPE_CATEGORY).includes(recipe.category)))
  assert.ok(RECIPE_LIST.every((recipe) => !/carpentry|arrow|bolt|quiver/i.test(JSON.stringify(recipe))))
})

test('new characters know defaults, hidden recipe unlock is idempotent and survives restore', () => {
  const { character, recipes } = setup()
  assert.equal(recipes.isKnown('craft_bandage'), true)
  assert.equal(recipes.isKnown('simple_soup'), false)
  assert.equal(recipes.unlock('simple_soup', { sourceType: 'book', sourceId: 'journal' }).code, 'RECIPE_UNLOCKED')
  assert.equal(recipes.unlock('simple_soup').code, 'RECIPE_ALREADY_KNOWN')
  assert.equal(restoreCharacterState(JSON.parse(JSON.stringify(character)), hero()).recipeState.knownRecipeIds.includes('simple_soup'), true)
})

test('RewardService UnlockRecipe uses central recipe state', () => {
  const { character, inventory, recipes } = setup()
  const result = new RewardService({ character, inventoryManager: inventory, recipeUnlockService: recipes }).apply({ type: REWARD_TYPE.GRANT_RECIPE, recipeId: 'simple_soup' }, { sourceType: 'scroll' })
  assert.equal(result.ok, true)
  assert.equal(recipes.isKnown('simple_soup'), true)
})

test('preview enforces station and ingredients and calculates maximum batch', () => {
  const { inventory, crafting } = setup(); add(inventory, 'raw_meat', 7)
  assert.equal(crafting.preview('cook_meat', 1, { stationType: STATION_TYPE.NONE }).code, 'STATION_REQUIRED')
  const preview = crafting.preview('cook_meat', 5, { stationType: STATION_TYPE.CAMPFIRE })
  assert.equal(preview.ok, true); assert.equal(preview.maxCraftable, 7); assert.equal(preview.ingredients[0].required, 5)
})

test('craft is deterministic, consumes exact ingredients and adds metadata', () => {
  const { character, inventory, crafting } = setup(); add(inventory, 'cloth_scrap', 4)
  const result = crafting.craft('craft_bandage', 2, { stationType: STATION_TYPE.NONE })
  assert.equal(result.ok, true)
  assert.equal(character.inventory.some((item) => item.definitionId === 'cloth_scrap'), false)
  const bandage = character.inventory.find((item) => item.definitionId === 'bandage')
  assert.equal(bandage.quantity, 2); assert.equal(bandage.creationSource, 'Crafting'); assert.equal(bandage.craftedRecipeId, 'craft_bandage'); assert.equal(bandage.craftedAtWorldDay, 4)
})

test('failed batch and combat crafting do not mutate inventory', () => {
  const { character, inventory, crafting } = setup(); add(inventory, 'cloth_scrap', 3)
  const before = JSON.stringify(character.inventory)
  assert.equal(crafting.craft('craft_bandage', 5, {}).ok, false)
  assert.equal(JSON.stringify(character.inventory), before)
  assert.equal(crafting.craft('craft_bandage', 1, { isCombatActive: true }).code, 'CRAFTING_BLOCKED_DURING_COMBAT')
  assert.equal(JSON.stringify(character.inventory), before)
})

test('craft max creates all possible outputs and records the transaction', () => {
  const { character, inventory, crafting } = setup(); add(inventory, 'cloth_scrap', 9)
  const result = crafting.craftMax('craft_bandage', { stationType: STATION_TYPE.NONE })
  assert.equal(result.quantity, 4); assert.equal(crafting.records.length, 1)
  assert.equal(character.inventory.find((item) => item.definitionId === 'cloth_scrap').quantity, 1)
  assert.equal(character.inventory.find((item) => item.definitionId === 'bandage').quantity, 4)
})

test('definitions expose station, requirements, ingredients, outputs and unlock hints', () => {
  const soup = getRecipe('simple_soup')
  assert.equal(soup.requiredStationType, STATION_TYPE.CAMPFIRE)
  assert.equal(soup.isHiddenUntilUnlocked, true)
  assert.ok(Array.isArray(soup.ingredients) && Array.isArray(soup.outputs) && Array.isArray(soup.requirements) && soup.optionalUnlockSourceHints.length)
})
