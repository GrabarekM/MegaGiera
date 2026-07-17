import { ENCOUNTER_TIME_WINDOW } from './encounterConstants.js'
import { evaluateRequirement } from '../npc/trainingRequirementSystem.js'
import { DAY_START_MINUTES, NIGHT_START_MINUTES } from '../world/worldClock.js'

const clockMinutes = (value) => typeof value === 'object' ? (value.hour ?? 0) * 60 + (value.minute ?? 0) : Math.floor(value) * 60
export function matchesTimeWindow(window, context) {
  const type = typeof window === 'object' ? window.type : window
  const minutes = clockMinutes(context.worldTime)
  if (!type || type === ENCOUNTER_TIME_WINDOW.ALL_DAY) return true
  if (type === ENCOUNTER_TIME_WINDOW.DAY) return minutes >= DAY_START_MINUTES && minutes < NIGHT_START_MINUTES
  if (type === ENCOUNTER_TIME_WINDOW.NIGHT) return minutes >= NIGHT_START_MINUTES || minutes < DAY_START_MINUTES
  if (type === ENCOUNTER_TIME_WINDOW.DAWN) return minutes >= DAY_START_MINUTES && minutes < DAY_START_MINUTES + 120
  if (type === ENCOUNTER_TIME_WINDOW.DUSK) return minutes >= NIGHT_START_MINUTES - 120 && minutes < NIGHT_START_MINUTES
  if (type === ENCOUNTER_TIME_WINDOW.CUSTOM) { const start = window.start; const end = window.end; return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end }
  return true
}
const includesAll = (source, required) => required.every((item) => source.includes(item))
const requirementMet = (requirement, context) => {
  if (requirement.type === 'world_flag') return context.worldFlags?.[requirement.flag] === (requirement.value ?? true)
  if (requirement.type === 'region_flag') return context.regionFlags?.[requirement.flag] === (requirement.value ?? true)
  if (requirement.type === 'quest_flag') return context.questFlags?.[requirement.flag] === (requirement.value ?? true)
  if (requirement.type === 'world_day') return context.worldDay >= (requirement.minimum ?? 1) && context.worldDay <= (requirement.maximum ?? Infinity)
  return context.characterState ? evaluateRequirement(context.characterState, requirement).met : false
}
export const requirementsMet = (requirements, context) => requirements.every((requirement) => requirementMet(requirement, context))

export class EncounterTableResolver {
  constructor(database) { this.database = database }
  evaluate(table, context) {
    const reasons = []
    const runtimeEnabled = context.worldEventEncounterRuntime?.tableEnabled(table, context) ?? table.enabled
    if (!runtimeEnabled) reasons.push('TABLE_DISABLED')
    if (context.currentSafeZoneStatus && !table.allowInSafeZone) reasons.push('SAFE_ZONE_BLOCKED')
    if (table.regionIds.length && !table.regionIds.includes(context.regionId)) reasons.push('REGION_MISMATCH')
    if (table.biomeTags.length && !table.biomeTags.some((tag) => context.biomeTags.includes(tag))) reasons.push('BIOME_MISMATCH')
    if (table.locationTags.length && !includesAll(context.locationTags, table.locationTags)) reasons.push('LOCATION_TAG_MISMATCH')
    if (!matchesTimeWindow(table.timeWindow, context)) reasons.push('TIME_WINDOW_MISMATCH')
    if (context.regionThreatLevel < table.minimumThreatLevel || context.regionThreatLevel > table.maximumThreatLevel) reasons.push('THREAT_LEVEL_MISMATCH')
    if (!requirementsMet(table.requirements ?? [], context)) reasons.push('REQUIREMENTS_NOT_MET')
    const priority = table.locationTags.length ? 3 : table.regionIds.length ? 2 : table.biomeTags.length ? 1 : 0
    const runtimeWeight = context.worldEventEncounterRuntime?.tableWeight(table, context) ?? table.tableWeight
    return { table, eligible: reasons.length === 0, reasons, priority, weight: runtimeWeight }
  }
  resolve(context) { const all = this.database.getAllTables().map((table) => this.evaluate(table, context)); const matching = all.filter(({ eligible }) => eligible); const maximumPriority = matching.length ? Math.max(...matching.map(({ priority }) => priority)) : -1; return { matchingTables: matching.filter(({ priority }) => priority === maximumPriority), rejectedTables: all.filter(({ eligible }) => !eligible), allMatchingTables: matching } }
  fallbackChain(table) { const result = []; const seen = new Set(); let current = table; while (current?.fallbackEncounterTableId && !seen.has(current.fallbackEncounterTableId)) { seen.add(current.id); current = this.database.getTable(current.fallbackEncounterTableId); if (current) result.push(current) } return result }
}
