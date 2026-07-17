import { EQUIPMENT_SLOTS } from '../data/characterCreation.js'
import { ITEM_TYPE } from '../items/itemConstants.js'
import { resolveItemInstance } from '../items/itemInstance.js'
import { evaluateItemRequirements } from '../items/itemRequirementService.js'

export const EQUIPMENT_EVENT = Object.freeze({ ITEM_EQUIPPED: 'OnItemEquipped', ITEM_UNEQUIPPED: 'OnItemUnequipped', EQUIPMENT_CHANGED: 'OnEquipmentChanged' })
const slotIds = Object.freeze(EQUIPMENT_SLOTS.map(({ id }) => id))
const success = (data = {}) => ({ ok: true, ...data })
const failure = (code, data = {}) => ({ ok: false, code, ...data })

export class EquipmentManager {
  constructor(character) { this.character = character; this.listeners = new Map(Object.values(EQUIPMENT_EVENT).map((event) => [event, new Set()])) }
  on(event, listener) { if (!this.listeners.has(event)) return () => {}; this.listeners.get(event).add(listener); return () => this.listeners.get(event).delete(listener) }
  emit(event, payload) { for (const listener of this.listeners.get(event) ?? []) listener(payload) }
  canEquip(instance, slotId) {
    if (!slotIds.includes(slotId)) return failure('INVALID_EQUIPMENT_SLOT')
    const item = resolveItemInstance(instance)
    if (!item) return failure('ITEM_DEFINITION_NOT_FOUND')
    if (![ITEM_TYPE.WEAPON, ITEM_TYPE.ARMOR, ITEM_TYPE.SHIELD, ITEM_TYPE.ACCESSORY].includes(item.itemType) || !item.equipSlots.includes(slotId)) return failure('ITEM_NOT_ALLOWED_IN_SLOT', { item, slotId })
    const requirements = evaluateItemRequirements(this.character, item)
    return requirements.met ? success({ item, requirements, slotId }) : failure('ITEM_REQUIREMENTS_NOT_MET', { item, requirements, slotId })
  }
  equip(instance, slotId) {
    const validation = this.canEquip(instance, slotId)
    if (!validation.ok) return validation
    const previous = this.character.equipment[slotId] ?? null
    this.character.equipment[slotId] = instance
    const payload = { characterId: this.character.id, slotId, instance, previous, item: validation.item }
    this.emit(EQUIPMENT_EVENT.ITEM_EQUIPPED, payload); this.emit(EQUIPMENT_EVENT.EQUIPMENT_CHANGED, payload)
    return success(payload)
  }
  unequip(slotId) {
    if (!slotIds.includes(slotId)) return failure('INVALID_EQUIPMENT_SLOT')
    const instance = this.character.equipment[slotId]
    if (!instance) return failure('EQUIPMENT_SLOT_EMPTY')
    this.character.equipment[slotId] = null
    const payload = { characterId: this.character.id, slotId, instance, item: resolveItemInstance(instance) }
    this.emit(EQUIPMENT_EVENT.ITEM_UNEQUIPPED, payload); this.emit(EQUIPMENT_EVENT.EQUIPMENT_CHANGED, payload)
    return success(payload)
  }
  swap(firstSlotId, secondSlotId) {
    if (!slotIds.includes(firstSlotId) || !slotIds.includes(secondSlotId)) return failure('INVALID_EQUIPMENT_SLOT')
    const first = this.character.equipment[firstSlotId]; const second = this.character.equipment[secondSlotId]
    if (first && !this.canEquip(first, secondSlotId).ok) return failure('FIRST_ITEM_NOT_ALLOWED_IN_TARGET_SLOT')
    if (second && !this.canEquip(second, firstSlotId).ok) return failure('SECOND_ITEM_NOT_ALLOWED_IN_TARGET_SLOT')
    this.character.equipment[firstSlotId] = second ?? null; this.character.equipment[secondSlotId] = first ?? null
    const payload = { characterId: this.character.id, firstSlotId, secondSlotId, first, second }
    this.emit(EQUIPMENT_EVENT.EQUIPMENT_CHANGED, payload); return success(payload)
  }
  getItemInSlot(slotId) { return slotIds.includes(slotId) ? this.character.equipment[slotId] ?? null : null }
  getEquippedItems() { return slotIds.flatMap((slotId) => { const instance = this.getItemInSlot(slotId); const item = resolveItemInstance(instance); return item ? [{ slotId, instance, item }] : [] }) }
  getEquippedWeapon() { return this.getEquippedItems().find(({ item }) => item.itemType === ITEM_TYPE.WEAPON) ?? null }
  getEquippedArmor() { return this.getEquippedItems().filter(({ item }) => item.itemType === ITEM_TYPE.ARMOR || item.itemType === ITEM_TYPE.SHIELD) }
}
