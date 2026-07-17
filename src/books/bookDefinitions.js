import { ITEM_QUALITY, ITEM_TYPE } from '../items/itemConstants.js'
import { defineReward, REWARD_TYPE } from '../rewards/rewardDefinitions.js'

export const BOOK_KIND = Object.freeze({
  SKILL_MANUAL: 'skill_manual', KNOWLEDGE_BOOK: 'knowledge_book', MASTER_TREATISE: 'master_treatise', LEGENDARY_TOME: 'legendary_tome',
  SKILL_SCROLL: 'skill_scroll', KNOWLEDGE_SCROLL: 'knowledge_scroll', RECIPE_SCROLL: 'recipe_scroll', MAP_SCROLL: 'map_scroll', RITUAL_SCROLL: 'ritual_scroll',
})

export const BOOK_CATEGORY = Object.freeze({ COMBAT: 'Combat', MAGIC: 'Magic', SURVIVAL: 'Survival', CRAFTING: 'Crafting', HISTORY: 'History', RELIGION: 'Religion', NATURE: 'Nature', LANGUAGES: 'Languages', ALCHEMY: 'Alchemy', COOKING: 'Cooking', FISHING: 'Fishing', LORE: 'Lore' })
export const BOOK_STATUS = Object.freeze({ UNREAD: 'Unread', KNOWN: 'Known', CONSUMED: 'Consumed', UNAVAILABLE: 'Unavailable', UNKNOWN: 'Unknown' })

export function defineBookDefinition(data) {
  if (!Object.values(BOOK_KIND).includes(data.kind) || !Object.values(BOOK_CATEGORY).includes(data.category)) throw new Error('BookDefinition requires a valid type and category.')
  return Object.freeze({ requirements: Object.freeze([]), effects: Object.freeze([]), quality: ITEM_QUALITY.NORMAL, manualTier: null, consumable: false, destroyOnUse: false, repeatable: false, questBook: false, protected: Boolean(data.questBook), ...data, protected: Boolean(data.protected ?? data.questBook), requirements: Object.freeze([...(data.requirements ?? [])].map((value) => Object.freeze({ ...value }))), effects: Object.freeze([...(data.effects ?? [])].map((value) => Object.freeze({ ...value }))) })
}
export const defineScrollDefinition = (data) => defineBookDefinition({ consumable: true, destroyOnUse: true, repeatable: false, ...data })

export const MANUAL_TIER = Object.freeze({
  BASIC: Object.freeze({ name: 'Basic', minimumBaseSkill: 0, maximumBaseSkill: 20 }),
  JOURNEYMAN: Object.freeze({ name: 'Journeyman', minimumBaseSkill: 20, maximumBaseSkill: 40 }),
  ADVANCED: Object.freeze({ name: 'Advanced', minimumBaseSkill: 40, maximumBaseSkill: 60 }),
  EXPERT: Object.freeze({ name: 'Expert', minimumBaseSkill: 60, maximumBaseSkill: 80 }),
  MASTER: Object.freeze({ name: 'Master', minimumBaseSkill: 80, maximumBaseSkill: 100 }),
})

const book = (id, displayName, description, itemType, quality, data) => { const bookData = itemType === ITEM_TYPE.SCROLL ? defineScrollDefinition({ quality, ...data }) : defineBookDefinition({ quality, ...data }); return { id, displayName, description, itemType, quality, category: bookData.category, value: 25, stackSize: 1, iconId: `book-${bookData.kind}`, useContext: ['exploration'], useEffects: [{ type: 'use_book' }], reusable: !bookData.destroyOnUse, protected: bookData.protected, bookData } }
const manual = (id, quality, tier, gain = 1) => book(id, `${tier.name} Archery Manual`, `A ${tier.name.toLowerCase()} training manual for Archery.`, ITEM_TYPE.BOOK, quality, { kind: BOOK_KIND.SKILL_MANUAL, category: BOOK_CATEGORY.COMBAT, affectedSkill: 'Archery', minimumBaseSkill: tier.minimumBaseSkill, maximumBaseSkill: tier.maximumBaseSkill, skillGain: gain, manualTier: tier.name, consumable: true, destroyOnUse: true, effects: [defineReward(REWARD_TYPE.GRANT_SKILL, { skill: 'Archery', amount: gain })] })

