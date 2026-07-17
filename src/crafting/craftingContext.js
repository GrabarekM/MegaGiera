import { STATION_TYPE } from './craftingConstants.js'
export function createCraftingContext({ activeStationId = null, activeStationType = STATION_TYPE.NONE, locationId = null, worldPosition = null, stationTags = [], source = 'recipe_journal', isCombatActive = false } = {}) {
  return Object.freeze({ activeStationId, activeStationType: Object.values(STATION_TYPE).includes(activeStationType) ? activeStationType : STATION_TYPE.NONE, locationId, worldPosition: worldPosition ? Object.freeze({ ...worldPosition }) : null, stationTags: Object.freeze([...stationTags]), source, isCombatActive: Boolean(isCombatActive) })
}
