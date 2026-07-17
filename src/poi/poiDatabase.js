import { POI_DEFINITIONS } from './poiDefinitions.js'

export class PoiDatabase {
  constructor(definitions = POI_DEFINITIONS) { this.definitions = Object.freeze([...definitions]); this.byId = new Map(definitions.map((definition) => [definition.id, definition])); const validation = this.validate(); if (!validation.valid) throw new Error(`Invalid PoiDatabase: ${validation.errors.map(({ code, poiId }) => `${code}:${poiId}`).join(', ')}`) }
  get(id) { return this.byId.get(id) ?? null }
  getAll() { return [...this.definitions] }
  getByRegion(regionId) { return this.definitions.filter((definition) => definition.regionId === regionId) }
  getByLocation(locationId) { return this.definitions.filter((definition) => definition.locationId === locationId) }
  getByType(poiType) { return this.definitions.filter((definition) => definition.poiType === poiType) }
  getByTag(tag) { return this.definitions.filter((definition) => definition.tags.includes(tag)) }
  has(id) { return this.byId.has(id) }
  validate() { const ids = new Set(); const errors = []; for (const definition of this.definitions) { if (ids.has(definition.id)) errors.push({ code: 'DUPLICATE_POI_ID', poiId: definition.id }); ids.add(definition.id); const stateIds = new Set(); for (const state of definition.stateDefinitions) { if (stateIds.has(state.id)) errors.push({ code: 'DUPLICATE_STATE_ID', poiId: definition.id, stateId: state.id }); stateIds.add(state.id) } if (!stateIds.has(definition.initialStateId)) errors.push({ code: 'INVALID_INITIAL_STATE', poiId: definition.id }) } return { valid: errors.length === 0, errors } }
}
export const poiDatabase = new PoiDatabase()
