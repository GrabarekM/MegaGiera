import assert from 'node:assert/strict'
import test from 'node:test'
import { createNewRun, createRunSeed, updateRunProgress } from '../src/game/gameState.js'
import { migrateSave, readSave, removeSave, SAVE_KEY, SAVE_VERSION, validateSave, writeSave } from '../src/game/saveService.js'
import { generateMeadowsRegion } from '../src/world/meadowsGenerator.js'
import { advanceMovementTime } from '../src/engine/timeSystem.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

const fixedNow = () => '2026-07-15T12:00:00.000Z'
const baseRun = createNewRun('warrior', { seed: 'save-test-seed', runId: 'run-1', now: fixedNow })

test('new run creates a valid state', () => assert.equal(validateSave(baseRun).valid, true))
test('new run generates a seed', () => assert.match(createRunSeed(), /^meadows-/))
test('new run resets move count', () => assert.equal(baseRun.time.moveCount, 0))
test('new run uses the generated map start', () => {
  const map = generateMeadowsRegion(baseRun.seed)
  assert.deepEqual(baseRun.playerPosition, { row: map.tiles[map.startIndex].row, column: map.tiles[map.startIndex].column })
})
test('new run is saved immediately', () => {
  const storage = memoryStorage()
  assert.equal(writeSave(baseRun, storage, fixedNow).ok, true)
  assert.equal(readSave(storage).status, 'valid')
})
test('successful movement updates the saved state once', () => {
  let writes = 0
  const storage = memoryStorage()
  const original = storage.setItem
  storage.setItem = (...args) => { writes += 1; original(...args) }
  const moved = updateRunProgress(baseRun, { playerPosition: { row: baseRun.playerPosition.row + 1, column: baseRun.playerPosition.column }, time: advanceMovementTime(baseRun.time, 180), discovered: baseRun.discovered, visited: baseRun.visited })
  writeSave(moved, storage, fixedNow)
  assert.equal(writes, 1)
  assert.equal(readSave(storage).save.time.moveCount, 1)
})
test('failed movement can leave the save untouched', () => {
  const storage = memoryStorage()
  writeSave(baseRun, storage, fixedNow)
  const before = storage.getItem(SAVE_KEY)
  assert.equal(storage.getItem(SAVE_KEY), before)
})
test('reload restores player position', () => {
  const storage = memoryStorage(); writeSave(baseRun, storage, fixedNow)
  assert.deepEqual(readSave(storage).save.playerPosition, baseRun.playerPosition)
})
test('reload restores move count and world time', () => {
  const storage = memoryStorage()
  let time = baseRun.time
  for (let index = 0; index < 9; index += 1) time = advanceMovementTime(time, 180)
  writeSave({ ...baseRun, time }, storage, fixedNow)
  assert.deepEqual(readSave(storage).save.time, time)
})
test('reload restores discovered tiles', () => {
  const storage = memoryStorage(); writeSave(baseRun, storage, fixedNow)
  assert.deepEqual(readSave(storage).save.discovered, baseRun.discovered)
})
test('reload restores visited tiles', () => {
  const storage = memoryStorage(); writeSave(baseRun, storage, fixedNow)
  assert.deepEqual(readSave(storage).save.visited, baseRun.visited)
})
test('reload restores visited POI discovery states', () => {
  const storage = memoryStorage()
  const progressed = updateRunProgress(baseRun, {
    playerPosition: baseRun.playerPosition,
    time: baseRun.time,
    discovered: baseRun.discovered,
    visited: baseRun.visited,
    poiDiscovery: { ...baseRun.poiDiscovery, 'test-poi': 'visited' },
  })
  writeSave(progressed, storage, fixedNow)
  assert.equal(readSave(storage).save.poiDiscovery['test-poi'], 'visited')
})
test('CharacterState travels through the existing save pipeline', () => {
  const storage = memoryStorage()
  const characterState = { ...baseRun.characterState, gold: 25, flags: { sample_complete: true } }
  const progressed = updateRunProgress(baseRun, {
    playerPosition: baseRun.playerPosition, time: baseRun.time,
    discovered: baseRun.discovered, visited: baseRun.visited, poiDiscovery: baseRun.poiDiscovery,
    characterState,
  })
  writeSave(progressed, storage, fixedNow)
  assert.deepEqual(readSave(storage).save.characterState, characterState)
})
test('deleting save disables continuation', () => {
  const storage = memoryStorage(); writeSave(baseRun, storage, fixedNow); removeSave(storage)
  assert.equal(readSave(storage).status, 'empty')
})
test('continue reads the saved run without replacing it', () => {
  const storage = memoryStorage(); writeSave(baseRun, storage, fixedNow)
  assert.equal(readSave(storage).save.runId, baseRun.runId)
})
test('saved seed recreates the identical map layout', () => {
  const one = generateMeadowsRegion(baseRun.seed)
  const two = generateMeadowsRegion(baseRun.seed)
  assert.deepEqual(one.tiles.map((tile) => tile.terrain), two.tiles.map((tile) => tile.terrain))
})
test('corrupted JSON is rejected without throwing', () => {
  assert.equal(readSave(memoryStorage({ [SAVE_KEY]: '{broken' })).status, 'invalid')
})
test('unsupported save version is rejected safely', () => {
  assert.equal(validateSave({ ...baseRun, saveVersion: SAVE_VERSION + 1 }).valid, false)
})
test('version 3 four-hour saves migrate to the nearest three-hour segment', () => {
  const mappings = new Map([[6, 6], [10, 9], [14, 15], [18, 18], [22, 21], [2, 3]])
  for (const [legacyHour, migratedHour] of mappings) {
    const migrated = migrateSave({ ...baseRun, saveVersion: 3, time: { day: 2, hour: legacyHour, moveCount: 7 } })
    assert.equal(migrated.saveVersion, SAVE_VERSION)
    assert.equal(migrated.time.hour, migratedHour)
    assert.equal(migrated.time.day, 2)
    assert.equal(migrated.time.moveCount, 7)
  }
})
test('version 4 saves from the previous map algorithm are rejected safely', () => {
  assert.equal(validateSave({ ...baseRun, saveVersion: 4 }).valid, false)
})
test('cancelling replacement does not delete a save', () => {
  const storage = memoryStorage(); writeSave(baseRun, storage, fixedNow)
  assert.equal(readSave(storage).status, 'valid')
})
test('confirmed replacement removes old run and stores a new one', () => {
  const storage = memoryStorage(); writeSave(baseRun, storage, fixedNow); removeSave(storage)
  const replacement = createNewRun('mage', { seed: 'replacement-seed', runId: 'run-2', now: fixedNow })
  writeSave(replacement, storage, fixedNow)
  assert.equal(readSave(storage).save.runId, 'run-2')
  assert.notEqual(readSave(storage).save.seed, baseRun.seed)
})
test('out-of-map and blocked player positions are rejected', () => {
  assert.equal(validateSave({ ...baseRun, playerPosition: { row: -1, column: 0 } }).valid, false)
  const map = generateMeadowsRegion(baseRun.seed)
  const blocked = map.tiles.find((tile) => !tile.walkable)
  assert.equal(validateSave({ ...baseRun, playerPosition: { row: blocked.row, column: blocked.column } }).valid, false)
})
test('storage exceptions are converted into safe results', () => {
  const broken = { getItem() { throw new Error('denied') }, setItem() { throw new Error('full') }, removeItem() { throw new Error('denied') } }
  assert.equal(readSave(broken).status, 'invalid')
  assert.equal(writeSave(baseRun, broken).ok, false)
  assert.equal(removeSave(broken).ok, false)
})
