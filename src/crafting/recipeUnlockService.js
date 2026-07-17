import { getDefaultRecipes, getRecipe, RECIPE_LIST } from './recipeDatabase.js'
import { RECIPE_STATE_VERSION } from './craftingConstants.js'

export const createRecipeState = () => ({ version: RECIPE_STATE_VERSION, knownRecipeIds: getDefaultRecipes().map(({ id }) => id), unlockSources: Object.fromEntries(getDefaultRecipes().map(({ id }) => [id, { recipeId: id, unlockSourceType: 'Default', sourceId: null, worldDay: 1, worldTime: 6 }])) })
export function normalizeRecipeState(state) { const base = createRecipeState(); const known = new Set([...(Array.isArray(state?.knownRecipeIds) ? state.knownRecipeIds : []), ...base.knownRecipeIds]); return { version: RECIPE_STATE_VERSION, knownRecipeIds: [...known].filter((id) => getRecipe(id)), unlockSources: { ...base.unlockSources, ...(state?.unlockSources && typeof state.unlockSources === 'object' ? state.unlockSources : {}) } } }

export class RecipeUnlockService {
  constructor(character) { this.character = character; this.character.recipeState = normalizeRecipeState(character.recipeState) }
  isRecipeKnown(recipeId) { return this.character.recipeState.knownRecipeIds.includes(recipeId) }
  exists(recipeId) { return Boolean(getRecipe(recipeId)) }
  isKnown(recipeId) { return this.isRecipeKnown(recipeId) }
  unlock(recipeId, source = {}) { return this.unlockRecipe(recipeId, { ...source, unlockSourceType: source.unlockSourceType ?? source.sourceType }) }
  unlockRecipe(recipeId, source = {}) { if (!getRecipe(recipeId)) return { ok: false, code: 'RECIPE_NOT_FOUND' }; if (this.isRecipeKnown(recipeId)) return { ok: true, code: 'RECIPE_ALREADY_KNOWN', recipeId, duplicate: true, source: this.getUnlockSource(recipeId) }; this.character.recipeState.knownRecipeIds.push(recipeId); const record = { recipeId, unlockSourceType: source.unlockSourceType ?? 'Unknown', sourceId: source.sourceId ?? null, worldDay: source.worldDay ?? null, worldTime: source.worldTime ?? null }; this.character.recipeState.unlockSources[recipeId] = record; return { ok: true, code: 'RECIPE_UNLOCKED', recipeId, duplicate: false, source: record } }
  lockRecipe(recipeId) { if (!getRecipe(recipeId)) return { ok: false, code: 'RECIPE_NOT_FOUND' }; this.character.recipeState.knownRecipeIds = this.character.recipeState.knownRecipeIds.filter((id) => id !== recipeId); delete this.character.recipeState.unlockSources[recipeId]; return { ok: true, code: 'RECIPE_LOCKED', recipeId } }
  getKnownRecipes() { return this.character.recipeState.knownRecipeIds.map(getRecipe).filter(Boolean) }
  getKnownRecipesByCategory(category) { return this.getKnownRecipes().filter((recipe) => recipe.category === category) }
  getUnlockSource(recipeId) { return this.character.recipeState.unlockSources[recipeId] ?? null }
  unlockAll(source = {}) { return RECIPE_LIST.map(({ id }) => this.unlockRecipe(id, { unlockSourceType: 'Developer Command', ...source })) }
  reset() { this.character.recipeState = createRecipeState(); return { ok: true, code: 'RECIPES_RESET' } }
}
