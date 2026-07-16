import assert from 'node:assert/strict'
import test from 'node:test'
import { EVENT_RESULT, EventManager } from '../src/engine/events/eventManager.js'

function createHarness() {
  const state = { gold: 5, flags: {}, minutes: 0, messages: [] }
  const manager = new EventManager({
    getGold: () => state.gold,
    changeGold: (amount) => { state.gold = Math.max(0, state.gold + amount) },
    getFlag: (key) => state.flags[key],
    setFlag: (key, value) => { state.flags[key] = value },
    advanceTime: ({ hours = 0, minutes = 0 }) => { state.minutes += hours * 60 + minutes },
    showMessage: (message) => state.messages.push(message),
  })
  return { manager, state }
}

const event = {
  id: 'test-event', title: 'Test Event', description: 'A test.', conditions: [], results: [],
  flags: { blocksMovement: true, allowManualClose: false },
  options: [{
    id: 'accept', text: 'Accept', conditions: [], results: [
      { type: EVENT_RESULT.ADD_GOLD, amount: 10 },
      { type: EVENT_RESULT.REMOVE_GOLD, amount: 3 },
      { type: EVENT_RESULT.ADVANCE_TIME, minutes: 90 },
      { type: EVENT_RESULT.SET_FLAG, key: 'accepted', value: true },
      { type: EVENT_RESULT.MESSAGE, text: 'Resolved.' },
      { type: EVENT_RESULT.END_EVENT },
    ],
  }],
}

test('starts an event and blocks movement while it is active', () => {
  const { manager } = createHarness()
  manager.registerEvent(event)
  assert.equal(manager.startEvent(event.id).ok, true)
  assert.equal(manager.getSnapshot().activeEvent.id, event.id)
  assert.equal(manager.getSnapshot().movementBlocked, true)
})

test('choosing an option executes results, sets flags and closes the event', () => {
  const { manager, state } = createHarness()
  manager.registerEvent(event)
  manager.startEvent(event.id)
  assert.equal(manager.chooseOption('accept').ok, true)
  assert.equal(state.gold, 12)
  assert.equal(state.minutes, 90)
  assert.equal(state.flags.accepted, true)
  assert.deepEqual(state.messages, ['Resolved.'])
  assert.equal(manager.getSnapshot().activeEvent, null)
  assert.equal(manager.getSnapshot().movementBlocked, false)
})

test('manual closing respects event flags', () => {
  const { manager } = createHarness()
  manager.startEvent(event)
  assert.equal(manager.closeEvent().ok, false)
  assert.equal(manager.closeEvent({ force: true }).ok, true)
})

test('condition and result handlers are extensible without changing EventManager', () => {
  const { manager, state } = createHarness()
  manager.registerConditionHandler('future_stat_check', (condition) => condition.passed)
  manager.registerResultHandler('future_result', (result) => { state.flags[result.key] = true })
  const futureEvent = {
    id: 'future', title: 'Future', description: '', conditions: [{ type: 'future_stat_check', passed: true }],
    results: [], flags: {}, options: [{ id: 'go', text: 'Go', conditions: [], results: [{ type: 'future_result', key: 'extended' }] }],
  }
  assert.equal(manager.startEvent(futureEvent).ok, true)
  manager.chooseOption('go')
  assert.equal(state.flags.extended, true)
})

test('movement entry points guard against an active event', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(source, /function movePlayerTo\(index\) \{\s*if \(eventSnapshot\.value\.movementBlocked \|\| combatSnapshot\.value\.worldBlocked\) return/)
  assert.match(source, /function movePlayerBy\(deltaRow, deltaColumn\) \{\s*if \(eventSnapshot\.value\.movementBlocked \|\| combatSnapshot\.value\.worldBlocked\) return/)
})
