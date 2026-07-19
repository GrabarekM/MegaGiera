import { getTerrainTileStyle } from './terrainTileVisuals.js'
import { getTerrainRenderDefinition, ROAD_TERRAINS, WORLD_OBJECT_DEFINITIONS } from './worldRenderDefinitions.js'

const DIRECTIONS = Object.freeze([
  ['north', -1, 0], ['east', 0, 1], ['south', 1, 0], ['west', 0, -1],
])

function hash(value) {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

function neighborAt(map, tile, rowOffset, columnOffset) {
  const row = tile.row + rowOffset
  const column = tile.column + columnOffset
  if (row < 0 || column < 0 || row >= map.rows || column >= map.columns) return null
  return map.tiles[row * map.columns + column]
}

export function createWorldTilePresentation(tile, map, tileSize, seed = '') {
  const definition = getTerrainRenderDefinition(tile.terrain)
  const random = hash(`${seed}:${tile.index}:${tile.terrain}`)
  const neighbors = DIRECTIONS.map(([direction, row, column]) => [direction, neighborAt(map, tile, row, column)])
  const roadConnections = Object.fromEntries(neighbors.map(([direction, neighbor]) => [direction, Boolean(neighbor && ROAD_TERRAINS.has(neighbor.terrain))]))
  const transitionColors = neighbors
    .filter(([, neighbor]) => neighbor && neighbor.terrain !== tile.terrain && !ROAD_TERRAINS.has(tile.terrain))
    .map(([direction, neighbor]) => ({ direction, color: getTerrainRenderDefinition(neighbor.terrain).color }))
  const objectType = definition.object ?? (tile.staticPoiId || tile.pointOfInterest ? 'ruins' : null)
  const object = objectType ? { type: objectType, ...WORLD_OBJECT_DEFINITIONS[objectType] } : null

  return {
    terrain: tile.terrain,
    groundStyle: { backgroundColor: definition.color, ...getTerrainTileStyle(tile, tileSize, seed) },
    transitionColors,
    road: definition.road ? { type: definition.road, connections: roadConnections } : null,
    detail: definition.detail ? { type: definition.detail, x: 18 + random % 64, y: 18 + Math.floor(random / 64) % 64 } : null,
    object,
    variation: random % 4,
  }
}

export function createWorldMapPresentation(map, tileSize, seed = '') {
  return map.tiles.map((tile) => createWorldTilePresentation(tile, map, tileSize, seed))
}
