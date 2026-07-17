import { getItemDefinition } from '../items/itemDatabase.js'
import { CRAFT_RESULT, RECIPE_CATEGORY, RECIPE_OUTPUT_TYPE, STATION_TYPE } from './craftingConstants.js'

const freezeRecords = (entries = []) => Object.freeze(entries.map((entry) => Object.freeze({ ...entry, optionalAcceptedTags: Object.freeze([...(entry.optionalAcceptedTags ?? [])]), optionalTags: Object.freeze([...(entry.optionalTags ?? [])]) })))
export function defineRecipe(data) {
  if (!data?.id || !data.displayName || !Object.values(RECIPE_CATEGORY).includes(data.category)) throw new Error('RecipeDefinition requires id, displayName and valid category.')
  if (!Object.values(STATION_TYPE).includes(data.requiredStationType)) throw new Error('RecipeDefinition requires a valid Station Type.')
  return Object.freeze({ description: '', ingredients: Object.freeze([]), outputs: Object.freeze([]), requirements: Object.freeze([]), craftTime: 0, tags: Object.freeze([]), isKnownByDefault: false, isHiddenUntilUnlocked: true, allowBatchCrafting: false, maximumBatchSize: 1, optionalKnowledgeIds: Object.freeze([]), optionalUnlockSourceHints: Object.freeze([]), ...data, ingredients: freezeRecords(data.ingredients), outputs: freezeRecords(data.outputs), requirements: Object.freeze([...(data.requirements ?? [])].map((entry) => Object.freeze({ ...entry }))), tags: Object.freeze([...(data.tags ?? [])]), optionalKnowledgeIds: Object.freeze([...(data.optionalKnowledgeIds ?? [])]), optionalUnlockSourceHints: Object.freeze([...(data.optionalUnlockSourceHints ?? [])]) })
}
const ingredient = (itemDefinitionId, quantity, data = {}) => ({ itemDefinitionId, quantity, consumeOnCraft: true, optionalAcceptedTags: [], optionalAlternativeGroupId: null, ...data })
const output = (itemDefinitionId, quantity = 1, optionalItemQuality = 'Normal') => ({ rewardType: RECIPE_OUTPUT_TYPE.ITEM, itemDefinitionId, quantity, optionalItemQuality, optionalTags: [] })

const recipes = [
  defineRecipe({ id: 'craft_bandage', displayName: 'Bandage', description: 'Turn clean cloth remnants into a simple medical dressing.', category: RECIPE_CATEGORY.SURVIVAL, requiredStationType: STATION_TYPE.NONE, ingredients: [ingredient('cloth_scrap', 2)], outputs: [output('bandage')], craftTime: 15, tags: ['survival', 'medical'], isKnownByDefault: true, isHiddenUntilUnlocked: false, allowBatchCrafting: true, maximumBatchSize: 20 }),
  defineRecipe({ id: 'cook_meat', displayName: 'Cooked Meat', description: 'Cook raw meat over a safe fire.', category: RECIPE_CATEGORY.COOKING, requiredStationType: STATION_TYPE.CAMPFIRE, ingredients: [ingredient('raw_meat', 1)], outputs: [output('cooked_meat')], craftTime: 30, tags: ['cooking', 'campfire'], isKnownByDefault: true, isHiddenUntilUnlocked: false, allowBatchCrafting: true, maximumBatchSize: 20 }),
  defineRecipe({ id: 'craft_torch', displayName: 'Wardwood Torch', description: 'Bind Wardwood to a simple wooden handle without weakening its protective purpose.', category: RECIPE_CATEGORY.SURVIVAL, requiredStationType: STATION_TYPE.CAMPFIRE, ingredients: [ingredient('wood_scrap', 1), ingredient('wardwood', 1)], outputs: [output('torch')], craftTime: 20, tags: ['survival', 'wardwood'], isKnownByDefault: true, isHiddenUntilUnlocked: false, allowBatchCrafting: true, maximumBatchSize: 10 }),
  defineRecipe({ id: 'simple_soup', displayName: 'Simple Soup', description: 'A modest camp meal prepared from meat and a travel ration.', category: RECIPE_CATEGORY.COOKING, requiredStationType: STATION_TYPE.CAMPFIRE, ingredients: [ingredient('raw_meat', 1), ingredient('travel_ration', 1)], outputs: [output('simple_soup')], craftTime: 45, tags: ['cooking', 'campfire'], isKnownByDefault: false, isHiddenUntilUnlocked: true, allowBatchCrafting: true, maximumBatchSize: 10, optionalUnlockSourceHints: ["Hunter's Journal or a Recipe Scroll"] }),
]

export const RECIPE_LIST = Object.freeze(recipes)
export const RECIPE_DATABASE = Object.freeze(Object.fromEntries(recipes.map((recipe) => [recipe.id, recipe])))
export const getRecipe = (id) => RECIPE_DATABASE[id] ?? null
export const getRecipesByCategory = (category) => RECIPE_LIST.filter((recipe) => recipe.category === category)
export const getRecipesForStation = (stationType) => RECIPE_LIST.filter((recipe) => recipe.requiredStationType === stationType)
export const getDefaultRecipes = () => RECIPE_LIST.filter((recipe) => recipe.isKnownByDefault)

export function validateRecipeDatabase(recipesToValidate = RECIPE_LIST, itemResolver = getItemDefinition) {
  const ids = new Set(); const errors = []
  for (const recipe of recipesToValidate) {
    if (ids.has(recipe.id)) errors.push({ code: 'DUPLICATE_RECIPE_ID', recipeId: recipe.id }); ids.add(recipe.id)
    if (!Object.values(STATION_TYPE).includes(recipe.requiredStationType)) errors.push({ code: 'INVALID_STATION_TYPE', recipeId: recipe.id })
    for (const entry of recipe.ingredients) if (!itemResolver(entry.itemDefinitionId)) errors.push({ code: 'INGREDIENT_ITEM_NOT_FOUND', recipeId: recipe.id, itemDefinitionId: entry.itemDefinitionId })
    for (const entry of recipe.outputs) if (entry.rewardType === RECIPE_OUTPUT_TYPE.ITEM && !itemResolver(entry.itemDefinitionId)) errors.push({ code: CRAFT_RESULT.OUTPUT_NOT_FOUND, recipeId: recipe.id, itemDefinitionId: entry.itemDefinitionId })
  }
  return { valid: errors.length === 0, errors }
}
