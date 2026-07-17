import { ENCOUNTER_COOLDOWN_TYPE, ENCOUNTER_REPEAT_POLICY, ENCOUNTER_SELECTION_RESULT, ENCOUNTER_TIME_WINDOW } from './encounterConstants.js'
import { createEncounterInstance, createEncounterSelectionContext } from './encounterModels.js'
import { EncounterTableResolver, matchesTimeWindow, requirementsMet } from './encounterTableResolver.js'

export const createSeededRandom = (seed = '') => { let value = [...String(seed)].reduce((hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619), 2166136261) >>> 0; return () => { value += 0x6D2B79F5; let result = value; result = Math.imul(result ^ result >>> 15, result | 1); result ^= result + Math.imul(result ^ result >>> 7, result | 61); return ((result ^ result >>> 14) >>> 0) / 4294967296 } }
const allFlags = (flags, required) => required.every((flag) => Boolean(flags?.[flag]))
const anyFlag = (flags, blocked) => blocked.some((flag) => Boolean(flags?.[flag]))
const worldMinutes = (context) => context.worldDay * 1440 + (typeof context.worldTime === 'object' ? context.worldTime.hour * 60 + (context.worldTime.minute ?? 0) : context.worldTime * 60)
const weightedPick = (items, random) => { const total = items.reduce((sum, item) => sum + item.finalWeight, 0); const roll = Math.min(.999999999, Math.max(0, random())) * total; let cursor = 0; const selected = items.find((item) => (cursor += item.finalWeight) > roll) ?? items.at(-1); return { selected, roll, total } }

