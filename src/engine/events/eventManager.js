export const EVENT_RESULT = Object.freeze({
  ADD_GOLD: 'add_gold',
  REMOVE_GOLD: 'remove_gold',
  ADVANCE_TIME: 'advance_time',
  MESSAGE: 'message',
  SET_FLAG: 'set_flag',
  END_EVENT: 'end_event',
})

export const EVENT_CONDITION = Object.freeze({
  FLAG: 'flag',
  MINIMUM_GOLD: 'minimum_gold',
})

const asArray = (value) => Array.isArray(value) ? value : []

export class EventManager {
  constructor(context, events = []) {
    this.context = context
    this.events = new Map()
    this.conditionHandlers = new Map()
    this.resultHandlers = new Map()
    this.listeners = new Set()
    this.activeEvent = null
    this.lastMessage = ''
    this.registerConditionHandler(EVENT_CONDITION.FLAG, (condition) => context.getFlag(condition.key) === condition.value)
    this.registerConditionHandler(EVENT_CONDITION.MINIMUM_GOLD, (condition) => context.getGold() >= condition.amount)
    this.registerResultHandler(EVENT_RESULT.ADD_GOLD, (result) => context.changeGold(Math.abs(result.amount)))
    this.registerResultHandler(EVENT_RESULT.REMOVE_GOLD, (result) => context.changeGold(-Math.abs(result.amount)))
    this.registerResultHandler(EVENT_RESULT.ADVANCE_TIME, (result) => context.advanceTime(result))
    this.registerResultHandler(EVENT_RESULT.MESSAGE, (result) => { this.lastMessage = result.text; context.showMessage(result.text) })
    this.registerResultHandler(EVENT_RESULT.SET_FLAG, (result) => context.setFlag(result.key, result.value ?? true))
    this.registerResultHandler(EVENT_RESULT.END_EVENT, () => { this.activeEvent = null })
    for (const event of events) this.registerEvent(event)
  }

  registerEvent(event) {
    if (!event?.id || !event.title || !Array.isArray(event.options)) throw new Error('Invalid event definition.')
    this.events.set(event.id, event)
    return event
  }

  registerConditionHandler(type, handler) { this.conditionHandlers.set(type, handler) }
  registerResultHandler(type, handler) { this.resultHandlers.set(type, handler) }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notify() { for (const listener of this.listeners) listener(this.getSnapshot()) }

  conditionsPass(conditions = []) {
    return conditions.every((condition) => {
      const handler = this.conditionHandlers.get(condition.type)
      if (!handler) throw new Error(`No condition handler registered for: ${condition.type}`)
      return handler(condition, this.context)
    })
  }

  startEvent(eventOrId) {
    if (this.activeEvent) return { ok: false, reason: 'event-already-active' }
    const event = typeof eventOrId === 'string' ? this.events.get(eventOrId) : eventOrId
    if (!event) return { ok: false, reason: 'event-not-found' }
    if (!this.conditionsPass(asArray(event.conditions))) return { ok: false, reason: 'conditions-not-met' }
    this.activeEvent = event
    this.lastMessage = ''
    this.notify()
    return { ok: true, event }
  }

  chooseOption(optionId) {
    if (!this.activeEvent) return { ok: false, reason: 'no-active-event' }
    const event = this.activeEvent
    const option = event.options.find((item) => item.id === optionId)
    if (!option) return { ok: false, reason: 'option-not-found' }
    if (!this.conditionsPass(asArray(option.conditions))) return { ok: false, reason: 'conditions-not-met' }
    for (const result of [...asArray(option.results), ...asArray(event.results)]) {
      const handler = this.resultHandlers.get(result.type)
      if (!handler) throw new Error(`No result handler registered for: ${result.type}`)
      handler(result, this.context, { event, option, manager: this })
    }
    this.notify()
    return { ok: true, eventId: event.id, optionId }
  }

  closeEvent({ force = false } = {}) {
    if (!this.activeEvent) return { ok: false, reason: 'no-active-event' }
    if (this.activeEvent.flags?.allowManualClose === false && !force) return { ok: false, reason: 'manual-close-disabled' }
    this.activeEvent = null
    this.notify()
    return { ok: true }
  }

  getAvailableOptions() {
    return this.activeEvent?.options.filter((option) => this.conditionsPass(asArray(option.conditions))) ?? []
  }

  getSnapshot() {
    return {
      activeEvent: this.activeEvent,
      options: this.getAvailableOptions(),
      lastMessage: this.lastMessage,
      movementBlocked: Boolean(this.activeEvent && this.activeEvent.flags?.blocksMovement !== false),
    }
  }
}
