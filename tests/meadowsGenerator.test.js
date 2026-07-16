import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  findPath,
  generateMeadowsRegion,
  MAP_HEIGHT,
  MAP_WIDTH,
  POI,
  TERRAIN,
  MEADOWS_GENERATION_CONFIG,
} from '../src/world/meadowsGenerator.js'
import { STATIC_POI_CONFIG } from '../src/data/staticPoiConfig.js'

const map = generateMeadowsRegion('automated-test-seed')

function signature(generatedMap) {
  return JSON.stringify({
    startIndex: generatedMap.startIndex,
    tiles: generatedMap.tiles.map((tile) => [tile.terrain, tile.pointOfInterest, tile.walkable]),
  })
}

function secondaryRoadSignature(generatedMap) {
  return generatedMap.region.secondaryRoadNetwork.branches.map((branch) => ({
    targetPoiId: branch.targetPoiId,
    pathIds: branch.pathIds,
  }))
}

function sameTerrainNeighborRatio(generatedMap, terrain) {
  let matching = 0
  let total = 0
  for (const tile of generatedMap.tiles) {
    if (tile.terrain !== terrain) continue
    total += 1
    const neighbors = [
      tile.row > 0 ? tile.id - MAP_WIDTH : -1,
      tile.column < MAP_WIDTH - 1 ? tile.id + 1 : -1,
      tile.row < MAP_HEIGHT - 1 ? tile.id + MAP_WIDTH : -1,
      tile.column > 0 ? tile.id - 1 : -1,
    ]
    if (neighbors.some((index) => index >= 0 && generatedMap.tiles[index].terrain === terrain)) matching += 1
  }
  return matching / total
}

test('creates exactly 100 x 100 tiles with unique ids and coordinates', () => {
  assert.equal(map.width, 100)
  assert.equal(map.height, 100)
  assert.equal(map.tiles.length, 10_000)
  assert.equal(new Set(map.tiles.map((tile) => tile.id)).size, 10_000)
  map.tiles.forEach((tile, index) => {
    assert.equal(tile.id, index)
    assert.equal(tile.column, index % MAP_WIDTH)
    assert.equal(tile.row, Math.floor(index / MAP_WIDTH))
  })
})

test('every tile exposes the index expected by the map view', () => {
  const map = generateMeadowsRegion('view-index-contract')

  for (const tile of map.tiles) {
    assert.equal(tile.index, tile.id)
    assert.equal(map.tiles[tile.index], tile)
  }
})

test('map edges are sealed by sea or mountains, at most three tiles deep', () => {
  const generatedMap = generateMeadowsRegion('sealed-border')
  const barriers = new Set([TERRAIN.SEA, TERRAIN.MOUNTAINS])

  for (const tile of generatedMap.tiles) {
    const distanceFromEdge = Math.min(
      tile.column,
      tile.row,
      generatedMap.columns - 1 - tile.column,
      generatedMap.rows - 1 - tile.row,
    )
    if (distanceFromEdge === 0) assert.ok(barriers.has(tile.terrain))
    if (tile.terrain === TERRAIN.SEA) {
      assert.ok(distanceFromEdge <= 2)
      assert.equal(tile.walkable, false)
    }
  }
})

test('same seed creates identical terrain, POIs and start', () => {
  assert.equal(signature(generateMeadowsRegion('repeatable')), signature(generateMeadowsRegion('repeatable')))
})

test('different seeds create different maps', () => {
  assert.notEqual(signature(generateMeadowsRegion('seed-one')), signature(generateMeadowsRegion('seed-two')))
})

test('start, city and every village are reachable', () => {
  assert.equal(map.tiles[map.startIndex].walkable, true)
  assert.ok(map.region.settlements.city)
  for (const village of map.pointsOfInterest[POI.VILLAGE]) {
    assert.ok(findPath(map, map.startIndex, village.id).length > 0)
  }
  assert.equal(map.validation.reachableRatio, 1)
})

test('lakes and forests form clusters', () => {
  assert.ok(sameTerrainNeighborRatio(map, TERRAIN.LAKE) > 0.9)
  assert.ok(sameTerrainNeighborRatio(map, TERRAIN.FOREST) > 0.9)
})

