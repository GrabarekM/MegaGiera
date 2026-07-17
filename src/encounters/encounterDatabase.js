import { ENCOUNTER_DEFINITIONS, ENCOUNTER_TABLES } from './encounterDefinitions.js'
import { ENCOUNTER_REPEAT_POLICY, ENCOUNTER_TIME_WINDOW, ENCOUNTER_TYPE } from './encounterConstants.js'

const duplicateIds = (items) => { const seen = new Set(); return items.filter(({ id }) => seen.has(id) || !seen.add(id)).map(({ id }) => id) }
export class EncounterDatabase {
  constructor({ encounters = ENCOUNTER_DEFINITIONS, tables = ENCOUNTER_TABLES, combatDefinitionIds = ['grey_wolf', 'desperate_peasant', 'starved_wild_dog', 'mongbat', 'giant_rat'], regionIds = ['meadows'], biomeTags = ['grassland', 'forest', 'hills', 'water', 'mountains'] } = {}) { this.encounters = Object.freeze([...encounters]); this.tables = Object.freeze([...tables]); this.encounterById = new Map(encounters.map((item) => [item.id, item])); this.tableById = new Map(tables.map((item) => [item.id, item])); this.combatDefinitionIds = new Set(combatDefinitionIds); this.regionIds = new Set(regionIds); this.biomeTags = new Set(biomeTags) }
  getEncounter(id) { return this.encounterById.get(id) ?? null }
  getTable(id) { return this.tableById.get(id) ?? null }
  getAllEncounters() { return [...this.encounters] }
  getAllTables() { return [...this.tables] }
  getTablesByRegion(id) { return this.tables.filter(({ regionIds }) => regionIds.includes(id)) }
  getTablesByBiome(tag) { return this.tables.filter(({ biomeTags }) => biomeTags.includes(tag)) }
  getEncountersByType(type) { return this.encounters.filter(({ encounterType }) => encounterType === type) }
  getEncountersByTag(tag) { return this.encounters.filter(({ tags }) => tags.includes(tag)) }
  validate() {
    const errors = []; const warnings = []
    for (const id of duplicateIds(this.encounters)) errors.push({ code: 'DUPLICATE_ENCOUNTER_ID', id })
    for (const id of duplicateIds(this.tables)) errors.push({ code: 'DUPLICATE_ENCOUNTER_TABLE_ID', id })
    for (const encounter of this.encounters) {
      if (encounter.weight < 0) errors.push({ code: 'NEGATIVE_ENCOUNTER_WEIGHT', id: encounter.id })
      if (encounter.minimumThreatLevel > encounter.maximumThreatLevel) errors.push({ code: 'INVALID_THREAT_RANGE', id: encounter.id })
      if ((encounter.maximumOccurrencesPerRun ?? 0) < 0) errors.push({ code: 'INVALID_OCCURRENCE_LIMIT', id: encounter.id })
      if (encounter.repeatPolicy === ENCOUNTER_REPEAT_POLICY.UNIQUE_PER_RUN && encounter.maximumOccurrencesPerRun > 1) warnings.push({ code: 'UNIQUE_LIMIT_ABOVE_ONE', id: encounter.id })
      if ([ENCOUNTER_TYPE.COMBAT, ENCOUNTER_TYPE.CREATURE, ENCOUNTER_TYPE.BANDIT].includes(encounter.encounterType) && encounter.combatDefinitionId && !this.combatDefinitionIds.has(encounter.combatDefinitionId)) errors.push({ code: 'MISSING_COMBAT_DEFINITION', id: encounter.id, combatDefinitionId: encounter.combatDefinitionId })
      if (encounter.timeWindow?.type === ENCOUNTER_TIME_WINDOW.CUSTOM && encounter.timeWindow.start === encounter.timeWindow.end) errors.push({ code: 'INVALID_TIME_RANGE', id: encounter.id })
      for (const tag of encounter.biomeTags) if (!this.biomeTags.has(tag)) warnings.push({ code: 'UNKNOWN_BIOME_TAG', id: encounter.id, tag })
    }
    for (const table of this.tables) {
      if (table.noEncounterWeight < 0 || table.tableWeight < 0) errors.push({ code: 'NEGATIVE_TABLE_WEIGHT', id: table.id })
      if (table.minimumThreatLevel > table.maximumThreatLevel) errors.push({ code: 'INVALID_THREAT_RANGE', id: table.id })
      if (table.fallbackEncounterTableId && !this.tableById.has(table.fallbackEncounterTableId)) errors.push({ code: 'MISSING_FALLBACK_TABLE', id: table.id, fallbackId: table.fallbackEncounterTableId })
      if (table.enabled && !table.encounterEntries.some(({ enabled, weight }) => enabled && weight > 0) && table.noEncounterWeight <= 0) errors.push({ code: 'EMPTY_ACTIVE_TABLE', id: table.id })
      for (const regionId of table.regionIds) if (!this.regionIds.has(regionId)) errors.push({ code: 'UNKNOWN_REGION_ID', id: table.id, regionId })
      for (const tag of table.biomeTags) if (!this.biomeTags.has(tag)) warnings.push({ code: 'UNKNOWN_BIOME_TAG', id: table.id, tag })
      for (const entry of table.encounterEntries) { if (!this.encounterById.has(entry.encounterDefinitionId)) errors.push({ code: 'MISSING_ENCOUNTER_DEFINITION', tableId: table.id, encounterId: entry.encounterDefinitionId }); if (entry.weight < 0) errors.push({ code: 'NEGATIVE_ENTRY_WEIGHT', tableId: table.id, encounterId: entry.encounterDefinitionId }); const conflicting = entry.requiredWorldFlags.some((flag) => entry.blockedWorldFlags.includes(flag)) || entry.requiredRegionFlags.some((flag) => entry.blockedRegionFlags.includes(flag)); if (conflicting) errors.push({ code: 'CONTRADICTORY_ENTRY_FLAGS', tableId: table.id, encounterId: entry.encounterDefinitionId }) }
    }
    for (const table of this.tables) { const seen = new Set([table.id]); let current = table; while (current?.fallbackEncounterTableId) { if (seen.has(current.fallbackEncounterTableId)) { errors.push({ code: 'FALLBACK_CYCLE', id: table.id }); break } seen.add(current.fallbackEncounterTableId); current = this.getTable(current.fallbackEncounterTableId) } }
    return { valid: errors.length === 0, errors, warnings }
  }
}
export const encounterDatabase = new EncounterDatabase()
