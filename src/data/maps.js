export { generateMeadowsRegion, findPath, MEADOWS_GENERATION_CONFIG, POI, TERRAIN } from '../world/meadowsGenerator.js'

export const terrainIcons = {
  grassland: '', forest: '♠', rocky_hills: '▲', lake: '≈', flower_field: '✿', tall_grass: '⌇',
  sea: '≈', mountains: '▲', river: '≈', road: '·', bridge: '═', farm: '▦', city_wall: '▣',
  city_gate: '⌂', city_street: '·', city_market: '◆', city_residential: '⌂', village_house: '⌂',
  village_square: '◇', inn: '⌂', ruins: '†', bandit_camp: '▲', shrine: '✦', cave: '◒',
  gravel_road: '·', wooden_bridge: '═',
}

export const poiIcons = {
  ruins: '⌂', camp: '⛺', shrine: '✦', ancient_tree: '♣', cave_entrance: '◒', village: '🏠',
  bridge: '═', watchtower: '♜', battlefield: '⚔', forgotten_cemetery: '†', sacred_grove: '❈', boss_arena: '☠',
  city: '♜', inn: '⌂', bandit_camp: '⚑',
}

export const terrainDetails = {
  grassland: { name: 'Grassland', type: 'Walkable terrain', description: 'Open meadow connecting the region.' },
  forest: { name: 'Forest', type: 'Walkable terrain', description: 'A dense, irregular woodland complex.' },
  rocky_hills: { name: 'Rocky Hills', type: 'Walkable terrain', description: 'Rugged hills forming natural ridges.' },
  lake: { name: 'Lake', type: 'Blocked terrain', description: 'Deep water that cannot be crossed without a bridge.' },
  flower_field: { name: 'Flower Field', type: 'Walkable terrain', description: 'A peaceful cluster of wildflowers.' },
  tall_grass: { name: 'Tall Grass', type: 'Walkable terrain', description: 'Dense grass that may conceal future threats.' },
  sea: { name: 'Sea', type: 'Blocked terrain', description: 'Deep coastal water marking the edge of the region.' },
  mountains: { name: 'Mountains', type: 'Blocked terrain', description: 'An impassable mountain range marking the edge of the region.' },
  river: { name: 'River', type: 'Blocked terrain', description: 'Flowing water crossed only where a road has a bridge.' },
  road: { name: 'Road', type: 'Walkable terrain', description: 'A maintained route linking the settlements.' },
  bridge: { name: 'Bridge', type: 'Walkable terrain', description: 'A strategic crossing built into the road network.' },
  gravel_road: { name: 'Gravel Road', type: 'Walkable terrain', description: 'A local track leading toward a place worth exploring.' },
  wooden_bridge: { name: 'Wooden Bridge', type: 'Walkable terrain', description: 'A small crossing built for a local gravel track.' },
  farm: { name: 'Farmland', type: 'Walkable terrain', description: 'A large cultivated field in a settlement influence zone.' },
  city_wall: { name: 'City Wall', type: 'Blocked terrain', description: 'Fortifications surrounding the regional capital.' },
  city_gate: { name: 'City Gate', type: 'Walkable terrain', description: 'A guarded entrance through the city walls.' },
  city_street: { name: 'City Street', type: 'Walkable terrain', description: 'A main street leading through the capital.' },
  city_market: { name: 'City Market', type: 'Walkable terrain', description: 'The central market square of the capital.' },
  city_residential: { name: 'Residential District', type: 'Walkable terrain', description: 'A planned district reserved for future services.' },
  village_house: { name: 'Village Homes', type: 'Walkable terrain', description: 'A cluster of rural homes.' },
  village_square: { name: 'Village Square', type: 'Walkable terrain', description: 'The social center of a village.' },
  inn: { name: 'Roadside Inn', type: 'Walkable terrain', description: 'A roadside stop outside the city.' },
  ruins: { name: 'Ruins', type: 'Walkable terrain', description: 'A remote remnant of an older settlement.' },
  bandit_camp: { name: 'Bandit Camp', type: 'Walkable terrain', description: 'A hidden camp near the forest.' },
  shrine: { name: 'Shrine', type: 'Walkable terrain', description: 'A secluded place of worship.' },
  cave: { name: 'Cave Entrance', type: 'Walkable terrain', description: 'An entrance beside a mountain.' },
}