test('points of interest never overlap and important POIs are walkable', () => {
  const poiTiles = map.tiles.filter((tile) => tile.pointOfInterest)
  assert.equal(new Set(poiTiles.map((tile) => tile.id)).size, poiTiles.length)
  for (const tile of poiTiles) assert.equal(tile.walkable, true)
})

test('remote structures are placed in logical locations', () => {
  const nearTerrain = (tile, terrainTypes, radius = 3) => map.tiles.some((candidate) => (
    terrainTypes.includes(candidate.terrain)
    && Math.abs(candidate.column - tile.column) <= radius
    && Math.abs(candidate.row - tile.row) <= radius
  ))
  for (const cave of map.pointsOfInterest[POI.CAVE_ENTRANCE]) assert.ok(nearTerrain(cave, [TERRAIN.MOUNTAINS], 2))
  for (const camp of map.pointsOfInterest[POI.BANDIT_CAMP]) assert.ok(nearTerrain(camp, [TERRAIN.FOREST], 3))
  for (const shrine of map.pointsOfInterest[POI.SHRINE]) assert.equal(shrine.terrain, TERRAIN.SHRINE)
})

test('region has exactly one city, three villages, one city inn and three roadside inns', () => {
  assert.ok(map.region.settlements.city)
  assert.equal(map.region.settlements.villages.length, 3)
  assert.equal(map.region.structures.inns.length, 4)
  assert.equal(map.pointsOfInterest[POI.CITY].length, 1)
  assert.equal(map.pointsOfInterest[POI.VILLAGE].length, 3)
  assert.equal(map.pointsOfInterest[POI.INN].length, 4)
  const cityTiles = new Set(map.region.settlements.city.tileIds)
  const cityInns = map.region.structures.inns.filter((inn) => inn.insideCity)
  const roadsideInns = map.region.structures.inns.filter((inn) => !inn.insideCity)
  assert.equal(cityInns.length, 1)
  assert.equal(roadsideInns.length, 3)
  assert.ok(cityInns[0].tileIds.every((id) => cityTiles.has(id)))
  assert.ok(roadsideInns.every((inn) => inn.tileIds.every((id) => !cityTiles.has(id))))
})

test('player starts near a village, closer to it than the city and close to a road', () => {
  const start = map.tiles[map.startIndex]
  const villageDistance = Math.min(...map.region.settlements.villages.map((village) => Math.hypot(start.column - village.center.column, start.row - village.center.row)))
  const city = map.region.settlements.city.center
  const cityDistance = Math.hypot(start.column - city.column, start.row - city.row)
  assert.ok(villageDistance >= MEADOWS_GENERATION_CONFIG.playerStart.minimumVillageDistance)
  assert.ok(villageDistance <= MEADOWS_GENERATION_CONFIG.playerStart.maximumVillageDistance)
  assert.ok(villageDistance < cityDistance)
  assert.ok(map.region.roadNetwork.roadIds.some((id) => {
    const road = map.tiles[id]
    return Math.max(Math.abs(start.column - road.column), Math.abs(start.row - road.row)) <= MEADOWS_GENERATION_CONFIG.playerStart.maximumRoadDistance
  }))
})

test('boss is distant, deep in a forest, away from roads and reachable from the start', () => {
  const boss = map.tiles[map.region.boss.centerId]
  const start = map.tiles[map.startIndex]
  assert.equal(boss.pointOfInterest, POI.BOSS_ARENA)
  assert.equal(boss.terrain, TERRAIN.FOREST)
  assert.ok(Math.hypot(start.column - boss.column, start.row - boss.row) >= MEADOWS_GENERATION_CONFIG.boss.minimumStartDistance)
  assert.ok(map.region.roadNetwork.roadIds.every((id) => {
    const road = map.tiles[id]
    return Math.max(Math.abs(boss.column - road.column), Math.abs(boss.row - road.row)) > MEADOWS_GENERATION_CONFIG.boss.minimumRoadDistance
  }))
  assert.ok(findPath(map, map.startIndex, boss.id).length > 0)
})

test('bridges connect at least two walkable banks', () => {
  for (const bridge of map.pointsOfInterest[POI.BRIDGE]) {
    const neighbors = [bridge.id - MAP_WIDTH, bridge.id + 1, bridge.id + MAP_WIDTH, bridge.id - 1]
      .filter((index) => index >= 0 && index < map.tiles.length)
    assert.ok(neighbors.filter((index) => map.tiles[index].walkable).length >= 2)
  }
})

