import { getWorldPeriod, WORLD_PERIOD } from './worldClock.js'
import { waitUntilTimeOfDay, TIME_OF_DAY } from '../engine/timeSystem.js'
import { deactivateLightSource, LIGHT_SOURCE_TYPE } from './lightSourceSystem.js'
import { canWaitThroughNight } from './wardwoodEconomy.js'

export function waitUntilMorningProtected({ character, tile, time, wardwoodService, random }) {
  if (!canWaitThroughNight(tile, character)) return { ok: false, code: 'SAFE_NIGHT_PROTECTION_REQUIRED' }
  if (getWorldPeriod(time) !== WORLD_PERIOD.NIGHT) return { ok: false, code: 'WAIT_UNTIL_MORNING_ONLY_AT_NIGHT' }
  const usedCampfire = character.activeLightSource?.type === LIGHT_SOURCE_TYPE.CAMPFIRE
  const nextTime = waitUntilTimeOfDay(time, TIME_OF_DAY.DAWN)
  let recovery = { ok: true, recovered: 0 }
  if (usedCampfire) { deactivateLightSource(character); recovery = wardwoodService.recoverCampfire(random) }
  const expiration = wardwoodService.expire(nextTime.day)
  return { ok: true, time: nextTime, recovery, expiration, bypassedThreatChecks: true }
}
