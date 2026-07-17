import { resolveItemInstance } from '../items/itemInstance.js'
import { recordFoundBook } from '../books/bookCollectionService.js'
import { RewardService } from '../rewards/rewardService.js'
import { REWARD_TYPE } from '../rewards/rewardDefinitions.js'

export const LOOT_REWARD_TYPE = Object.freeze({
  ITEM_INSTANCE: 'item_instance',
  GOLD: 'gold',
  LEARNING_POINTS: 'learning_points',
  KNOWLEDGE: 'knowledge',
  COMBAT_SKILL: 'combat_skill',
  PASSIVE_SKILL: 'passive_skill',
  SPECIALIZATION: 'specialization',
  QUEST_REWARD: 'quest_reward',
  REPUTATION: 'reputation',
  TITLE: 'title',
  UNLOCK: 'unlock',
})

const rewardIcons = Object.freeze({
  [LOOT_REWARD_TYPE.ITEM_INSTANCE]: '◇',
  [LOOT_REWARD_TYPE.GOLD]: '●',
  [LOOT_REWARD_TYPE.LEARNING_POINTS]: '✦',
  [LOOT_REWARD_TYPE.KNOWLEDGE]: '📘',
  [LOOT_REWARD_TYPE.COMBAT_SKILL]: '⭐',
  [LOOT_REWARD_TYPE.PASSIVE_SKILL]: '✨',
  [LOOT_REWARD_TYPE.SPECIALIZATION]: '◆',
  [LOOT_REWARD_TYPE.QUEST_REWARD]: '✓',
  [LOOT_REWARD_TYPE.REPUTATION]: '♜',
  [LOOT_REWARD_TYPE.TITLE]: '🏅',
  [LOOT_REWARD_TYPE.UNLOCK]: '🔓',
})

export function createLootRewardEntry({ type, displayName, description = '', icon, quantity = 1, source = null, quality = null, rarity = null, payload = null }) {
  if (!Object.values(LOOT_REWARD_TYPE).includes(type)) throw new Error(`Unsupported Loot Reward type: ${type}`)
  if (!displayName?.trim()) throw new Error('Loot Reward entry requires a display name.')
  return Object.freeze({
    type,
    displayName: displayName.trim(),
    description,
    icon: icon ?? rewardIcons[type],
    quantity: Math.max(1, Math.trunc(quantity)),
    source,
    quality,
    rarity,
    payload,
  })
}

export function createItemRewardEntry(instance, source = null) {
  const definition = resolveItemInstance(instance)
  if (!definition) throw new Error('Item reward requires a valid ItemInstance.')
  return createLootRewardEntry({
    type: LOOT_REWARD_TYPE.ITEM_INSTANCE,
    displayName: definition.displayName,
    description: definition.description,
    icon: definition.icon ?? rewardIcons[LOOT_REWARD_TYPE.ITEM_INSTANCE],
    quantity: instance.quantity ?? 1,
    source,
    quality: definition.quality,
    payload: instance,
  })
}

export function createGoldRewardEntry(quantity, source = null) {
  return createLootRewardEntry({ type: LOOT_REWARD_TYPE.GOLD, displayName: 'Gold', description: 'Currency.', icon: '●', quantity, source })
}

export function createLootReward({ sourceName = 'Reward', source = null, entries = [], itemInstances = [], gold = 0 } = {}) {
  const normalizedEntries = [
    ...entries,
    ...itemInstances.map((instance) => createItemRewardEntry(instance, source)),
    ...(gold > 0 ? [createGoldRewardEntry(gold, source)] : []),
  ]
  return Object.freeze({ sourceName, source, entries: Object.freeze(normalizedEntries.map((entry) => Object.freeze({ ...entry }))) })
}

export function claimLootReward(reward, selectedIndices, character, inventoryManager) {
  if (!reward || !Array.isArray(reward.entries) || !character || !inventoryManager) return { ok: false, code: 'INVALID_LOOT_REWARD' }
  const selected = new Set(selectedIndices)
  let itemCount = 0
  let gold = 0
  let deferredCount = 0
  const rewards = new RewardService({ character, inventoryManager })
  for (const [index, entry] of reward.entries.entries()) {
    if (!selected.has(index)) continue
    if (entry.type === LOOT_REWARD_TYPE.ITEM_INSTANCE) {
      rewards.apply({ type: REWARD_TYPE.GRANT_ITEM, itemInstance: entry.payload })
      recordFoundBook(character, resolveItemInstance(entry.payload), { foundDate: entry.payload.acquiredAt ?? null, source: entry.source ?? reward.source })
      itemCount += entry.quantity
    } else if (entry.type === LOOT_REWARD_TYPE.GOLD) {
      rewards.apply({ type: REWARD_TYPE.GRANT_GOLD, amount: entry.quantity })
      gold += entry.quantity
    } else deferredCount += 1
  }
  return { ok: true, itemCount, gold, deferredCount }
}

export function takeLootReward(reward, character, inventoryManager) { return claimLootReward(reward, reward?.entries?.map((_, index) => index) ?? [], character, inventoryManager) }
export function leaveLootReward(reward) { return reward?.entries ? { ok: true, claimed: false, entryCount: reward.entries.length } : { ok: false, code: 'INVALID_LOOT_REWARD' } }
