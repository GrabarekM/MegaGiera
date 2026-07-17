import test from 'node:test'
import assert from 'node:assert/strict'
import { DURATION_TYPE, EFFECTS_STATUS, EVENT_SCOPE, EVENT_STATE, EVENT_VISIBILITY, TRIGGER_TYPE } from '../src/worldEvents/worldEventConstants.js'
import { defineWorldEvent } from '../src/worldEvents/worldEventModels.js'
import { WorldEventDatabase } from '../src/worldEvents/worldEventDatabase.js'
import { createInitialWorldEventRuntime, WorldEventStateRepository } from '../src/worldEvents/worldEventRepository.js'
import { WorldEventProcessingService } from '../src/worldEvents/worldEventServices.js'
import { EFFECT_FAILURE_POLICY, EFFECT_TYPE, defineWorldEventEffect } from '../src/worldEvents/worldEventEffectModels.js'
import { WorldEventEffectExecutor } from '../src/worldEvents/worldEventEffectExecutor.js'
import { createRegionStateViewModel } from '../src/worldEvents/worldEventPresentation.js'

const now = { worldDay: 1, worldTime: { hour: 6, minute: 0 }, regionId: 'meadows', randomSource: () => 0.99 }
const effect = (id, effectType, extra = {}) => defineWorldEventEffect({ id, effectType, targetIds: ['meadows'], ...extra })
const definition = (id, effects, extra = {}) => defineWorldEvent({ id, displayName: id, description: `${id} description`, scope: EVENT_SCOPE.REGION, targetRegionIds: ['meadows'], triggerDefinitions: [{ id: 'manual', triggerType: TRIGGER_TYPE.MANUAL }], durationDefinition: { type: DURATION_TYPE.PERMANENT }, visibility: EVENT_VISIBILITY.NOTIFICATION, effects, ...extra })
const setup = (definitions, dependencies = {}) => {
  const database = new WorldEventDatabase(definitions)
  const repository = new WorldEventStateRepository(createInitialWorldEventRuntime('effects-test'))
  const processing = new WorldEventProcessingService({ database, repository })
  const executor = new WorldEventEffectExecutor({ database, repository, lifecycle: processing.lifecycle, processingService: processing, ...dependencies })
  const activate = (id) => {
    processing.processSignal({ signalId: `signal-${id}`, triggerType: TRIGGER_TYPE.MANUAL, targetId: id, ...now }, now)
    return repository.worldState.eventInstances.find((entry) => entry.eventDefinitionId === id)
  }
  return { database, repository, processing, executor, activate }
}

test('pending effects apply in order, persist markers and are idempotent', () => {
  const d = definition('ordered', [effect('second', EFFECT_TYPE.SET_REGION_SAFETY, { value: 8, executionOrder: 20 }), effect('first', EFFECT_TYPE.CHANGE_REGION_SAFETY, { value: 2, executionOrder: 10 })])
  const e = setup([d]); const instance = e.activate('ordered')
  assert.equal(instance.effectsStatus, EFFECTS_STATUS.PENDING)
  assert.equal(e.executor.applyPendingWorldEventEffects(instance.instanceId, now).ok, true)
  assert.equal(e.repository.region('meadows').safetyLevel, 8)
  assert.deepEqual(instance.appliedEffectIds, ['first', 'second'])
  assert.equal(e.executor.applyPendingWorldEventEffects(instance.instanceId, now).code, 'WORLD_EVENT_EFFECT_ALREADY_APPLIED')
})

test('required failure rolls back region, road and encounter effects', () => {
  const d = definition('rollback', [
    effect('threat', EFFECT_TYPE.CHANGE_REGION_THREAT, { value: 4, reversible: true }),
    effect('road', EFFECT_TYPE.SET_ROAD_STATE, { targetIds: ['northern_road'], value: 'Dangerous', reversible: true }),
    effect('wolves', EFFECT_TYPE.MODIFY_ENCOUNTER_WEIGHT, { targetIds: ['grey_wolf'], value: 2, reversible: true }),
    effect('failure', EFFECT_TYPE.GRANT_REWARD, { parameters: { reward: {} }, failurePolicy: EFFECT_FAILURE_POLICY.ROLLBACK })
  ])
  const e = setup([d]); const instance = e.activate('rollback'); const result = e.executor.applyPendingWorldEventEffects(instance.instanceId, now)
  assert.equal(result.ok, false)
  assert.equal(e.repository.region('meadows').threatLevel, 1)
  assert.equal(e.repository.region('meadows').roadStates.northern_road, 'Open')
  assert.equal(e.executor.encounters.modifiers('meadows').length, 0)
  assert.equal(e.repository.getInstance(instance.instanceId).currentState, EVENT_STATE.FAILED)
})

test('optional failures are skipped and instant events complete', () => {
  const d = definition('optional', [effect('missing-reward', EFFECT_TYPE.GRANT_REWARD, { required: false, failurePolicy: EFFECT_FAILURE_POLICY.SKIP }), effect('flag', EFFECT_TYPE.SET_WORLD_FLAG, { value: 'done' })], { durationDefinition: { type: DURATION_TYPE.INSTANT } })
  const e = setup([d]); const instance = e.activate('optional'); const result = e.executor.applyPendingWorldEventEffects(instance.instanceId, now)
  assert.equal(result.ok, true); assert.equal(e.repository.getInstance(instance.instanceId).currentState, EVENT_STATE.COMPLETED); assert.equal(e.repository.worldState.worldFlags.done, true)
})

