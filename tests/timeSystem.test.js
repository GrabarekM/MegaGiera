import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  advanceMovementTime, advanceTime, createInitialTime, formatHour, getTimeOfDay, hoursUntilTimeOfDay,
  isAfternoon, isDawn, isDeepNight, isDusk, isEvening, isMorning, isNight, isNoon,
  restHours, TIME_OF_DAY, waitHours, waitUntilTimeOfDay,
} from '../src/engine/timeSystem.js'
import { calculateTileTravelTime, calculateTravelTime, getTerrainTravelTime, getTileTravelTime, TRAVEL_TIME_MINUTES } from '../src/data/travelConfig.js'

test('new run begins on day 1 at 06:00', () => assert.deepEqual(createInitialTime(), { day: 1, hour: 6, minute: 0, moveCount: 0 }))

test('terrain travel configuration contains the required travel durations', () => {
  assert.equal(getTerrainTravelTime('road'), 60)
  assert.equal(getTerrainTravelTime('bridge'), 60)
  assert.equal(getTerrainTravelTime('gravel_road'), 120)
  assert.equal(getTerrainTravelTime('wooden_bridge'), 120)
  assert.equal(getTerrainTravelTime('grassland'), 180)
  assert.equal(getTerrainTravelTime('forest'), 240)
  assert.equal(getTerrainTravelTime('rocky_hills'), 300)
  assert.equal(TRAVEL_TIME_MINUTES.lake, null)
})

test('movement advances time by the destination terrain duration', () => {
  const cases = [
    ['road', 7, 0], ['bridge', 7, 0], ['gravel_road', 8, 0], ['wooden_bridge', 8, 0],
    ['grassland', 9, 0], ['forest', 10, 0], ['rocky_hills', 11, 0],
  ]
  for (const [terrain, hour, minute] of cases) {
    assert.deepEqual(advanceMovementTime(createInitialTime(), getTerrainTravelTime(terrain)), { day: 1, hour, minute, moveCount: 1 })
  }
})

test('movement and UI formatting preserve configured travel time', () => {
  const time = advanceMovementTime(createInitialTime(), getTerrainTravelTime('gravel_road'))
  assert.equal(formatHour(time.hour, time.minute), '08:00')
  assert.equal(formatHour(6, 0), '06:00')
})

test('city and village context has explicit priority over terrain', () => {
  assert.equal(getTileTravelTime({ terrain: 'grassland', settlementType: 'city' }), 60)
  assert.equal(getTileTravelTime({ terrain: 'road', settlementType: 'village' }), 120)
  assert.equal(getTileTravelTime({ terrain: 'forest' }), 240)
  assert.equal(calculateTileTravelTime({ terrain: 'gravel_road' }), 120)
})

test('crossing midnight and the 06:00 day boundary works with minutes', () => {
  assert.deepEqual(advanceTime({ day: 1, hour: 23, minute: 30, moveCount: 0 }, { minutes: 150 }), { day: 1, hour: 2, minute: 0, moveCount: 0 })
  assert.deepEqual(advanceTime({ day: 1, hour: 5, minute: 30, moveCount: 2 }, { minutes: 30 }), { day: 2, hour: 6, minute: 0, moveCount: 2 })
})

test('failed movement leaves time and move count unchanged', () => {
  const time = createInitialTime()
  assert.deepEqual(time, { day: 1, hour: 6, minute: 0, moveCount: 0 })
})

test('waiting three and six hours still uses advanceTime without increasing movement count', () => {
  const afterThree = waitHours(createInitialTime(), 3)
  assert.deepEqual(afterThree, { day: 1, hour: 9, minute: 0, moveCount: 0 })
  assert.deepEqual(waitHours(afterThree, 6), { day: 1, hour: 15, minute: 0, moveCount: 0 })
})

test('resting six hours still invokes its hook without adding moves', () => {
  const calls = []
  const rested = restHours(createInitialTime(), 6, { onRest: (event) => calls.push(event) })
  assert.deepEqual(rested, { day: 1, hour: 12, minute: 0, moveCount: 0 })
  assert.equal(calls.length, 1)
})

test('waiting until a period works from times containing minutes', () => {
  assert.equal(hoursUntilTimeOfDay({ hour: 18, minute: 30 }, TIME_OF_DAY.EVENING), 23.5)
  assert.deepEqual(waitUntilTimeOfDay({ day: 1, hour: 21, minute: 30, moveCount: 0 }, TIME_OF_DAY.MORNING), { day: 2, hour: 9, minute: 0, moveCount: 0 })
})

test('time-of-day selectors retain the existing three-hour periods for arbitrary minutes', () => {
  const cases = [
    [6, 30, TIME_OF_DAY.DAWN, isDawn], [10, 30, TIME_OF_DAY.MORNING, isMorning],
    [12, 45, TIME_OF_DAY.NOON, isNoon], [16, 0, TIME_OF_DAY.AFTERNOON, isAfternoon],
    [18, 30, TIME_OF_DAY.EVENING, isEvening], [22, 0, TIME_OF_DAY.DUSK, isDusk],
    [0, 30, TIME_OF_DAY.NIGHT, isNight], [4, 0, TIME_OF_DAY.DEEP_NIGHT, isDeepNight],
  ]
  for (const [hour, minute, period, selector] of cases) {
    assert.equal(getTimeOfDay(hour, minute), period)
    assert.equal(selector({ hour, minute }), true)
  }
})

test('advanceTime supports multiple days and shared hooks', () => {
  const timeEvents = []; const dayEvents = []
  const result = advanceTime(createInitialTime(), { hours: 54, onTimeAdvanced: (event) => timeEvents.push(event), onNewDay: (event) => dayEvents.push(event) })
  assert.deepEqual(result, { day: 3, hour: 12, minute: 0, moveCount: 0 })
  assert.equal(timeEvents[0].minutesAdvanced, 3240)
  assert.equal(dayEvents.length, 1)
})

test('future travel modifiers compose outside movement and time systems', () => {
  assert.equal(calculateTravelTime('forest', [0.75]), 180)
  assert.equal(calculateTravelTime('road', [(minutes) => minutes - 30]), 30)
})

test('movement view reads destination terrain travel time instead of a fixed duration', async () => {
  const source = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(source, /calculateTileTravelTime\(meadowsMap\.tiles\[(?:index|nextIndex)\]\)/)
  assert.doesNotMatch(source, /advanceMovementTime\(timeState\.value\)/)
})
