import { ITEM_TAG } from '../items/itemConstants.js'
import { QUALITY_SALVAGE_MODIFIERS, SALVAGE_MATERIAL } from './salvageConstants.js'

const material = (materialItemDefinitionId, minimumQuantity, maximumQuantity, chance = 1, data = {}) => Object.freeze({ materialItemDefinitionId, minimumQuantity, maximumQuantity, chance, optionalRequiredTags: Object.freeze([]), optionalBlockedTags: Object.freeze([]), ...data, optionalRequiredTags: Object.freeze([...(data.optionalRequiredTags ?? [])]), optionalBlockedTags: Object.freeze([...(data.optionalBlockedTags ?? [])]) })
export function defineSalvage(data) {
  if (!data?.id || !data.displayName || !Array.isArray(data.materialEntries)) throw new Error('SalvageDefinition requires id, displayName and materialEntries.')
  return Object.freeze({ qualityModifiers: QUALITY_SALVAGE_MODIFIERS, requirements: Object.freeze([]), tags: Object.freeze([]), allowZeroResult: true, useRandomRange: true, ...data, materialEntries: Object.freeze(data.materialEntries.map((entry) => Object.freeze({ ...entry }))), requirements: Object.freeze([...(data.requirements ?? [])].map((entry) => Object.freeze({ ...entry }))), tags: Object.freeze([...(data.tags ?? [])]), qualityModifiers: Object.freeze({ ...QUALITY_SALVAGE_MODIFIERS, ...(data.qualityModifiers ?? {}) }) })
}

const definitions = [
  defineSalvage({ id: 'metal_weapon', displayName: 'Metal Weapon Salvage', tags: [ITEM_TAG.METAL], materialEntries: [material(SALVAGE_MATERIAL.METAL, 0, 2, 0.9, { optionalRequiredTags: [ITEM_TAG.METAL] })] }),
  defineSalvage({ id: 'wood_weapon', displayName: 'Wooden Weapon Salvage', tags: [ITEM_TAG.WOOD], materialEntries: [material(SALVAGE_MATERIAL.WOOD, 0, 1, 0.75, { optionalRequiredTags: [ITEM_TAG.WOOD] })] }),
  defineSalvage({ id: 'leather_armor', displayName: 'Leather Armor Salvage', tags: ['Leather'], materialEntries: [material(SALVAGE_MATERIAL.LEATHER, 0, 2, 0.9, { optionalRequiredTags: ['Leather'] })] }),
  defineSalvage({ id: 'studded_armor', displayName: 'Studded Armor Salvage', tags: ['Leather', ITEM_TAG.METAL], materialEntries: [material(SALVAGE_MATERIAL.LEATHER, 0, 2, 0.9, { optionalRequiredTags: ['Leather'] }), material(SALVAGE_MATERIAL.METAL, 0, 1, 0.45, { optionalRequiredTags: [ITEM_TAG.METAL] })] }),
  defineSalvage({ id: 'cloth_armor', displayName: 'Cloth Armor Salvage', tags: ['Cloth'], materialEntries: [material(SALVAGE_MATERIAL.CLOTH, 0, 2, 0.9, { optionalRequiredTags: ['Cloth'] })] }),
  defineSalvage({ id: 'bone_armor', displayName: 'Bone Armor Salvage', tags: [ITEM_TAG.BONE], materialEntries: [material(SALVAGE_MATERIAL.BONE, 0, 2, 0.9, { optionalRequiredTags: [ITEM_TAG.BONE] })] }),
  defineSalvage({ id: 'wood_shield', displayName: 'Wooden Shield Salvage', tags: [ITEM_TAG.WOOD], materialEntries: [material(SALVAGE_MATERIAL.WOOD, 0, 1, 0.75, { optionalRequiredTags: [ITEM_TAG.WOOD] })] }),
]

export const SALVAGE_DEFINITION_LIST = Object.freeze(definitions)
export const SALVAGE_DEFINITIONS = Object.freeze(Object.fromEntries(definitions.map((definition) => [definition.id, definition])))
export const getSalvageDefinition = (id) => SALVAGE_DEFINITIONS[id] ?? null
