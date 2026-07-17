import { POI_MAP_STATUS } from './poiConstants.js'
import { poiDatabase } from './poiDatabase.js'
import { createPoiInstance } from './poiModels.js'
import { PoiRepository } from './poiRepository.js'

const result = (instance, code = 'POI_UPDATED') => ({ ok: true, code, instance })
export class PoiService {
  constructor({ database = poiDatabase, repository = new PoiRepository(), onChange = () => {} } = {}) { this.database = database; this.repository = repository; this.onChange = onChange }
  getDefinition(id) { return this.database.get(id) }
  getInstance(id) { return this.repository.get(id) }
  create(definitionId, options = {}) { const definition = this.database.get(definitionId); if (!definition) return { ok: false, code: 'POI_DEFINITION_NOT_FOUND' }; const created = this.repository.create(createPoiInstance(definition, options)); if (created.ok) this.changed(created.instance); return created }
  delete(instanceId) { const ok = this.repository.delete(instanceId); if (ok) this.onChange(this.repository.serialize()); return { ok, code: ok ? 'POI_DELETED' : 'POI_INSTANCE_NOT_FOUND' } }
  mutate(instanceId, updater, code) { const instance = this.getInstance(instanceId); if (!instance) return { ok: false, code: 'POI_INSTANCE_NOT_FOUND' }; updater(instance); this.repository.save(instance); this.changed(instance); return result(instance, code) }
  changeState(instanceId, stateId) { const instance = this.getInstance(instanceId); const definition = instance && this.getDefinition(instance.poiDefinitionId); const state = definition?.stateDefinitions.find(({ id }) => id === stateId); if (!instance) return { ok: false, code: 'POI_INSTANCE_NOT_FOUND' }; if (!state) return { ok: false, code: 'POI_STATE_NOT_FOUND' }; return this.mutate(instanceId, (target) => { target.currentStateId = stateId; if (state.isCompletedState) target.isCompleted = true; if (state.isExhaustedState) target.isExhausted = true }, 'POI_STATE_CHANGED') }
  discover(id, value = true) { return this.mutate(id, (instance) => { instance.isDiscovered = value; if (!value) instance.isVisited = false }, value ? 'POI_DISCOVERED' : 'POI_HIDDEN') }
  visit(id, time = {}) { return this.mutate(id, (instance) => { instance.isDiscovered = true; instance.isVisited = true; this.stamp(instance, time) }, 'POI_VISITED') }
  complete(id, time = {}) { return this.mutate(id, (instance) => { instance.isDiscovered = true; instance.isVisited = true; instance.isCompleted = true; this.stamp(instance, time) }, 'POI_COMPLETED') }
  exhaust(id, time = {}) { return this.mutate(id, (instance) => { instance.isDiscovered = true; instance.isVisited = true; instance.isCompleted = true; instance.isExhausted = true; this.stamp(instance, time) }, 'POI_EXHAUSTED') }
  setFlag(id, flag, value = true) { return this.mutate(id, (instance) => { instance.localFlags[flag] = value }, 'POI_FLAG_SET') }
  clearFlag(id, flag) { return this.mutate(id, (instance) => { delete instance.localFlags[flag] }, 'POI_FLAG_CLEARED') }
  incrementCounter(id, counter, amount = 1) { return this.mutate(id, (instance) => { instance.interactionCounters[counter] = Math.max(0, (instance.interactionCounters[counter] ?? 0) + amount) }, 'POI_COUNTER_INCREMENTED') }
  resetCounter(id, counter) { return this.mutate(id, (instance) => { instance.interactionCounters[counter] = 0 }, 'POI_COUNTER_RESET') }
  claimReward(id, rewardId) { return this.mutate(id, (instance) => { if (!instance.claimedRewardIds.includes(rewardId)) instance.claimedRewardIds.push(rewardId) }, 'POI_REWARD_CLAIMED') }
  reset(id) { const instance = this.getInstance(id); if (!instance) return { ok: false, code: 'POI_INSTANCE_NOT_FOUND' }; const definition = this.getDefinition(instance.poiDefinitionId); return this.mutate(id, (target) => Object.assign(target, createPoiInstance(definition, { instanceId: target.instanceId, runId: target.generatedForRunId, seed: target.seed, worldPosition: target.worldPosition, locationId: target.locationId, regionId: target.regionId })), 'POI_RESET') }
  getMapStatus(id) { const instance = this.getInstance(id); if (!instance?.isDiscovered) return POI_MAP_STATUS.UNDISCOVERED; if (instance.isExhausted) return POI_MAP_STATUS.EXHAUSTED; if (instance.isCompleted) return POI_MAP_STATUS.COMPLETED; if (instance.isVisited) return POI_MAP_STATUS.VISITED; return POI_MAP_STATUS.DISCOVERED }
  stamp(instance, time) { instance.lastInteractionWorldDay = time.day ?? null; instance.lastInteractionWorldTime = time.hour ?? time.time ?? null }
  changed(instance) { this.onChange(this.repository.serialize(), instance) }
}
