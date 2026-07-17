import { formatHour } from '../engine/timeSystem.js'

export const WORLD_PERIOD = Object.freeze({ DAY: 'Day', NIGHT: 'Night' })
export const DAY_START_MINUTES = 6 * 60
export const NIGHT_START_MINUTES = 20 * 60
export const toClockMinutes = (time) => time.hour * 60 + (time.minute ?? 0)
export const getWorldPeriod = (time) => { const minutes = toClockMinutes(time); return minutes >= DAY_START_MINUTES && minutes < NIGHT_START_MINUTES ? WORLD_PERIOD.DAY : WORLD_PERIOD.NIGHT }
export const isWorldNight = (time) => getWorldPeriod(time) === WORLD_PERIOD.NIGHT
export function getWorldClock(time, threatLevel = 0) { return { currentDay: time.day, currentTime: formatHour(time.hour, time.minute ?? 0), currentPeriod: getWorldPeriod(time), currentThreatLevel: threatLevel } }
