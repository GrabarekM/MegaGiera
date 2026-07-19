import assert from 'node:assert/strict'
import test from 'node:test'
import { initializeWorldSession, resolvePlayerPosition } from '../src/world/worldSession.js'

const map = { id: 'meadows', rows: 2, columns: 2, startIndex: 1, tiles: [
  { row: 0, column: 0, walkable: false }, { row: 0, column: 1, walkable: true },
  { row: 1, column: 0, walkable: true }, { row: 1, column: 1, walkable: true },
] }

test('new session uses start while continuation preserves valid saved position', () => {
  assert.deepEqual(resolvePlayerPosition(map, null), { position: { row: 0, column: 1 }, usedFallback: true })
  assert.deepEqual(resolvePlayerPosition(map, { row: 1, column: 1 }), { position: { row: 1, column: 1 }, usedFallback: false })
})

test('invalid or blocked continuation position falls back safely', () => {
  assert.deepEqual(resolvePlayerPosition(map, { row: 0, column: 0 }).position, { row: 0, column: 1 })
  assert.deepEqual(resolvePlayerPosition(map, { row: 99, column: 99 }).position, { row: 0, column: 1 })
})

test('session initialization is deterministic and does not overwrite a valid position', () => {
  let calls = 0
  const generator = () => { calls += 1; return map }
  const run = { seed: 'stable', regionId: 'meadows', playerPosition: { row: 1, column: 0 } }
  const first = initializeWorldSession(run, generator)
  const second = initializeWorldSession(run, generator)
  assert.deepEqual(first.position, run.playerPosition)
  assert.deepEqual(first.position, second.position)
  assert.equal(calls, 2)
  assert.equal(first.seed, 'stable')
})

test('session initialization reports controlled failures', () => {
  assert.equal(initializeWorldSession({ regionId: 'meadows' }).reason, 'missing-seed')
  assert.equal(initializeWorldSession({ seed: 'x', regionId: 'other' }).reason, 'unsupported-region')
  assert.equal(initializeWorldSession({ seed: 'x', regionId: 'meadows' }, () => null).reason, 'invalid-map')
})
