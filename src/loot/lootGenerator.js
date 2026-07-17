import { createItemInstance } from '../items/itemInstance.js'
import { createGoldRewardEntry, createItemRewardEntry, createLootReward } from '../inventory/lootReward.js'
import { getItemDefinition } from '../items/itemDatabase.js'
import { canUseSkillManual } from '../books/bookService.js'
import { BOOK_KIND } from '../books/bookDefinitions.js'

const chooseWeighted = (choices, random) => {
  const total = choices.reduce((sum, choice) => sum + Math.max(0, choice.weight), 0)
  if (!total) return null
  let roll = random() * total
  for (const choice of choices) { roll -= Math.max(0, choice.weight); if (roll < 0) return choice }
  return choices.at(-1) ?? null
}

export function applyRegionLootModifier(definition, regionModifier = null) {
  if (!regionModifier) return definition
  return { ...definition, bundles: definition.bundles.map((bundle) => ({ ...bundle, chance: Math.min(100, bundle.chance * (regionModifier.bundleMultipliers?.[bundle.id] ?? 1)) })) }
}

function filterSmartManuals(choices, character, enabled) {
  if (!enabled || !character) return choices
  return choices.filter((choice) => {
    if (choice.type !== 'item') return true
    const item = getItemDefinition(choice.itemId)
    return item?.bookData?.kind !== BOOK_KIND.SKILL_MANUAL || canUseSkillManual(character, item).ok
  })
}

export function generateLoot(definition, { sourceName = 'Reward', source = null, regionModifier = null, random = Math.random, smartLootCharacter = null, isRandomLoot = false } = {}) {
  if (!definition) return createLootReward({ sourceName, source })
  const modified = applyRegionLootModifier(definition, regionModifier)
  const entries = []
  for (const bundle of modified.bundles) {
    if (!bundle.guaranteed && random() * 100 >= bundle.chance) continue
    const choice = chooseWeighted(filterSmartManuals(bundle.choices, smartLootCharacter, isRandomLoot), random)
    if (!choice || choice.type === 'nothing') continue
    const quantity = typeof choice.quantity === 'object'
      ? Math.floor(random() * (choice.quantity.maximum - choice.quantity.minimum + 1)) + choice.quantity.minimum
      : choice.quantity
    if (choice.type === 'item') entries.push(createItemRewardEntry(createItemInstance(choice.itemId, { quantity }), source))
    if (choice.type === 'gold') entries.push(createGoldRewardEntry(quantity, source))
  }
  return createLootReward({ sourceName, source, entries })
}
