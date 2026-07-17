import test from 'node:test'
import assert from 'node:assert/strict'
import { encounterDatabase } from '../src/encounters/encounterDatabase.js'
import { createEncounterInstance } from '../src/encounters/encounterModels.js'
import { createInitialEncounterRunState, EncounterStateRepository, normalizeEncounterRunState } from '../src/encounters/encounterRepository.js'
import { EncounterDetectionService } from '../src/encounters/encounterDetectionService.js'
import { EncounterCombatService } from '../src/encounters/encounterCombatService.js'
import { EncounterResolutionService } from '../src/encounters/encounterResolutionService.js'
import { EncounterNonCombatService } from '../src/encounters/encounterNonCombatService.js'
import { EncounterChoiceAvailabilityResolver, EncounterChoiceService } from '../src/encounters/encounterChoiceService.js'
import { ENCOUNTER_PHASE, PREPARATION_STATE } from '../src/encounters/encounterConstants.js'
import { REWARD_TYPE } from '../src/rewards/rewardDefinitions.js'

const setup = (encounterDefinitionId = 'bandit_ambush') => {
  const stateRepository = new EncounterStateRepository(createInitialEncounterRunState('part3', 'run'))
  const instance = createEncounterInstance({ instanceId: 'encounter-1', encounterDefinitionId, seed: 'instance-seed', generatedForRunId: 'run', regionId: 'meadows', worldPosition: { row: 4, column: 7 }, currentPhase: ENCOUNTER_PHASE.PENDING_TRIGGER })
  stateRepository.instances.save(instance)
  Object.assign(stateRepository.state.travelState, { pendingEncounterInstanceId: instance.instanceId, movementBlockedByEncounter: true, movementLockReason: 'EncounterPending' })
  const resolutionService = new EncounterResolutionService({ database: encounterDatabase, stateRepository, rewardServiceFactory: (context) => ({ apply(reward) { if (reward.type === REWARD_TYPE.GRANT_GOLD) context.characterState.gold += reward.amount; return { ok: true } } }) })
  let combatSequence = 0
  const combatService = new EncounterCombatService({ database: encounterDatabase, stateRepository, resolutionService, startCombat: (combatContext) => ({ ok: true, combatId: `combat-${++combatSequence}`, combatContext }) })
  const nonCombatService = new EncounterNonCombatService({ stateRepository, resolutionService })
  const choiceService = new EncounterChoiceService({ stateRepository, combatService, nonCombatService, resolutionService, runSeed: 'part3' })
  const detectionService = new EncounterDetectionService({ database: encounterDatabase, stateRepository, runSeed: 'part3' })
  return { stateRepository, instanceId: instance.instanceId, detectionService, resolutionService, combatService, choiceService }
}

const character = (stats = {}) => ({ gold: 0, inventory: [], stats: { perception: 3, luck: 3, agility: 3, ...stats }, proficiencySkills: {} })

test('activation resolves detection once, records occurrence at presentation and exposes detected choices', () => {
  const system = setup()
  const result = system.detectionService.activatePendingEncounter(system.instanceId, { characterState: character({ perception: 12 }), randomSource: () => 0.5 })
  assert.equal(result.ok, true)
  assert.equal(result.instance.currentPhase, ENCOUNTER_PHASE.CHOICE_PENDING)
  assert.equal(result.detectionResult.detected, true)
  assert.equal(result.choiceSet.id, 'bandit_detected')
  assert.equal(system.stateRepository.state.occurrenceCountersByEncounterId.bandit_ambush, 1)
  assert.equal(system.detectionService.runDetection(system.instanceId).code, 'DETECTION_ALREADY_RESOLVED')
  assert.equal(system.stateRepository.state.occurrenceCountersByEncounterId.bandit_ambush, 1)
})

test('failed and critical detection produce surprise or preparation using controlled RNG', () => {
  const failed = setup()
  const failure = failed.detectionService.activatePendingEncounter(failed.instanceId, { characterState: character({ perception: 0 }), randomSource: () => 0 })
  assert.equal(failure.detectionResult.critical, true)
  assert.equal(failure.preparationState, PREPARATION_STATE.SURPRISED)
  assert.equal(failure.choiceSet.id, 'combat_undetected')
  const success = setup()
  const critical = success.detectionService.activatePendingEncounter(success.instanceId, { characterState: character({ perception: 20 }), randomSource: () => 0.999 })
  assert.equal(critical.detectionResult.critical, true)
  assert.equal(critical.preparationState, PREPARATION_STATE.PREPARED)
})

test('automatic non-combat encounter skips a manual detection phase', () => {
  const system = setup('injured_traveler')
  const result = system.detectionService.activatePendingEncounter(system.instanceId, { characterState: character() })
  assert.equal(result.detectionResult.detected, true)
  assert.equal(result.choiceSet.id, 'traveler')
  assert.equal(result.instance.currentPhase, ENCOUNTER_PHASE.CHOICE_PENDING)
})

test('choice preview is phase-safe and preparation is limited to one use', () => {
  const system = setup()
  assert.equal(system.choiceService.preview(system.instanceId, 'prepare').code, 'ENCOUNTER_INVALID_PHASE')
  system.detectionService.activatePendingEncounter(system.instanceId, { characterState: character({ perception: 20 }), randomSource: () => 0.5 })
  const context = { characterState: character(), advanceWorldTime: () => ({ ok: true }) }
  const preview = system.choiceService.preview(system.instanceId, 'prepare', context)
  assert.equal(preview.visible, true)
  const result = system.choiceService.execute(system.instanceId, 'prepare', context)
  assert.equal(result.ok, true)
  assert.equal(system.stateRepository.instances.get(system.instanceId).preparationState, PREPARATION_STATE.PREPARED)
  assert.equal(system.choiceService.preview(system.instanceId, 'prepare', context).status, 'Exhausted')
})

