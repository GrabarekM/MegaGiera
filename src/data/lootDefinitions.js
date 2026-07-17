import { defineLootDefinition, LOOT_SOURCE_TYPE } from '../loot/lootDefinition.js'

const choice = (type, data = {}) => Object.freeze({ type, weight: 1, quantity: 1, ...data })
const bundle = (id, chance, choices, options = {}) => Object.freeze({ id, chance, choices, ...options })

const definitions = [
  defineLootDefinition({ id: 'grey_wolf_loot', sourceType: LOOT_SOURCE_TYPE.ENEMY, modifierHooks: ['luck', 'animal_lore', 'scouting', 'knowledge', 'region'], bundles: [bundle('resources', 30, [choice('item', { itemId: 'raw_meat', weight: 20 }), choice('item', { itemId: 'wolf_hide', weight: 8 }), choice('item', { itemId: 'wolf_tooth', weight: 2 })]), bundle('rare', 3, [choice('item', { itemId: 'wardwood' })])] }),
  defineLootDefinition({ id: 'wild_dog_loot', sourceType: LOOT_SOURCE_TYPE.ENEMY, bundles: [bundle('resources', 18, [choice('item', { itemId: 'raw_meat', weight: 4 }), choice('item', { itemId: 'wolf_hide' })])] }),
  defineLootDefinition({ id: 'humanoid_loot', sourceType: LOOT_SOURCE_TYPE.ENEMY, bundles: [bundle('pocket_gold', 25, [choice('gold', { quantity: { minimum: 2, maximum: 8 } })]), bundle('food', 8, [choice('item', { itemId: 'raw_meat' })])] }),
  defineLootDefinition({ id: 'small_beast_loot', sourceType: LOOT_SOURCE_TYPE.ENEMY, bundles: [bundle('resources', 12, [choice('item', { itemId: 'raw_meat' })])] }),
  defineLootDefinition({ id: 'meadows_poi_loot', sourceType: LOOT_SOURCE_TYPE.POI, modifierHooks: ['region', 'scouting', 'knowledge'], bundles: [bundle('discovery', 28, [choice('item', { itemId: 'wardwood' }), choice('item', { itemId: 'silver_cup' })]), bundle('written_knowledge', 6, [choice('item', { itemId: 'poor_basic_archery_manual', weight: 4 }), choice('item', { itemId: 'history_of_the_old_kingdom', weight: 2 }), choice('item', { itemId: 'archery_skill_scroll', weight: 3 }), choice('item', { itemId: 'old_kingdom_knowledge_scroll', weight: 1 })])] }),
  defineLootDefinition({ id: 'meadows_boss_loot', sourceType: LOOT_SOURCE_TYPE.BOSS, bundles: [bundle('boss_guaranteed', 100, [choice('item', { itemId: 'sealed_contract' })], { guaranteed: true }), bundle('boss_gold', 100, [choice('gold', { quantity: { minimum: 20, maximum: 35 } })], { guaranteed: true })] }),
]

export const LOOT_DEFINITIONS = Object.freeze(Object.fromEntries(definitions.map((definition) => [definition.id, definition])))
export const REGION_LOOT_MODIFIERS = Object.freeze({ meadows: Object.freeze({ id: 'meadows', bundleMultipliers: Object.freeze({ resources: 1.05, discovery: 1.1 }) }), forest: Object.freeze({ id: 'forest', bundleMultipliers: Object.freeze({ resources: 1.25 }) }), swamp: Object.freeze({ id: 'swamp', bundleMultipliers: Object.freeze({ venom: 1.25 }) }), mountains: Object.freeze({ id: 'mountains', bundleMultipliers: Object.freeze({ ore: 1.25 }) }) })
export const POI_LOOT_DEFINITION_IDS = Object.freeze({ ancient_ruins: 'meadows_poi_loot', shrine: 'meadows_poi_loot', hollow_tree: 'meadows_poi_loot', abandoned_hut: 'meadows_poi_loot', forgotten_temple: 'meadows_poi_loot' })
