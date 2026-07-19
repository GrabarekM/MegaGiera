import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getTerrainTileStyle,
  getTerrainTileVisual,
  SUPPORTED_TERRAIN_TILE_VISUALS,
} from '../src/world/terrainTileVisuals.js'

test('supports every currently generated illustrated terrain', () => {
  assert.deepEqual(SUPPORTED_TERRAIN_TILE_VISUALS, ['grassland', 'flower_field', 'tall_grass'])
})

test('selects the same sprite for the same seed and tile', () => {
  const tile = { index: 148, terrain: 'flower_field' }
  assert.deepEqual(getTerrainTileVisual(tile, 'world-a'), getTerrainTileVisual(tile, 'world-a'))
})

test('returns a scaled atlas crop style without stretching the whole sheet', () => {
  const style = getTerrainTileStyle({ index: 12, terrain: 'tall_grass' }, 64, 'world-a')
  assert.match(style.backgroundImage, /04-tall-grass-tileset\.png/)
  assert.match(style.backgroundPosition, /^-?[\d.]+px -?[\d.]+px$/)
  assert.match(style.backgroundSize, /^[\d.]+px [\d.]+px$/)
  assert.equal(style.backgroundRepeat, 'no-repeat')
})

test('keeps the CSS fallback for terrains without an illustrated atlas', () => {
  assert.deepEqual(getTerrainTileStyle({ index: 1, terrain: 'forest' }, 64, 'world-a'), {})
})