test('every village has a traversable road connection to the city', () => {
  assert.equal(map.region.roadNetwork.connections.length, 3)
  for (const connection of map.region.roadNetwork.connections) {
    assert.ok(connection.pathIds.length > 0)
    assert.ok(connection.pathIds.every((id) => map.tiles[id].walkable))
  }
})

test('secondary gravel roads lead to a subset of eligible static POIs', () => {
  const network = map.region.secondaryRoadNetwork
  const config = MEADOWS_GENERATION_CONFIG.secondaryRoads
  assert.ok(network.branches.length >= config.minimumCount && network.branches.length <= config.maximumCount)
  const eligible = map.region.staticPois.filter((poi) => config.eligiblePoiTypes.includes(poi.type))
  assert.ok(network.branches.length < eligible.length)
  const forbidden = new Set([...config.forbiddenPoiTypes, 'boss_arena'])
  for (const branch of network.branches) {
    const target = map.region.staticPois.find((poi) => poi.id === branch.targetPoiId)
    assert.ok(target)
    assert.equal(forbidden.has(target.type), false)
    assert.equal(branch.pathIds.at(-1), target.position.index)
    assert.equal(branch.endId, branch.pathIds.at(-2))
    assert.ok(branch.paintedIds.length > 0)
    assert.ok(branch.pathIds.every((id) => ![TERRAIN.MOUNTAINS, TERRAIN.LAKE, TERRAIN.SEA].includes(map.tiles[id].terrain)))
    assert.ok(branch.pathIds.every((id) => map.validation.mainComponent[id]))
  }
})

test('secondary roads and wooden bridges are deterministic', () => {
  const first = generateMeadowsRegion('secondary-road-determinism')
  const second = generateMeadowsRegion('secondary-road-determinism')
  assert.deepEqual(secondaryRoadSignature(first), secondaryRoadSignature(second))
  assert.deepEqual(first.region.secondaryRoadNetwork.woodenBridgeIds, second.region.secondaryRoadNetwork.woodenBridgeIds)
})

test('a required river crossing becomes a traversable wooden bridge', () => {
  const generated = generateMeadowsRegion('manual-secondary-audit-11')
  const network = generated.region.secondaryRoadNetwork
  assert.ok(network.woodenBridgeIds.length > 0)
  for (const bridgeId of network.woodenBridgeIds) {
    assert.equal(generated.tiles[bridgeId].terrain, TERRAIN.WOODEN_BRIDGE)
    const branch = network.branches.find((item) => item.pathIds.includes(bridgeId))
    assert.ok(branch)
    const position = branch.pathIds.indexOf(bridgeId)
    assert.ok(position > 0 && position < branch.pathIds.length - 1)
    assert.ok(generated.tiles[branch.pathIds[position - 1]].walkable)
    assert.ok(generated.tiles[branch.pathIds[position + 1]].walkable)
  }
})

test('a road crossing a river is converted into a bridge', () => {
  let generated = null
  for (let index = 0; index < 40; index += 1) {
    const candidate = generateMeadowsRegion(`bridge-crossing-${index}`)
    if (candidate.region.roadNetwork.bridgeIds.length) { generated = candidate; break }
  }
  assert.ok(generated, 'expected at least one deterministic road/river crossing')
  for (const id of generated.region.roadNetwork.bridgeIds) {
    assert.equal(generated.tiles[id].terrain, TERRAIN.BRIDGE)
    assert.ok(generated.region.roadNetwork.roadIds.includes(id))
  }
})

test('farms form multi-tile fields around every settlement', () => {
  const settlementIds = new Set([map.region.settlements.city.id, ...map.region.settlements.villages.map((village) => village.id)])
  const farmOwners = new Set(map.region.farms.map((farm) => farm.settlementId))
  for (const id of settlementIds) assert.ok(farmOwners.has(id), `missing farms for ${id}`)
  assert.ok(map.region.farms.every((farm) => farm.tileIds.length >= 12))
})

