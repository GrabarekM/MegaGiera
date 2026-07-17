import { POI_STATE_VERSION } from './poiConstants.js'

export const createEmptyPoiState = () => ({ version: POI_STATE_VERSION, instances: [] })
export const normalizePoiState = (state) => ({ version: POI_STATE_VERSION, instances: Array.isArray(state?.instances) ? state.instances.map((instance) => ({ isActive: true, discoverySourceType: null, discoverySourceId: null, discoveredWorldDay: null, discoveredWorldTime: null, discoveryAttempts: 0, pendingOutcomeId: null, pendingCombatId: null, pendingLootRewardId: null, pendingResolution: null, lastCheckResults: [], lastOutcomeResult: null, ...instance, worldPosition: { ...instance.worldPosition }, localFlags: { ...(instance.localFlags ?? {}) }, interactionCounters: { ...(instance.interactionCounters ?? {}) }, claimedRewardIds: [...(instance.claimedRewardIds ?? [])], finalizedOutcomeIds: [...(instance.finalizedOutcomeIds ?? [])], lastCheckResults: [...(instance.lastCheckResults ?? [])], pendingResolution: instance.pendingResolution ? structuredClone(instance.pendingResolution) : null })) : [] })
export const isValidPoiState = (state) => Boolean(state && state.version === POI_STATE_VERSION && Array.isArray(state.instances) && state.instances.every((instance) => typeof instance.instanceId === 'string' && typeof instance.poiDefinitionId === 'string' && instance.worldPosition && typeof instance.localFlags === 'object' && typeof instance.interactionCounters === 'object' && Array.isArray(instance.claimedRewardIds)))

export class PoiRepository {
  constructor(state = createEmptyPoiState()) { this.state = normalizePoiState(state) }
  get(instanceId) { return this.state.instances.find((instance) => instance.instanceId === instanceId) ?? null }
  save(instance) { const index = this.state.instances.findIndex(({ instanceId }) => instanceId === instance.instanceId); const stored = normalizePoiState({ instances: [instance] }).instances[0]; if (index < 0) this.state.instances.push(stored); else if (this.state.instances[index] !== instance) Object.assign(this.state.instances[index], stored); return index < 0 ? stored : this.state.instances[index] }
  create(instance) { if (this.get(instance.instanceId)) return { ok: false, code: 'POI_INSTANCE_EXISTS' }; return { ok: true, instance: this.save(instance) } }
  delete(instanceId) { const index = this.state.instances.findIndex((instance) => instance.instanceId === instanceId); if (index < 0) return false; this.state.instances.splice(index, 1); return true }
  getAll() { return this.state.instances }
  getByRegion(regionId) { return this.state.instances.filter((instance) => instance.regionId === regionId) }
  getByLocation(locationId) { return this.state.instances.filter((instance) => instance.locationId === locationId) }
  serialize() { return normalizePoiState(this.state) }
}

export class PoiStateRepository extends PoiRepository {}