export const BOOK_ITEM_DATA = Object.freeze([
  manual('poor_basic_archery_manual', ITEM_QUALITY.POOR, MANUAL_TIER.BASIC),
  manual('basic_archery_manual', ITEM_QUALITY.NORMAL, MANUAL_TIER.BASIC),
  manual('excellent_basic_archery_manual', ITEM_QUALITY.EXCELLENT, MANUAL_TIER.BASIC),
  manual('journeyman_archery_manual', ITEM_QUALITY.NORMAL, MANUAL_TIER.JOURNEYMAN),
  manual('advanced_archery_manual', ITEM_QUALITY.NORMAL, MANUAL_TIER.ADVANCED),
  manual('expert_archery_manual', ITEM_QUALITY.NORMAL, MANUAL_TIER.EXPERT),
  manual('master_archery_manual', ITEM_QUALITY.NORMAL, MANUAL_TIER.MASTER),
  book('history_of_the_old_kingdom', 'History of the Old Kingdom', 'A preserved account of the fallen kingdom.', ITEM_TYPE.BOOK, ITEM_QUALITY.NORMAL, { kind: BOOK_KIND.KNOWLEDGE_BOOK, category: BOOK_CATEGORY.HISTORY, protected: true, knowledgeId: 'old_kingdom_history', effects: [defineReward(REWARD_TYPE.GRANT_KNOWLEDGE, { knowledgeId: 'old_kingdom_history' })] }),
  book('hunters_journal', "Hunter's Journal", 'Field notes combining archery, animal lore and a simple camp recipe.', ITEM_TYPE.BOOK, ITEM_QUALITY.NORMAL, { kind: BOOK_KIND.KNOWLEDGE_BOOK, category: BOOK_CATEGORY.NATURE, protected: true, effects: [defineReward(REWARD_TYPE.GRANT_SKILL, { skill: 'Archery', amount: 1 }), defineReward(REWARD_TYPE.GRANT_SKILL, { skill: 'Animal Lore', amount: 1 }), defineReward(REWARD_TYPE.GRANT_KNOWLEDGE, { knowledgeId: 'hunters_legacy' }), defineReward(REWARD_TYPE.GRANT_RECIPE, { recipeId: 'simple_soup' })] }),
  book('archery_master_treatise', 'Master Treatise of Archery', 'Advanced theory that expands the natural limit of Archery.', ITEM_TYPE.BOOK, ITEM_QUALITY.MASTERWORK, { kind: BOOK_KIND.MASTER_TREATISE, category: BOOK_CATEGORY.COMBAT, affectedSkill: 'Archery', maximumCapGain: 5, protected: true, consumable: true, destroyOnUse: true, requirements: [{ type: 'skill_rank', skill: 'Archery', rank: 'Grandmaster' }], effects: [defineReward(REWARD_TYPE.GRANT_MAXIMUM_CAP, { skill: 'Archery', amount: 5 })] }),
  book('legendary_archery_tome', 'Legendary Tome of Archery', 'Rare teachings capable of breaking ordinary limits.', ITEM_TYPE.BOOK, ITEM_QUALITY.MASTERWORK, { kind: BOOK_KIND.LEGENDARY_TOME, category: BOOK_CATEGORY.COMBAT, affectedSkill: 'Archery', maximumCapGain: 5, protected: true, consumable: true, destroyOnUse: true, effects: [defineReward(REWARD_TYPE.GRANT_MAXIMUM_CAP, { skill: 'Archery', amount: 5 })] }),
  book('archery_skill_scroll', 'Archery Skill Scroll', 'A concise set of practical Archery exercises.', ITEM_TYPE.SCROLL, ITEM_QUALITY.NORMAL, { kind: BOOK_KIND.SKILL_SCROLL, category: BOOK_CATEGORY.COMBAT, affectedSkill: 'Archery', skillGain: 1, effects: [defineReward(REWARD_TYPE.GRANT_SKILL, { skill: 'Archery', amount: 1 })] }),
  book('old_kingdom_knowledge_scroll', 'Old Kingdom Knowledge Scroll', 'A fragile historical record.', ITEM_TYPE.SCROLL, ITEM_QUALITY.NORMAL, { kind: BOOK_KIND.KNOWLEDGE_SCROLL, category: BOOK_CATEGORY.HISTORY, knowledgeId: 'old_kingdom_history', effects: [defineReward(REWARD_TYPE.GRANT_KNOWLEDGE, { knowledgeId: 'old_kingdom_history' })] }),
  book('simple_soup_recipe_scroll', 'Simple Soup Recipe Scroll', 'A cook’s field note describing a modest camp soup.', ITEM_TYPE.SCROLL, ITEM_QUALITY.NORMAL, { kind: BOOK_KIND.RECIPE_SCROLL, category: BOOK_CATEGORY.NATURE, recipeId: 'simple_soup', effects: [defineReward(REWARD_TYPE.GRANT_RECIPE, { recipeId: 'simple_soup' })] }),
  book('meadows_map_scroll', 'Meadows Map Scroll', 'A map whose discovery effect will be connected to the world system later.', ITEM_TYPE.SCROLL, ITEM_QUALITY.NORMAL, { kind: BOOK_KIND.MAP_SCROLL, category: BOOK_CATEGORY.LORE, mapId: 'meadows' }),
  book('ritual_scroll_placeholder', 'Ritual Scroll', 'An undeciphered ritual reserved for a future system.', ITEM_TYPE.SCROLL, ITEM_QUALITY.NORMAL, { kind: BOOK_KIND.RITUAL_SCROLL, category: BOOK_CATEGORY.MAGIC, ritualId: null }),
])
