import { resolveItemInstance } from './itemInstance.js'
import { activateLightSource, deactivateLightSource, isLightActive, LIGHT_SOURCE_TYPE, toggleHolyLantern } from '../world/lightSourceSystem.js'
import { WARDWOOD_CONFIG } from '../world/wardwoodService.js'
import { ITEM_TYPE } from './itemConstants.js'

export const ITEM_USE_ACTION = Object.freeze({ USE: 'use', BUILD_CAMPFIRE: 'build_campfire', LIGHT_TORCH: 'light_torch', REFUEL_LANTERN: 'refuel_lantern', LIGHT_LANTERN: 'light_lantern', EXTINGUISH_LANTERN: 'extinguish_lantern', TOGGLE_HOLY_LANTERN: 'toggle_holy_lantern' })
const ok = (code, data = {}) => ({ ok: true, code, messages: data.message ? [data.message] : [], ...data })
const fail = (code, data = {}) => ({ ok: false, code, messages: [], ...data })

export class ItemUseService {
  constructor({ character, inventoryManager, wardwoodService, bookService = null }) { this.character = character; this.inventory = inventoryManager; this.wardwood = wardwoodService; this.books = bookService }
  useItem(characterId, itemInstanceId, context, action = ITEM_USE_ACTION.USE) {
    if (characterId !== this.character.id) return fail('CHARACTER_NOT_FOUND')
    const instance = this.inventory.find(itemInstanceId)
    if (!instance) return fail('ITEM_NOT_FOUND')
    const item = resolveItemInstance(instance)
    if (!item?.useEffects.length) return fail('ITEM_NOT_USABLE')
    if (!context || !context.time) return fail('INVALID_USE_CONTEXT')
    if (context.isCombatActive) return fail('CANNOT_USE_DURING_COMBAT')
    if ([ITEM_TYPE.BOOK, ITEM_TYPE.SCROLL].includes(item.itemType)) return this.books ? this.books.useBook(instance, item, context) : fail('BOOK_SERVICE_UNAVAILABLE')
    if (item.id === 'wardwood') return this.useWardwood(action, context, instance)
    if (item.id === 'torch') return this.lightTorch(context, instance, true)
    if (item.id === 'lantern') return this.useLantern(action, context, instance)
    if (item.id === 'holy_lantern') return this.useHolyLantern(instance)
    return fail('ITEM_NOT_USABLE')
  }
  useWardwood(action, context, instance) {
    if (action === ITEM_USE_ACTION.USE) return ok('WARDWOOD_ACTION_REQUIRED', { actions: [ITEM_USE_ACTION.BUILD_CAMPFIRE, ITEM_USE_ACTION.LIGHT_TORCH, ITEM_USE_ACTION.REFUEL_LANTERN] })
    if (action === ITEM_USE_ACTION.BUILD_CAMPFIRE) {
      if (context.isSafeZone) return fail('SAFE_ZONE_NOT_REQUIRED')
      if (isLightActive(this.character.activeLightSource)) return fail(this.character.activeLightSource.type === LIGHT_SOURCE_TYPE.CAMPFIRE ? 'ALREADY_PROTECTED' : 'LIGHT_SOURCE_ALREADY_ACTIVE')
      const spent = this.wardwood.consume(WARDWOOD_CONFIG.campfireCost, context.time.day); if (!spent.ok) return fail(spent.code)
      activateLightSource(this.character, LIGHT_SOURCE_TYPE.CAMPFIRE, { startedAt: context.time, position: context.position })
      return ok('CAMPFIRE_BUILT', { itemInstanceId: instance.instanceId, message: 'Campfire built. You are protected from Night Threat.' })
    }
    if (action === ITEM_USE_ACTION.LIGHT_TORCH) return this.lightTorch(context, instance, false)
    if (action === ITEM_USE_ACTION.REFUEL_LANTERN) return this.refuelLantern(context)
    return fail('INVALID_USE_CONTEXT')
  }
  lightTorch(context, instance, consumeTorchItem) {
    if (isLightActive(this.character.activeLightSource)) return fail('LIGHT_SOURCE_ALREADY_ACTIVE')
    if (!consumeTorchItem) { const spent = this.wardwood.consume(WARDWOOD_CONFIG.torchCost, context.time.day); if (!spent.ok) return fail(spent.code) }
    const activated = activateLightSource(this.character, LIGHT_SOURCE_TYPE.TORCH, { sourceItemInstanceId: consumeTorchItem ? instance.instanceId : null, startedAt: context.time, remainingDurationMinutes: WARDWOOD_CONFIG.torchDurationMinutes })
    if (!activated.ok) return fail(activated.code)
    if (consumeTorchItem) this.inventory.remove(instance.instanceId, 1)
    return ok('TORCH_LIT', { durationMinutes: WARDWOOD_CONFIG.torchDurationMinutes, message: `Wardwood torch lit for ${WARDWOOD_CONFIG.torchDurationMinutes} minutes.` })
  }
  findLantern() { return this.character.inventory.find(({ definitionId }) => definitionId === 'lantern') ?? null }
  refuelLantern(context) {
    const lantern = this.findLantern(); if (!lantern) return fail('ITEM_NOT_FOUND')
    const missing = WARDWOOD_CONFIG.lanternMaximumFuelMinutes - this.character.lanternState.remainingFuelMinutes
    if (missing <= 0) return fail('LANTERN_ALREADY_FULL')
    const desiredUnits = Math.ceil(missing / WARDWOOD_CONFIG.lanternMinutesPerWardwood)
    const available = this.wardwood.getSummary(context.time.day).quantity
    const units = Math.min(desiredUnits, available)
    if (!units) return fail('NO_WARDWOOD')
    this.wardwood.consume(units, context.time.day)
    this.character.lanternState = { ...this.character.lanternState, itemInstanceId: lantern.instanceId, maximumFuelMinutes: WARDWOOD_CONFIG.lanternMaximumFuelMinutes, remainingFuelMinutes: Math.min(WARDWOOD_CONFIG.lanternMaximumFuelMinutes, this.character.lanternState.remainingFuelMinutes + units * WARDWOOD_CONFIG.lanternMinutesPerWardwood) }
    this.inventory.replace(lantern.instanceId, { state: this.character.lanternState })
    return ok('LANTERN_REFUELED', { wardwoodSpent: units, fuelMinutes: this.character.lanternState.remainingFuelMinutes, message: `Lantern refueled to ${this.character.lanternState.remainingFuelMinutes} minutes.` })
  }
  useLantern(action, context, lantern) {
    if (action === ITEM_USE_ACTION.REFUEL_LANTERN) return this.refuelLantern(context)
    if (action === ITEM_USE_ACTION.EXTINGUISH_LANTERN) { if (!this.character.lanternState.isLit) return fail('LANTERN_NOT_LIT'); deactivateLightSource(this.character); this.inventory.replace(lantern.instanceId, { state: this.character.lanternState }); return ok('LANTERN_EXTINGUISHED') }
    if (action !== ITEM_USE_ACTION.LIGHT_LANTERN && action !== ITEM_USE_ACTION.USE) return fail('INVALID_USE_CONTEXT')
    if (isLightActive(this.character.activeLightSource)) return fail('LIGHT_SOURCE_ALREADY_ACTIVE')
    if (this.character.lanternState.remainingFuelMinutes <= 0) return fail('LANTERN_HAS_NO_FUEL')
    this.character.lanternState = { ...this.character.lanternState, itemInstanceId: lantern.instanceId, isLit: true }
    activateLightSource(this.character, LIGHT_SOURCE_TYPE.LANTERN, { sourceItemInstanceId: lantern.instanceId, startedAt: context.time, remainingDurationMinutes: this.character.lanternState.remainingFuelMinutes })
    this.inventory.replace(lantern.instanceId, { state: this.character.lanternState })
    return ok('LANTERN_LIT')
  }
  useHolyLantern(instance) { this.character.holyLanternState = { itemInstanceId: instance.instanceId, enabled: this.character.holyLanternState?.enabled ?? false }; const result = toggleHolyLantern(this.character); return result.ok ? ok(result.enabled ? 'HOLY_LANTERN_ENABLED' : 'HOLY_LANTERN_DISABLED') : fail(result.code) }
}
