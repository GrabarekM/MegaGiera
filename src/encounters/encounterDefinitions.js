import { ENCOUNTER_COOLDOWN_TYPE, ENCOUNTER_REPEAT_POLICY, ENCOUNTER_TIME_WINDOW, ENCOUNTER_TYPE } from './encounterConstants.js'
import { defineEncounter, defineEncounterTable, defineEncounterTableEntry } from './encounterModels.js'
const entry = (encounterDefinitionId, weight, data = {}) => defineEncounterTableEntry({ encounterDefinitionId, weight, ...data })

export const ENCOUNTER_DEFINITIONS = Object.freeze([
  defineEncounter({ id: 'lone_wolf', displayName: 'Lone Wolf', description: 'A lone wolf watches the road.', encounterType: ENCOUNTER_TYPE.CREATURE, tags: ['wolf'], biomeTags: ['grassland', 'forest'], allowedLocationTags: ['Road', 'Wilderness'], weight: 8, combatDefinitionId: 'grey_wolf', repeatPolicy: ENCOUNTER_REPEAT_POLICY.COOLDOWN, cooldownPolicy: { type: ENCOUNTER_COOLDOWN_TYPE.ENCOUNTER_COUNT, value: 2 }, blockImmediateRepeat: true, repeatedEncounterWeightMultiplier: .3 }),
  defineEncounter({ id: 'bandit_scouts', displayName: 'Bandit Scouts', encounterType: ENCOUNTER_TYPE.BANDIT, tags: ['bandit'], allowedLocationTags: ['Road'], weight: 5, combatDefinitionId: 'desperate_peasant', maximumOccurrencesPerRun: 4, repeatPolicy: ENCOUNTER_REPEAT_POLICY.LIMITED_PER_RUN }),
  defineEncounter({ id: 'injured_traveler', displayName: 'Injured Traveler', encounterType: ENCOUNTER_TYPE.TRAVELER, tags: ['traveler'], allowedLocationTags: ['Road'], weight: 3, nonCombatDefinitionId: 'injured_traveler_placeholder' }),
  defineEncounter({ id: 'abandoned_supplies', displayName: 'Abandoned Supplies', encounterType: ENCOUNTER_TYPE.DISCOVERY, allowedLocationTags: ['Road'], weight: 3, nonCombatDefinitionId: 'abandoned_supplies_placeholder', uniquePerRun: true, repeatPolicy: ENCOUNTER_REPEAT_POLICY.UNIQUE_PER_RUN }),
  defineEncounter({ id: 'hungry_wolves', displayName: 'Hungry Wolves', encounterType: ENCOUNTER_TYPE.CREATURE, tags: ['wolf', 'night'], nightOnly: true, minimumNightThreatPercent: 20, weight: 8, combatDefinitionId: 'grey_wolf', blockImmediateRepeat: true }),
  defineEncounter({ id: 'night_stalker', displayName: 'Night Stalker', encounterType: ENCOUNTER_TYPE.SPECIAL, tags: ['night'], nightOnly: true, minimumNightThreatPercent: 60, weight: 2, nonCombatDefinitionId: 'night_stalker_placeholder' }),
  defineEncounter({ id: 'bandit_ambush', displayName: 'Bandit Ambush', encounterType: ENCOUNTER_TYPE.AMBUSH, tags: ['bandit', 'night'], nightOnly: true, weight: 4, ambushDefinitionId: 'bandit_ambush_placeholder', combatDefinitionId: 'desperate_peasant' }),
  defineEncounter({ id: 'strange_lights', displayName: 'Strange Lights', encounterType: ENCOUNTER_TYPE.ENVIRONMENTAL, nightOnly: true, weight: 3, nonCombatDefinitionId: 'strange_lights_placeholder' }),
  defineEncounter({ id: 'boar', displayName: 'Wild Boar', encounterType: ENCOUNTER_TYPE.CREATURE, biomeTags: ['forest'], allowedLocationTags: ['Wilderness'], weight: 7, combatDefinitionId: 'starved_wild_dog' }),
  defineEncounter({ id: 'wolf_pair', displayName: 'Wolf Pair', encounterType: ENCOUNTER_TYPE.CREATURE, tags: ['wolf'], biomeTags: ['forest'], allowedLocationTags: ['Wilderness'], weight: 5, combatDefinitionId: 'grey_wolf' }),
  defineEncounter({ id: 'forager', displayName: 'Forager', encounterType: ENCOUNTER_TYPE.TRAVELER, biomeTags: ['forest'], weight: 3, nonCombatDefinitionId: 'forager_placeholder' }),
  defineEncounter({ id: 'animal_tracks', displayName: 'Animal Tracks', encounterType: ENCOUNTER_TYPE.DISCOVERY, biomeTags: ['forest'], weight: 4, nonCombatDefinitionId: 'animal_tracks_placeholder' }),
  defineEncounter({ id: 'predator_pack', displayName: 'Predator Pack', encounterType: ENCOUNTER_TYPE.CREATURE, nightOnly: true, minimumNightThreatPercent: 40, weight: 6, combatDefinitionId: 'grey_wolf' }),
  defineEncounter({ id: 'disturbing_sounds', displayName: 'Disturbing Sounds', encounterType: ENCOUNTER_TYPE.ENVIRONMENTAL, nightOnly: true, weight: 4, nonCombatDefinitionId: 'sounds_placeholder' }),
  defineEncounter({ id: 'hidden_creature', displayName: 'Hidden Creature', encounterType: ENCOUNTER_TYPE.AMBUSH, nightOnly: true, minimumNightThreatPercent: 30, weight: 4, ambushDefinitionId: 'hidden_creature_placeholder', combatDefinitionId: 'mongbat' }),
  defineEncounter({ id: 'lost_traveler', displayName: 'Lost Traveler', encounterType: ENCOUNTER_TYPE.TRAVELER, nightOnly: true, weight: 3, nonCombatDefinitionId: 'lost_traveler_placeholder' }),
])