export class EncounterSelectionService {
  constructor({ database, stateRepository, tableResolver = new EncounterTableResolver(database), runSeed = '' }) { this.database = database; this.stateRepository = stateRepository; this.tableResolver = tableResolver; this.runSeed = runSeed }
  cooldownActive(definition, context) { const cooldown = this.stateRepository.state.cooldowns[definition.id]; if (!cooldown) return false; if (cooldown.type === ENCOUNTER_COOLDOWN_TYPE.WORLD_MINUTES) return worldMinutes(context) - cooldown.startedWorldMinutes < cooldown.value; if (cooldown.type === ENCOUNTER_COOLDOWN_TYPE.ENCOUNTER_COUNT) return this.stateRepository.state.triggeredEncounterCount - cooldown.startedEncounterCount < cooldown.value; return false }
  evaluateEntry(entry, table, context) {
    const definition = this.database.getEncounter(entry.encounterDefinitionId); const reasons = []
    if (!definition) return { entry, definition: null, eligible: false, reasons: ['ENCOUNTER_DEFINITION_NOT_FOUND'], finalWeight: 0 }
    if (!definition.enabled || this.stateRepository.state.disabledEncounterIds.includes(definition.id)) reasons.push('ENCOUNTER_DISABLED')
    if (!entry.enabled) reasons.push('ENTRY_DISABLED')
    if (definition.regionTags.length && !definition.regionTags.includes(context.regionId)) reasons.push('REGION_MISMATCH')
    if (definition.biomeTags.length && !definition.biomeTags.some((tag) => context.biomeTags.includes(tag))) reasons.push('BIOME_MISMATCH')
    if (definition.allowedLocationTags.length && !definition.allowedLocationTags.some((tag) => context.locationTags.includes(tag))) reasons.push('LOCATION_TAG_MISMATCH')
    if (definition.blockedLocationTags.some((tag) => context.locationTags.includes(tag))) reasons.push('BLOCKED_LOCATION_TAG')
    const timeWindow = entry.timeWindowOverride ?? (definition.nightOnly ? ENCOUNTER_TIME_WINDOW.NIGHT : definition.dayOnly ? ENCOUNTER_TIME_WINDOW.DAY : definition.timeWindow)
    if (!matchesTimeWindow(timeWindow, context)) reasons.push('TIME_WINDOW_MISMATCH')
    const minThreat = entry.minimumThreatLevelOverride ?? definition.minimumThreatLevel; const maxThreat = entry.maximumThreatLevelOverride ?? definition.maximumThreatLevel
    if (context.regionThreatLevel < minThreat || context.regionThreatLevel > maxThreat) reasons.push('THREAT_LEVEL_MISMATCH')
    const minNight = entry.minimumNightThreatPercent ?? definition.minimumNightThreatPercent; const maxNight = entry.maximumNightThreatPercent ?? definition.maximumNightThreatPercent
    if (context.nightThreatPercent < minNight || context.nightThreatPercent > maxNight) reasons.push('NIGHT_THREAT_MISMATCH')
    if (context.worldDay < definition.minimumWorldDay || context.worldDay > definition.maximumWorldDay) reasons.push('WORLD_DAY_MISMATCH')
    if (!requirementsMet([...definition.requirements, ...entry.requirements], context)) reasons.push('REQUIREMENTS_NOT_MET')
    if (!allFlags(context.worldFlags, entry.requiredWorldFlags) || anyFlag(context.worldFlags, entry.blockedWorldFlags)) reasons.push('WORLD_FLAGS_MISMATCH')
    if (!allFlags(context.regionFlags, entry.requiredRegionFlags) || anyFlag(context.regionFlags, entry.blockedRegionFlags)) reasons.push('REGION_FLAGS_MISMATCH')
    const occurrences = this.stateRepository.state.occurrenceCountersByEncounterId[definition.id] ?? 0; const limit = entry.maximumOccurrencesPerRunOverride ?? definition.maximumOccurrencesPerRun
    if ((definition.repeatPolicy === ENCOUNTER_REPEAT_POLICY.LIMITED_PER_RUN || limit !== null) && limit !== null && occurrences >= limit) reasons.push('OCCURRENCE_LIMIT_REACHED')
    if ((definition.uniquePerRun || definition.repeatPolicy === ENCOUNTER_REPEAT_POLICY.UNIQUE_PER_RUN) && this.stateRepository.state.uniqueEncounterIdsUsed.includes(definition.id)) reasons.push('UNIQUE_ENCOUNTER_ALREADY_USED')
    if (this.cooldownActive(definition, context)) reasons.push('COOLDOWN_ACTIVE')
    const recent = this.stateRepository.state.recentEncounterIds; const immediateRepeat = definition.blockImmediateRepeat && this.stateRepository.state.lastEncounterId === definition.id
    if (immediateRepeat && !definition.allowFallbackRepeat) reasons.push('IMMEDIATE_REPEAT_BLOCKED')
    if (definition.blockRecentRepeatCount > 0 && recent.slice(-definition.blockRecentRepeatCount).includes(definition.id)) reasons.push('RECENT_REPEAT_BLOCKED')
    const repetitionModifier = recent.includes(definition.id) ? definition.repeatedEncounterWeightMultiplier : 1
    const worldEventModifier = context.worldEventEncounterRuntime?.encounterWeight(definition, context) ?? 1
    const finalWeight = definition.weight * entry.weight * repetitionModifier * worldEventModifier
    if (finalWeight <= 0) reasons.push('INVALID_ENCOUNTER_WEIGHT')
    return { entry, definition, eligible: reasons.length === 0, reasons, baseDefinitionWeight: definition.weight, entryWeight: entry.weight, repetitionModifier, worldEventModifier, finalWeight, occurrenceCount: occurrences, cooldownActive: this.cooldownActive(definition, context), uniqueUsed: this.stateRepository.state.uniqueEncounterIdsUsed.includes(definition.id) }
  }
  chooseTable(matching, context) { if (!matching.length) return null; if (matching.length === 1) return matching[0].table; const picks = matching.map(({ table, weight }) => ({ table, finalWeight: weight })).filter(({ finalWeight }) => finalWeight > 0); return weightedPick(picks, context.randomSource).selected?.table ?? null }
  previewEncounterSelection(rawContext = {}) {
    const context = createEncounterSelectionContext(rawContext); const resolved = this.tableResolver.resolve(context); let table = null
    if (this.stateRepository.state.forcedNextEncounterTableId) table = this.database.getTable(this.stateRepository.state.forcedNextEncounterTableId)
    else table = this.chooseTable(resolved.matchingTables, context)
    if (!table) return { success: false, resultCode: ENCOUNTER_SELECTION_RESULT.NO_TABLE, context, matchingTables: resolved.matchingTables, rejectedTables: resolved.rejectedTables, eligibleEncounters: [], rejectedEncounters: [] }
    let fallbackUsed = false; let candidates = table.encounterEntries.map((entry) => this.evaluateEntry(entry, table, context)); let eligible = candidates.filter(({ eligible }) => eligible)
    if (this.stateRepository.state.forcedNextEncounterId) { const forcedId = this.stateRepository.state.forcedNextEncounterId; let forced = candidates.find(({ definition }) => definition?.id === forcedId); if (!forced) { const source = this.database.getAllTables().find(({ encounterEntries }) => encounterEntries.some(({ encounterDefinitionId }) => encounterDefinitionId === forcedId)); const forcedEntry = source?.encounterEntries.find(({ encounterDefinitionId }) => encounterDefinitionId === forcedId); if (source && forcedEntry) { table = source; candidates = source.encounterEntries.map((entry) => this.evaluateEntry(entry, source, context)); forced = candidates.find(({ definition }) => definition?.id === forcedId) } } eligible = forced?.eligible || context.developerBypass ? [forced ?? { definition: this.database.getEncounter(forcedId), entry: { weight: 1 }, finalWeight: 1, eligible: true, reasons: [] }] : [] }
    if (!eligible.length && (!table.allowNoEncounterResult || table.noEncounterWeight <= 0)) { const explicit = this.tableResolver.fallbackChain(table); const lowerPriority = resolved.allMatchingTables.filter(({ table: candidate }) => candidate.id !== table.id && !explicit.some(({ id }) => id === candidate.id)).sort((a, b) => b.priority - a.priority).map(({ table: candidate }) => candidate); for (const fallback of [...explicit, ...lowerPriority]) { const next = fallback.encounterEntries.map((entry) => this.evaluateEntry(entry, fallback, context)); const nextEligible = next.filter(({ eligible }) => eligible); if (nextEligible.length || (fallback.allowNoEncounterResult && fallback.noEncounterWeight > 0)) { table = fallback; candidates = next; eligible = nextEligible; fallbackUsed = true; break } } }
    return { success: true, resultCode: eligible.length || table.noEncounterWeight > 0 ? (fallbackUsed ? ENCOUNTER_SELECTION_RESULT.FALLBACK : 'SELECTION_PREVIEW_READY') : ENCOUNTER_SELECTION_RESULT.NO_ELIGIBLE, context, matchingTables: resolved.matchingTables, rejectedTables: resolved.rejectedTables, selectedTable: table, selectedTableId: table.id, fallbackUsed, fallbackChain: this.tableResolver.fallbackChain(table).map(({ id }) => id), eligibleEncounters: eligible, rejectedEncounters: candidates.filter(({ eligible }) => !eligible), noEncounterWeight: table.allowNoEncounterResult ? table.noEncounterWeight : 0, sequenceCounter: this.stateRepository.state.encounterSequenceCounter }
  }
  selectEncounter(rawContext = {}) {
    const context = createEncounterSelectionContext(rawContext); if (!context.runId) return { success: false, resultCode: ENCOUNTER_SELECTION_RESULT.INVALID_CONTEXT }
    const preview = this.previewEncounterSelection(context); if (!preview.success) return preview
    const pool = preview.eligibleEncounters.map((candidate) => ({ ...candidate })); if (preview.noEncounterWeight > 0) pool.push({ noEncounter: true, finalWeight: preview.noEncounterWeight })
    if (!pool.length) return { ...preview, success: false, resultCode: ENCOUNTER_SELECTION_RESULT.NO_ELIGIBLE }
    const sequence = this.stateRepository.nextSequence(); const random = rawContext.randomSource ?? createSeededRandom(`${this.runSeed}:${context.runId}:${sequence}`); const selection = weightedPick(pool, random)
    this.stateRepository.state.forcedNextEncounterId = null; this.stateRepository.state.forcedNextEncounterTableId = null
    if (selection.selected.noEncounter) return { ...preview, success: true, resultCode: ENCOUNTER_SELECTION_RESULT.NONE, noEncounterSelected: true, selectedEncounterDefinitionId: null, candidateCount: preview.eligibleEncounters.length, randomRoll: selection.roll, totalWeight: selection.total, sequenceCounter: sequence }
    const definition = selection.selected.definition; const instanceId = `encounter-${context.runId}-${sequence}`; const instance = createEncounterInstance({ instanceId, encounterDefinitionId: definition.id, sourceTableId: preview.selectedTableId, generatedForRunId: context.runId, seed: `${this.runSeed}:${sequence}`, regionId: context.regionId, biomeTag: context.biomeTags[0] ?? null, locationId: context.locationId, worldPosition: context.worldPosition, worldDay: context.worldDay, worldTime: context.worldTime, threatLevel: context.regionThreatLevel, triggerSource: context.triggerSource }); this.stateRepository.instances.save(instance)
    return { ...preview, success: true, resultCode: ENCOUNTER_SELECTION_RESULT.SELECTED, noEncounterSelected: false, selectedEncounterDefinitionId: definition.id, encounterInstanceId: instanceId, encounterInstance: instance, candidateCount: preview.eligibleEncounters.length, randomRoll: selection.roll, totalWeight: selection.total, sequenceCounter: sequence }
  }
  markEncounterTriggered(instanceId) { const instance = this.stateRepository.instances.get(instanceId); const definition = instance && this.database.getEncounter(instance.encounterDefinitionId); return instance && definition ? this.stateRepository.markTriggered(instance, definition) : null }
  markEncounterResolved(instanceId, result) { const instance = this.stateRepository.instances.get(instanceId); const definition = instance && this.database.getEncounter(instance.encounterDefinitionId); return instance && definition ? this.stateRepository.markResolved(instanceId, definition, result) : null }
}
