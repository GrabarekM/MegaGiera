import { createItemInstance } from '../items/itemInstance.js'
import { getItemDefinition } from '../items/itemDatabase.js'
import { evaluateRequirement } from '../npc/trainingRequirementSystem.js'
import { REWARD_TYPE } from '../rewards/rewardDefinitions.js'
import { RewardService } from '../rewards/rewardService.js'
import { CRAFT_RESULT, RECIPE_OUTPUT_TYPE, STATION_TYPE } from './craftingConstants.js'
import { getRecipe } from './recipeDatabase.js'
import { RecipeUnlockService } from './recipeUnlockService.js'

const fail = (code, data = {}) => ({ ok: false, code, ...data })
const positiveInteger = (value) => Math.max(1, Math.trunc(value || 1))

export class CraftingService {
  constructor({ character, inventoryManager, rewardService = null, recipeUnlockService = null, getWorldTime = () => ({ day: null, hour: null }) } = {}) {
    this.character = character
    this.inventory = inventoryManager
    this.recipes = recipeUnlockService ?? new RecipeUnlockService(character)
    this.rewards = rewardService ?? new RewardService({ character, inventoryManager, recipeUnlockService: this.recipes })
    this.getWorldTime = getWorldTime
    this.records = []
  }

  countItem(definitionId) { return this.character.inventory.filter((item) => item.definitionId === definitionId).reduce((sum, item) => sum + item.quantity, 0) }
  getMaxCraftable(recipe) {
    const limits = recipe.ingredients.filter((entry) => entry.consumeOnCraft !== false).map((entry) => Math.floor(this.countItem(entry.itemDefinitionId) / entry.quantity))
    return Math.max(0, Math.min(recipe.allowBatchCrafting ? recipe.maximumBatchSize : 1, ...(limits.length ? limits : [1])))
  }

  preview(recipeId, quantity = 1, context = {}) {
    const recipe = getRecipe(recipeId)
    if (!recipe) return fail(CRAFT_RESULT.RECIPE_NOT_FOUND)
    const requestedQuantity = positiveInteger(quantity)
    const stationType = context.stationType ?? STATION_TYPE.NONE
    const requirements = recipe.requirements.map((requirement) => evaluateRequirement(this.character, requirement))
    const ingredients = recipe.ingredients.map((entry) => { const owned = this.countItem(entry.itemDefinitionId); const required = entry.quantity * requestedQuantity; return { ...entry, displayName: getItemDefinition(entry.itemDefinitionId)?.displayName ?? entry.itemDefinitionId, owned, required, missing: Math.max(0, required - owned) } })
    const maxCraftable = this.getMaxCraftable(recipe)
    const blockers = []
    if (!this.recipes.isRecipeKnown(recipeId)) blockers.push({ code: CRAFT_RESULT.RECIPE_NOT_KNOWN, message: 'This recipe is not known.' })
    if (context.isCombatActive) blockers.push({ code: CRAFT_RESULT.BLOCKED_DURING_COMBAT, message: 'You cannot craft during combat.' })
    if (recipe.requiredStationType !== STATION_TYPE.NONE && recipe.requiredStationType !== stationType) blockers.push({ code: CRAFT_RESULT.STATION_REQUIRED, message: `${recipe.requiredStationType} required.` })
    if (requirements.some(({ met }) => !met)) blockers.push({ code: CRAFT_RESULT.REQUIREMENTS_NOT_MET, message: 'Requirements are not met.' })
    if (ingredients.some(({ missing }) => missing > 0)) blockers.push({ code: CRAFT_RESULT.MISSING_INGREDIENTS, message: 'Not enough ingredients.' })
    if ((!recipe.allowBatchCrafting && requestedQuantity > 1) || requestedQuantity > recipe.maximumBatchSize) blockers.push({ code: CRAFT_RESULT.BATCH_LIMIT_EXCEEDED, message: `Maximum batch size is ${recipe.allowBatchCrafting ? recipe.maximumBatchSize : 1}.` })
    return { ok: blockers.length === 0, code: blockers[0]?.code ?? 'CRAFT_READY', recipe, requestedQuantity, stationType, requirements, ingredients, outputs: recipe.outputs.map((entry) => ({ ...entry, quantity: entry.quantity * requestedQuantity })), maxCraftable, blockers }
  }

  consume(definitionId, quantity) {
    let remaining = quantity
    for (const item of [...this.character.inventory]) { if (item.definitionId !== definitionId || remaining <= 0) continue; const amount = Math.min(remaining, item.quantity); const result = this.inventory.remove(item.instanceId, amount); if (!result.ok) return result; remaining -= amount }
    return remaining === 0 ? { ok: true } : fail(CRAFT_RESULT.MISSING_INGREDIENTS)
  }

  craft(recipeId, quantity = 1, context = {}) {
    const preview = this.preview(recipeId, quantity, context)
    if (!preview.ok) return preview
    for (const output of preview.outputs) if (output.rewardType === RECIPE_OUTPUT_TYPE.ITEM && !getItemDefinition(output.itemDefinitionId)) return fail(CRAFT_RESULT.OUTPUT_NOT_FOUND, { output })
    const inventorySnapshot = [...this.character.inventory]
    const time = this.getWorldTime() ?? {}
    try {
      for (const ingredient of preview.ingredients) if (ingredient.consumeOnCraft !== false) { const consumed = this.consume(ingredient.itemDefinitionId, ingredient.required); if (!consumed.ok) throw new Error(consumed.code) }
      const results = []
      for (const output of preview.outputs) {
        if (output.rewardType !== RECIPE_OUTPUT_TYPE.ITEM) continue
        const instance = createItemInstance(output.itemDefinitionId, { quantity: output.quantity, creationSource: 'Crafting', craftedRecipeId: preview.recipe.id, craftedAtWorldDay: time.day ?? null, craftedAtWorldTime: time.hour ?? time.time ?? null, state: { quality: output.optionalItemQuality } })
        const result = this.rewards.apply({ type: REWARD_TYPE.GRANT_ITEM, itemInstance: instance }, { sourceType: 'crafting', sourceId: preview.recipe.id })
        if (!result.ok) throw new Error(result.code)
        results.push(result)
      }
      const record = Object.freeze({ id: `craft-${Date.now()}-${this.records.length + 1}`, recipeId, quantity: preview.requestedQuantity, stationType: preview.stationType, worldDay: time.day ?? null, worldTime: time.hour ?? time.time ?? null, consumed: Object.freeze(preview.ingredients.filter((entry) => entry.consumeOnCraft !== false).map(({ itemDefinitionId, required }) => Object.freeze({ itemDefinitionId, quantity: required }))), outputs: Object.freeze(preview.outputs.map(({ itemDefinitionId, quantity }) => Object.freeze({ itemDefinitionId, quantity }))) })
      this.records.push(record)
      return { ok: true, code: CRAFT_RESULT.SUCCESS, recipe: preview.recipe, quantity: preview.requestedQuantity, results, record, message: `Crafted ${preview.requestedQuantity} × ${preview.recipe.displayName}.` }
    } catch (error) {
      this.character.inventory.splice(0, this.character.inventory.length, ...inventorySnapshot)
      return fail(CRAFT_RESULT.FAILED, { reason: error instanceof Error ? error.message : String(error) })
    }
  }

  craftMax(recipeId, context = {}) { const preview = this.preview(recipeId, 1, context); return preview.maxCraftable > 0 ? this.craft(recipeId, preview.maxCraftable, context) : preview }
}