test('region threat and safety clamp independently of night threat', () => {
  const d = definition('clamp', [effect('threat', EFFECT_TYPE.CHANGE_REGION_THREAT, { value: 99 }), effect('safety', EFFECT_TYPE.CHANGE_REGION_SAFETY, { value: -99 })])
  const e = setup([d]); const instance = e.activate('clamp'); e.executor.applyPendingWorldEventEffects(instance.instanceId, now)
  assert.equal(e.repository.region('meadows').threatLevel, 10); assert.equal(e.repository.region('meadows').safetyLevel, 0); assert.equal('nightThreat' in e.repository.region('meadows'), false)
})

test('timed effects revert snapshots in reverse order', () => {
  const d = definition('timed', [effect('threat', EFFECT_TYPE.CHANGE_REGION_THREAT, { value: 2, reversible: true }), effect('road', EFFECT_TYPE.SET_ROAD_STATE, { targetIds: ['northern_road'], value: 'Blocked', reversible: true })], { durationDefinition: { type: DURATION_TYPE.TIMED, durationWorldMinutes: 60 } })
  const e = setup([d]); const instance = e.activate('timed'); e.executor.applyPendingWorldEventEffects(instance.instanceId, now)
  assert.equal(e.executor.road.canEnter('meadows', 'northern_road'), false)
  const result = e.executor.revertWorldEventEffects(instance.instanceId, now)
  assert.equal(result.ok, true); assert.deepEqual(result.transaction.revertedEffectIds, ['road', 'threat']); assert.equal(e.repository.region('meadows').threatLevel, 1)
})

test('encounter runtime controls table state and weights without mutating definitions', () => {
  const d = definition('encounters', [effect('enable', EFFECT_TYPE.ENABLE_ENCOUNTER_TABLE, { targetIds: ['night'], value: true }), effect('table-weight', EFFECT_TYPE.MODIFY_TABLE_WEIGHT, { targetIds: ['night'], value: 1.5 }), effect('wolf-weight', EFFECT_TYPE.MODIFY_ENCOUNTER_WEIGHT, { targetIds: ['wolf'], value: 2 })])
  const e = setup([d]); const instance = e.activate('encounters'); e.executor.applyPendingWorldEventEffects(instance.instanceId, now)
  const context = { regionId: 'meadows' }; const table = { id: 'night', enabled: false, tableWeight: 4 }; const wolf = { id: 'wolf', tags: [] }
  assert.equal(e.executor.encounters.tableEnabled(table, context), true); assert.equal(e.executor.encounters.tableWeight(table, context), 6); assert.equal(e.executor.encounters.encounterWeight(wolf, context), 2)
  assert.equal(table.enabled, false); assert.equal(table.tableWeight, 4)
})

test('controlled Wardwood delivery stores one roll and excludes arrows and bolts', () => {
  const stocks = { general: { currentGoldReserve: 10, items: [] } }
  const merchantService = { stock: (id) => stocks[id], addStock: (id, itemDefinitionId, quantity) => { stocks[id].items.push({ itemDefinitionId, quantity }); return { ok: true } } }
  const d = definition('delivery', [effect('wardwood', EFFECT_TYPE.ADD_WARDWOOD, { targetIds: ['general'], parameters: { minimum: 1, maximum: 3 } })])
  const e = setup([d], { merchantService }); const instance = e.activate('delivery'); e.executor.applyPendingWorldEventEffects(instance.instanceId, now)
  assert.equal(instance.rolledValues.wardwood, 3); assert.deepEqual(stocks.general.items, [{ itemDefinitionId: 'wardwood', quantity: 3 }]); assert.ok(!stocks.general.items.some(({ itemDefinitionId }) => ['arrow', 'bolt'].includes(itemDefinitionId)))
  e.executor.applyPendingWorldEventEffects(instance.instanceId, now); assert.equal(stocks.general.items.length, 1)
})

test('safe zone state and notifications are saved and hidden events stay out of Region UI', () => {
  const messages = []; const notifications = { notify: (...args) => messages.push(args) }
  const visible = definition('visible', [effect('safe', EFFECT_TYPE.ENABLE_SAFE_ZONE, { targetIds: ['shelter'], reversible: true })])
  const hidden = definition('hidden', [effect('hidden-flag', EFFECT_TYPE.SET_REGION_FLAG, { value: 'secret' })], { visibility: EVENT_VISIBILITY.HIDDEN })
  const e = setup([visible, hidden], { notificationService: notifications })
  for (const id of ['visible', 'hidden']) { const instance = e.activate(id); e.executor.applyPendingWorldEventEffects(instance.instanceId, now) }
  assert.equal(e.executor.safeZones.status('meadows', 'shelter').enabled, true); assert.equal(messages.length, 1)
  const model = createRegionStateViewModel('meadows', e.repository, e.database)
  assert.ok(model.activeConditions.includes('visible')); assert.ok(!model.activeConditions.includes('hidden')); assert.ok(!JSON.stringify(model).includes('hidden-flag'))
})

test('serialized pending and applied transactions recover without duplicate effects', () => {
  const d = definition('recovery', [effect('flag', EFFECT_TYPE.SET_WORLD_FLAG, { value: 'recovered' })])
  const first = setup([d]); const instance = first.activate('recovery'); first.executor.applyPendingWorldEventEffects(instance.instanceId, now)
  const repository = new WorldEventStateRepository(first.repository.serialize()); const processing = new WorldEventProcessingService({ database: first.database, repository }); const executor = new WorldEventEffectExecutor({ database: first.database, repository, lifecycle: processing.lifecycle, processingService: processing })
  assert.equal(repository.getInstance(instance.instanceId).appliedEffectIds.length, 1); assert.equal(repository.worldState.effectTransactions.length, 1)
  assert.equal(executor.recoverPendingEffects(now).results.length, 0); assert.equal(repository.worldState.worldFlags.recovered, true)
})
