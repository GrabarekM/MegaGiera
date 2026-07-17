import { createLootReward } from '../inventory/lootReward.js'
import { ITEM_TAG, ITEM_TYPE } from '../items/itemConstants.js'
import { getItemDefinition } from '../items/itemDatabase.js'
import { createItemInstance } from '../items/itemInstance.js'
import { evaluateRequirement } from '../npc/trainingRequirementSystem.js'
import { getSalvageDefinition } from './salvageDefinitions.js'
import { QUALITY_SALVAGE_MODIFIERS, roundSalvageQuantity, SALVAGE_RESULT } from './salvageConstants.js'

const allowedTypes = Object.freeze([ITEM_TYPE.WEAPON, ITEM_TYPE.ARMOR, ITEM_TYPE.SHIELD, ITEM_TYPE.ACCESSORY])
const failure = (code, data = {}) => ({ ok: false, code, ...data })
const isEquipped = (character, instanceId) => Object.values(character.equipment ?? {}).some((instance) => instance?.instanceId === instanceId)
const randomValue = (source) => typeof source === 'function' ? source() : source?.next?.()
export function createSalvageRandomSource(seed = 0x6d2b79f5) {
  let state = (Number(seed) >>> 0) || 0x6d2b79f5
  return () => { state += 0x6d2b79f5; let value = state; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296 }
}

export function isPotentiallySalvageable(item) {
  if (!item || !allowedTypes.includes(item.itemType) || !item.salvageDefinitionId) return false
  if (item.itemType === ITEM_TYPE.ACCESSORY) return item.salvageable === true
  return item.salvageable !== false
}

export class SalvageService {
  constructor({ character, inventoryManager, randomSource = createSalvageRandomSource(), getWorldTime = () => ({ day: null, hour: null }), definitions = null, itemResolver = getItemDefinition } = {}) {
    this.character = character
    this.inventoryManager = inventoryManager
    this.randomSource = randomSource
    this.getWorldTime = getWorldTime
    this.definitions = definitions
    this.itemResolver = itemResolver
    this.records = []
  }

  getDefinition(id) { return this.definitions?.[id] ?? getSalvageDefinition(id) }

  validate(instanceId) {
    const instance = this.inventoryManager?.find(instanceId)
    if (!instance) return failure(SALVAGE_RESULT.ITEM_NOT_FOUND)
    const item = this.itemResolver(instance.definitionId)
    if (!item) return failure(SALVAGE_RESULT.ITEM_NOT_FOUND)
    if (item.itemType === ITEM_TYPE.QUEST_ITEM || item.tags.includes(ITEM_TAG.QUEST)) return failure(SALVAGE_RESULT.QUEST_ITEM, { instance, item })
    if (item.itemType === ITEM_TYPE.KEY_ITEM) return failure(SALVAGE_RESULT.KEY_ITEM, { instance, item })
    if (instance.favorite) return failure(SALVAGE_RESULT.ITEM_FAVORITE, { instance, item })
    if (item.protected || instance.state?.protected) return failure(SALVAGE_RESULT.ITEM_PROTECTED, { instance, item })
    if (item.unique && !item.allowUniqueSalvage) return failure(SALVAGE_RESULT.ITEM_PROTECTED, { instance, item })
    if (isEquipped(this.character, instanceId)) return failure(SALVAGE_RESULT.ITEM_EQUIPPED, { instance, item, message: 'Unequip this item before salvaging it.' })
    if (!isPotentiallySalvageable(item)) return failure(SALVAGE_RESULT.ITEM_NOT_SALVAGEABLE, { instance, item })
    const definition = this.getDefinition(item.salvageDefinitionId)
    if (!definition) return failure(SALVAGE_RESULT.DEFINITION_NOT_FOUND, { instance, item })
    const requirements = definition.requirements.map((requirement) => evaluateRequirement(this.character, requirement))
    if (requirements.some(({ met }) => !met)) return failure(SALVAGE_RESULT.REQUIREMENTS_NOT_MET, { instance, item, definition, requirements })
    return { ok: true, instance, item, definition, requirements }
  }

