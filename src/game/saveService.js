import { generateMeadowsRegion } from '../world/meadowsGenerator.js'
import { isValidTime } from '../engine/timeSystem.js'
import { isValidCharacterState } from './characterState.js'

export const SAVE_KEY = 'super-mega-giera.current-run'
export const SAVE_VERSION = 7

const LEGACY_HOUR_MIGRATION = Object.freeze({ 6: 6, 10: 9, 14: 15, 18: 18, 22: 21, 2: 3 })

export function migrateSave(value) {
  if (!value || typeof value !== 'object') return value
  if (value.saveVersion !== 3) return value
  const migratedHour = LEGACY_HOUR_MIGRATION[value.time?.hour]
  if (migratedHour === undefined) return value
  return {
    ...value,
    saveVersion: SAVE_VERSION,
    time: { ...value.time, hour: migratedHour },
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
  if (!value.playerPosition || !Number.isInteger(value.playerPosition.row) || !Number.isInteger(value.playerPosition.column)) {
    return { valid: false, reason: 'invalid-position' }
  }
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') return { valid: false, reason: 'invalid-dates' }

  const map = generateMeadowsRegion(value.seed)
  const { row, column } = value.playerPosition
  if (row < 0 || row >= map.rows || column < 0 || column >= map.columns) return { valid: false, reason: 'position-outside-map' }
  if (!map.tiles[row * map.columns + column]?.walkable) return { valid: false, reason: 'blocked-position' }
  if (!isIntegerArray(value.discovered, map.tiles.length) || !isIntegerArray(value.visited, map.tiles.length)) {
    return { valid: false, reason: 'invalid-tile-state' }
  }
  return { valid: true, value, map }
}

export function readSave(storage = globalThis.localStorage) {
  try {
    if (!storage) return { status: 'unavailable' }
    const raw = storage.getItem(SAVE_KEY)
    if (raw === null) return { status: 'empty' }
    const parsed = migrateSave(JSON.parse(raw))
    const validation = validateSave(parsed)
    return validation.valid ? { status: 'valid', save: parsed } : { status: 'invalid', reason: validation.reason }
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
