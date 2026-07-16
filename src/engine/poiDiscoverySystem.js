export const POI_DISCOVERY_STATE = Object.freeze({
  HIDDEN: 'hidden',
  DETECTED: 'detected',
  IDENTIFIED: 'identified',
  VISITED: 'visited',
})

export const PLAYER_VISIBILITY_RADIUS = 2

export function getVisibleTileIndices(playerPosition, width, height, radius = PLAYER_VISIBILITY_RADIUS) {
  const indices = []
  for (let row = Math.max(0, playerPosition.row - radius); row <= Math.min(height - 1, playerPosition.row + radius); row += 1) {
    for (let column = Math.max(0, playerPosition.column - radius); column <= Math.min(width - 1, playerPosition.column + radius); column += 1) {
      indices.push(row * width + column)
    }
  }
  return indices
}

export function isTileCurrentlyVisible(tilePosition, playerPosition, radius = PLAYER_VISIBILITY_RADIUS) {
  return Math.abs(tilePosition.row - playerPosition.row) <= radius
    && Math.abs(tilePosition.column - playerPosition.column) <= radius
}

const STATE_RANK = Object.freeze({ hidden: 0, detected: 1, identified: 2, visited: 3 })

const range = (detectionRange, identificationRange) => Object.freeze({ detectionRange, identificationRange })

export const POI_DISCOVERY_RANGES = Object.freeze({
  city: range(15, 10),
  village: range(10, 6),
  watchtower: range(10, 5),
  inn: range(7, 3),
  ancient_ruins: range(6, 2),
  ruins: range(6, 2),
  shrine: range(5, 2),
  ancient_oak: range(7, 3),
  hunter_camp: range(5, 2),
  bandit_camp: range(3, 1),
  wolf_den: range(3, 1),
  spider_nest: range(3, 1),
  hidden_cache: range(0, 0),
})

const DEFAULT_RANGE = range(5, 2)

export function getPoiDiscoveryRange(type) {
  return POI_DISCOVERY_RANGES[type] ?? DEFAULT_RANGE
}

export function createPoiRecords(map) {
  const records = []
  for (const tile of map.tiles) {
    if (!tile.pointOfInterest) continue
    const ranges = getPoiDiscoveryRange(tile.pointOfInterest)
    records.push({ id: `${map.seed}:core:${tile.pointOfInterest}:${tile.id}`, source: 'core', type: tile.pointOfInterest,
      tileIndex: tile.id, column: tile.column, row: tile.row, ...ranges })
  }
  for (const poi of map.region.staticPois) {
    const ranges = getPoiDiscoveryRange(poi.type)
    records.push({ id: poi.id, source: 'static', type: poi.type, tileIndex: poi.position.index,
      column: poi.position.column, row: poi.position.row, ...ranges })
  }
  return records
}

export function promotePoiState(current = POI_DISCOVERY_STATE.HIDDEN, requested) {
  if (!(requested in STATE_RANK)) throw new Error(`Unknown POI discovery state: ${requested}`)
  return STATE_RANK[requested] > STATE_RANK[current] ? requested : current
}

export function getPoiMapMarker(state, identifiedIcon) {
  if (state === POI_DISCOVERY_STATE.DETECTED) return '?'
  if (state === POI_DISCOVERY_STATE.IDENTIFIED || state === POI_DISCOVERY_STATE.VISITED) return identifiedIcon
  return null
}

export function setPoiDiscoveryState(states, poiId, requested) {
  return { ...states, [poiId]: promotePoiState(states[poiId], requested) }
}

export function advancePoiDiscovery(records, currentStates, playerPosition) {
  const next = { ...currentStates }
  for (const poi of records) {
    const distance = Math.max(Math.abs(poi.column - playerPosition.column), Math.abs(poi.row - playerPosition.row))
    const requested = distance === 0 ? POI_DISCOVERY_STATE.VISITED
      : poi.detectionRange === 0 ? POI_DISCOVERY_STATE.HIDDEN
        : distance <= poi.identificationRange ? POI_DISCOVERY_STATE.IDENTIFIED
          : distance <= poi.detectionRange ? POI_DISCOVERY_STATE.DETECTED
            : POI_DISCOVERY_STATE.HIDDEN
    next[poi.id] = promotePoiState(next[poi.id], requested)
  }
  return next
}

export function countPoiDiscoveryStates(records, states) {
  const counts = { hidden: 0, detected: 0, identified: 0, visited: 0 }
  for (const poi of records) counts[states[poi.id] ?? POI_DISCOVERY_STATE.HIDDEN] += 1
  return counts
}
