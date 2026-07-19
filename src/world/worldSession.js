import { generateMeadowsRegion } from './meadowsGenerator.js'
import { canPlayerEnterTile, getTileAt } from './worldMovement.js'

export const SUPPORTED_WORLD_REGION = 'meadows'

export function getMapStartPosition(map) {
  const start = Number.isInteger(map?.startIndex) ? map.tiles?.[map.startIndex] : null
  if (start?.walkable === true) return { row: start.row, column: start.column }
  const fallback = map?.tiles?.find((tile) => tile?.walkable === true)
  return fallback ? { row: fallback.row, column: fallback.column } : null
}

export function resolvePlayerPosition(map, savedPosition) {
  if (canPlayerEnterTile(map, savedPosition?.row, savedPosition?.column)) {
    return { position: { row: savedPosition.row, column: savedPosition.column }, usedFallback: false }
  }
  return { position: getMapStartPosition(map), usedFallback: true }
}

export function initializeWorldSession(run, generateRegion = generateMeadowsRegion) {
  if (!run || typeof run.seed !== 'string' || !run.seed) return { ok: false, reason: 'missing-seed' }
  if ((run.regionId ?? SUPPORTED_WORLD_REGION) !== SUPPORTED_WORLD_REGION) return { ok: false, reason: 'unsupported-region' }
  const map = generateRegion(run.seed)
  if (!map || !Array.isArray(map.tiles) || !map.tiles.length) return { ok: false, reason: 'invalid-map' }
  const resolved = resolvePlayerPosition(map, run.playerPosition)
  if (!resolved.position || !getTileAt(map, resolved.position.row, resolved.position.column)) return { ok: false, reason: 'missing-start' }
  return { ok: true, map, seed: run.seed, regionId: map.id, ...resolved }
}
