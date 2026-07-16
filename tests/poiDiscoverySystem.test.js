import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advancePoiDiscovery,
  getPoiMapMarker,
  getVisibleTileIndices,
  POI_DISCOVERY_STATE,
  promotePoiState,
  setPoiDiscoveryState,
} from '../src/engine/poiDiscoverySystem.js'

const poi = { id: 'ruin-1', type: 'ancient_ruins', column: 10, row: 10, detectionRange: 6, identificationRange: 2 }

test('player visibility is exactly 5x5 away from map edges', () => {
  const visible = getVisibleTileIndices({ column: 10, row: 10 }, 100, 100)
  assert.equal(visible.length, 25)
  assert.equal(new Set(visible).size, 25)
})

test('hidden, detected, identified and visited states produce the correct marker', () => {
  assert.equal(getPoiMapMarker(POI_DISCOVERY_STATE.HIDDEN, '†'), null)
  assert.equal(getPoiMapMarker(POI_DISCOVERY_STATE.DETECTED, '†'), '?')
  assert.equal(getPoiMapMarker(POI_DISCOVERY_STATE.IDENTIFIED, '†'), '†')
  assert.equal(getPoiMapMarker(POI_DISCOVERY_STATE.VISITED, '†'), '†')
})

test('detection and identification ranges promote a POI at their boundaries', () => {
  const detected = advancePoiDiscovery([poi], {}, { column: 16, row: 10 })
  assert.equal(detected[poi.id], POI_DISCOVERY_STATE.DETECTED)
  const identified = advancePoiDiscovery([poi], {}, { column: 12, row: 10 })
  assert.equal(identified[poi.id], POI_DISCOVERY_STATE.IDENTIFIED)
  const visited = advancePoiDiscovery([poi], {}, { column: 10, row: 10 })
  assert.equal(visited[poi.id], POI_DISCOVERY_STATE.VISITED)
})

test('hidden cache is never detected automatically but becomes visited on entry', () => {
  const cache = { ...poi, id: 'cache', type: 'hidden_cache', detectionRange: 0, identificationRange: 0 }
  assert.equal(advancePoiDiscovery([cache], {}, { column: 11, row: 10 }).cache, POI_DISCOVERY_STATE.HIDDEN)
  assert.equal(advancePoiDiscovery([cache], {}, { column: 10, row: 10 }).cache, POI_DISCOVERY_STATE.VISITED)
})

test('POI discovery never regresses and supports future external discovery sources', () => {
  assert.equal(promotePoiState(POI_DISCOVERY_STATE.VISITED, POI_DISCOVERY_STATE.DETECTED), POI_DISCOVERY_STATE.VISITED)
  const fromRumor = setPoiDiscoveryState({}, poi.id, POI_DISCOVERY_STATE.DETECTED)
  const afterMovingAway = advancePoiDiscovery([poi], fromRumor, { column: 99, row: 99 })
  assert.equal(afterMovingAway[poi.id], POI_DISCOVERY_STATE.DETECTED)
})