test('ruins are remote, caves touch mountains, camps touch forests and shrines stay outside the city', () => {
  const settlements = [map.region.settlements.city, ...map.region.settlements.villages]
  const cityTiles = new Set(map.region.settlements.city.tileIds)
  for (const ruin of map.region.structures.ruins) {
    const tile = map.tiles[ruin.centerId]
    assert.ok(settlements.every((place) => Math.hypot(tile.column - place.center.column, tile.row - place.center.row) >= MEADOWS_GENERATION_CONFIG.ruins.civilizationDistance))
  }
  for (const cave of map.region.structures.caves) {
    const tile = map.tiles[cave.centerId]
    assert.ok(map.tiles.some((other) => other.terrain === TERRAIN.MOUNTAINS && Math.abs(other.column - tile.column) <= 1 && Math.abs(other.row - tile.row) <= 1))
  }
  for (const camp of map.region.structures.banditCamps) {
    const tile = map.tiles[camp.centerId]
    assert.ok(map.tiles.some((other) => other.terrain === TERRAIN.FOREST && Math.abs(other.column - tile.column) <= 3 && Math.abs(other.row - tile.row) <= 3))
  }
  for (const shrine of map.region.structures.shrines) assert.equal(cityTiles.has(shrine.centerId), false)
})

test('every ruin and bandit camp occupies exactly one tile', () => {
  for (const ruin of map.region.structures.ruins) assert.equal(ruin.tileIds.length, 1)
  for (const camp of map.region.structures.banditCamps) assert.equal(camp.tileIds.length, 1)
})

test('city respects its large edge margin while wild POIs can occupy the edge zone', () => {
  const city = map.region.settlements.city
  assert.ok(Math.min(city.left, city.top, MAP_WIDTH - city.left - city.width, MAP_HEIGHT - city.top - city.height)
    >= MEADOWS_GENERATION_CONFIG.placementMargins.city)
  const wildIds = [
    ...map.region.structures.ruins, ...map.region.structures.caves,
    ...map.region.structures.banditCamps, ...map.region.structures.shrines,
  ].map((structure) => structure.centerId)
  assert.ok(wildIds.some((id) => {
    const tile = map.tiles[id]
    return Math.min(tile.column, tile.row, MAP_WIDTH - 1 - tile.column, MAP_HEIGHT - 1 - tile.row) <= MEADOWS_GENERATION_CONFIG.edgeZone.width
  }))
})

test('boss is placed in the external map ring', () => {
  const boss = map.tiles[map.region.boss.centerId]
  assert.ok(Math.min(boss.column, boss.row, MAP_WIDTH - 1 - boss.column, MAP_HEIGHT - 1 - boss.row)
    <= MEADOWS_GENERATION_CONFIG.edgeZone.width)
})

test('every 4x4 sector contains a significant exploration element', () => {
  assert.equal(map.region.sectors.length, MEADOWS_GENERATION_CONFIG.sectors.columns * MEADOWS_GENERATION_CONFIG.sectors.rows)
  for (const sector of map.region.sectors) {
    assert.equal(sector.empty, false, `empty sector ${sector.column},${sector.row}`)
    assert.ok(sector.significantElementCount >= MEADOWS_GENERATION_CONFIG.sectors.minimumSignificantElements)
    const hasEnoughContent = sector.dominantTerrainRatio <= MEADOWS_GENERATION_CONFIG.sectors.maximumDominantTerrainRatio
      || sector.poiCount >= MEADOWS_GENERATION_CONFIG.sectors.minimumPoiForUniformSector
      || sector.roadCount >= MEADOWS_GENERATION_CONFIG.sectors.minimumRoadTilesForUniformSector
    assert.equal(hasEnoughContent, true, `uniform sparse sector ${sector.column},${sector.row}`)
  }
})

test('every 10x10 area contains a coherent exploration feature', () => {
  assert.equal(map.region.coverageCells.length, 100)
  for (const cell of map.region.coverageCells) {
    assert.equal(cell.empty, false, `empty 10x10 area ${cell.column},${cell.row}`)
    assert.ok(cell.interestingTileCount >= MEADOWS_GENERATION_CONFIG.localCoverage.minimumInterestingTiles)
  }
})

