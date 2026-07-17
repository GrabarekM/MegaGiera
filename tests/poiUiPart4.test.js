import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPoiInteractionModel, createPoiMarkerModel, getPoiStatus } from '../src/poi/poiPresentationService.js'
import { validatePoiData } from '../src/poi/poiDataValidator.js'

const definition = { id: 'ruin', displayName: 'Old Ruin', description: 'Ancient stones.', poiType: 'Ruin', mapIconId: 'ruin', completionPolicy: 'Remain', discoveryDefinitionId: 'visible', stateDefinitions: [{ id: 'fresh', descriptionOverride: 'The doorway is open.', availableActionIds: ['locked', 'search'] }] }
const instance = (changes = {}) => ({ instanceId: 'poi-1', poiDefinitionId: 'ruin', currentStateId: 'fresh', worldPosition: { row: 2, column: 3 }, regionId: 'meadows', locationId: 'wilds', isActive: true, isDiscovered: true, isVisited: false, isCompleted: false, isExhausted: false, localFlags: {}, ...changes })

test('POI markers hide undiscovered and inactive locations', () => {
  assert.equal(createPoiMarkerModel(instance({ isDiscovered: false }), definition, 'Discovered').visible, false)
  assert.equal(createPoiMarkerModel(instance({ isActive: false }), definition, 'Discovered').visible, false)
  assert.equal(createPoiMarkerModel(instance(), definition, 'Discovered').visible, true)
})

test('POI marker exposes safe and pending states without leaking domain objects', () => {
  const safe = instance({ localFlags: { safeZoneEnabled: true } })
  assert.equal(getPoiStatus(safe), 'Safe')
  const combat = instance({ pendingCombatId: 'combat-1', localFlags: { safeZoneEnabled: true } })
  assert.equal(getPoiStatus(combat), 'Combat Pending')
  const marker = createPoiMarkerModel(combat, definition, getPoiStatus(combat))
  assert.equal(marker.isCombatPending, true)
  assert.match(marker.optionalTooltip, /Combat Pending/)
  assert.equal('definition' in marker, false)
})

test('interaction model uses current state description and filters hidden actions', () => {
  const previews = {
    locked: { ok: true, visible: true, status: 'Locked', displayName: 'Locked action', action: { sortOrder: 2 } },
    search: { ok: true, visible: false, status: 'Hidden', displayName: 'Secret action', action: { sortOrder: 1 } },
  }
  const model = createPoiInteractionModel(instance(), definition, { preview: (_id, actionId) => previews[actionId] }, {})
  assert.equal(model.description, 'The doorway is open.')
  assert.deepEqual(model.actions.map(({ displayName }) => displayName), ['Locked action'])
})

test('POI data validator reports missing actions, outcomes, encounters and loot tables', () => {
  const result = validatePoiData({
    definitions: [{ id: 'bad', initialStateId: 'missing', stateDefinitions: [{ id: 'open', availableActionIds: ['missing-action', 'known'] }] }],
    actions: { known: { id: 'known', defaultOutcomeId: 'missing-outcome' } },
    outcomes: { encounter: { id: 'encounter', encounters: [{ encounterId: 'missing-enemy' }], randomRewardTableIds: [{ lootTableId: 'missing-loot' }] } },
    encounterIds: ['wolf'], lootTableIds: ['valid-loot'],
  })
  assert.equal(result.valid, false)
  for (const code of ['INVALID_INITIAL_STATE', 'MISSING_ACTION', 'MISSING_OUTCOME', 'MISSING_ENCOUNTER', 'MISSING_LOOT_TABLE']) assert.ok(result.errors.some((error) => error.code === code), code)
})

test('POI overlay and map integration remain presentation-only and movement-blocking', () => {
  const overlay = readFileSync(new URL('../src/components/PoiInteractionOverlay.vue', import.meta.url), 'utf8')
  const map = readFileSync(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(overlay, /Requirements/)
  assert.match(overlay, /Costs/)
  assert.match(overlay, /confirming/)
  assert.match(overlay, /resume-loot/)
  assert.match(map, /poi-framework-marker/)
  assert.match(map, /if \(activePoiInstanceId\.value\) return/)
})
