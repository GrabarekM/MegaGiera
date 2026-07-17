import { isSafeZone } from './safeZoneService.js'
import { isLightActive, LIGHT_SOURCE_TYPE } from './lightSourceSystem.js'

export const WARDWOOD_RESOURCE = Object.freeze({ id: 'wardwood', displayName: 'Wardwood', renewableByTime: false, uses: Object.freeze([LIGHT_SOURCE_TYPE.TORCH, LIGHT_SOURCE_TYPE.CAMPFIRE, 'Lantern Fuel']), futureUses: Object.freeze([LIGHT_SOURCE_TYPE.HOLY_LANTERN, 'Quests', 'Rituals']) })
export const DEAD_WARDWOOD_RESOURCE = Object.freeze({ id: 'dead_wardwood', displayName: 'Dead Wardwood', protectsFromDemons: false, decaySourceId: 'wardwood', decayImplemented: false })
export const WARDWOOD_MERCHANT_STOCK = Object.freeze({ itemId: 'wardwood', maximumStock: 3, refreshPolicy: 'world_event', refreshEventType: 'wardwood_supply_restored' })

const collectedSources = (character) => character.flags.wardwoodSourcesCollected ?? (character.flags.wardwoodSourcesCollected = [])
export function acquireWardwood(character, quantity, sourceId) {
  if (!sourceId) return { ok: false, code: 'SOURCE_REQUIRED' }
  const sources = collectedSources(character)
  if (sources.includes(sourceId)) return { ok: false, code: 'SOURCE_DEPLETED' }
  const gained = Math.max(0, Math.trunc(quantity))
  character.wardwood += gained
  sources.push(sourceId)
  return { ok: true, quantity: gained }
}
export function spendWardwood(character, quantity) { const cost = Math.max(0, Math.trunc(quantity)); if (character.wardwood < cost) return { ok: false, code: 'NOT_ENOUGH_WARDWOOD' }; character.wardwood -= cost; return { ok: true, quantity: cost } }
export function createWardwoodMerchantState(stock = WARDWOOD_MERCHANT_STOCK.maximumStock) { return { wardwoodStock: Math.max(0, Math.trunc(stock)), lastRefreshEventId: null } }
export function refreshWardwoodMerchantStock(merchant, event) { if (event?.type !== WARDWOOD_MERCHANT_STOCK.refreshEventType || !event.id || merchant.lastRefreshEventId === event.id) return { ok: false, code: 'REFRESH_EVENT_REQUIRED' }; merchant.wardwoodStock = WARDWOOD_MERCHANT_STOCK.maximumStock; merchant.lastRefreshEventId = event.id; return { ok: true } }
export function canWaitThroughNight(tile, character) { return isSafeZone(tile) || (character.activeLightSource?.type === LIGHT_SOURCE_TYPE.CAMPFIRE && isLightActive(character.activeLightSource)) }
