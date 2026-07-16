import { STATIC_POI_CONFIG } from '../data/staticPoiConfig.js'

export const MAP_WIDTH = 100
export const MAP_HEIGHT = 100
export const TILE_COUNT = MAP_WIDTH * MAP_HEIGHT

export const TERRAIN = {
  GRASSLAND: 'grassland',
  FOREST: 'forest',
  ROCKY_HILLS: 'rocky_hills',
  LAKE: 'lake',
  FLOWER_FIELD: 'flower_field',
  TALL_GRASS: 'tall_grass',
  SEA: 'sea',
  MOUNTAINS: 'mountains',
  RIVER: 'river', ROAD: 'road', BRIDGE: 'bridge', FARM: 'farm',
  CITY_WALL: 'city_wall', CITY_GATE: 'city_gate', CITY_STREET: 'city_street',
  CITY_MARKET: 'city_market', CITY_RESIDENTIAL: 'city_residential',
  VILLAGE_HOUSE: 'village_house', VILLAGE_SQUARE: 'village_square',
  INN: 'inn', RUINS: 'ruins', BANDIT_CAMP: 'bandit_camp', SHRINE: 'shrine', CAVE: 'cave',
  GRAVEL_ROAD: 'gravel_road', WOODEN_BRIDGE: 'wooden_bridge',
}

export const POI = {
  RUINS: 'ruins', CAMP: 'camp', SHRINE: 'shrine', ANCIENT_TREE: 'ancient_tree',
  CAVE_ENTRANCE: 'cave_entrance', VILLAGE: 'village', BRIDGE: 'bridge',
  WATCHTOWER: 'watchtower', BATTLEFIELD: 'battlefield',
  FORGOTTEN_CEMETERY: 'forgotten_cemetery', SACRED_GROVE: 'sacred_grove',
  BOSS_ARENA: 'boss_arena',
  CITY: 'city', INN: 'inn', BANDIT_CAMP: 'bandit_camp',
}

export const MEADOWS_GENERATION_CONFIG = Object.freeze({
  maximumAttempts: 96,
  border: { minimumDepth: 1, maximumDepth: 3, segmentLength: 24 },
  mountainRanges: { minimumCount: 3, maximumCount: 5, minimumLength: 15, maximumLength: 50, minimumWidth: 2, maximumWidth: 6, branchChance: 0.45, minimumPassWidth: 1, maximumPassWidth: 3 },
  lakes: { minimumCount: 3, maximumCount: 6, minimumSize: 20, maximumSize: 150 },
  forests: { minimumCount: 4, maximumCount: 7, minimumSize: 100, maximumSize: 500 },
  hills: { mountainRadius: 3, minimumClusters: 3, maximumClusters: 6, minimumClusterSize: 35, maximumClusterSize: 110 },
  flowerFields: { minimumClusters: 6, maximumClusters: 10, minimumSize: 25, maximumSize: 70 },
  tallGrass: { minimumClusters: 6, maximumClusters: 10, minimumSize: 30, maximumSize: 85 },
  rivers: { minimumCount: 2, maximumCount: 3, minimumLength: 28, maximumLength: 55, width: 1 },
  city: { minimumSize: 10, maximumSize: 15, margin: 12 },
  villages: { count: 3, minimumSize: 5, maximumSize: 8, minimumDistance: 18 },
  roads: { riverCost: 7, forestCost: 3, hillsCost: 4, meanderVariation: 0.35 },
  secondaryRoads: { minimumCount: 3, maximumCount: 7, riverCost: 14, forestCost: 2.5, hillsCost: 4,
    meanderVariation: 0.45, rareCityStartChance: 0.08, plazaChance: 0.55,
    eligiblePoiTypes: ['ancient_ruins', 'shrine', 'wayside_chapel', 'watchtower', 'old_cemetery', 'abandoned_hut',
      'burned_farm', 'fallen_monument', 'standing_stones', 'windmill', 'quarry', 'farmhouse', 'hermit_hut'],
    forbiddenPoiTypes: ['bandit_camp', 'wolf_den', 'spider_nest', 'ritual_site', 'hidden_cache', 'hollow_tree'],
  },
  farms: { minimumSize: 5, maximumSize: 12, fieldsPerSettlement: 2 },
  inns: { count: 4, cityCount: 1, roadsideCount: 3, size: 3, minimumDistance: 12, minimumCityDistance: 10 },
  ruins: { minimumCount: 3, maximumCount: 5, minimumSize: 1, maximumSize: 1, civilizationDistance: 14, roadDistance: 7 },
  caves: { minimumCount: 3, maximumCount: 6 },
  banditCamps: { minimumCount: 2, maximumCount: 4, size: 1, civilizationDistance: 14, roadDistance: 5 },
  shrines: { minimumCount: 3, maximumCount: 6, civilizationDistance: 8 },
  playerStart: { minimumVillageDistance: 3, maximumVillageDistance: 8, maximumRoadDistance: 2, dangerDistance: 10 },
  boss: { count: 1, minimumStartDistance: 70, minimumRoadDistance: 10, minimumCivilizationDistance: 24, forestRadius: 2, minimumForestNeighbors: 5 },
  regionZones: { civilizationRadius: 14, frontierRadius: 28 },
  sectors: { columns: 4, rows: 4, minimumSignificantElements: 1, formationTileThreshold: 20,
    maximumDominantTerrainRatio: 0.72, minimumPoiForUniformSector: 2, minimumRoadTilesForUniformSector: 5 },
  edgeZone: { width: 18 },
  placementMargins: { city: 12, village: 7, inn: 4, ruins: 2, cave: 1, banditCamp: 2, shrine: 2, boss: 3 },
  placementWeights: { centerCivilization: 1, edgeRuins: 0.12, edgeCaves: 0.2, edgeBanditCamps: 0.15, edgeShrines: 0.1, edgeBoss: 3 },
  sectorFillers: { minimumEdgeDistance: 2, candidateInset: 8, minimumFormationRadius: 7, maximumFormationRadius: 8 },
  poiSpacing: { caveEntrance: 8, shrine: 8, cryptCaveShrineGroup: 8, ruinGroup: 10, wildernessPoiGroup: 8 },
  localCoverage: { cellSize: 10, minimumInterestingTiles: 8, minimumClusterRadius: 2, maximumClusterRadius: 3 },
})

