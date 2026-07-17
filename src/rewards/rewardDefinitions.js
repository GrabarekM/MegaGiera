export const REWARD_TYPE = Object.freeze({
  GRANT_SKILL: 'grant_skill', GRANT_KNOWLEDGE: 'grant_knowledge', GRANT_ITEM: 'grant_item', GRANT_GOLD: 'grant_gold', GRANT_LP: 'grant_learning_points',
  GRANT_MAXIMUM_CAP: 'grant_maximum_cap', UNLOCK_POI: 'unlock_poi', UNLOCK_QUEST: 'unlock_quest', GRANT_FLAG: 'grant_flag', GRANT_RECIPE: 'grant_recipe',
})

export function defineReward(type, data = {}) {
  if (!Object.values(REWARD_TYPE).includes(type)) throw new Error(`Unsupported Reward type: ${type}`)
  return Object.freeze({ type, ...data })
}
