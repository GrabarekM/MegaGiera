import { MINUTES_PER_HOUR } from '../data/travelConfig.js'

export const STARTING_HOUR = 6
export const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR

export const TIME_OF_DAY = Object.freeze({
  DAWN: 'dawn', MORNING: 'morning', NOON: 'noon', AFTERNOON: 'afternoon',
  EVENING: 'evening', DUSK: 'dusk', NIGHT: 'night', DEEP_NIGHT: 'deep-night',
})

export const TIME_OF_DAY_HOURS = Object.freeze({
  [TIME_OF_DAY.DAWN]: 6,
  [TIME_OF_DAY.MORNING]: 9,
  [TIME_OF_DAY.NOON]: 12,
  [TIME_OF_DAY.AFTERNOON]: 15,
  [TIME_OF_DAY.EVENING]: 18,
  [TIME_OF_DAY.DUSK]: 21,
  [TIME_OF_DAY.NIGHT]: 0,
  [TIME_OF_DAY.DEEP_NIGHT]: 3,
})

export const TIME_OF_DAY_DETAILS = Object.freeze({
  [TIME_OF_DAY.DAWN]: { label: 'Dawn', icon: '🌅' },
  [TIME_OF_DAY.MORNING]: { label: 'Morning', icon: '🌤️' },
  [TIME_OF_DAY.NOON]: { label: 'Noon', icon: '☀️' },
  [TIME_OF_DAY.AFTERNOON]: { label: 'Afternoon', icon: '🌞' },
  [TIME_OF_DAY.EVENING]: { label: 'Evening', icon: '🌇' },
  [TIME_OF_DAY.DUSK]: { label: 'Dusk', icon: '🌆' },
  [TIME_OF_DAY.NIGHT]: { label: 'Night', icon: '🌙' },
  [TIME_OF_DAY.DEEP_NIGHT]: { label: 'Deep Night', icon: '🌌' },
})

export const onTimeAdvanced = () => {}
export const onNewDay = () => {}
export const onWait = () => {}
export const onRest = () => {}

const minutePart = (time) => time.minute ?? 0
const clockMinutes = (time) => time.hour * MINUTES_PER_HOUR + minutePart(time)
const startMinutes = STARTING_HOUR * MINUTES_PER_HOUR

export function createInitialTime() {
  return { day: 1, hour: STARTING_HOUR, minute: 0, moveCount: 0 }
}

export function getTimeOfDay(hour, minute = 0) {
  const value = hour * MINUTES_PER_HOUR + minute
  const ordered = [
    [0, TIME_OF_DAY.NIGHT], [3, TIME_OF_DAY.DEEP_NIGHT], [6, TIME_OF_DAY.DAWN], [9, TIME_OF_DAY.MORNING],
    [12, TIME_OF_DAY.NOON], [15, TIME_OF_DAY.AFTERNOON], [18, TIME_OF_DAY.EVENING], [21, TIME_OF_DAY.DUSK],
  ]
  return ordered.filter(([boundary]) => value >= boundary * MINUTES_PER_HOUR).at(-1)?.[1] ?? TIME_OF_DAY.NIGHT
}

