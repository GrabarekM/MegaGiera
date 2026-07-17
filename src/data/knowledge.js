export const KNOWLEDGE_CATEGORY = Object.freeze({
  MARTIAL: 'Martial', ARCANE: 'Arcane', DIVINE: 'Divine', NATURAL: 'Natural', HISTORICAL: 'Historical',
  SURVIVAL: 'Survival', CRAFTING: 'Crafting', FORBIDDEN: 'Forbidden', EXPLORATION: 'Exploration',
})

const defineKnowledge = (id, displayName, description, category, options = {}) => Object.freeze({
  id, displayName, description, category, isSecret: false, tags: Object.freeze([]), relatedLessons: Object.freeze([]),
  relatedMentors: Object.freeze([]), relatedTrainers: Object.freeze([]), ...options,
})

export const KNOWLEDGE = Object.freeze({
  hunters_legacy: defineKnowledge('hunters_legacy', "Hunter's Legacy", 'Old hunting traditions passed between generations.', KNOWLEDGE_CATEGORY.MARTIAL, { tags: Object.freeze(['hunter', 'legacy']), relatedTrainers: Object.freeze(['village_hunter']) }),
  ancient_sword_forms: defineKnowledge('ancient_sword_forms', 'Ancient Sword Forms', 'Fragments of forgotten martial doctrine.', KNOWLEDGE_CATEGORY.MARTIAL, { tags: Object.freeze(['sword', 'ancient']), relatedMentors: Object.freeze(['sword_master']) }),
  forbidden_arts: defineKnowledge('forbidden_arts', 'Forbidden Arts', 'Knowledge deliberately erased from accepted arcane study.', KNOWLEDGE_CATEGORY.FORBIDDEN, { isSecret: true, tags: Object.freeze(['secret', 'forbidden']), relatedMentors: Object.freeze(['necromancer']) }),
  ancient_shrine: defineKnowledge('ancient_shrine', 'Ancient Shrine', 'Understanding of a forgotten sacred place.', KNOWLEDGE_CATEGORY.DIVINE, { tags: Object.freeze(['shrine']) }),
  royal_recipes: defineKnowledge('royal_recipes', 'Royal Recipes', 'Culinary traditions once guarded by the royal kitchens.', KNOWLEDGE_CATEGORY.CRAFTING, { tags: Object.freeze(['cooking', 'royal']) }),
  old_kingdom_history: defineKnowledge('old_kingdom_history', 'Old Kingdom History', 'Recorded history of the fallen old kingdom.', KNOWLEDGE_CATEGORY.HISTORICAL, { tags: Object.freeze(['history']) }),
  local_threat: defineKnowledge('local_threat', 'Local Threat', 'Signs identifying dangerous activity in the Meadows.', KNOWLEDGE_CATEGORY.EXPLORATION, { tags: Object.freeze(['meadows', 'tracks']) }),
})

export const KNOWLEDGE_LIST = Object.freeze(Object.values(KNOWLEDGE))
