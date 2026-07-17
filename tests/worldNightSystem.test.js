import assert from 'node:assert/strict'
import test from 'node:test'
import { PROFICIENCY_NAMES } from '../src/data/characterCreation.js'
import { createCharacterState } from '../src/game/characterState.js'
import { activateLightSource, canWaitUntilMorning, consumeLightDuration, LIGHT_SOURCE_TYPE, toggleHolyLantern } from '../src/world/lightSourceSystem.js'
import { checkNightEncounter, REGION_DEMONS } from '../src/world/nightEncounterService.js'
import { getNightThreat } from '../src/world/nightThreatService.js'
import { isSafeZone } from '../src/world/safeZoneService.js'
import { getWorldClock, getWorldPeriod, WORLD_PERIOD } from '../src/world/worldClock.js'

const time = (hour, minute = 0, day = 1) => ({ day, hour, minute, moveCount: 0 })
const hero = () => createCharacterState({ id: 'night-hero', name: 'Hero', proficiencies: Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, ['Camping', 'Swordsmanship'].includes(name) ? 'Novice' : 'Untrained'])), startingSkills: ['player_strike'] })
const wildTile = { terrain: 'grassland' }

test('World Clock starts Day at 06:00 and Night at 20:00', () => {
  assert.equal(getWorldPeriod(time(5, 59)), WORLD_PERIOD.NIGHT)
  assert.equal(getWorldPeriod(time(6)), WORLD_PERIOD.DAY)
  assert.equal(getWorldPeriod(time(19, 59)), WORLD_PERIOD.DAY)
  assert.equal(getWorldPeriod(time(20)), WORLD_PERIOD.NIGHT)
  assert.deepEqual(getWorldClock(time(20, 30, 3), 10), { currentDay: 3, currentTime: '20:30', currentPeriod: 'Night', currentThreatLevel: 10 })
})

test('Night Threat follows the central half-hour configuration', () => {
  const cases = [[20, 0, 0], [20, 30, 10], [21, 0, 20], [21, 30, 50], [22, 0, 100], [2, 0, 100], [6, 0, 0]]
  for (const [hour, minute, level] of cases) assert.equal(getNightThreat(time(hour, minute)).level, level)
})

test('Safe Zones suppress Threat Checks', () => {
  for (const tile of [{ settlementType: 'city' }, { settlementType: 'village' }, { terrain: 'inn' }, { terrain: 'village_house' }, { terrain: 'cave' }, { terrain: 'mine' }, { terrain: 'temple' }]) {
    assert.equal(isSafeZone(tile), true)
    assert.equal(checkNightEncounter({ time: time(22), tile, lightSource: null, random: () => 0 }).reason, 'SAFE_ZONE')
  }
})

test('Campfire, Torch, Lantern and Holy Lantern protect from ambush', () => {
  for (const type of Object.values(LIGHT_SOURCE_TYPE)) {
    const character = hero(); character.wardwood = 5
    assert.equal(activateLightSource(character, type).ok, true)
    assert.equal(checkNightEncounter({ time: time(22), tile: wildTile, lightSource: character.activeLightSource, random: () => 0 }).reason, 'PROTECTED')
  }
})

test('Campfire enables the Wait Until Morning action', () => { const character = hero(); character.wardwood = 1; activateLightSource(character, LIGHT_SOURCE_TYPE.CAMPFIRE); assert.equal(canWaitUntilMorning(character), true) })

test('portable light duration is consumed while infinite lights remain active', () => {
  const character = hero(); character.wardwood = 2
  activateLightSource(character, LIGHT_SOURCE_TYPE.TORCH)
  consumeLightDuration(character, 60); assert.equal(character.activeLightSource.remainingDurationMinutes, 60)
  consumeLightDuration(character, 60); assert.equal(character.activeLightSource, null)
  activateLightSource(character, LIGHT_SOURCE_TYPE.HOLY_LANTERN)
  consumeLightDuration(character, 999); assert.equal(character.activeLightSource.enabled, true)
  toggleHolyLantern(character, false); assert.equal(character.activeLightSource, null)
})

test('successful Threat Check creates a regional placeholder Ambush', () => {
  const result = checkNightEncounter({ time: time(22), tile: wildTile, lightSource: null, regionId: 'meadows', random: () => 0 })
  assert.equal(result.triggered, true); assert.equal(result.encounter.type, 'Night Demon Encounter')
  assert.equal(REGION_DEMONS.meadows.includes(result.encounter.demonName), true)
})

test('HUD and movement integrate clock, threat, light and ambush combat', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(source, /Encounter Chance: \{\{ currentThreat\.level \}\}%/)
  assert.match(source, /Light: \{\{ characterState\.activeLightSource/)
  assert.match(source, /performNightThreatCheck\(meadowsMap\.tiles/)
  assert.match(source, /startTestCombat\(COMBAT_INITIATOR\.ENEMY/)
  assert.match(source, /Wait Until Morning/)
})