export function advanceTime(current, options = {}) {
  const minutes = options.minutes ?? (options.hours === undefined ? null : options.hours * MINUTES_PER_HOUR)
  if (!Number.isInteger(minutes) || minutes <= 0) throw new Error('Time must advance by a positive whole number of minutes.')
  const offsetInCurrentDay = (clockMinutes(current) - startMinutes + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const totalOffset = offsetInCurrentDay + minutes
  const daysAdvanced = Math.floor(totalOffset / MINUTES_PER_DAY)
  const nextClockMinutes = (startMinutes + totalOffset) % MINUTES_PER_DAY
  const next = {
    day: current.day + daysAdvanced,
    hour: Math.floor(nextClockMinutes / MINUTES_PER_HOUR),
    minute: nextClockMinutes % MINUTES_PER_HOUR,
    moveCount: current.moveCount + Number(options.countMove === true),
  }
  const event = {
    previous: current,
    current: next,
    minutesAdvanced: minutes,
    hoursAdvanced: minutes / MINUTES_PER_HOUR,
    daysAdvanced,
    reason: options.reason ?? 'time',
  }
  ;(options.onTimeAdvanced ?? onTimeAdvanced)(event)
  if (daysAdvanced > 0) (options.onNewDay ?? onNewDay)(event)
  return next
}

export function advanceMovementTime(current, travelMinutes, hooks = {}) {
  return advanceTime(current, { ...hooks, minutes: travelMinutes, countMove: true, reason: 'movement' })
}

export function waitHours(current, hours, hooks = {}) {
  const next = advanceTime(current, { ...hooks, hours, countMove: false, reason: 'wait' })
  ;(hooks.onWait ?? onWait)({ previous: current, current: next, minutesAdvanced: hours * MINUTES_PER_HOUR, hoursAdvanced: hours })
  return next
}

export function minutesUntilTimeOfDay(current, targetPeriod) {
  const targetHour = TIME_OF_DAY_HOURS[targetPeriod]
  if (targetHour === undefined) throw new Error('Unknown time of day.')
  const difference = (targetHour * MINUTES_PER_HOUR - clockMinutes(current) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  return difference || MINUTES_PER_DAY
}

export const hoursUntilTimeOfDay = (current, targetPeriod) => minutesUntilTimeOfDay(current, targetPeriod) / MINUTES_PER_HOUR

export function waitUntilTimeOfDay(current, targetPeriod, hooks = {}) {
  const minutes = minutesUntilTimeOfDay(current, targetPeriod)
  const next = advanceTime(current, { ...hooks, minutes, countMove: false, reason: 'wait' })
  ;(hooks.onWait ?? onWait)({ previous: current, current: next, minutesAdvanced: minutes, hoursAdvanced: minutes / MINUTES_PER_HOUR })
  return next
}

export function restHours(current, hours = 6, hooks = {}) {
  const next = advanceTime(current, { ...hooks, hours, countMove: false, reason: 'rest' })
  ;(hooks.onRest ?? onRest)({ previous: current, current: next, minutesAdvanced: hours * MINUTES_PER_HOUR, hoursAdvanced: hours })
  return next
}

export const formatHour = (hour, minute = 0) => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
const isPeriod = (time, period) => getTimeOfDay(time.hour, minutePart(time)) === period
export const isDawn = (time) => isPeriod(time, TIME_OF_DAY.DAWN)
export const isMorning = (time) => isPeriod(time, TIME_OF_DAY.MORNING)
export const isNoon = (time) => isPeriod(time, TIME_OF_DAY.NOON)
export const isAfternoon = (time) => isPeriod(time, TIME_OF_DAY.AFTERNOON)
export const isEvening = (time) => isPeriod(time, TIME_OF_DAY.EVENING)
export const isDusk = (time) => isPeriod(time, TIME_OF_DAY.DUSK)
export const isNight = (time) => isPeriod(time, TIME_OF_DAY.NIGHT)
export const isDeepNight = (time) => isPeriod(time, TIME_OF_DAY.DEEP_NIGHT)
export const getElapsedDays = (time) => time.day - 1
export const getElapsedMinutes = (time) => (time.day - 1) * MINUTES_PER_DAY + ((clockMinutes(time) - startMinutes + MINUTES_PER_DAY) % MINUTES_PER_DAY)
export const getElapsedHours = (time) => getElapsedMinutes(time) / MINUTES_PER_HOUR

export function isValidTime(time) {
  const minute = minutePart(time)
  return Boolean(time)
    && Number.isInteger(time.day) && time.day >= 1
    && Number.isInteger(time.hour) && time.hour >= 0 && time.hour < 24
    && Number.isInteger(minute) && minute >= 0 && minute < 60
    && Number.isInteger(time.moveCount) && time.moveCount >= 0
}
