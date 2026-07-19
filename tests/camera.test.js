import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateFollowScroll } from '../src/utils/camera.js'

const base = {
  scrollLeft: 1000,
  scrollTop: 1000,
  viewportWidth: 1000,
  viewportHeight: 800,
  contentWidth: 10_000,
  contentHeight: 10_000,
}

test('camera stays still while player remains inside the safe zone', () => {
  assert.deepEqual(calculateFollowScroll({ ...base, playerCenterX: 1500, playerCenterY: 1400 }), { left: 1000, top: 1000 })
})

test('camera follows player after crossing the right and bottom thresholds', () => {
  const target = calculateFollowScroll({ ...base, playerCenterX: 1800, playerCenterY: 1650 })
  assert.ok(target.left > base.scrollLeft)
  assert.ok(target.top > base.scrollTop)
})

test('camera follows player in every direction and clamps to map bounds', () => {
  assert.deepEqual(calculateFollowScroll({ ...base, scrollLeft: 0, scrollTop: 0, playerCenterX: 0, playerCenterY: 0 }), { left: 0, top: 0 })
  assert.deepEqual(calculateFollowScroll({ ...base, scrollLeft: 9000, scrollTop: 9200, playerCenterX: 10_000, playerCenterY: 10_000 }), { left: 9000, top: 9200 })
})

test('camera remains at the origin when the map is smaller than the viewport', () => {
  const target = calculateFollowScroll({
    scrollLeft: 50, scrollTop: 50, viewportWidth: 1200, viewportHeight: 900,
    contentWidth: 600, contentHeight: 500, playerCenterX: 300, playerCenterY: 250,
  })
  assert.deepEqual(target, { left: 0, top: 0 })
})
