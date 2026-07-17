import { getSalvageDefinition } from '../salvage/salvageDefinitions.js'
const words = (value) => String(value).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
export function describeItemRequirement(requirement) {
  if (requirement.type === 'attribute') return `${words(requirement.attribute)} ${requirement.minimum}`
  if (requirement.type === 'character_level') return `Level ${requirement.minimum}`
  if (requirement.type === 'proficiency_rank') return `${requirement.proficiency} ${requirement.minimumRank}`
  if (requirement.type === 'combat_skill') return `Combat Skill: ${requirement.skillId}`
  if (requirement.type === 'knowledge') return 'Required Knowledge'
  if (requirement.type === 'wisdom') return `Wisdom ${requirement.minimum}`
  if (requirement.type === 'skill_rank') return `${requirement.skill} ${requirement.rank}`
  if (requirement.type === 'language') return `Language: ${requirement.language}`
  if (requirement.type === 'quest' || requirement.type === 'quest_flag') return 'Quest requirement'
  return words(requirement.type)
}
export function describeItemEffect(effect) { return words(effect.type) }
export function describeBookEffect(effect) { if (effect.type === 'grant_skill') return `${effect.skill} +${Number(effect.amount).toFixed(2)}`; if (effect.type === 'grant_knowledge') return `Knowledge: ${words(effect.knowledgeId)}`; if (effect.type === 'grant_maximum_cap') return `Maximum ${effect.skill} +${effect.amount}`; return describeItemEffect(effect) }
export function createItemTooltipModel(item, character = null) {
  const book = item.bookData
  const record = character?.libraryRecords?.find(({ bookId }) => bookId === item.id)
  const salvageDefinition = item.salvageDefinitionId ? getSalvageDefinition(item.salvageDefinitionId) : null
  return {
    name: item.displayName,
    itemType: item.itemType,
    category: book?.category ?? item.category,
    bookType: book ? words(book.kind) : null,
    manualTier: book?.manualTier ?? null,
    protected: Boolean(book?.protected ?? item.protected),
    availability: record?.status ?? (book ? 'Unknown' : null),
    quality: item.quality,
    description: item.description,
    value: item.value,
    iconId: item.iconId,
    equipSlots: item.equipSlots.map(words),
    proficiency: item.proficiency,
    salvageable: Boolean(item.salvageable && salvageDefinition),
    salvageMaterials: (salvageDefinition?.materialEntries ?? []).map((entry) => ({ id: entry.materialItemDefinitionId, displayName: words(entry.materialItemDefinitionId), minimum: entry.minimumQuantity, maximum: entry.maximumQuantity })),
    requirements: (book?.requirements ?? item.requirements).map(describeItemRequirement),
    weaponStats: item.weaponStats ? {
      baseDamage: item.weaponStats.baseDamage,
      damageType: words(item.weaponStats.damageType),
      attackRange: item.weaponStats.attackRange,
      attackSpeed: item.weaponStats.attackSpeed,
      handsRequired: item.weaponStats.handsRequired,
    } : null,
    armorRating: item.armorStats?.armorRating ?? null,
    maximumHpBonus: item.armorStats?.maximumHpBonus ?? null,
    resistances: item.armorStats?.resistances ?? null,
    effects: (book?.effects ?? item.effects).map(describeBookEffect),
  }
}
