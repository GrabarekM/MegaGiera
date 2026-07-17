import { grantKnowledge, hasKnowledge } from '../game/knowledgeService.js'
import { gainLearningPoints } from '../game/characterProgression.js'
import { createItemInstance } from '../items/itemInstance.js'
import { getItemDefinition } from '../items/itemDatabase.js'
import { gainBaseProficiency, increaseMaximumProficiencyCap, synchronizeLegacyProficiency } from '../skills/proficiencySystem.js'
import { REWARD_TYPE } from './rewardDefinitions.js'
import { RecipeUnlockService } from '../crafting/recipeUnlockService.js'

const success = (code, data = {}) => ({ ok: true, code, ...data })
const failure = (code, data = {}) => ({ ok: false, code, ...data })

export class RewardService {
  constructor({ character, inventoryManager = null, recipeUnlockService = null }) { this.character = character; this.inventory = inventoryManager; this.recipes = recipeUnlockService ?? new RecipeUnlockService(character) }

  validate(reward) {
    if (reward.type === REWARD_TYPE.GRANT_SKILL) { const skill = synchronizeLegacyProficiency(this.character, reward.skill); return skill.baseValue + reward.amount <= Math.min(skill.currentRankCap, skill.maximumCap) ? success('REWARD_VALID') : failure('CURRENT_RANK_CAP_REACHED') }
    if (reward.type === REWARD_TYPE.GRANT_KNOWLEDGE) return hasKnowledge(this.character, reward.knowledgeId) ? failure('KNOWLEDGE_ALREADY_DISCOVERED') : success('REWARD_VALID')
    if (reward.type === REWARD_TYPE.GRANT_ITEM) return !this.inventory ? failure('INVENTORY_SERVICE_REQUIRED') : (reward.itemInstance || getItemDefinition(reward.itemId) ? success('REWARD_VALID') : failure('ITEM_NOT_FOUND'))
    if (reward.type === REWARD_TYPE.GRANT_MAXIMUM_CAP) { const skill = synchronizeLegacyProficiency(this.character, reward.skill); return skill.maximumCap < 120 ? success('REWARD_VALID') : failure('ABSOLUTE_SKILL_CAP_REACHED') }
    if (reward.type === REWARD_TYPE.GRANT_RECIPE) return this.recipes.exists(reward.recipeId) ? success('REWARD_VALID') : failure('RECIPE_NOT_FOUND')
    return Object.values(REWARD_TYPE).includes(reward.type) ? success('REWARD_VALID') : failure('UNSUPPORTED_REWARD')
  }

  apply(reward, context = {}) {
    const validation = this.validate(reward); if (!validation.ok) return validation
    if (reward.type === REWARD_TYPE.GRANT_SKILL) { const value = gainBaseProficiency(this.character, reward.skill, reward.amount, context.sourceType ?? 'reward'); return { ...value, type: reward.type, message: `${reward.skill} increased to ${value.baseValue.toFixed(2)}.` } }
    if (reward.type === REWARD_TYPE.GRANT_KNOWLEDGE) { const value = grantKnowledge(this.character, reward.knowledgeId, { discoveredDay: context.day ?? null, sourceType: context.sourceType ?? 'reward', sourceId: context.sourceId ?? null }); return { ...value, type: reward.type, message: value.ok ? `Knowledge gained: ${value.knowledge.displayName}.` : null } }
    if (reward.type === REWARD_TYPE.GRANT_ITEM) { const instance = reward.itemInstance ?? createItemInstance(reward.itemId, { quantity: reward.quantity ?? 1 }); const value = this.inventory.add(instance); return { ...value, type: reward.type, item: instance, message: value.ok ? `Item gained: ${instance.definitionId}.` : null } }
    if (reward.type === REWARD_TYPE.GRANT_GOLD) { this.character.gold += reward.amount; return success('GOLD_GRANTED', { type: reward.type, amount: reward.amount, message: `${reward.amount} Gold gained.` }) }
    if (reward.type === REWARD_TYPE.GRANT_LP) { const value = gainLearningPoints(this.character, reward.amount); return { ...value, type: reward.type, message: `${reward.amount} Learning Points gained.` } }
    if (reward.type === REWARD_TYPE.GRANT_MAXIMUM_CAP) { const value = increaseMaximumProficiencyCap(this.character, reward.skill, reward.amount); return { ...value, type: reward.type, message: `Maximum ${reward.skill} increased to ${value.maximumCap}.` } }
    if (reward.type === REWARD_TYPE.GRANT_FLAG) { this.character.flags[reward.flag] = reward.value ?? true; return success('FLAG_GRANTED', { type: reward.type, message: `Unlocked: ${reward.flag}.` }) }
    if (reward.type === REWARD_TYPE.UNLOCK_POI) { this.character.flags[`poi:${reward.poiId}`] = true; return success('POI_UNLOCKED', { type: reward.type, message: `POI unlocked: ${reward.poiId}.` }) }
    if (reward.type === REWARD_TYPE.UNLOCK_QUEST) { this.character.flags[`quest:${reward.questId}`] = true; return success('QUEST_UNLOCKED', { type: reward.type, message: `Quest unlocked: ${reward.questId}.` }) }
    if (reward.type === REWARD_TYPE.GRANT_RECIPE) { const value = this.recipes.unlock(reward.recipeId, { sourceType: context.sourceType ?? 'reward', sourceId: context.sourceId ?? null, worldDay: context.day ?? null, worldTime: context.time ?? null }); return { ...value, type: reward.type, message: value.code === 'RECIPE_ALREADY_KNOWN' ? 'Recipe already known.' : `Recipe learned: ${value.recipe?.displayName ?? reward.recipeId}.` } }
    return failure('UNSUPPORTED_REWARD')
  }

  applyMany(rewards, context = {}) {
    const validations = rewards.map((reward) => this.validate(reward))
    if (validations.some(({ ok }) => !ok)) return failure('REWARD_SET_BLOCKED', { validations, results: [] })
    const results = rewards.map((reward) => this.apply(reward, context))
    return success('REWARDS_APPLIED', { results, messages: results.map(({ message }) => message).filter(Boolean) })
  }
}
