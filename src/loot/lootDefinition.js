export const LOOT_SOURCE_TYPE = Object.freeze({ ENEMY: 'enemy', BOSS: 'boss', POI: 'poi', QUEST: 'quest', TRAINER: 'trainer', MENTOR: 'mentor', MERCHANT: 'merchant', WORLD_EVENT: 'world_event' })

const freezeChoice = (choice) => Object.freeze({ weight: 1, quantity: 1, ...choice })
const freezeBundle = (bundle) => Object.freeze({ chance: 0, guaranteed: false, ...bundle, choices: Object.freeze((bundle.choices ?? []).map(freezeChoice)) })

export function defineLootDefinition({ id, sourceType, bundles = [], modifierHooks = [] }) {
  if (!id || !Object.values(LOOT_SOURCE_TYPE).includes(sourceType)) throw new Error('LootDefinition requires id and valid sourceType.')
  const normalized = bundles.map(freezeBundle)
  if (normalized.some(({ chance }) => chance < 0 || chance > 100)) throw new Error('Loot Bundle chance must be between 0 and 100.')
  return Object.freeze({ id, sourceType, bundles: Object.freeze(normalized), modifierHooks: Object.freeze([...modifierHooks]) })
}
