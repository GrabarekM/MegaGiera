export const SALVAGE_RESULT = Object.freeze({
  SUCCESS: 'SALVAGE_SUCCESS',
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  ITEM_NOT_SALVAGEABLE: 'ITEM_NOT_SALVAGEABLE',
  ITEM_EQUIPPED: 'ITEM_EQUIPPED',
  ITEM_FAVORITE: 'ITEM_FAVORITE',
  ITEM_PROTECTED: 'ITEM_PROTECTED',
  QUEST_ITEM: 'QUEST_ITEM_CANNOT_BE_SALVAGED',
  KEY_ITEM: 'KEY_ITEM_CANNOT_BE_SALVAGED',
  DEFINITION_NOT_FOUND: 'SALVAGE_DEFINITION_NOT_FOUND',
  REQUIREMENTS_NOT_MET: 'REQUIREMENTS_NOT_MET',
  EMPTY_RESULT: 'EMPTY_SALVAGE_RESULT',
  FAILED: 'SALVAGE_FAILED',
})

export const SALVAGE_MATERIAL = Object.freeze({
  METAL: 'metal_scrap', LEATHER: 'leather_scrap', CLOTH: 'cloth_scrap', BONE: 'bone_fragment', WOOD: 'wood_scrap',
})

export const QUALITY_SALVAGE_MODIFIERS = Object.freeze({
  Broken: Object.freeze({ quantityMultiplier: 0.5, chanceMultiplier: 0.9 }),
  Poor: Object.freeze({ quantityMultiplier: 0.75, chanceMultiplier: 0.95 }),
  Normal: Object.freeze({ quantityMultiplier: 1, chanceMultiplier: 1 }),
  Fine: Object.freeze({ quantityMultiplier: 1.1, chanceMultiplier: 1 }),
  Excellent: Object.freeze({ quantityMultiplier: 1.18, chanceMultiplier: 1 }),
  Superior: Object.freeze({ quantityMultiplier: 1.25, chanceMultiplier: 1 }),
  Masterwork: Object.freeze({ quantityMultiplier: 1.5, chanceMultiplier: 1 }),
})

export const roundSalvageQuantity = (value) => Math.max(0, Math.floor(Number(value) + 0.000001))
