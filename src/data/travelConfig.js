export const MINUTES_PER_HOUR = 60

export const TRAVEL_TIME_MINUTES = Object.freeze({
  road: 60,
  bridge: 60,
  city_street: 60,
  city_gate: 60,
  city_market: 60,
  city_residential: 60,
  gravel_road: 120,
  wooden_bridge: 120,
  grassland: 180,
  flower_field: 180,
  tall_grass: 180,
  farm: 180,
  village_house: 120,
  village_square: 120,
  inn: 180,
  ruins: 180,
  shrine: 180,
  bandit_camp: 180,
  forest: 240,
  dense_forest: 300,
  rocky_hills: 300,
  cave: 300,
  rocky_ground: 360,
  river: null,
  lake: null,
  sea: null,
  mountains: null,
  city_wall: null,
})

export function getTerrainTravelTime(terrain) {
  const minutes = TRAVEL_TIME_MINUTES[terrain]
  if (!Number.isInteger(minutes) || minutes <= 0) throw new Error(`Terrain is not traversable or has no travel time: ${terrain}`)
  return minutes
}

export function getTileTravelTime(tile) {
  if (!tile || typeof tile !== 'object') throw new Error('A destination tile is required.')
  if (tile.settlementType === 'city') return 60
  if (tile.settlementType === 'village') return 120
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
