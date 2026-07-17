import { SAVE_VERSION } from './saveService.js'
import { generateMeadowsRegion } from '../world/meadowsGenerator.js'
import { createInitialTime } from '../engine/timeSystem.js'
import { advancePoiDiscovery, createPoiRecords } from '../engine/poiDiscoverySystem.js'
import { cloneCharacterState, createCharacterState } from './characterState.js'
import { generateMerchantState } from '../merchants/merchantStock.js'
import { poiDatabase } from '../poi/poiDatabase.js'
import { PoiRepository } from '../poi/poiRepository.js'
import { PoiService } from '../poi/poiService.js'
import { PROFICIENCY_NAMES } from '../data/characterCreation.js'
import { PoiDiscoveryService } from '../poi/poiDiscoveryService.js'
import { createEmptyEncounterRunState, createInitialEncounterRunState } from '../encounters/encounterRepository.js'
import { createInitialWorldEventRuntime } from '../worldEvents/worldEventRepository.js'
import { createDialogueRuntime } from '../dialogue/dialogueModels.js'
import { createQuestRuntime } from '../quests/questModels.js'
import { createNpcScheduleRuntime } from '../npcSchedules/npcScheduleModels.js'

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
  const normalizedCreation = characterCreation && typeof characterCreation === 'object' ? characterCreation : { name: 'Hero', proficiencies: Object.fromEntries(PROFICIENCY_NAMES.map((name, index) => [name, index < 2 ? 'Novice' : 'Untrained'])), startingWeapon: { id: 'legacy-training-weapon', combatSkills: [] }, startingSkills: [] }
  const characterState = createCharacterState({ id: `character-${runId}`, ...normalizedCreation })
  const poiRepository = new PoiRepository()
  const poiService = new PoiService({ database: poiDatabase, repository: poiRepository })
  poiDatabase.getByRegion(map.id).forEach((definition, index) => poiService.create(definition.id, { runId, seed, worldPosition: { row: Math.min(map.rows - 1, start.row + index + 2), column: Math.min(map.columns - 1, start.column + index + 2) } }))
  const discoveryService = new PoiDiscoveryService({ poiService })
  poiRepository.getAll().forEach((instance) => discoveryService.evaluate(instance.instanceId, { regionId: map.id, worldPosition: playerPosition, worldDay: 1, worldTime: 6, knownKnowledgeIds: characterState.discoveredKnowledge, character: characterState, controlledRandomSource: () => 0 }))
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
    poiState: poiRepository.serialize(),
    encounterState: createInitialEncounterRunState(seed, runId),
    worldEventRuntime: createInitialWorldEventRuntime(runId),
    dialogueRuntime: createDialogueRuntime(),
    questRuntime: createQuestRuntime(),
    npcScheduleRuntime: createNpcScheduleRuntime(),
    characterState,
    merchantState: generateMerchantState(seed, runId),
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
    poiState: structuredClone(progress.poiState ?? run.poiState),
    encounterState: structuredClone(progress.encounterState ?? run.encounterState ?? createEmptyEncounterRunState()),
    worldEventRuntime: structuredClone(progress.worldEventRuntime ?? run.worldEventRuntime ?? createInitialWorldEventRuntime(run.runId)),
    dialogueRuntime: structuredClone(progress.dialogueRuntime ?? run.dialogueRuntime ?? createDialogueRuntime()),
    questRuntime: structuredClone(progress.questRuntime ?? run.questRuntime ?? createQuestRuntime()),
    npcScheduleRuntime: structuredClone(progress.npcScheduleRuntime ?? run.npcScheduleRuntime ?? createNpcScheduleRuntime()),
    characterState: cloneCharacterState(progress.characterState ?? run.characterState),
    merchantState: structuredClone(progress.merchantState ?? run.merchantState),
  }
}
