export const SAFE_ZONE_TYPES = Object.freeze(['city', 'village', 'inn', 'house', 'village_house', 'cave', 'mine', 'temple'])
export function isSafeZone(tile) {
  if (!tile) return false
  return SAFE_ZONE_TYPES.includes(tile.settlementType) || SAFE_ZONE_TYPES.includes(tile.terrain) || SAFE_ZONE_TYPES.includes(tile.pointOfInterest) || SAFE_ZONE_TYPES.includes(tile.staticPoi?.type)
}
