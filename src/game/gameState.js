import { SAVE_VERSION } from './saveService.js'
import { generateMeadowsRegion } from '../world/meadowsGenerator.js'
import { createInitialTime } from '../engine/timeSystem.js'
import { advancePoiDiscovery, createPoiRecords } from '../engine/poiDiscoverySystem.js'
import { cloneCharacterState, createCharacterState } from './characterState.js'

export function createRunSeed() {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  return `meadows-${Date.now()}-${randomPart}`
}

export function createNewRun(characterCreation, options = {}) {
  const seed = options.seed ?? createRunSeed()
  const now = options.now?.() ?? new Date().toISOString()
  const runId = options.runId ?? globalThis.crypto?.randomUUID?.() ?? `run-${Date.now()}`
  const map = generateMeadowsRegion(seed)
  const start = map.tiles[map.startIndex]
  const discovered = []
  for (let rowOffset = -2; rowOffset <= 2; rowOffset += 1) {
    for (let columnOffset = -2; columnOffset <= 2; columnOffset += 1) {
      const row = start.row + rowOffset
      const column = start.column + columnOffset
      if (row >= 0 && row < map.rows && column >= 0 && column < map.columns) discovered.push(row * map.columns + column)
    }
  }
  const playerPosition = { row: start.row, column: start.column }
  const poiDiscovery = advancePoiDiscovery(createPoiRecords(map), {}, playerPosition)
  const characterState = createCharacterState({ id: `character-${runId}`, ...characterCreation })
  return {
    saveVersion: SAVE_VERSION,
    runId,
    seed,
    characterId: 'custom',
    regionId: map.id,
    playerPosition,
    time: createInitialTime(),
    discovered,
    visited: [map.startIndex],
    poiDiscovery,
    characterState,
    createdAt: now,
    updatedAt: now,
  }
}

export function updateRunProgress(run, progress) {
  return {
    ...run,
    playerPosition: { ...progress.playerPosition },
    time: { ...progress.time },
    discovered: [...progress.discovered],
    visited: [...progress.visited],
    poiDiscovery: { ...(progress.poiDiscovery ?? run.poiDiscovery ?? {}) },
    characterState: cloneCharacterState(progress.characterState ?? run.characterState),
  }
}
