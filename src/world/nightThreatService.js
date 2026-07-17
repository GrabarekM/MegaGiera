import { isWorldNight, toClockMinutes } from './worldClock.js'

export const NIGHT_THREAT_STEPS = Object.freeze([
  Object.freeze({ startMinute: 20 * 60, threat: 0, demonTier: null }),
  Object.freeze({ startMinute: 20 * 60 + 30, threat: 10, demonTier: 'Lesser Demon' }),
  Object.freeze({ startMinute: 21 * 60, threat: 20, demonTier: 'Lesser Demon' }),
  Object.freeze({ startMinute: 21 * 60 + 30, threat: 50, demonTier: 'Greater Demon' }),
  Object.freeze({ startMinute: 22 * 60, threat: 100, demonTier: 'Greater Demon' }),
])
export function getNightThreat(time) {
  if (!isWorldNight(time)) return { level: 0, demonTier: null }
  const minute = toClockMinutes(time)
  if (minute < 6 * 60) return { level: 100, demonTier: 'Greater Demon' }
  const step = NIGHT_THREAT_STEPS.filter(({ startMinute }) => minute >= startMinute).at(-1) ?? NIGHT_THREAT_STEPS[0]
  return { level: step.threat, demonTier: step.demonTier }
}
export function rollThreatCheck(level, random = Math.random) { return level > 0 && random() * 100 < level }
