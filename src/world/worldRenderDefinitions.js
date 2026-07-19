export const WORLD_LAYER_ORDER = Object.freeze([
  'ground', 'transitions', 'roads', 'details', 'objects', 'trees',
  'buildings', 'poi', 'player', 'effects', 'ui',
])

export const TERRAIN_RENDER_DEFINITIONS = Object.freeze({
  grassland: { color: '#526d48', family: 'grass', detail: 'grass' },
  flower_field: { color: '#657743', family: 'grass', detail: 'flowers' },
  tall_grass: { color: '#465d35', family: 'grass', detail: 'grass' },
  forest: { color: '#263f2d', family: 'forest', object: 'tree' },
  dense_forest: { color: '#1c3225', family: 'forest', object: 'tree' },
  pine_forest: { color: '#23372d', family: 'forest', object: 'pine' },
  birch_forest: { color: '#354b35', family: 'forest', object: 'birch' },
  hills: { color: '#5a6341', family: 'highland', detail: 'stone' },
  rocky_hills: { color: '#55594b', family: 'highland', detail: 'stone' },
  mountain: { color: '#484b48', family: 'mountain', object: 'rock' },
  water: { color: '#16445a', family: 'water', detail: 'water' },
  shallow_water: { color: '#286475', family: 'water', detail: 'water' },
  marsh: { color: '#344c3d', family: 'wetland', detail: 'reeds' },
  beach: { color: '#aa8c58', family: 'coast', detail: 'sand' },
  road: { color: '#526d48', family: 'grass', road: 'dirt' },
  gravel_road: { color: '#526d48', family: 'grass', road: 'gravel' },
  city_street: { color: '#4c514b', family: 'settlement', road: 'stone' },
  wooden_bridge: { color: '#16445a', family: 'water', road: 'wood-bridge' },
  stone_bridge: { color: '#16445a', family: 'water', road: 'stone-bridge' },
  village: { color: '#566748', family: 'settlement', object: 'village' },
  city: { color: '#4f584d', family: 'settlement', object: 'city' },
  ruins: { color: '#4b5540', family: 'grass', object: 'ruins' },
  shrine: { color: '#4d6044', family: 'grass', object: 'shrine' },
  cave: { color: '#4b5044', family: 'highland', object: 'cave' },
  bandit_camp: { color: '#4f5e3e', family: 'grass', object: 'camp' },
})

export const ROAD_TERRAINS = Object.freeze(new Set(
  Object.entries(TERRAIN_RENDER_DEFINITIONS).filter(([, value]) => value.road).map(([key]) => key),
))

export const WORLD_OBJECT_DEFINITIONS = Object.freeze({
  tree: { layer: 'trees', scale: 0.72, shadow: true },
  pine: { layer: 'trees', scale: 0.76, shadow: true },
  birch: { layer: 'trees', scale: 0.72, shadow: true },
  rock: { layer: 'objects', scale: 0.58, shadow: true },
  village: { layer: 'buildings', scale: 0.78, shadow: true },
  city: { layer: 'buildings', scale: 0.86, shadow: true },
  ruins: { layer: 'poi', scale: 0.7, shadow: true },
  shrine: { layer: 'poi', scale: 0.64, shadow: true },
  cave: { layer: 'poi', scale: 0.72, shadow: true },
  camp: { layer: 'poi', scale: 0.68, shadow: true },
})

export function getTerrainRenderDefinition(terrain) {
  return TERRAIN_RENDER_DEFINITIONS[terrain] ?? { color: '#465547', family: terrain || 'unknown' }
}
