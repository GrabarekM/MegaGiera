import { generateMeadowsRegion } from '../world/meadowsGenerator.js'
import { isValidTime } from '../engine/timeSystem.js'
import { isValidCharacterState } from './characterState.js'
import { generateMerchantState, isValidMerchantState } from '../merchants/merchantStock.js'
import { normalizeRecipeState } from '../crafting/recipeUnlockService.js'
import { createEmptyPoiState, isValidPoiState, normalizePoiState } from '../poi/poiRepository.js'
import { createEmptyEncounterRunState, createInitialEncounterRunState, isValidEncounterRunState, normalizeEncounterRunState } from '../encounters/encounterRepository.js'
import { createInitialWorldEventRuntime, normalizeWorldEventRuntime } from '../worldEvents/worldEventRepository.js'
import { createDialogueRuntime } from '../dialogue/dialogueModels.js'
import { createQuestRuntime } from '../quests/questModels.js'
import { createNpcScheduleRuntime } from '../npcSchedules/npcScheduleModels.js'
import { resolvePlayerPosition } from '../world/worldSession.js'

export const SAVE_KEY = 'super-mega-giera.current-run'
export const SAVE_VERSION = 9

const LEGACY_HOUR_MIGRATION = Object.freeze({ 6: 6, 10: 9, 14: 15, 18: 18, 22: 21, 2: 3 })

export function migrateSave(value) {
  if (!value || typeof value !== 'object') return value
  const legacyStrengthKey = String.fromCharCode(109, 105, 103, 104, 116)
  const savedCharacter = value.characterState
  let migrated = value
  const legacySeed = migrated.seed ?? migrated.world?.seed ?? migrated.worldSeed ?? migrated.regionSeed
  const legacyRegionId = migrated.regionId ?? migrated.world?.regionId ?? 'meadows'
  const legacyPosition = migrated.playerPosition ?? migrated.world?.playerPosition ?? migrated.savedPlayerPosition
  migrated = { ...migrated, seed: legacySeed, regionId: legacyRegionId, playerPosition: legacyPosition }
  if (!migrated.poiState) migrated = { ...migrated, poiState: createEmptyPoiState() }
  else migrated = { ...migrated, poiState: normalizePoiState(migrated.poiState) }
  if (!migrated.encounterState) migrated = { ...migrated, encounterState: createInitialEncounterRunState(migrated.seed, migrated.runId) }
  else migrated = { ...migrated, encounterState: normalizeEncounterRunState(migrated.encounterState) }
  migrated = { ...migrated, worldEventRuntime: normalizeWorldEventRuntime(migrated.worldEventRuntime ?? createInitialWorldEventRuntime(migrated.runId), migrated.runId) }
  migrated = { ...migrated, dialogueRuntime: createDialogueRuntime(migrated.dialogueRuntime) }
  migrated = { ...migrated, questRuntime: createQuestRuntime(migrated.questRuntime) }
  migrated = { ...migrated, npcScheduleRuntime: createNpcScheduleRuntime(migrated.npcScheduleRuntime) }
  if (savedCharacter && !savedCharacter.recipeState) migrated = { ...migrated, characterState: { ...savedCharacter, recipeState: normalizeRecipeState() } }
  if (savedCharacter?.stats && Number.isInteger(savedCharacter.stats[legacyStrengthKey]) && !Number.isInteger(savedCharacter.stats.strength)) {
    const stats = { ...savedCharacter.stats, strength: savedCharacter.stats[legacyStrengthKey] }
    delete stats[legacyStrengthKey]
    const startingWeapon = savedCharacter.startingWeapon?.requiredAttribute === legacyStrengthKey ? { ...savedCharacter.startingWeapon, requiredAttribute: 'strength' } : savedCharacter.startingWeapon
    migrated = { ...migrated, characterState: { ...migrated.characterState, stats, startingWeapon } }
  }
  if (!migrated.merchantState && typeof migrated.seed === 'string' && typeof migrated.runId === 'string') migrated = { ...migrated, merchantState: generateMerchantState(migrated.seed, migrated.runId) }
  if (migrated.saveVersion !== 3) return { ...migrated, saveVersion: SAVE_VERSION }
  const migratedHour = LEGACY_HOUR_MIGRATION[migrated.time?.hour]
  if (migratedHour === undefined) return migrated
  return {
    ...migrated,
    saveVersion: SAVE_VERSION,
    time: { ...migrated.time, hour: migratedHour },
  }
}