  preview(instanceId) {
    const validation = this.validate(instanceId)
    if (!validation.ok) return validation
    const { instance, item, definition, requirements } = validation
    const quality = instance.state?.quality ?? item.quality
    const modifier = definition.qualityModifiers[quality] ?? QUALITY_SALVAGE_MODIFIERS.Normal
    const possibleMaterials = definition.materialEntries.filter((entry) => this.matchesTags(item, entry)).map((entry) => ({ materialItemDefinitionId: entry.materialItemDefinitionId, displayName: getItemDefinition(entry.materialItemDefinitionId)?.displayName ?? entry.materialItemDefinitionId, minimumQuantity: roundSalvageQuantity(entry.minimumQuantity * modifier.quantityMultiplier), maximumQuantity: roundSalvageQuantity(entry.maximumQuantity * modifier.quantityMultiplier), chance: Math.min(1, entry.chance * (modifier.chanceMultiplier ?? 1)) }))
    return { ok: true, instance, item, definition, quality, qualityModifier: modifier, requirements, possibleMaterials, allowZeroResult: definition.allowZeroResult, warning: 'This item will be permanently destroyed.' }
  }

  matchesTags(item, entry) { return entry.optionalRequiredTags.every((tag) => item.tags.includes(tag)) && !entry.optionalBlockedTags.some((tag) => item.tags.includes(tag)) }

  execute(instanceId) {
    const preview = this.preview(instanceId)
    if (!preview.ok) return preview
    try {
      const generatedMaterials = []
      const rolls = []
      for (const material of preview.possibleMaterials) {
        const chanceRoll = Number(randomValue(this.randomSource))
        if (!Number.isFinite(chanceRoll)) return failure(SALVAGE_RESULT.FAILED, { reason: 'INVALID_RANDOM_SOURCE' })
        let quantity = 0
        let quantityRoll = null
        if (chanceRoll < material.chance) {
          quantityRoll = Number(randomValue(this.randomSource))
          if (!Number.isFinite(quantityRoll)) return failure(SALVAGE_RESULT.FAILED, { reason: 'INVALID_RANDOM_SOURCE' })
          quantity = preview.definition.useRandomRange ? material.minimumQuantity + Math.floor(quantityRoll * (material.maximumQuantity - material.minimumQuantity + 1)) : material.maximumQuantity
        }
        quantity = Math.max(0, Math.min(material.maximumQuantity, Math.trunc(quantity)))
        rolls.push({ materialItemDefinitionId: material.materialItemDefinitionId, chanceRoll, quantityRoll, quantity })
        if (quantity > 0) generatedMaterials.push(createItemInstance(material.materialItemDefinitionId, { quantity }))
      }
      const removed = this.inventoryManager.remove(instanceId, 1)
      if (!removed.ok) return failure(SALVAGE_RESULT.FAILED, { reason: removed.code })
      const time = this.getWorldTime() ?? {}
      const record = Object.freeze({ salvageId: `salvage-${Date.now()}-${this.records.length + 1}`, sourceItemInstanceId: preview.instance.instanceId, sourceItemDefinitionId: preview.item.id, sourceQuality: preview.quality, generatedMaterials: Object.freeze(generatedMaterials.map((instance) => Object.freeze({ definitionId: instance.definitionId, quantity: instance.quantity }))), worldDay: time.day ?? null, worldTime: time.hour ?? time.time ?? null, rolls: Object.freeze(rolls.map(Object.freeze)) })
      this.records.push(record)
      const reward = createLootReward({ sourceName: 'Salvage Results', source: { type: 'salvage', salvageId: record.salvageId }, itemInstances: generatedMaterials })
      const empty = generatedMaterials.length === 0
      return { ok: true, code: empty ? SALVAGE_RESULT.EMPTY_RESULT : SALVAGE_RESULT.SUCCESS, empty, generatedMaterials, reward, record, message: empty ? 'Nothing usable could be recovered.' : 'Salvage complete.' }
    } catch (error) {
      return failure(SALVAGE_RESULT.FAILED, { reason: error instanceof Error ? error.message : String(error) })
    }
  }
}