export const ENCOUNTER_TABLES = Object.freeze([
  defineEncounterTable({ id: 'starter_road_day', displayName: 'Starter Road — Day', regionIds: ['meadows'], locationTags: ['Road'], timeWindow: ENCOUNTER_TIME_WINDOW.DAY, noEncounterWeight: 30, encounterEntries: [entry('lone_wolf', 10), entry('bandit_scouts', 5), entry('injured_traveler', 3), entry('abandoned_supplies', 3)] }),
  defineEncounterTable({ id: 'starter_road_night', displayName: 'Starter Road — Night', regionIds: ['meadows'], locationTags: ['Road'], timeWindow: ENCOUNTER_TIME_WINDOW.NIGHT, noEncounterWeight: 20, encounterEntries: [entry('hungry_wolves', 10), entry('night_stalker', 2), entry('bandit_ambush', 5), entry('strange_lights', 4)] }),
  defineEncounterTable({ id: 'starter_wilderness_day', displayName: 'Starter Wilderness — Day', regionIds: ['meadows'], biomeTags: ['forest'], locationTags: ['Wilderness'], timeWindow: ENCOUNTER_TIME_WINDOW.DAY, noEncounterWeight: 25, encounterEntries: [entry('boar', 8), entry('wolf_pair', 6), entry('forager', 4), entry('animal_tracks', 5)] }),
  defineEncounterTable({ id: 'starter_wilderness_night', displayName: 'Starter Wilderness — Night', regionIds: ['meadows'], biomeTags: ['forest'], locationTags: ['Wilderness'], timeWindow: ENCOUNTER_TIME_WINDOW.NIGHT, noEncounterWeight: 20, encounterEntries: [entry('predator_pack', 8), entry('disturbing_sounds', 5), entry('hidden_creature', 4), entry('lost_traveler', 3)] }),
  defineEncounterTable({ id: 'starter_cave_placeholder', displayName: 'Starter Cave', regionIds: ['meadows'], locationTags: ['Cave'], noEncounterWeight: 100, encounterEntries: [] }),
  defineEncounterTable({ id: 'global_encounter_fallback', displayName: 'Global Fallback', noEncounterWeight: 100, encounterEntries: [], tags: ['global'] }),
])