test('Fight starts exactly one combat and carries encounter preparation modifiers', () => {
  const system = setup()
  system.detectionService.activatePendingEncounter(system.instanceId, { characterState: character(), randomSource: () => 0 })
  const started = system.choiceService.execute(system.instanceId, 'fight', { characterState: character() })
  assert.equal(started.code, 'ENCOUNTER_COMBAT_STARTED')
  assert.equal(started.combatContext.initiator, 'enemy')
  assert.equal(started.combatContext.playerInitiativeModifier, -2)
  assert.equal(started.combatContext.enemyInitiativeModifier, 2)
  assert.equal(system.combatService.start(system.instanceId).code, 'ENCOUNTER_COMBAT_ALREADY_PENDING')
})

test('combat outcomes finalize centrally and defeat never grants victory', () => {
  const system = setup()
  system.detectionService.activatePendingEncounter(system.instanceId, { characterState: character({ perception: 20 }), randomSource: () => 0.5 })
  const started = system.choiceService.execute(system.instanceId, 'fight', { characterState: character() })
  const result = system.combatService.resolveEncounterCombat(system.instanceId, started.combatId, 'Defeat', { characterState: character() })
  assert.equal(result.ok, true)
  assert.equal(result.instance.currentPhase, ENCOUNTER_PHASE.FAILED)
  assert.equal(result.instance.resolutionType, 'CombatDefeat')
  assert.equal(system.stateRepository.state.travelState.movementBlockedByEncounter, false)
})

test('successful Avoid resolves without combat while failed Flee starts surprised combat', () => {
  const avoided = setup()
  avoided.detectionService.activatePendingEncounter(avoided.instanceId, { characterState: character({ perception: 20 }), randomSource: () => 0.5 })
  const avoidResult = avoided.choiceService.execute(avoided.instanceId, 'avoid', { characterState: character({ perception: 20 }), randomSource: () => 0.999 })
  assert.equal(avoidResult.instance.currentPhase, ENCOUNTER_PHASE.AVOIDED)
  const fleeing = setup()
  fleeing.detectionService.activatePendingEncounter(fleeing.instanceId, { characterState: character(), randomSource: () => 0 })
  const fleeResult = fleeing.choiceService.execute(fleeing.instanceId, 'flee', { characterState: character({ agility: 0 }), randomSource: () => 0 })
  assert.equal(fleeResult.code, 'ENCOUNTER_COMBAT_STARTED')
  assert.equal(fleeResult.combatContext.preparationState, PREPARATION_STATE.SURPRISED)
})

test('non-combat choice uses central rewards and records one final history record', () => {
  const system = setup('injured_traveler')
  const hero = character()
  system.detectionService.activatePendingEncounter(system.instanceId, { characterState: hero })
  const result = system.choiceService.execute(system.instanceId, 'help_traveler', { characterState: hero, characterStats: { proficiencyValues: { Healing: { effectiveValue: 20 } } }, randomSource: () => 0.5 })
  assert.equal(result.ok, true)
  assert.equal(hero.gold, 5)
  assert.equal(system.stateRepository.state.historyRecords.length, 1)
  assert.equal(system.choiceService.execute(system.instanceId, 'help_traveler', { characterState: hero }).code, 'ENCOUNTER_INVALID_PHASE')
})

test('item rewards pause finalization until Loot is resolved and stay idempotent', () => {
  const system = setup('injured_traveler')
  system.detectionService.activatePendingEncounter(system.instanceId, { characterState: character() })
  const result = system.resolutionService.begin(system.instanceId, 'NonCombatSuccess', { title: 'Supplies', rewards: [{ type: REWARD_TYPE.GRANT_ITEM, itemId: 'bandage', quantity: 1 }] }, { characterState: character() })
  assert.equal(result.code, 'ENCOUNTER_LOOT_PENDING')
  assert.equal(system.stateRepository.state.travelState.movementBlockedByEncounter, true)
  const finalized = system.resolutionService.resolveLoot(system.instanceId, 'all', { characterState: character() })
  assert.equal(finalized.code, 'ENCOUNTER_FINALIZED')
  assert.equal(system.stateRepository.state.historyRecords.length, 1)
  assert.equal(system.resolutionService.resolveLoot(system.instanceId, 'all').code, 'ENCOUNTER_LOOT_NOT_PENDING')
})

test('save normalization restores every new interaction field and cancellation history follows presentation', () => {
  const system = setup()
  const beforePresentation = system.resolutionService.cancelPendingEncounter(system.instanceId, 'world reset')
  assert.equal(beforePresentation.historyRecorded, false)
  assert.equal(system.stateRepository.state.historyRecords.length, 0)
  const restored = normalizeEncounterRunState(system.stateRepository.serialize())
  assert.deepEqual(restored.encounterInstances[0].choiceCounters, {})
  assert.equal(restored.encounterInstances[0].detectionSequenceCounter, 0)
  const shown = setup()
  shown.detectionService.activatePendingEncounter(shown.instanceId, { characterState: character({ perception: 20 }), randomSource: () => 0.5 })
  assert.equal(shown.resolutionService.cancelPendingEncounter(shown.instanceId, 'closed').historyRecorded, true)
  assert.equal(shown.stateRepository.state.historyRecords.length, 1)
})
