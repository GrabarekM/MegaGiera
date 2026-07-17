export const MINUTES_PER_HOUR = 60

export const TRAVEL_TIME_MINUTES = Object.freeze({
  road: 30, bridge: 30, city_street: 30, city_gate: 30, city_market: 30, city_residential: 30,
  gravel_road: 45, wooden_bridge: 45,
  grassland: 60, flower_field: 60, tall_grass: 60, farm: 60,
  village_house: 30, village_square: 30, inn: 30,
  ruins: 60, shrine: 60, bandit_camp: 60,
  forest: 60, dense_forest: 60,
  rocky_hills: 90, cave: 60, mine: 60, temple: 60,
  rocky_ground: 120, mountains: 120, swamp: 120, dungeon_interior: 10,
  river: null,
  lake: null,
  sea: null,
  city_wall: null,
})

export function getTerrainTravelTime(terrain) {
  const minutes = TRAVEL_TIME_MINUTES[terrain]
  if (!Number.isInteger(minutes) || minutes <= 0) throw new Error(`Terrain is not traversable or has no travel time: ${terrain}`)
  return minutes
}

export function getTileTravelTime(tile) {
  if (!tile || typeof tile !== 'object') throw new Error('A destination tile is required.')
  if (tile.settlementType === 'city') return 30
  if (tile.settlementType === 'village') return 30
  return getTerrainTravelTime(tile.terrain)
}

// Future mounts, equipment, weather and talents can provide modifiers without
// changing movement or the base terrain configuration.
export function calculateTravelTime(terrain, modifiers = []) {
  return modifiers.reduce((minutes, modifier) => {
    const modified = typeof modifier === 'function' ? modifier(minutes, terrain) : minutes * modifier
    if (!Number.isFinite(modified) || modified <= 0) throw new Error('Travel modifiers must produce a positive duration.')
    return Math.round(modified)
  }, getTerrainTravelTime(terrain))
}

export function calculateTileTravelTime(tile, modifiers = []) {
  return modifiers.reduce((minutes, modifier) => {
    const modified = typeof modifier === 'function' ? modifier(minutes, tile) : minutes * modifier
    if (!Number.isFinite(modified) || modified <= 0) throw new Error('Travel modifiers must produce a positive duration.')
    return Math.round(modified)
  }, getTileTravelTime(tile))
}
