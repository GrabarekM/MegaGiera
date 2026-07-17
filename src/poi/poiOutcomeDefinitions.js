import { REWARD_TYPE } from '../rewards/rewardDefinitions.js'
import { definePoiOutcome } from './poiModels.js'

const outcome = (id, title, data = {}) => definePoiOutcome({ id, title, description: data.description ?? title, ...data })
const list = [
  outcome('abandoned_cart_search_success', 'Useful remains', { description: 'Something useful remains beneath the broken boards.', setLocalFlags: ['cartSearched'], randomRewardTableIds: [{ rewardId: 'cart-small-loot', lootTableId: 'meadows_poi_loot', useSmartLoot: false }], nextStateId: 'searched' }),
  outcome('abandoned_cart_search_failure', 'Nothing useful', { setLocalFlags: ['searchFailed'] }),
  outcome('abandoned_cart_tracks_success', 'Fresh tracks', { setLocalFlags: ['tracksInspected'], rewards: [{ rewardId: 'tracks-knowledge', type: REWARD_TYPE.GRANT_KNOWLEDGE, knowledgeId: 'local_threat' }], revealPoiTargets: [{ poiDefinitionId: 'collapsed_mine' }] }),
  outcome('abandoned_cart_tracks_failure', 'The tracks are lost'),
  outcome('shrine_pray_success', 'A quiet blessing', { effects: [{ type: 'ApplyStatusEffect', statusId: 'Blessed' }], setLocalFlags: ['shrineBlessed'] }),
  outcome('shrine_pray_failure', 'Silence answers'),
  outcome('shrine_study', 'The inscription', { setLocalFlags: ['inscriptionRead'], rewards: [{ rewardId: 'shrine-knowledge', type: REWARD_TYPE.GRANT_KNOWLEDGE, knowledgeId: 'old_kingdom_history' }, { rewardId: 'shrine-recipe', type: REWARD_TYPE.GRANT_RECIPE, recipeId: 'simple_soup' }] }),
  outcome('shrine_desecrate', 'Desecration', { effects: [{ type: 'DamageCharacter', damageAmount: 2, canReduceBelowOneHealth: true }], setWorldFlags: ['shrineDesecrated'], nextStateId: 'completed', markCompleted: true }),
  outcome('hunter_cache_open', 'Hunter cache opened', { rewards: [{ rewardId: 'hunter-cache-fixed', type: REWARD_TYPE.GRANT_ITEM, itemId: 'advanced_archery_manual', quantity: 1 }, { rewardId: 'hunter-cache-wardwood', type: REWARD_TYPE.GRANT_ITEM, itemId: 'wardwood', quantity: 1 }, { rewardId: 'hunter-cache-food', type: REWARD_TYPE.GRANT_ITEM, itemId: 'travel_ration', quantity: 1 }], nextStateId: 'exhausted', markCompleted: true, markExhausted: true }),
  outcome('mine_inspect_success', 'Supports understood', { setLocalFlags: ['supportsUnderstood'] }),
  outcome('mine_inspect_failure', 'Unstable supports'),
  outcome('mine_clear', 'Debris cleared', { nextStateId: 'searched', setLocalFlags: ['mineOpened'] }),
  outcome('mine_tool', 'Tool applied', { setLocalFlags: ['toolUsed'] }),
  outcome('shelter_inspect_success', 'A defensible shelter', { setLocalFlags: ['shelterInspected'] }),
  outcome('shelter_inspect_failure', 'Unsafe shelter'),
  outcome('shelter_secure', 'Shelter secured', { setLocalFlags: ['shelterSecured', 'safeZoneEnabled', 'allowWaitUntilMorning', 'campfireCompatible'], nextStateId: 'searched', markCompleted: true }),
]
export const POI_OUTCOMES = Object.freeze(Object.fromEntries(list.map((entry) => [entry.id, entry])))