test('core ruins keep their configured distance from each other', () => {
  const ruinTypes = new Set(['ancient_ruins', 'forgotten_temple', 'old_cemetery', 'battlefield', 'fallen_monument', 'abandoned_hut'])
  const ruins = [
    ...map.region.structures.ruins.map((ruin) => map.tiles[ruin.centerId]),
    ...map.region.staticPois.filter((poi) => ruinTypes.has(poi.type)).map((poi) => poi.position),
  ]
  for (let left = 0; left < ruins.length; left += 1) {
    for (let right = left + 1; right < ruins.length; right += 1) {
      assert.ok(Math.hypot(ruins[left].column - ruins[right].column, ruins[left].row - ruins[right].row)
        >= MEADOWS_GENERATION_CONFIG.poiSpacing.ruinGroup)
    }
  }
})

test('edge zone contains POIs or characteristic formations and center does not monopolize POIs', () => {
  const edgeWidth = MEADOWS_GENERATION_CONFIG.edgeZone.width
  const edgeTiles = map.tiles.filter((tile) => Math.min(tile.column, tile.row, MAP_WIDTH - 1 - tile.column, MAP_HEIGHT - 1 - tile.row) <= edgeWidth)
  assert.ok(edgeTiles.some((tile) => tile.pointOfInterest || [TERRAIN.FOREST, TERRAIN.ROCKY_HILLS, TERRAIN.MOUNTAINS, TERRAIN.LAKE].includes(tile.terrain)))
  const allPois = map.tiles.filter((tile) => tile.pointOfInterest)
  const centerPois = allPois.filter((tile) => tile.column >= 25 && tile.column < 75 && tile.row >= 25 && tile.row < 75)
  assert.ok(centerPois.length / allPois.length < 0.7)
})

test('static POIs have unique event-ready records and valid preferred terrain', () => {
  assert.equal(new Set(map.region.staticPois.map((poi) => poi.id)).size, map.region.staticPois.length)
  assert.equal(new Set(map.region.staticPois.map((poi) => poi.position.index)).size, map.region.staticPois.length)
  for (const poi of map.region.staticPois) {
    const tile = map.tiles[poi.position.index]
    assert.equal(tile.staticPoiId, poi.id)
    assert.equal(tile.walkable, true)
    assert.ok(STATIC_POI_CONFIG[poi.type].preferredTerrains.includes(tile.terrain), `${poi.type} on ${tile.terrain}`)
    assert.equal(poi.region, 'meadows')
    assert.equal(poi.seed, map.seed)
    assert.deepEqual(poi.eventIds, [])
    assert.ok(findPath(map, map.startIndex, tile.id).length > 0)
  }
})

test('terrain-specific static POIs respect their placement preferences', () => {
  const near = (generatedMap, poi, terrains, radius) => {
    const tile = generatedMap.tiles[poi.position.index]
    return generatedMap.tiles.some((candidate) => terrains.includes(candidate.terrain)
      && Math.abs(candidate.column - tile.column) <= radius && Math.abs(candidate.row - tile.row) <= radius)
  }
  for (const poi of map.region.staticPois.filter((item) => item.type === 'bandit_camp')) assert.ok(near(map, poi, [TERRAIN.FOREST], 2))
  for (const poi of map.region.staticPois.filter((item) => item.type === 'quarry')) assert.ok(near(map, poi, [TERRAIN.ROCKY_HILLS, TERRAIN.MOUNTAINS], 2))
  for (const poi of map.region.staticPois.filter((item) => item.type === 'farmhouse')) assert.ok(near(map, poi, [TERRAIN.FARM], 2))
  for (const poi of map.region.staticPois.filter((item) => item.type === 'waterfall')) assert.ok(near(map, poi, [TERRAIN.RIVER], 2))
  for (const poi of map.region.staticPois.filter((item) => item.type === 'toll_bridge')) assert.ok(near(map, poi, [TERRAIN.BRIDGE], 1))
})

test('crypts, cave entrances and shrines keep a shared minimum distance', () => {
  const group = [
    ...map.region.structures.caves.map((item) => ({ type: 'cave', ...map.tiles[item.centerId] })),
    ...map.region.structures.shrines.map((item) => ({ type: 'shrine', ...map.tiles[item.centerId] })),
    ...map.region.staticPois.filter((item) => ['crypt', 'shrine'].includes(item.type))
      .map((item) => ({ type: item.type, ...map.tiles[item.position.index] })),
  ]
  for (let left = 0; left < group.length; left += 1) {
    for (let right = left + 1; right < group.length; right += 1) {
      const spacing = Math.hypot(group[left].column - group[right].column, group[left].row - group[right].row)
      assert.ok(spacing >= MEADOWS_GENERATION_CONFIG.poiSpacing.cryptCaveShrineGroup,
        `${group[left].type} and ${group[right].type} are only ${spacing.toFixed(1)} tiles apart`)
    }
  }
})