function hashSeed(input) {
  const text = String(input)
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function createSeededRandom(seed) {
  let state = hashSeed(seed) || 1
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

const randomInt = (rng, minimum, maximum) => Math.floor(rng() * (maximum - minimum + 1)) + minimum
const indexOf = (column, row) => row * MAP_WIDTH + column
const coordinatesOf = (index) => ({ column: index % MAP_WIDTH, row: Math.floor(index / MAP_WIDTH) })
const distance = (a, b) => Math.hypot(a.column - b.column, a.row - b.row)
const distanceFromEdge = (tile) => Math.min(tile.column, tile.row, MAP_WIDTH - 1 - tile.column, MAP_HEIGHT - 1 - tile.row)

const inside = (column, row, margin = 0) => column >= margin && row >= margin && column < MAP_WIDTH - margin && row < MAP_HEIGHT - margin

function paintDisk(terrain, centerColumn, centerRow, radius, type, predicate = () => true) {
  const painted = []
  for (let row = Math.floor(centerRow - radius); row <= Math.ceil(centerRow + radius); row += 1) {
    for (let column = Math.floor(centerColumn - radius); column <= Math.ceil(centerColumn + radius); column += 1) {
      if (!inside(column, row, 4) || Math.hypot(column - centerColumn, row - centerRow) > radius + 0.35) continue
      const index = indexOf(column, row)
      if (predicate(index)) {
        terrain[index] = type
        painted.push(index)
      }
    }
  }
  return painted
}

function growFormation(terrain, rng, type, targetSize, allowed, margin = 5) {
  const candidates = []
  for (let index = 0; index < TILE_COUNT; index += 1) {
    const { column, row } = coordinatesOf(index)
    if (inside(column, row, margin) && allowed.has(terrain[index])) candidates.push(index)
  }
  if (!candidates.length) return []
  const start = candidates[randomInt(rng, 0, candidates.length - 1)]
  const claimed = new Set([start])
  const frontier = new Set(neighbors(start).filter((index) => allowed.has(terrain[index])))
  terrain[start] = type
  while (claimed.size < targetSize && frontier.size) {
    const options = [...frontier]
    const scored = options.map((index) => {
      const adjacent = neighbors(index).filter((neighbor) => claimed.has(neighbor)).length
      return { index, score: adjacent * 2.5 + rng() }
    }).sort((a, b) => b.score - a.score || a.index - b.index)
    const chosen = scored[Math.min(scored.length - 1, randomInt(rng, 0, Math.min(3, scored.length - 1)))].index
    frontier.delete(chosen)
    const { column, row } = coordinatesOf(chosen)
    if (!inside(column, row, margin) || !allowed.has(terrain[chosen])) continue
    terrain[chosen] = type
    claimed.add(chosen)
    for (const neighbor of neighbors(chosen)) if (allowed.has(terrain[neighbor])) frontier.add(neighbor)
  }
  return [...claimed]
}

function removeIsolatedTerrain(terrain, type, replacement) {
  const isolated = []
  for (let index = 0; index < TILE_COUNT; index += 1) {
    if (terrain[index] === type && !neighbors(index).some((neighbor) => terrain[neighbor] === type)) isolated.push(index)
  }
  for (const index of isolated) terrain[index] = replacement
}

function generateMountainRanges(terrain, rng) {
  const config = MEADOWS_GENERATION_CONFIG.mountainRanges
  const ranges = []
  const count = randomInt(rng, config.minimumCount, config.maximumCount)
  for (let rangeIndex = 0; rangeIndex < count; rangeIndex += 1) {
    const length = randomInt(rng, config.minimumLength, config.maximumLength)
    const width = randomInt(rng, config.minimumWidth, config.maximumWidth)
    let column = randomInt(rng, 12, MAP_WIDTH - 13)
    let row = randomInt(rng, 12, MAP_HEIGHT - 13)
    let angle = rng() * Math.PI * 2
    const centerline = []
    const tileIds = new Set()
    for (let step = 0; step < length; step += 1) {
      centerline.push({ column: Math.round(column), row: Math.round(row) })
      for (const id of paintDisk(terrain, column, row, width / 2, TERRAIN.MOUNTAINS)) tileIds.add(id)
      angle += (rng() - 0.5) * 0.34 + Math.sin(step * 0.22 + rangeIndex) * 0.045
      column += Math.cos(angle)
      row += Math.sin(angle)
      if (!inside(column, row, 9)) angle += Math.PI * 0.72
      if (rng() < config.branchChance / Math.max(8, length)) {
        const branchAngle = angle + (rng() < 0.5 ? -1 : 1) * (0.6 + rng() * 0.5)
        for (let branchStep = 0; branchStep < Math.floor(length * 0.35); branchStep += 1) {
          const bx = column + Math.cos(branchAngle) * branchStep
          const by = row + Math.sin(branchAngle) * branchStep
          for (const id of paintDisk(terrain, bx, by, Math.max(1, width / 2 - 1), TERRAIN.MOUNTAINS)) tileIds.add(id)
        }
      }
    }
    ranges.push({ id: rangeIndex, length, width, centerline, tileIds: [...tileIds], passageIds: [] })
  }
  // Carve passes only after every range exists so later ranges cannot repaint them.
  for (const range of ranges) {
    const passPosition = randomInt(rng, Math.floor(range.centerline.length * 0.25), Math.max(1, Math.floor(range.centerline.length * 0.75)))
    const passCenter = range.centerline[passPosition]
    const before = range.centerline[Math.max(0, passPosition - 1)]
    const after = range.centerline[Math.min(range.centerline.length - 1, passPosition + 1)]
    const tangentAngle = Math.atan2(after.row - before.row, after.column - before.column)
    const normalAngle = tangentAngle + Math.PI / 2
    const passWidth = randomInt(rng, config.minimumPassWidth, config.maximumPassWidth)
    const passages = new Set()
    for (let along = -Math.floor((passWidth - 1) / 2); along <= Math.ceil((passWidth - 1) / 2); along += 1) {
      for (let across = -Math.ceil(range.width / 2) - 2; across <= Math.ceil(range.width / 2) + 2; across += 1) {
        const column = Math.round(passCenter.column + Math.cos(tangentAngle) * along + Math.cos(normalAngle) * across)
        const row = Math.round(passCenter.row + Math.sin(tangentAngle) * along + Math.sin(normalAngle) * across)
        if (!inside(column, row, 4)) continue
        const id = indexOf(column, row)
        if (terrain[id] === TERRAIN.MOUNTAINS) {
          terrain[id] = TERRAIN.ROCKY_HILLS
          passages.add(id)
        }
      }
    }
    range.passWidth = passWidth
    range.passageIds = [...passages]
  }
  return ranges
}

function generateRivers(terrain, rng) {
  const config = MEADOWS_GENERATION_CONFIG.rivers
  const rivers = []
  for (let riverIndex = 0; riverIndex < randomInt(rng, config.minimumCount, config.maximumCount); riverIndex += 1) {
    let column = randomInt(rng, 10, MAP_WIDTH - 11)
    let row = randomInt(rng, 10, MAP_HEIGHT - 11)
    const horizontal = rng() < 0.5
    const direction = rng() < 0.5 ? -1 : 1
    const length = randomInt(rng, config.minimumLength, config.maximumLength)
    const tileIds = new Set()
    for (let step = 0; step < length; step += 1) {
      const id = indexOf(Math.round(column), Math.round(row))
      if ([TERRAIN.GRASSLAND, TERRAIN.ROCKY_HILLS].includes(terrain[id])) {
        terrain[id] = TERRAIN.RIVER
        tileIds.add(id)
      }
      if (horizontal) {
        column += direction
        row += Math.sin(step * 0.28 + riverIndex) * 0.42 + (rng() - 0.5) * 0.35
      } else {
        row += direction
        column += Math.sin(step * 0.28 + riverIndex) * 0.42 + (rng() - 0.5) * 0.35
      }
      if (!inside(Math.round(column), Math.round(row), 7)) break
    }
    if (tileIds.size >= 12) rivers.push({ id: riverIndex, tileIds: [...tileIds] })
  }
  return rivers
}

function generateTerrain(rng) {
  const terrain = Array(TILE_COUNT).fill(TERRAIN.GRASSLAND)
  const formations = { mountainRanges: [], rivers: [], lakes: [], forests: [], hillClusters: [] }
  formations.mountainRanges = generateMountainRanges(terrain, rng)
  formations.rivers = generateRivers(terrain, rng)

  const lakeConfig = MEADOWS_GENERATION_CONFIG.lakes
  for (let index = 0; index < randomInt(rng, lakeConfig.minimumCount, lakeConfig.maximumCount); index += 1) {
    formations.lakes.push(growFormation(terrain, rng, TERRAIN.LAKE,
      randomInt(rng, lakeConfig.minimumSize, lakeConfig.maximumSize), new Set([TERRAIN.GRASSLAND])))
  }

  const forestConfig = MEADOWS_GENERATION_CONFIG.forests
  for (let index = 0; index < randomInt(rng, forestConfig.minimumCount, forestConfig.maximumCount); index += 1) {
    formations.forests.push(growFormation(terrain, rng, TERRAIN.FOREST,
      randomInt(rng, forestConfig.minimumSize, forestConfig.maximumSize), new Set([TERRAIN.GRASSLAND])))
  }

  const mountainIds = new Set(formations.mountainRanges.flatMap((range) => range.tileIds))
  for (const mountainId of mountainIds) {
    const origin = coordinatesOf(mountainId)
    for (let row = origin.row - 3; row <= origin.row + 3; row += 1) {
      for (let column = origin.column - 3; column <= origin.column + 3; column += 1) {
        if (!inside(column, row, 4)) continue
        const id = indexOf(column, row)
        if (terrain[id] === TERRAIN.GRASSLAND && Math.hypot(column - origin.column, row - origin.row) <= 3 && rng() < 0.24) terrain[id] = TERRAIN.ROCKY_HILLS
      }
    }
  }
  const hillConfig = MEADOWS_GENERATION_CONFIG.hills
  for (let index = 0; index < randomInt(rng, hillConfig.minimumClusters, hillConfig.maximumClusters); index += 1) {
    formations.hillClusters.push(growFormation(terrain, rng, TERRAIN.ROCKY_HILLS,
      randomInt(rng, hillConfig.minimumClusterSize, hillConfig.maximumClusterSize), new Set([TERRAIN.GRASSLAND])))
  }

  for (const [type, config] of [[TERRAIN.FLOWER_FIELD, MEADOWS_GENERATION_CONFIG.flowerFields], [TERRAIN.TALL_GRASS, MEADOWS_GENERATION_CONFIG.tallGrass]]) {
    for (let index = 0; index < randomInt(rng, config.minimumClusters, config.maximumClusters); index += 1) {
      growFormation(terrain, rng, type, randomInt(rng, config.minimumSize, config.maximumSize), new Set([TERRAIN.GRASSLAND]))
    }
  }
  applyBorderBarrier(terrain, rng)
  removeIsolatedTerrain(terrain, TERRAIN.MOUNTAINS, TERRAIN.ROCKY_HILLS)
  return { terrain, formations }
}

function applyBorderBarrier(terrain, rng) {
  const config = MEADOWS_GENERATION_CONFIG.border
  const sidePhases = Array.from({ length: 4 }, () => rng() * Math.PI * 2)
  const sideOffsets = Array.from({ length: 4 }, () => randomInt(rng, 0, 40))

  for (let row = 0; row < MAP_HEIGHT; row += 1) {
    for (let column = 0; column < MAP_WIDTH; column += 1) {
      const distances = [row, MAP_WIDTH - 1 - column, MAP_HEIGHT - 1 - row, column]
      const edgeDistance = Math.min(...distances)
      if (edgeDistance >= config.maximumDepth) continue

      const side = distances.indexOf(edgeDistance)
      const position = side % 2 === 0 ? column : row
      const wave = Math.sin(position * 0.16 + sidePhases[side])
      const thickness = wave < -0.34 ? config.minimumDepth : wave > 0.34 ? config.maximumDepth : 2
      if (edgeDistance >= thickness) continue

      const segment = Math.floor((position + sideOffsets[side]) / config.segmentLength)
      terrain[indexOf(column, row)] = segment % 2 === 0 ? TERRAIN.SEA : TERRAIN.MOUNTAINS
    }
  }
}

const isWalkableTerrain = (terrain) => ![TERRAIN.LAKE, TERRAIN.SEA, TERRAIN.MOUNTAINS, TERRAIN.RIVER, TERRAIN.CITY_WALL].includes(terrain)

function neighbors(index) {
  const { column, row } = coordinatesOf(index)
  const result = []
  if (row > 0) result.push(index - MAP_WIDTH)
  if (column < MAP_WIDTH - 1) result.push(index + 1)
  if (row < MAP_HEIGHT - 1) result.push(index + MAP_WIDTH)
  if (column > 0) result.push(index - 1)
  return result
}

function floodFill(tiles, startIndex) {
  const visited = new Uint8Array(TILE_COUNT)
  const queue = new Int32Array(TILE_COUNT)
  let head = 0
  let tail = 0
  queue[tail++] = startIndex
  visited[startIndex] = 1
  while (head < tail) {
    const current = queue[head++]
    for (const next of neighbors(current)) {
      if (!visited[next] && tiles[next].walkable) {
        visited[next] = 1
        queue[tail++] = next
      }
    }
  }
  return { visited, count: tail }
}

function chooseStart(terrain, rng) {
  const center = { column: MAP_WIDTH / 2, row: MAP_HEIGHT / 2 }
  const candidates = []
  const startAreaMinimum = Math.floor(MAP_WIDTH * 0.3)
  const startAreaMaximum = Math.ceil(MAP_WIDTH * 0.7)
  for (let row = startAreaMinimum; row < startAreaMaximum; row += 1) {
    for (let column = startAreaMinimum; column < startAreaMaximum; column += 1) {
      const index = indexOf(column, row)
      if (![TERRAIN.GRASSLAND, TERRAIN.FLOWER_FIELD].includes(terrain[index])) continue
      const openNeighbors = neighbors(index).filter((neighbor) => isWalkableTerrain(terrain[neighbor])).length
      if (openNeighbors >= 3) candidates.push({ index, score: distance({ column, row }, center) + rng() * 25 })
    }
  }
  candidates.sort((a, b) => a.score - b.score || a.index - b.index)
  return candidates[0]?.index ?? indexOf(Math.floor(MAP_WIDTH / 2), Math.floor(MAP_HEIGHT / 2))
}

function shuffledCandidates(tiles, allowedTerrains, rng, predicate = null) {
  const result = []
  for (const tile of tiles) {
    if (tile.pointOfInterest || !allowedTerrains.includes(tile.terrain) || (predicate && !predicate(tile))) continue
    result.push({ tile, order: rng() })
  }
  result.sort((a, b) => a.order - b.order)
  return result.map((entry) => entry.tile)
}

function placeSeparated(tiles, type, count, allowed, rng, minimumDistance, predicate = null) {
  const placed = []
  for (const tile of shuffledCandidates(tiles, allowed, rng, predicate)) {
    if (placed.every((other) => distance(tile, other) >= minimumDistance)) {
      tile.pointOfInterest = type
      placed.push(tile)
      if (placed.length === count) break
    }
  }
  return placed
}

const isNearTerrain = (tiles, tile, terrainTypes, radius = 2) => {
  for (let row = tile.row - radius; row <= tile.row + radius; row += 1) {
    for (let column = tile.column - radius; column <= tile.column + radius; column += 1) {
      if (inside(column, row) && terrainTypes.includes(tiles[indexOf(column, row)].terrain)) return true
    }
  }
  return false
}

function placePointsOfInterest(tiles, startTile, rng) {
  const locations = {}
  locations[POI.VILLAGE] = placeSeparated(tiles, POI.VILLAGE, randomInt(rng, 2, 4), [TERRAIN.GRASSLAND], rng, 28,
    (tile) => neighbors(tile.id).every((index) => tiles[index].walkable))
  locations[POI.RUINS] = placeSeparated(tiles, POI.RUINS, randomInt(rng, 10, 20),
    [TERRAIN.GRASSLAND, TERRAIN.FOREST, TERRAIN.ROCKY_HILLS], rng, 7,
    (tile) => distance(tile, startTile) > 6 && isNearTerrain(tiles, tile, [TERRAIN.FOREST, TERRAIN.ROCKY_HILLS], 3))
  locations[POI.CAMP] = placeSeparated(tiles, POI.CAMP, randomInt(rng, 8, 16),
    [TERRAIN.GRASSLAND, TERRAIN.FOREST, TERRAIN.TALL_GRASS], rng, 7)
  locations[POI.SHRINE] = placeSeparated(tiles, POI.SHRINE, randomInt(rng, 4, 8),
    [TERRAIN.GRASSLAND, TERRAIN.FLOWER_FIELD], rng, 13,
    (tile) => distance(tile, startTile) > 12 && neighbors(tile.id).every((id) => tiles[id].walkable && tiles[id].terrain !== TERRAIN.FOREST))
  locations[POI.ANCIENT_TREE] = placeSeparated(tiles, POI.ANCIENT_TREE, randomInt(rng, 3, 6),
    [TERRAIN.FOREST, TERRAIN.FLOWER_FIELD], rng, 24)
  locations[POI.CAVE_ENTRANCE] = placeSeparated(tiles, POI.CAVE_ENTRANCE, randomInt(rng, 4, 10),
    [TERRAIN.ROCKY_HILLS], rng, 10, (tile) => isNearTerrain(tiles, tile, [TERRAIN.MOUNTAINS], 2))
  locations[POI.WATCHTOWER] = placeSeparated(tiles, POI.WATCHTOWER, randomInt(rng, 3, 6),
    [TERRAIN.ROCKY_HILLS], rng, 16,
    (tile) => tile.column > 8 && tile.row > 8 && tile.column < MAP_WIDTH - 9 && tile.row < MAP_HEIGHT - 9)
  locations[POI.BATTLEFIELD] = placeSeparated(tiles, POI.BATTLEFIELD, randomInt(rng, 2, 5),
    [TERRAIN.GRASSLAND, TERRAIN.TALL_GRASS], rng, 22,
    (tile) => distance(tile, startTile) > 12 && locations[POI.VILLAGE].every((village) => distance(tile, village) > 14))
  locations[POI.FORGOTTEN_CEMETERY] = placeSeparated(tiles, POI.FORGOTTEN_CEMETERY, randomInt(rng, 1, 3),
    [TERRAIN.FOREST, TERRAIN.TALL_GRASS], rng, 26, (tile) => distance(tile, startTile) > 30)
  locations[POI.SACRED_GROVE] = placeSeparated(tiles, POI.SACRED_GROVE, randomInt(rng, 1, 2),
    [TERRAIN.FOREST], rng, 30, (tile) => distance(tile, startTile) > 30)

  const bossCandidates = shuffledCandidates(tiles,
    [TERRAIN.GRASSLAND, TERRAIN.FOREST, TERRAIN.ROCKY_HILLS], rng,
    (tile) => tile.walkable && distance(tile, startTile) > 45 && neighbors(tile.id).some((index) => tiles[index].walkable))
  const boss = bossCandidates[0] || tiles.find((tile) => tile.walkable && distance(tile, startTile) > 38)
  if (boss) boss.pointOfInterest = POI.BOSS_ARENA
  locations[POI.BOSS_ARENA] = boss ? [boss] : []

  const bridges = []
  for (const tile of shuffledCandidates(tiles, [TERRAIN.LAKE], rng)) {
    const walkableBanks = neighbors(tile.id).filter((index) => tiles[index].walkable)
    if (walkableBanks.length >= 2) {
      tile.pointOfInterest = POI.BRIDGE
      tile.walkable = true
      bridges.push(tile)
      if (bridges.length === 3) break
    }
  }
  locations[POI.BRIDGE] = bridges
  return locations
}

const rectIds = (left, top, width, height) => {
  const ids = []
  for (let row = top; row < top + height; row += 1) for (let column = left; column < left + width; column += 1) ids.push(indexOf(column, row))
  return ids
}

function findOpenRect(tiles, rng, width, height, excluded = [], minimumDistance = 0, margin = 6) {
  for (let attempt = 0; attempt < 700; attempt += 1) {
    const left = randomInt(rng, margin, MAP_WIDTH - width - margin - 1)
    const top = randomInt(rng, margin, MAP_HEIGHT - height - margin - 1)
    const center = { column: left + Math.floor(width / 2), row: top + Math.floor(height / 2) }
    if (excluded.some((other) => distance(center, other.center) < minimumDistance)) continue
    const ids = rectIds(left - 1, top - 1, width + 2, height + 2)
    if (ids.every((id) => [TERRAIN.GRASSLAND, TERRAIN.FLOWER_FIELD, TERRAIN.TALL_GRASS].includes(tiles[id].terrain))) {
      return { left, top, width, height, center, tileIds: rectIds(left, top, width, height) }
    }
  }
  return null
}

function buildCity(tiles, rng) {
  const config = MEADOWS_GENERATION_CONFIG.city
  const width = randomInt(rng, config.minimumSize, config.maximumSize)
  const height = randomInt(rng, config.minimumSize, config.maximumSize)
  const city = findOpenRect(tiles, rng, width, height, [], 0, MEADOWS_GENERATION_CONFIG.placementMargins.city)
  if (!city) return null
  city.id = 'capital'
  city.wallIds = []; city.gateIds = []; city.streetIds = []; city.marketIds = []; city.residentialIds = []
  const centerColumn = city.center.column; const centerRow = city.center.row
  const gateCoordinates = new Set([
    `${centerColumn},${city.top}`, `${centerColumn},${city.top + height - 1}`,
    `${city.left},${centerRow}`, `${city.left + width - 1},${centerRow}`,
  ])
  for (const id of city.tileIds) {
    const tile = tiles[id]
    tile.settlementType = 'city'
    const edge = tile.column === city.left || tile.column === city.left + width - 1 || tile.row === city.top || tile.row === city.top + height - 1
    const gate = gateCoordinates.has(`${tile.column},${tile.row}`)
    const market = Math.abs(tile.column - centerColumn) <= 1 && Math.abs(tile.row - centerRow) <= 1
    const street = tile.column === centerColumn || tile.row === centerRow
    if (gate) { tile.terrain = TERRAIN.CITY_GATE; city.gateIds.push(id) }
    else if (edge) { tile.terrain = TERRAIN.CITY_WALL; city.wallIds.push(id) }
    else if (market) { tile.terrain = TERRAIN.CITY_MARKET; city.marketIds.push(id) }
    else if (street) { tile.terrain = TERRAIN.CITY_STREET; city.streetIds.push(id) }
    else { tile.terrain = TERRAIN.CITY_RESIDENTIAL; city.residentialIds.push(id) }
    tile.walkable = isWalkableTerrain(tile.terrain)
  }
  const centerTile = tiles[indexOf(centerColumn, centerRow)]
  centerTile.pointOfInterest = POI.CITY
  return city
}

function buildVillage(tiles, rng, id, excluded) {
  const config = MEADOWS_GENERATION_CONFIG.villages
  const width = randomInt(rng, config.minimumSize, config.maximumSize)
  const height = randomInt(rng, config.minimumSize, config.maximumSize)
  const village = findOpenRect(tiles, rng, width, height, excluded, config.minimumDistance, MEADOWS_GENERATION_CONFIG.placementMargins.village)
  if (!village) return null
  village.id = `village-${id}`; village.houseIds = []; village.roadIds = []; village.squareIds = []
  for (const tileId of village.tileIds) {
    const tile = tiles[tileId]
    tile.settlementType = 'village'
    const square = Math.abs(tile.column - village.center.column) <= 1 && Math.abs(tile.row - village.center.row) <= 1
    const road = tile.column === village.center.column || tile.row === village.center.row
    tile.terrain = square ? TERRAIN.VILLAGE_SQUARE : road ? TERRAIN.ROAD : TERRAIN.VILLAGE_HOUSE
    ;(square ? village.squareIds : road ? village.roadIds : village.houseIds).push(tileId)
    tile.walkable = true
  }
  tiles[indexOf(village.center.column, village.center.row)].pointOfInterest = POI.VILLAGE
  return village
}

function routeBetween(tiles, from, to, rng) {
  const blocked = new Set([TERRAIN.MOUNTAINS, TERRAIN.LAKE, TERRAIN.SEA, TERRAIN.CITY_WALL])
  const costs = new Float64Array(TILE_COUNT); costs.fill(Infinity); costs[from] = 0
  const previous = new Int32Array(TILE_COUNT); previous.fill(-1)
  const open = [{ id: from, cost: 0 }]
  while (open.length) {
    open.sort((a, b) => b.cost - a.cost)
    const current = open.pop()
    if (current.cost !== costs[current.id]) continue
    if (current.id === to) break
    for (const next of neighbors(current.id)) {
      if (blocked.has(tiles[next].terrain) && next !== to) continue
      const terrain = tiles[next].terrain
      const step = terrain === TERRAIN.RIVER ? MEADOWS_GENERATION_CONFIG.roads.riverCost
        : terrain === TERRAIN.FOREST ? MEADOWS_GENERATION_CONFIG.roads.forestCost
          : terrain === TERRAIN.ROCKY_HILLS ? MEADOWS_GENERATION_CONFIG.roads.hillsCost : 1
      const meander = 1 + rng() * MEADOWS_GENERATION_CONFIG.roads.meanderVariation
      const nextCost = current.cost + step * meander
      if (nextCost < costs[next]) { costs[next] = nextCost; previous[next] = current.id; open.push({ id: next, cost: nextCost }) }
    }
  }
  if (previous[to] < 0) return []
  const path = [to]
  while (path[0] !== from) path.unshift(previous[path[0]])
  return path
}

function buildRoadNetwork(tiles, city, villages, rng) {
  const connections = []; const roadIds = new Set(); const bridgeIds = new Set()
  const cityGate = city.gateIds[0]
  for (const village of villages) {
    const target = indexOf(village.center.column, village.center.row)
    const pathIds = routeBetween(tiles, cityGate, target, rng)
    for (const id of pathIds) {
      if (tiles[id].terrain === TERRAIN.RIVER) { tiles[id].terrain = TERRAIN.BRIDGE; tiles[id].pointOfInterest = POI.BRIDGE; bridgeIds.add(id) }
      else if (![TERRAIN.CITY_GATE, TERRAIN.CITY_STREET, TERRAIN.CITY_MARKET, TERRAIN.VILLAGE_SQUARE, TERRAIN.VILLAGE_HOUSE].includes(tiles[id].terrain)) tiles[id].terrain = TERRAIN.ROAD
      tiles[id].walkable = true; roadIds.add(id)
    }
    connections.push({ from: city.id, to: village.id, pathIds })
  }
  return { roadIds: [...roadIds], bridgeIds: [...bridgeIds], connections }
}

function paintFeatureRect(tiles, left, top, width, height, terrain, protectedTypes = []) {
  const ids = rectIds(left, top, width, height)
  if (!ids.every((id) => inside(tiles[id].column, tiles[id].row, 4) && !protectedTypes.includes(tiles[id].terrain))) return []
  for (const id of ids) { tiles[id].terrain = terrain; tiles[id].walkable = isWalkableTerrain(terrain) }
  return ids
}

function buildFarms(tiles, rng, settlements) {
  const farms = []
  for (const settlement of settlements) {
    for (let field = 0; field < MEADOWS_GENERATION_CONFIG.farms.fieldsPerSettlement; field += 1) {
      const width = randomInt(rng, MEADOWS_GENERATION_CONFIG.farms.minimumSize, MEADOWS_GENERATION_CONFIG.farms.maximumSize)
      const height = randomInt(rng, MEADOWS_GENERATION_CONFIG.farms.minimumSize, MEADOWS_GENERATION_CONFIG.farms.maximumSize)
      const side = field % 2 === 0 ? -1 : 1
      const left = Math.max(4, Math.min(MAP_WIDTH - width - 5, settlement.left + side * (settlement.width + 2)))
      const top = Math.max(4, Math.min(MAP_HEIGHT - height - 5, settlement.top + field * 3))
      const allowed = new Set([TERRAIN.GRASSLAND, TERRAIN.FLOWER_FIELD, TERRAIN.TALL_GRASS, TERRAIN.FOREST])
      const ids = rectIds(left, top, width, height).filter((id) => allowed.has(tiles[id].terrain))
      for (const id of ids) { tiles[id].terrain = TERRAIN.FARM; tiles[id].walkable = true }
      if (ids.length >= 12) farms.push({ settlementId: settlement.id, tileIds: ids })
    }
  }
  return farms
}

function nearAnyId(tile, ids, radius) {
  return ids.some((id) => { const other = coordinatesOf(id); return Math.abs(tile.column - other.column) <= radius && Math.abs(tile.row - other.row) <= radius })
}

function shuffle(items, rng) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(rng, 0, index)
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function preferEdge(items, rng, weight) {
  return items.map((tile) => ({ tile, score: distanceFromEdge(tile) * weight + rng() * MEADOWS_GENERATION_CONFIG.edgeZone.width }))
    .sort((a, b) => a.score - b.score || a.tile.id - b.tile.id)
    .map((entry) => entry.tile)
}

function buildRemoteFeatures(tiles, rng, city, villages, roads) {
  const civilization = [city, ...villages]
  const structures = { inns: [], ruins: [], caves: [], banditCamps: [], shrines: [] }
  const innConfig = MEADOWS_GENERATION_CONFIG.inns
  const cityInnCenter = tiles[city.residentialIds.find((id) => {
    const tile = tiles[id]
    return tile.column >= city.left + 2 && tile.column <= city.left + city.width - 3
      && tile.row >= city.top + 2 && tile.row <= city.top + city.height - 3
  })]
  if (cityInnCenter) {
    const ids = paintFeatureRect(tiles, cityInnCenter.column - 1, cityInnCenter.row - 1, innConfig.size, innConfig.size, TERRAIN.INN, [TERRAIN.CITY_WALL, TERRAIN.CITY_GATE])
    if (ids.length) {
      tiles[cityInnCenter.id].pointOfInterest = POI.INN
      structures.inns.push({ id: 'city-inn', centerId: cityInnCenter.id, tileIds: ids, insideCity: true })
    }
  }

  const usedCenters = cityInnCenter ? [cityInnCenter] : []
  const roadCandidates = shuffle(roads.roadIds.map((id) => tiles[id]).filter((tile) => tile.terrain === TERRAIN.ROAD), rng)
  for (const candidate of roadCandidates) {
    if (structures.inns.length >= innConfig.count) break
    if (usedCenters.some((center) => distance(candidate, center) < MEADOWS_GENERATION_CONFIG.inns.minimumDistance)) continue
    if (distance(candidate, city.center) < innConfig.minimumCityDistance) continue
    const ids = paintFeatureRect(tiles, candidate.column - 1, candidate.row - 1, innConfig.size, innConfig.size, TERRAIN.INN,
      [TERRAIN.RIVER, TERRAIN.BRIDGE, TERRAIN.MOUNTAINS, TERRAIN.LAKE, TERRAIN.SEA, TERRAIN.CITY_WALL])
    if (ids.length) { tiles[candidate.id].pointOfInterest = POI.INN; structures.inns.push({ id: `roadside-inn-${structures.inns.length}`, centerId: candidate.id, tileIds: ids, insideCity: false }); usedCenters.push(candidate) }
  }

  const baseCandidates = tiles.filter((tile) => [TERRAIN.GRASSLAND, TERRAIN.FLOWER_FIELD, TERRAIN.TALL_GRASS, TERRAIN.ROCKY_HILLS].includes(tile.terrain))
  const candidates = preferEdge(baseCandidates, rng, MEADOWS_GENERATION_CONFIG.placementWeights.edgeRuins)
  const farFromCivilization = (tile, minimum) => civilization.every((place) => distance(tile, place.center) >= minimum)
  const ruinTarget = randomInt(rng, MEADOWS_GENERATION_CONFIG.ruins.minimumCount, MEADOWS_GENERATION_CONFIG.ruins.maximumCount)
  for (const tile of preferEdge(baseCandidates, rng, MEADOWS_GENERATION_CONFIG.placementWeights.edgeBanditCamps)) {
    if (structures.ruins.length >= ruinTarget) break
    if (!farFromCivilization(tile, MEADOWS_GENERATION_CONFIG.ruins.civilizationDistance) || nearAnyId(tile, roads.roadIds, MEADOWS_GENERATION_CONFIG.ruins.roadDistance)) continue
    if (structures.ruins.some((ruin) => distance(tile, tiles[ruin.centerId]) < MEADOWS_GENERATION_CONFIG.poiSpacing.ruinGroup)) continue
    const size = randomInt(rng, MEADOWS_GENERATION_CONFIG.ruins.minimumSize, MEADOWS_GENERATION_CONFIG.ruins.maximumSize)
    const ids = paintFeatureRect(tiles, tile.column, tile.row, size, size, TERRAIN.RUINS,
      [TERRAIN.RIVER, TERRAIN.BRIDGE, TERRAIN.MOUNTAINS, TERRAIN.LAKE, TERRAIN.SEA, TERRAIN.ROAD, TERRAIN.FARM, TERRAIN.INN])
    if (ids.length) { tiles[tile.id].pointOfInterest = POI.RUINS; structures.ruins.push({ centerId: tile.id, tileIds: ids }) }
  }

  const caveTarget = randomInt(rng, MEADOWS_GENERATION_CONFIG.caves.minimumCount, MEADOWS_GENERATION_CONFIG.caves.maximumCount)
  for (const tile of tiles.filter((item) => item.terrain === TERRAIN.ROCKY_HILLS && isNearTerrain(tiles, item, [TERRAIN.MOUNTAINS], 1))
    .map((tile) => ({ tile, score: distanceFromEdge(tile) * MEADOWS_GENERATION_CONFIG.placementWeights.edgeCaves + rng() * MEADOWS_GENERATION_CONFIG.edgeZone.width }))
    .sort((a, b) => a.score - b.score || a.tile.id - b.tile.id).map((entry) => entry.tile)) {
    if (structures.caves.length >= caveTarget) break
    if (structures.caves.some((cave) => distance(tile, tiles[cave.centerId]) < MEADOWS_GENERATION_CONFIG.poiSpacing.caveEntrance)) continue
    if (structures.ruins.some((ruin) => distance(tile, tiles[ruin.centerId]) < MEADOWS_GENERATION_CONFIG.poiSpacing.wildernessPoiGroup)) continue
    tile.terrain = TERRAIN.CAVE; tile.pointOfInterest = POI.CAVE_ENTRANCE; structures.caves.push({ centerId: tile.id, tileIds: [tile.id] })
  }

  const campTarget = randomInt(rng, MEADOWS_GENERATION_CONFIG.banditCamps.minimumCount, MEADOWS_GENERATION_CONFIG.banditCamps.maximumCount)
  for (const tile of preferEdge(baseCandidates, rng, MEADOWS_GENERATION_CONFIG.placementWeights.edgeBanditCamps)) {
    if (structures.banditCamps.length >= campTarget) break
    if (!farFromCivilization(tile, MEADOWS_GENERATION_CONFIG.banditCamps.civilizationDistance)
      || nearAnyId(tile, roads.roadIds, MEADOWS_GENERATION_CONFIG.banditCamps.roadDistance)
      || !isNearTerrain(tiles, tile, [TERRAIN.FOREST], 2)) continue
    const ids = paintFeatureRect(tiles, tile.column, tile.row, MEADOWS_GENERATION_CONFIG.banditCamps.size, MEADOWS_GENERATION_CONFIG.banditCamps.size, TERRAIN.BANDIT_CAMP,
      [TERRAIN.RIVER, TERRAIN.MOUNTAINS, TERRAIN.LAKE, TERRAIN.SEA, TERRAIN.ROAD, TERRAIN.RUINS, TERRAIN.INN])
    if (ids.length) { tiles[tile.id].pointOfInterest = POI.BANDIT_CAMP; structures.banditCamps.push({ centerId: tile.id, tileIds: ids }) }
  }

  const shrineTarget = randomInt(rng, MEADOWS_GENERATION_CONFIG.shrines.minimumCount, MEADOWS_GENERATION_CONFIG.shrines.maximumCount)
  for (const tile of preferEdge(baseCandidates, rng, MEADOWS_GENERATION_CONFIG.placementWeights.edgeShrines)) {
    if (structures.shrines.length >= shrineTarget) break
    if (!farFromCivilization(tile, MEADOWS_GENERATION_CONFIG.shrines.civilizationDistance)
      || !isNearTerrain(tiles, tile, [TERRAIN.ROCKY_HILLS, TERRAIN.FOREST], 2) || tile.pointOfInterest) continue
    if (structures.caves.some((cave) => distance(tile, tiles[cave.centerId]) < MEADOWS_GENERATION_CONFIG.poiSpacing.cryptCaveShrineGroup)) continue
    if (structures.shrines.some((shrine) => distance(tile, tiles[shrine.centerId]) < MEADOWS_GENERATION_CONFIG.poiSpacing.shrine)) continue
    if (structures.ruins.some((ruin) => distance(tile, tiles[ruin.centerId]) < MEADOWS_GENERATION_CONFIG.poiSpacing.wildernessPoiGroup)) continue
    tile.terrain = TERRAIN.SHRINE; tile.pointOfInterest = POI.SHRINE; structures.shrines.push({ centerId: tile.id, tileIds: [tile.id] })
  }
  return structures
}

function generateCivilization(tiles, rng) {
  const city = buildCity(tiles, rng)
  if (!city) return null
  const villages = []
  for (let id = 0; id < MEADOWS_GENERATION_CONFIG.villages.count; id += 1) {
    const village = buildVillage(tiles, rng, id, [city, ...villages])
    if (!village) return null
    villages.push(village)
  }
  const roads = buildRoadNetwork(tiles, city, villages, rng)
  if (roads.connections.some((connection) => !connection.pathIds.length)) return null
  const farms = buildFarms(tiles, rng, [city, ...villages])
  const structures = buildRemoteFeatures(tiles, rng, city, villages, roads)
  return { settlements: { city, villages }, roadNetwork: roads, farms, structures }
}

function choosePlayerStart(tiles, region, rng) {
  const config = MEADOWS_GENERATION_CONFIG.playerStart
  const dangers = [
    ...region.structures.ruins, ...region.structures.caves,
    ...region.structures.banditCamps,
  ].map((structure) => tiles[structure.centerId])
  const candidates = []
  for (const village of region.settlements.villages) {
    for (const tile of tiles) {
      const villageDistance = distance(tile, village.center)
      if (villageDistance < config.minimumVillageDistance || villageDistance > config.maximumVillageDistance) continue
      if (!tile.walkable || region.settlements.city.tileIds.includes(tile.id)) continue
      if (!nearAnyId(tile, region.roadNetwork.roadIds, config.maximumRoadDistance)) continue
      if (dangers.some((danger) => distance(tile, danger) < config.dangerDistance)) continue
      candidates.push({ tile, villageId: village.id, villageDistance, order: rng() })
    }
  }
  candidates.sort((a, b) => a.order - b.order || a.villageDistance - b.villageDistance)
  return candidates[0] ? { index: candidates[0].tile.id, villageId: candidates[0].villageId, distanceToVillage: candidates[0].villageDistance } : null
}

function countTerrainAround(tiles, tile, terrain, radius) {
  let count = 0
  for (let row = tile.row - radius; row <= tile.row + radius; row += 1) {
    for (let column = tile.column - radius; column <= tile.column + radius; column += 1) {
      if (inside(column, row) && tiles[indexOf(column, row)].terrain === terrain) count += 1
    }
  }
  return count
}

function placeRegionBoss(tiles, region, startIndex, rng) {
  const config = MEADOWS_GENERATION_CONFIG.boss
  const start = tiles[startIndex]
  const civilization = [region.settlements.city, ...region.settlements.villages]
  const candidates = tiles.filter((tile) => tile.terrain === TERRAIN.FOREST
    && distanceFromEdge(tile) >= MEADOWS_GENERATION_CONFIG.placementMargins.boss
    && distanceFromEdge(tile) <= MEADOWS_GENERATION_CONFIG.edgeZone.width
    && distance(tile, start) >= config.minimumStartDistance
    && !nearAnyId(tile, region.roadNetwork.roadIds, config.minimumRoadDistance)
    && civilization.every((place) => distance(tile, place.center) >= config.minimumCivilizationDistance)
    && countTerrainAround(tiles, tile, TERRAIN.FOREST, config.forestRadius) >= config.minimumForestNeighbors)
    .map((tile) => ({ tile, score: distance(tile, start) + countTerrainAround(tiles, tile, TERRAIN.FOREST, config.forestRadius)
      - distanceFromEdge(tile) * MEADOWS_GENERATION_CONFIG.placementWeights.edgeBoss + rng() }))
    .sort((a, b) => b.score - a.score || a.tile.id - b.tile.id)
  const bossTile = candidates[0]?.tile
  if (!bossTile) return null
  bossTile.pointOfInterest = POI.BOSS_ARENA
  return { centerId: bossTile.id, tileIds: [bossTile.id], distanceFromStart: distance(bossTile, start) }
}

function createRegionZones(tiles, region, boss) {
  const config = MEADOWS_GENERATION_CONFIG.regionZones
  const settlements = [region.settlements.city, ...region.settlements.villages]
  const zones = { civilization: [], frontier: [], wilds: [], bossRegion: [] }
  const bossTile = tiles[boss.centerId]
  for (const tile of tiles) {
    const civilizationDistance = Math.min(...settlements.map((place) => distance(tile, place.center)))
    if (distance(tile, bossTile) <= config.civilizationRadius) zones.bossRegion.push(tile.id)
    else if (civilizationDistance <= config.civilizationRadius) zones.civilization.push(tile.id)
    else if (civilizationDistance <= config.frontierRadius) zones.frontier.push(tile.id)
    else zones.wilds.push(tile.id)
  }
  return zones
}

function sectorForTile(tile) {
  const config = MEADOWS_GENERATION_CONFIG.sectors
  return {
    column: Math.min(config.columns - 1, Math.floor(tile.column / (MAP_WIDTH / config.columns))),
    row: Math.min(config.rows - 1, Math.floor(tile.row / (MAP_HEIGHT / config.rows))),
  }
}

function analyzeSectors(tiles) {
  const config = MEADOWS_GENERATION_CONFIG.sectors
  const formationTerrains = new Set([TERRAIN.FOREST, TERRAIN.ROCKY_HILLS, TERRAIN.MOUNTAINS, TERRAIN.LAKE])
  const roadTerrains = new Set([TERRAIN.ROAD, TERRAIN.BRIDGE, TERRAIN.GRAVEL_ROAD, TERRAIN.WOODEN_BRIDGE, TERRAIN.CITY_STREET])
  const sectors = []
  for (let row = 0; row < config.rows; row += 1) {
    for (let column = 0; column < config.columns; column += 1) {
      const left = Math.floor(column * MAP_WIDTH / config.columns)
      const right = Math.floor((column + 1) * MAP_WIDTH / config.columns)
      const top = Math.floor(row * MAP_HEIGHT / config.rows)
      const bottom = Math.floor((row + 1) * MAP_HEIGHT / config.rows)
      const sectorTiles = tiles.filter((tile) => tile.column >= left && tile.column < right && tile.row >= top && tile.row < bottom)
      const poiCount = sectorTiles.filter((tile) => tile.pointOfInterest || tile.staticPoiId).length
      const roadCount = sectorTiles.filter((tile) => roadTerrains.has(tile.terrain)).length
      const formationTileCount = sectorTiles.filter((tile) => formationTerrains.has(tile.terrain)).length
      const terrainCounts = new Map()
      for (const tile of sectorTiles) terrainCounts.set(tile.terrain, (terrainCounts.get(tile.terrain) ?? 0) + 1)
      const dominantTerrainCount = Math.max(...terrainCounts.values())
      const dominantTerrainRatio = dominantTerrainCount / sectorTiles.length
      const significantElementCount = poiCount + Number(roadCount > 0) + Number(formationTileCount >= config.formationTileThreshold)
      const uniformAndSparse = dominantTerrainRatio > config.maximumDominantTerrainRatio
        && poiCount < config.minimumPoiForUniformSector && roadCount < config.minimumRoadTilesForUniformSector
      sectors.push({ id: row * config.columns + column, column, row, left, right, top, bottom,
        poiCount, roadCount, formationTileCount, significantElementCount,
        dominantTerrainRatio,
        densityScore: poiCount * 5 + Math.min(roadCount, 30) + Math.min(formationTileCount / config.formationTileThreshold, 5),
        empty: significantElementCount < config.minimumSignificantElements || uniformAndSparse })
    }
  }
  return sectors
}

function fillEmptySectors(tiles, region, rng) {
  const microPoints = []
  let sectors = analyzeSectors(tiles)
  for (const sector of sectors.filter((item) => item.empty)) {
    const candidates = []
    for (let row = sector.top + MEADOWS_GENERATION_CONFIG.sectorFillers.candidateInset; row < sector.bottom - MEADOWS_GENERATION_CONFIG.sectorFillers.candidateInset; row += 1) {
      for (let column = sector.left + MEADOWS_GENERATION_CONFIG.sectorFillers.candidateInset; column < sector.right - MEADOWS_GENERATION_CONFIG.sectorFillers.candidateInset; column += 1) {
        const tile = tiles[indexOf(column, row)]
        if (!tile.walkable || tile.pointOfInterest || [TERRAIN.ROAD, TERRAIN.BRIDGE, TERRAIN.FARM, TERRAIN.INN,
          TERRAIN.CITY_GATE, TERRAIN.CITY_STREET, TERRAIN.CITY_MARKET, TERRAIN.CITY_RESIDENTIAL,
          TERRAIN.VILLAGE_HOUSE, TERRAIN.VILLAGE_SQUARE].includes(tile.terrain)) continue
        candidates.push(tile)
      }
    }
    const selected = shuffle(candidates, rng)[0]
    if (!selected) continue
    const formationType = distanceFromEdge(selected) <= MEADOWS_GENERATION_CONFIG.edgeZone.width && rng() < 0.7
      ? TERRAIN.FOREST : rng() < 0.65 ? TERRAIN.FOREST : TERRAIN.ROCKY_HILLS
    const radius = randomInt(rng, MEADOWS_GENERATION_CONFIG.sectorFillers.minimumFormationRadius, MEADOWS_GENERATION_CONFIG.sectorFillers.maximumFormationRadius)
    for (let row = Math.max(sector.top, selected.row - radius); row < Math.min(sector.bottom, selected.row + radius + 1); row += 1) {
      for (let column = Math.max(sector.left, selected.column - radius); column < Math.min(sector.right, selected.column + radius + 1); column += 1) {
        if (Math.hypot(column - selected.column, row - selected.row) > radius + 0.35) continue
        const tile = tiles[indexOf(column, row)]
        if ([TERRAIN.GRASSLAND, TERRAIN.FLOWER_FIELD, TERRAIN.TALL_GRASS].includes(tile.terrain) && !tile.pointOfInterest && !tile.staticPoiId) {
          tile.terrain = formationType
          tile.walkable = true
        }
      }
    }
    const edge = distanceFromEdge(selected) <= MEADOWS_GENERATION_CONFIG.edgeZone.width
    selected.pointOfInterest = edge ? POI.FORGOTTEN_CEMETERY : formationType === TERRAIN.FOREST ? POI.ANCIENT_TREE : POI.WATCHTOWER
    microPoints.push({ centerId: selected.id, tileIds: [selected.id], type: selected.pointOfInterest, sectorId: sector.id })
  }
  region.microPoints = microPoints
  sectors = analyzeSectors(tiles)
  return sectors
}

function ensureLocalCoverage(tiles, rng) {
  const config = MEADOWS_GENERATION_CONFIG.localCoverage
  const interestingTerrains = new Set([
    TERRAIN.FOREST, TERRAIN.ROCKY_HILLS, TERRAIN.MOUNTAINS, TERRAIN.LAKE, TERRAIN.SEA, TERRAIN.RIVER,
    TERRAIN.ROAD, TERRAIN.BRIDGE, TERRAIN.GRAVEL_ROAD, TERRAIN.WOODEN_BRIDGE, TERRAIN.FARM, TERRAIN.INN,
    TERRAIN.CITY_WALL, TERRAIN.CITY_GATE, TERRAIN.CITY_STREET, TERRAIN.CITY_MARKET, TERRAIN.CITY_RESIDENTIAL,
    TERRAIN.VILLAGE_HOUSE, TERRAIN.VILLAGE_SQUARE,
  ])
  const cells = []
  for (let top = 0; top < MAP_HEIGHT; top += config.cellSize) {
    for (let left = 0; left < MAP_WIDTH; left += config.cellSize) {
      const right = Math.min(MAP_WIDTH, left + config.cellSize)
      const bottom = Math.min(MAP_HEIGHT, top + config.cellSize)
      const cellTiles = tiles.filter((tile) => tile.column >= left && tile.column < right && tile.row >= top && tile.row < bottom)
      const countInteresting = () => cellTiles.filter((tile) => tile.pointOfInterest || tile.staticPoiId || interestingTerrains.has(tile.terrain)).length
      let interestingTileCount = countInteresting()
      if (interestingTileCount < config.minimumInterestingTiles) {
        const candidates = shuffle(cellTiles.filter((tile) => tile.walkable && !tile.pointOfInterest && !tile.staticPoiId
          && [TERRAIN.GRASSLAND, TERRAIN.FLOWER_FIELD, TERRAIN.TALL_GRASS].includes(tile.terrain)), rng)
        const centerColumn = (left + right - 1) / 2
        const centerRow = (top + bottom - 1) / 2
        candidates.sort((a, b) => Math.hypot(a.column - centerColumn, a.row - centerRow)
          - Math.hypot(b.column - centerColumn, b.row - centerRow))
        const selected = candidates[0]
        if (selected) {
          const terrain = rng() < 0.62 ? TERRAIN.FOREST : TERRAIN.ROCKY_HILLS
          const radius = randomInt(rng, config.minimumClusterRadius, config.maximumClusterRadius)
          for (const tile of cellTiles) {
            const irregularDistance = Math.hypot(tile.column - selected.column, tile.row - selected.row) + rng() * 0.8
            if (irregularDistance > radius || tile.pointOfInterest || tile.staticPoiId) continue
            if ([TERRAIN.GRASSLAND, TERRAIN.FLOWER_FIELD, TERRAIN.TALL_GRASS].includes(tile.terrain)) {
              tile.terrain = terrain
              tile.walkable = true
            }
          }
        }
        interestingTileCount = countInteresting()
      }
      cells.push({ id: cells.length, column: Math.floor(left / config.cellSize), row: Math.floor(top / config.cellSize),
        left, right, top, bottom, interestingTileCount, empty: interestingTileCount < config.minimumInterestingTiles })
    }
  }
  return cells
}

function staticPoiMatchesPreference(tile, config, tiles, region, placed) {
  const near = config.near
  if (near === 'farm' && !isNearTerrain(tiles, tile, [TERRAIN.FARM], 2)) return false
  if (near === 'forest' && !isNearTerrain(tiles, tile, [TERRAIN.FOREST], 2)) return false
  if (near === 'deep_forest' && countTerrainAround(tiles, tile, TERRAIN.FOREST, 2) < 12) return false
  if (near === 'mountains_or_hills' && !isNearTerrain(tiles, tile, [TERRAIN.MOUNTAINS, TERRAIN.ROCKY_HILLS], 2)) return false
  if (near === 'river' && !isNearTerrain(tiles, tile, [TERRAIN.RIVER], 2)) return false
  if (near === 'road' && !nearAnyId(tile, region.roadNetwork.roadIds, 2)) return false
  if (near === 'bridge' && !nearAnyId(tile, region.roadNetwork.bridgeIds, 1)) return false
  if (near === 'ruins_or_cemetery') {
    const anchors = placed.filter((poi) => ['ancient_ruins', 'old_cemetery'].includes(poi.type)).map((poi) => poi.position.index)
    if (!nearAnyId(tile, anchors, 3) && !isNearTerrain(tiles, tile, [TERRAIN.RUINS], 3)) return false
  }
  if (config.zone === 'edge' && distanceFromEdge(tile) > MEADOWS_GENERATION_CONFIG.edgeZone.width) return false
  if (config.zone === 'wilds' && !region.zones.wilds.includes(tile.id) && !region.zones.bossRegion.includes(tile.id)) return false
  if (config.zone === 'civilization' && !region.zones.civilization.includes(tile.id)) return false
  if (config.zone === 'outside_city' && region.settlements.city.tileIds.includes(tile.id)) return false
  if (config.zone === 'far_from_roads' && nearAnyId(tile, region.roadNetwork.roadIds, MEADOWS_GENERATION_CONFIG.banditCamps.roadDistance)) return false
  return true
}

function generateStaticPois(tiles, region, seed, rng) {
  const placed = []
  const ruinTypes = new Set(['ancient_ruins', 'forgotten_temple', 'old_cemetery', 'battlefield', 'fallen_monument', 'abandoned_hut'])
  const coreWildernessTypes = new Set([POI.RUINS, POI.CAVE_ENTRANCE, POI.SHRINE])
  for (const [type, config] of Object.entries(STATIC_POI_CONFIG)) {
    const target = rng() <= config.occurrenceChance
      ? randomInt(rng, Math.max(1, config.minimumCount), config.maximumCount)
      : config.minimumCount
    if (target === 0) continue
    const candidates = shuffle(tiles.filter((tile) => tile.walkable && !tile.pointOfInterest && !tile.staticPoiId
      && config.preferredTerrains.includes(tile.terrain)), rng)
    let typeCount = 0
    for (const tile of candidates) {
      if (typeCount >= target) break
      if (!staticPoiMatchesPreference(tile, config, tiles, region, placed)) continue
      if ((ruinTypes.has(type) || ['crypt', 'shrine'].includes(type))
        && tiles.some((other) => coreWildernessTypes.has(other.pointOfInterest)
          && !(type === 'crypt' && other.pointOfInterest === POI.RUINS)
          && distance(tile, other) < (ruinTypes.has(type) && other.pointOfInterest === POI.RUINS
            ? MEADOWS_GENERATION_CONFIG.poiSpacing.ruinGroup
            : MEADOWS_GENERATION_CONFIG.poiSpacing.wildernessPoiGroup))) continue
      if (ruinTypes.has(type) && placed.some((poi) => ruinTypes.has(poi.type)
        && distance(tile, poi.position) < MEADOWS_GENERATION_CONFIG.poiSpacing.ruinGroup)) continue
      if (['crypt', 'shrine'].includes(type)) {
        const groupDistance = MEADOWS_GENERATION_CONFIG.poiSpacing.cryptCaveShrineGroup
        const nearCoreGroup = tiles.some((other) => [POI.CAVE_ENTRANCE, POI.SHRINE].includes(other.pointOfInterest)
          && distance(tile, other) < groupDistance)
        const nearStaticGroup = placed.some((poi) => ['crypt', 'shrine'].includes(poi.type)
          && distance(tile, poi.position) < groupDistance)
        if (nearCoreGroup || nearStaticGroup) continue
      }
      if (placed.some((poi) => distance(tile, poi.position) < 5)) continue
      if (placed.some((poi) => poi.type === type && distance(tile, poi.position) < config.minimumDistance)) continue
      const id = `${seed}:static:${type}:${typeCount}:${tile.id}`
      const sector = sectorForTile(tile)
      const instance = {
        id, type, category: config.category,
        position: { index: tile.id, column: tile.column, row: tile.row },
        region: 'meadows', seed: String(seed), eventIds: [],
        preferredBiomes: [...config.preferredTerrains],
        placementZone: distanceFromEdge(tile) <= MEADOWS_GENERATION_CONFIG.edgeZone.width ? 'edge' : `${sector.column},${sector.row}`,
      }
      tile.staticPoiId = id
      placed.push(instance)
      typeCount += 1
    }
  }
  return placed
}

function routeSecondaryRoad(tiles, sourceIds, targetId, rng) {
  const config = MEADOWS_GENERATION_CONFIG.secondaryRoads
  const blocked = new Set([TERRAIN.MOUNTAINS, TERRAIN.LAKE, TERRAIN.SEA, TERRAIN.CITY_WALL,
    TERRAIN.CITY_MARKET, TERRAIN.CITY_RESIDENTIAL, TERRAIN.VILLAGE_HOUSE, TERRAIN.INN])
  const costs = new Float64Array(TILE_COUNT); costs.fill(Infinity)
  const previous = new Int32Array(TILE_COUNT); previous.fill(-1)
  const open = []
  for (const id of sourceIds) { costs[id] = 0; open.push({ id, cost: 0 }) }
  while (open.length) {
    open.sort((a, b) => b.cost - a.cost || b.id - a.id)
    const current = open.pop()
    if (current.cost !== costs[current.id]) continue
    if (current.id === targetId) break
    for (const next of neighbors(current.id)) {
      const tile = tiles[next]
      if (next !== targetId && (blocked.has(tile.terrain) || tile.pointOfInterest || tile.staticPoiId)) continue
      const step = tile.terrain === TERRAIN.RIVER ? config.riverCost
        : tile.terrain === TERRAIN.FOREST ? config.forestCost
          : tile.terrain === TERRAIN.ROCKY_HILLS ? config.hillsCost
            : [TERRAIN.ROAD, TERRAIN.BRIDGE, TERRAIN.GRAVEL_ROAD, TERRAIN.WOODEN_BRIDGE].includes(tile.terrain) ? 0.65 : 1
      const nextCost = current.cost + step * (1 + rng() * config.meanderVariation)
      if (nextCost < costs[next]) { costs[next] = nextCost; previous[next] = current.id; open.push({ id: next, cost: nextCost }) }
    }
  }
  if (previous[targetId] < 0) return []
  const path = [targetId]
  while (!sourceIds.has(path[0])) path.unshift(previous[path[0]])
  return path
}

function buildSecondaryRoads(tiles, region, rng) {
  const config = MEADOWS_GENERATION_CONFIG.secondaryRoads
  const eligibleTypes = new Set(config.eligiblePoiTypes)
  const forbiddenTypes = new Set(config.forbiddenPoiTypes)
  const candidates = shuffle(region.staticPois.filter((poi) => eligibleTypes.has(poi.type)
    && !forbiddenTypes.has(poi.type) && STATIC_POI_CONFIG[poi.type]?.hidden !== true), rng)
  const maximumTargets = Math.min(config.maximumCount, Math.max(0, candidates.length - 1))
  const targetCount = maximumTargets < config.minimumCount ? maximumTargets : randomInt(rng, config.minimumCount, maximumTargets)
  const branches = []; const gravelRoadIds = new Set(); const woodenBridgeIds = new Set()
  for (const target of candidates) {
    if (branches.length >= targetCount) break
    const sourceIds = new Set([...region.roadNetwork.roadIds, ...gravelRoadIds])
    for (const village of region.settlements.villages) {
      for (const id of village.tileIds) {
        const tile = tiles[id]
        if (tile.column === village.left || tile.column === village.left + village.width - 1
          || tile.row === village.top || tile.row === village.top + village.height - 1) sourceIds.add(id)
      }
    }
    const pathIds = routeSecondaryRoad(tiles, sourceIds, target.position.index, rng)
    if (pathIds.length < 3) continue
    const paintedIds = []
    for (const id of pathIds.slice(1, -1)) {
      const tile = tiles[id]
      if ([TERRAIN.ROAD, TERRAIN.BRIDGE, TERRAIN.CITY_GATE, TERRAIN.CITY_STREET, TERRAIN.VILLAGE_SQUARE].includes(tile.terrain)) continue
      if (tile.terrain === TERRAIN.RIVER) { tile.terrain = TERRAIN.WOODEN_BRIDGE; woodenBridgeIds.add(id) }
      else tile.terrain = TERRAIN.GRAVEL_ROAD
      tile.walkable = true; gravelRoadIds.add(id); paintedIds.push(id)
    }
    const endId = pathIds.at(-2)
    if (rng() < config.plazaChance) {
      for (const id of neighbors(endId).slice(0, 2)) {
        const tile = tiles[id]
        if (!tile.pointOfInterest && !tile.staticPoiId
          && [TERRAIN.GRASSLAND, TERRAIN.FLOWER_FIELD, TERRAIN.TALL_GRASS].includes(tile.terrain)) {
          tile.terrain = TERRAIN.GRAVEL_ROAD; tile.walkable = true; gravelRoadIds.add(id)
        }
      }
    }
    branches.push({ id: `secondary-road-${branches.length}`, targetPoiId: target.id, targetType: target.type,
      startId: pathIds[0], endId, pathIds, paintedIds, length: pathIds.length - 1 })
  }
  return { branches, gravelRoadIds: [...gravelRoadIds], woodenBridgeIds: [...woodenBridgeIds] }
}

function buildTiles(terrain) {
  return terrain.map((type, id) => {
    const { column, row } = coordinatesOf(id)
    return {
      id,
      index: id,
      column,
      row,
      terrain: type,
      walkable: isWalkableTerrain(type),
      pointOfInterest: null,
      staticPoiId: null,
      discovered: false,
      visited: false,
    }
  })
}

export function validateMeadowsMap(map) {
  const errors = []
  if (map.width !== MAP_WIDTH || map.height !== MAP_HEIGHT || map.tiles.length !== TILE_COUNT) errors.push('invalid-size')
  const start = map.tiles[map.startIndex]
  if (!start?.walkable) errors.push('blocked-start')
  if (!start) return { valid: false, errors, reachableCount: 0, reachableRatio: 0 }
  const connectivity = floodFill(map.tiles, map.startIndex)
  const walkableCount = map.tiles.reduce((total, tile) => total + Number(tile.walkable), 0)
  const reachableRatio = connectivity.count / Math.max(1, walkableCount)
  if (reachableRatio < 1) errors.push('insufficient-connectivity')
  for (const tile of map.tiles) {
    if (tile.pointOfInterest && tile.pointOfInterest !== POI.BRIDGE && !tile.walkable) errors.push(`blocked-poi:${tile.id}`)
    if (tile.pointOfInterest && !connectivity.visited[tile.id]) errors.push(`unreachable-poi:${tile.id}`)
  }
  for (const range of map.formations?.mountainRanges ?? []) {
    if (!range.passageIds.length) errors.push(`missing-pass:${range.id}`)
    if (range.passageIds.some((id) => !connectivity.visited[id])) errors.push(`unreachable-pass:${range.id}`)
  }
  const region = map.region
  if (!region?.settlements?.city) errors.push('missing-city')
  if (region?.settlements?.villages?.length !== MEADOWS_GENERATION_CONFIG.villages.count) errors.push('invalid-village-count')
  if (region?.structures?.inns?.length !== MEADOWS_GENERATION_CONFIG.inns.count) errors.push('invalid-inn-count')
  const cityTileIds = new Set(region?.settlements?.city?.tileIds ?? [])
  const cityInns = region?.structures?.inns?.filter((inn) => inn.insideCity && inn.tileIds.every((id) => cityTileIds.has(id))) ?? []
  const roadsideInns = region?.structures?.inns?.filter((inn) => !inn.insideCity && inn.tileIds.every((id) => !cityTileIds.has(id))) ?? []
  if (cityInns.length !== MEADOWS_GENERATION_CONFIG.inns.cityCount) errors.push('invalid-city-inn-count')
  if (roadsideInns.length !== MEADOWS_GENERATION_CONFIG.inns.roadsideCount) errors.push('invalid-roadside-inn-count')
  for (const [name, config] of [['ruins', MEADOWS_GENERATION_CONFIG.ruins], ['caves', MEADOWS_GENERATION_CONFIG.caves], ['banditCamps', MEADOWS_GENERATION_CONFIG.banditCamps], ['shrines', MEADOWS_GENERATION_CONFIG.shrines]]) {
    const count = region?.structures?.[name]?.length ?? 0
    if (count < config.minimumCount || count > config.maximumCount) errors.push(`invalid-${name}-count`)
  }
  for (const settlement of [region?.settlements?.city, ...(region?.settlements?.villages ?? [])].filter(Boolean)) {
    if (!region.farms.some((farm) => farm.settlementId === settlement.id)) errors.push(`missing-farms:${settlement.id}`)
  }
  for (const connection of region?.roadNetwork?.connections ?? []) {
    if (!connection.pathIds.length || connection.pathIds.some((id) => !map.tiles[id].walkable)) errors.push(`broken-road:${connection.to}`)
  }
  const secondary = region?.secondaryRoadNetwork
  const secondaryConfig = MEADOWS_GENERATION_CONFIG.secondaryRoads
  if (!secondary || secondary.branches.length < secondaryConfig.minimumCount || secondary.branches.length > secondaryConfig.maximumCount) {
    errors.push('invalid-secondary-road-count')
  }
  const forbiddenSecondaryTargets = new Set([...secondaryConfig.forbiddenPoiTypes, 'boss_arena'])
  for (const branch of secondary?.branches ?? []) {
    const target = region.staticPois.find((poi) => poi.id === branch.targetPoiId)
    if (!target || forbiddenSecondaryTargets.has(target.type)) errors.push(`invalid-secondary-road-target:${branch.id}`)
    if (branch.pathIds.at(-1) !== target?.position.index || branch.endId !== branch.pathIds.at(-2)) errors.push(`unfinished-secondary-road:${branch.id}`)
    if (branch.pathIds.some((id) => [TERRAIN.MOUNTAINS, TERRAIN.LAKE, TERRAIN.SEA].includes(map.tiles[id].terrain))) errors.push(`blocked-secondary-road:${branch.id}`)
    if (branch.pathIds.some((id) => !connectivity.visited[id])) errors.push(`unreachable-secondary-road:${branch.id}`)
  }
  for (const id of secondary?.woodenBridgeIds ?? []) if (map.tiles[id].terrain !== TERRAIN.WOODEN_BRIDGE) errors.push(`invalid-wooden-bridge:${id}`)
  for (const id of region?.roadNetwork?.bridgeIds ?? []) if (map.tiles[id].terrain !== TERRAIN.BRIDGE) errors.push(`invalid-bridge:${id}`)
  const startTile = map.tiles[map.startIndex]
  const nearestVillageDistance = Math.min(...(region?.settlements?.villages ?? []).map((village) => distance(startTile, village.center)))
  const cityDistance = region?.settlements?.city ? distance(startTile, region.settlements.city.center) : 0
  if (nearestVillageDistance < MEADOWS_GENERATION_CONFIG.playerStart.minimumVillageDistance
    || nearestVillageDistance > MEADOWS_GENERATION_CONFIG.playerStart.maximumVillageDistance) errors.push('invalid-start-village-distance')
  if (nearestVillageDistance >= cityDistance || cityTileIds.has(map.startIndex)) errors.push('start-not-closer-to-village')
  const boss = region?.boss
  const bossTile = boss ? map.tiles[boss.centerId] : null
  if (!bossTile || bossTile.pointOfInterest !== POI.BOSS_ARENA) errors.push('missing-boss')
  else {
    if (bossTile.terrain !== TERRAIN.FOREST) errors.push('boss-not-in-forest')
    if (distance(startTile, bossTile) < MEADOWS_GENERATION_CONFIG.boss.minimumStartDistance) errors.push('boss-too-close')
    if (nearAnyId(bossTile, region.roadNetwork.roadIds, MEADOWS_GENERATION_CONFIG.boss.minimumRoadDistance)) errors.push('boss-near-road')
    if (distanceFromEdge(bossTile) > MEADOWS_GENERATION_CONFIG.edgeZone.width) errors.push('boss-not-in-edge-zone')
    const bossPath = findPath(map, map.startIndex, boss.centerId)
    if (!bossPath.length) errors.push('unreachable-boss')
    const wildernessSteps = bossPath.filter((id) => [TERRAIN.FOREST, TERRAIN.ROCKY_HILLS, TERRAIN.CAVE].includes(map.tiles[id].terrain)).length
    if (wildernessSteps < MEADOWS_GENERATION_CONFIG.boss.minimumForestNeighbors) errors.push('boss-path-lacks-natural-obstacles')
  }
  for (const sector of region?.sectors ?? []) if (sector.empty) errors.push(`empty-sector:${sector.id}`)
  for (const cell of region?.coverageCells ?? []) if (cell.empty) errors.push(`empty-coverage-cell:${cell.id}`)
  const staticPoiIds = new Set()
  for (const poi of region?.staticPois ?? []) {
    if (!poi.id || staticPoiIds.has(poi.id)) errors.push(`duplicate-static-poi:${poi.id}`)
    staticPoiIds.add(poi.id)
    const tile = map.tiles[poi.position?.index]
    if (!tile?.walkable || tile.staticPoiId !== poi.id) errors.push(`invalid-static-poi:${poi.id}`)
    if (!Array.isArray(poi.eventIds) || poi.region !== map.id || poi.seed !== map.seed) errors.push(`invalid-static-poi-contract:${poi.id}`)
  }
  return { valid: errors.length === 0, errors, reachableCount: connectivity.count, reachableRatio, mainComponent: connectivity.visited }
}

export function generateMeadowsRegion(seed = 'meadows-default', options = {}) {
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const maximumAttempts = options.maximumAttempts ?? MEADOWS_GENERATION_CONFIG.maximumAttempts
  let fallback = null
  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    const rng = createSeededRandom(`${seed}:attempt:${attempt}`)
    const generatedTerrain = generateTerrain(rng)
    const { terrain, formations } = generatedTerrain
    const tiles = buildTiles(terrain)
    const region = generateCivilization(tiles, rng)
    if (!region) continue
    const playerStart = choosePlayerStart(tiles, region, rng)
    if (!playerStart) continue
    const startIndex = playerStart.index
    const boss = placeRegionBoss(tiles, region, startIndex, rng)
    if (!boss) continue
    region.playerStart = playerStart
    region.boss = boss
    region.zones = createRegionZones(tiles, region, boss)
    region.staticPois = generateStaticPois(tiles, region, seed, rng)
    region.secondaryRoadNetwork = buildSecondaryRoads(tiles, region, rng)
    region.coverageCells = ensureLocalCoverage(tiles, rng)
    region.sectors = fillEmptySectors(tiles, region, rng)
    const poiTypes = Object.values(POI)
    const pointsOfInterest = Object.fromEntries(poiTypes.map((type) => [type, tiles.filter((tile) => tile.pointOfInterest === type)]))
    const biomeBoundaries = tiles.filter((tile) => neighbors(tile.id).some((id) => tiles[id].terrain !== tile.terrain)).map((tile) => tile.id)
    const map = { id: 'meadows', name: 'Meadows', seed: String(seed), attempt, width: MAP_WIDTH, height: MAP_HEIGHT,
      columns: MAP_WIDTH, rows: MAP_HEIGHT, tiles, startIndex, pointsOfInterest, formations, region, biomeBoundaries }
    const validation = validateMeadowsMap(map)
    const terrainCounts = Object.values(TERRAIN).reduce((counts, type) => ({ ...counts, [type]: 0 }), {})
    for (const tile of tiles) terrainCounts[tile.terrain] += 1
    map.validation = validation
    map.terrainCounts = terrainCounts
    map.generationTimeMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt
    fallback = map
    if (validation.valid) return map
  }
  fallback.fallbackUsed = true
  return fallback
}

export function findPath(map, startIndex, targetIndex) {
  const previous = new Int32Array(TILE_COUNT).fill(-1)
  const queue = new Int32Array(TILE_COUNT)
  let head = 0
  let tail = 0
  queue[tail++] = startIndex
  previous[startIndex] = startIndex
  while (head < tail) {
    const current = queue[head++]
    if (current === targetIndex) break
    for (const next of neighbors(current)) {
      if (previous[next] === -1 && map.tiles[next].walkable) {
        previous[next] = current
        queue[tail++] = next
      }
    }
  }
  if (previous[targetIndex] === -1) return []
  const path = []
  for (let current = targetIndex; current !== startIndex; current = previous[current]) path.push(current)
  path.push(startIndex)
  return path.reverse()
}
