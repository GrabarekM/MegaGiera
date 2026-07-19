import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorldMapPresentation, createWorldTilePresentation } from '../src/world/worldTilePresentation.js'
import { WORLD_LAYER_ORDER } from '../src/world/worldRenderDefinitions.js'

function makeMap(terrains) {
  const columns = terrains[0].length
  const rows = terrains.length
  return {
    columns,
    rows,
    tiles: terrains.flatMap((row, rowIndex) => row.map((terrain, column) => ({
      index: rowIndex * columns + column, row: rowIndex, column, terrain, walkable: true,
    }))),
  }
}

test('keeps the required layer order explicit', () => {
  assert.deepEqual(WORLD_LAYER_ORDER, ['ground', 'transitions', 'roads', 'details', 'objects', 'trees', 'buildings', 'poi', 'player', 'effects', 'ui'])
})

test('creates deterministic transitions without mutating tiles', () => {
  const map = makeMap([['grassland', 'forest']])
  const before = structuredClone(map)
  const first = createWorldTilePresentation(map.tiles[0], map, 88, 'seed')
  assert.deepEqual(first, createWorldTilePresentation(map.tiles[0], map, 88, 'seed'))
  assert.equal(first.transitionColors.some(({ direction }) => direction === 'east'), true)
  assert.deepEqual(map, before)
})

test('connects adjacent road families and handles map edges', () => {
  const map = makeMap([['road', 'gravel_road', 'grassland']])
  const presentation = createWorldMapPresentation(map, 88, 'roads')
  assert.equal(presentation[0].road.connections.east, true)
  assert.equal(presentation[0].road.connections.west, false)
  assert.equal(presentation[1].road.connections.west, true)
  assert.equal(presentation[2].road, null)
})

test('maps large terrain features onto object layers with shadows', () => {
  const map = makeMap([['forest', 'village', 'cave']])
  const presentation = createWorldMapPresentation(map, 88, 'objects')
  assert.deepEqual({ layer: presentation[0].object.layer, shadow: presentation[0].object.shadow }, { layer: 'trees', shadow: true })
  assert.deepEqual({ layer: presentation[1].object.layer, shadow: presentation[1].object.shadow }, { layer: 'buildings', shadow: true })
  assert.deepEqual({ layer: presentation[2].object.layer, shadow: presentation[2].object.shadow }, { layer: 'poi', shadow: true })
})
