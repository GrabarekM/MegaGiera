import { isLightActive } from './lightSourceSystem.js'
import { getNightThreat, rollThreatCheck } from './nightThreatService.js'
import { isSafeZone } from './safeZoneService.js'
import { isWorldNight } from './worldClock.js'

export const REGION_DEMONS = Object.freeze({ meadows: Object.freeze(['Ash Wraith', 'Lost Soul']), forest: Object.freeze(['Forest Shade', 'Hollow Beast']), swamp: Object.freeze(['Rot Spirit', 'Bog Horror']), mountains: Object.freeze(['Frost Wraith', 'Stone Revenant']) })
export function checkNightEncounter({ time, tile, lightSource, regionId = 'meadows', random = Math.random, force = false }) {
  if (isSafeZone(tile)) return { triggered: false, reason: 'SAFE_ZONE' }
  if (isLightActive(lightSource)) return { triggered: false, reason: 'PROTECTED' }
  if (!force && !isWorldNight(time)) return { triggered: false, reason: 'DAY' }
  const threat = getNightThreat(time)
  if (!force && !rollThreatCheck(threat.level, random)) return { triggered: false, reason: 'THREAT_CHECK_FAILED', threat }
  const demons = REGION_DEMONS[regionId] ?? REGION_DEMONS.meadows
  return { triggered: true, reason: 'NIGHT_AMBUSH', threat, encounter: { type: 'Night Demon Encounter', demonName: demons[0], regionId, placeholder: true } }
}