const isIntegerArray = (value, maximum) => Array.isArray(value)
  && value.every((item) => Number.isInteger(item) && item >= 0 && item < maximum)

export function validateSave(value) {
  if (!value || typeof value !== 'object') return { valid: false, reason: 'missing-data' }
  if (value.saveVersion !== SAVE_VERSION) return { valid: false, reason: 'unsupported-version' }
  if (typeof value.runId !== 'string' || typeof value.seed !== 'string' || value.characterId !== 'custom') {
    return { valid: false, reason: 'missing-fields' }
  }
  if (value.regionId !== 'meadows') return { valid: false, reason: 'unsupported-region' }
  if (!isValidTime(value.time)) return { valid: false, reason: 'invalid-time' }
  if (!isValidCharacterState(value.characterState)) return { valid: false, reason: 'invalid-character' }
  if (!isValidMerchantState(value.merchantState, value.runId)) return { valid: false, reason: 'invalid-merchant-state' }
  if (!isValidPoiState(value.poiState)) return { valid: false, reason: 'invalid-poi-state' }
  if (!isValidEncounterRunState(value.encounterState)) return { valid: false, reason: 'invalid-encounter-state' }
  if (!value.worldEventRuntime?.worldState || !value.worldEventRuntime?.regionStates?.meadows) return { valid: false, reason: 'invalid-world-event-state' }
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') return { valid: false, reason: 'invalid-dates' }

  const map = generateMeadowsRegion(value.seed)
  const resolvedPosition = resolvePlayerPosition(map, value.playerPosition)
  if (!resolvedPosition.position) return { valid: false, reason: 'missing-map-start' }
  if (!isIntegerArray(value.discovered, map.tiles.length) || !isIntegerArray(value.visited, map.tiles.length)) {
    return { valid: false, reason: 'invalid-tile-state' }
  }
  const normalizedValue = resolvedPosition.usedFallback ? { ...value, playerPosition: resolvedPosition.position } : value
  return { valid: true, value: normalizedValue, map, usedPositionFallback: resolvedPosition.usedFallback }
}

export function readSave(storage = globalThis.localStorage) {
  try {
    if (!storage) return { status: 'unavailable' }
    const raw = storage.getItem(SAVE_KEY)
    if (raw === null) return { status: 'empty' }
    const parsed = migrateSave(JSON.parse(raw))
    const validation = validateSave(parsed)
    return validation.valid ? { status: 'valid', save: validation.value, map: validation.map, usedPositionFallback: validation.usedPositionFallback } : { status: 'invalid', reason: validation.reason }
  } catch {
    return { status: 'invalid', reason: 'unreadable' }
  }
}

export function writeSave(state, storage = globalThis.localStorage, now = () => new Date().toISOString()) {
  try {
    if (!storage) return { ok: false, reason: 'storage-unavailable' }
    const save = { ...state, saveVersion: SAVE_VERSION, updatedAt: now() }
    storage.setItem(SAVE_KEY, JSON.stringify(save))
    return { ok: true, save }
  } catch {
    return { ok: false, reason: 'write-failed' }
  }
}

export function removeSave(storage = globalThis.localStorage) {
  try {
    if (!storage) return { ok: false, reason: 'storage-unavailable' }
    storage.removeItem(SAVE_KEY)
    return { ok: true }
  } catch {
    return { ok: false, reason: 'remove-failed' }
  }
}