test('all configured static POI types can be generated across twenty maps', () => {
  const seen = new Set()
  for (let index = 0; index < 20; index += 1) {
    const generated = generateMeadowsRegion(`static-poi-coverage-${index}`)
    for (const poi of generated.region.staticPois) seen.add(poi.type)
  }
  assert.deepEqual([...seen].sort(), Object.keys(STATIC_POI_CONFIG).sort())
})

test('natural formations respect configured lake and forest sizes', () => {
  for (const lake of map.formations.lakes) {
    assert.ok(lake.length >= MEADOWS_GENERATION_CONFIG.lakes.minimumSize)
    assert.ok(lake.length <= MEADOWS_GENERATION_CONFIG.lakes.maximumSize)
  }
  for (const forest of map.formations.forests) {
    assert.ok(forest.length >= MEADOWS_GENERATION_CONFIG.forests.minimumSize)
    assert.ok(forest.length <= MEADOWS_GENERATION_CONFIG.forests.maximumSize)
  }
})

test('generator has a bounded retry count and returns a validated map', () => {
  const generated = generateMeadowsRegion('bounded')
  assert.ok(generated.attempt < MEADOWS_GENERATION_CONFIG.maximumAttempts)
  assert.equal(generated.validation.valid, true)
})

test('every mountain range has at least one reachable pass', () => {
  for (const range of map.formations.mountainRanges) {
    assert.ok(range.length >= MEADOWS_GENERATION_CONFIG.mountainRanges.minimumLength)
    assert.ok(range.length <= MEADOWS_GENERATION_CONFIG.mountainRanges.maximumLength)
    assert.ok(range.width >= MEADOWS_GENERATION_CONFIG.mountainRanges.minimumWidth)
    assert.ok(range.width <= MEADOWS_GENERATION_CONFIG.mountainRanges.maximumWidth)
    assert.ok(range.passageIds.length > 0)
    assert.ok(range.passageIds.every((id) => map.tiles[id].walkable && map.validation.mainComponent[id]))
  }
})

test('all walkable areas and every POI are reachable', () => {
  assert.equal(map.validation.reachableRatio, 1)
  for (const tile of map.tiles.filter((item) => item.pointOfInterest)) {
    assert.ok(findPath(map, map.startIndex, tile.id).length > 0)
  }
})

test('mountains and forests are clustered rather than isolated tiles', () => {
  assert.ok(sameTerrainNeighborRatio(map, TERRAIN.MOUNTAINS) > 0.94)
  assert.ok(sameTerrainNeighborRatio(map, TERRAIN.FOREST) > 0.96)
  for (const tile of map.tiles.filter((item) => [TERRAIN.MOUNTAINS, TERRAIN.FOREST].includes(item.terrain))) {
    const adjacent = [tile.id - MAP_WIDTH, tile.id + 1, tile.id + MAP_WIDTH, tile.id - 1]
      .filter((id) => id >= 0 && id < map.tiles.length)
    assert.ok(adjacent.some((id) => map.tiles[id].terrain === tile.terrain), `isolated ${tile.terrain} at ${tile.id}`)
  }
})

test('lakes never cut the traversable map into separate regions', () => {
  assert.equal(map.validation.reachableRatio, 1)
  assert.ok(map.formations.lakes.every((lake) => lake.length >= 20))
})

test('twenty different seeds all produce valid inhabited regions', () => {
  for (let index = 0; index < 20; index += 1) {
    const generated = generateMeadowsRegion(`natural-seed-${index}`)
    assert.equal(generated.validation.valid, true, `seed ${index}: ${generated.validation.errors.join(',')}`)
  }
})

test('generator does not call Math.random', async () => {
  const source = await readFile(new URL('../src/world/meadowsGenerator.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /Math\.random\s*\(/)
})
