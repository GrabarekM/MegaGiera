import assert from 'node:assert/strict'
import test from 'node:test'
import { canPlayerEnterTile, getTileAt, resolveMovementIntent } from '../src/world/worldMovement.js'

const map = { rows: 2, columns: 3, tiles: [
  { row: 0, column: 0, walkable: true }, { row: 0, column: 1, walkable: false }, { row: 0, column: 2, walkable: true },
  { row: 1, column: 0, walkable: true }, { row: 1, column: 1, walkable: true }, { row: 1, column: 2, walkable: true },
] }

test('movement enters a walkable tile and rejects blocked terrain', () => {
  assert.deepEqual(resolveMovementIntent(map, { row: 0, column: 0 }, 1, 0).position, { row: 1, column: 0 })
  assert.equal(resolveMovementIntent(map, { row: 0, column: 0 }, 0, 1).reason, 'blocked')
})

test('movement rejects all four map boundaries', () => {
  assert.equal(resolveMovementIntent(map, { row: 0, column: 0 }, -1, 0).reason, 'outside-map')
  assert.equal(resolveMovementIntent(map, { row: 0, column: 0 }, 0, -1).reason, 'outside-map')
  assert.equal(resolveMovementIntent(map, { row: 1, column: 2 }, 1, 0).reason, 'outside-map')
  assert.equal(resolveMovementIntent(map, { row: 1, column: 2 }, 0, 1).reason, 'outside-map')
})

test('tile lookup and collision are defensive before map initialization', () => {
  assert.equal(getTileAt(null, 0, 0), null)
  assert.equal(getTileAt(map, -1, 0), null)
  assert.equal(canPlayerEnterTile(map, 0, 1), false)
  assert.equal(canPlayerEnterTile({ rows: 1, columns: 1, tiles: [] }, 0, 0), false)
})
