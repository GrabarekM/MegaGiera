import { ITEM_TYPE } from '../items/itemConstants.js'
import { resolveItemInstance } from '../items/itemInstance.js'

export const INVENTORY_FILTER = Object.freeze({
  ALL: 'All', WEAPONS: 'Weapons', ARMOR: 'Armor', ACCESSORIES: 'Accessories',
  CONSUMABLES: 'Consumables', MATERIALS: 'Materials', BOOKS: 'Books',
  QUEST_ITEMS: 'Quest Items', TREASURES: 'Treasures',
})
export const INVENTORY_SORT = Object.freeze({ NAME: 'Name', ITEM_TYPE: 'Item Type', NEWEST: 'Newest', GOLD_VALUE: 'Gold Value' })

const filterTypes = Object.freeze({
  [INVENTORY_FILTER.WEAPONS]: [ITEM_TYPE.WEAPON],
  [INVENTORY_FILTER.ARMOR]: [ITEM_TYPE.ARMOR, ITEM_TYPE.SHIELD],
  [INVENTORY_FILTER.ACCESSORIES]: [ITEM_TYPE.ACCESSORY],
  [INVENTORY_FILTER.CONSUMABLES]: [ITEM_TYPE.CONSUMABLE],
  [INVENTORY_FILTER.MATERIALS]: [ITEM_TYPE.MATERIAL],
  [INVENTORY_FILTER.BOOKS]: [ITEM_TYPE.BOOK, ITEM_TYPE.SCROLL],
  [INVENTORY_FILTER.QUEST_ITEMS]: [ITEM_TYPE.QUEST_ITEM, ITEM_TYPE.KEY_ITEM],
  [INVENTORY_FILTER.TREASURES]: [ITEM_TYPE.TREASURE],
})

const replaceInstance = (instance, changes) => Object.freeze({ ...instance, ...changes })
const normalizeQuantity = (value) => Math.max(1, Math.trunc(value ?? 1))

export class InventoryManager {
  constructor(character) {
    if (!character || !Array.isArray(character.inventory)) throw new Error('InventoryManager requires CharacterState inventory.')
    this.character = character
  }

  add(instance) {
    const definition = resolveItemInstance(instance)
    if (!definition) return { ok: false, code: 'ITEM_NOT_FOUND' }
    const quantity = normalizeQuantity(instance.quantity)
    if (definition.stackSize > 1) {
      let remaining = quantity
      for (let index = 0; index < this.character.inventory.length && remaining > 0; index += 1) {
        const current = this.character.inventory[index]
        if (current.definitionId !== instance.definitionId || current.favorite !== instance.favorite || current.quantity >= definition.stackSize) continue
        const added = Math.min(remaining, definition.stackSize - current.quantity)
        this.character.inventory[index] = replaceInstance(current, { quantity: current.quantity + added })
        remaining -= added
      }
      let stackIndex = 0
      while (remaining > 0) {
        const amount = Math.min(remaining, definition.stackSize)
        this.character.inventory.push(replaceInstance(instance, { quantity: amount, instanceId: stackIndex ? `${instance.instanceId}-stack-${stackIndex + 1}` : instance.instanceId }))
        remaining -= amount
        stackIndex += 1
      }
    } else {
      for (let count = 0; count < quantity; count += 1) this.character.inventory.push(replaceInstance(instance, { quantity: 1, instanceId: count ? `${instance.instanceId}-${count + 1}` : instance.instanceId }))
    }
    return { ok: true, quantity }
  }

  remove(instanceId, quantity = 1) {
    const index = this.character.inventory.findIndex((item) => item.instanceId === instanceId)
    if (index < 0) return { ok: false, code: 'ITEM_NOT_FOUND' }
    const instance = this.character.inventory[index]
    const removed = Math.min(normalizeQuantity(quantity), instance.quantity)
    if (removed === instance.quantity) this.character.inventory.splice(index, 1)
    else this.character.inventory[index] = replaceInstance(instance, { quantity: instance.quantity - removed })
    return { ok: true, item: instance, quantity: removed }
  }

  setFavorite(instanceId, favorite = true) {
    const index = this.character.inventory.findIndex((item) => item.instanceId === instanceId)
    if (index < 0) return { ok: false, code: 'ITEM_NOT_FOUND' }
    this.character.inventory[index] = replaceInstance(this.character.inventory[index], { favorite: Boolean(favorite) })
    return { ok: true, item: this.character.inventory[index] }
  }

  find(instanceId) { return this.character.inventory.find((item) => item.instanceId === instanceId) ?? null }
  replace(instanceId, changes) { const index = this.character.inventory.findIndex((item) => item.instanceId === instanceId); if (index < 0) return { ok: false, code: 'ITEM_NOT_FOUND' }; this.character.inventory[index] = Object.freeze({ ...this.character.inventory[index], ...changes, state: Object.freeze({ ...(changes.state ?? this.character.inventory[index].state ?? {}) }) }); return { ok: true, item: this.character.inventory[index] } }

  destroy(instanceId) {
    const instance = this.character.inventory.find((item) => item.instanceId === instanceId)
    const definition = resolveItemInstance(instance)
    if (!definition) return { ok: false, code: 'ITEM_NOT_FOUND' }
    if ([ITEM_TYPE.QUEST_ITEM, ITEM_TYPE.KEY_ITEM].includes(definition.itemType)) return { ok: false, code: 'QUEST_ITEM_PROTECTED' }
    if (definition.protected || instance.state?.protected) return { ok: false, code: 'PROTECTED_ITEM' }
    if (instance.favorite) return { ok: false, code: 'FAVORITE_ITEM_PROTECTED' }
    return this.remove(instanceId, instance.quantity)
  }

  query({ search = '', filter = INVENTORY_FILTER.ALL, sort = INVENTORY_SORT.NEWEST } = {}) {
    const phrase = search.trim().toLocaleLowerCase()
    const allowedTypes = filterTypes[filter]
    const entries = this.character.inventory.map((instance) => ({ instance, definition: resolveItemInstance(instance) })).filter(({ definition }) => definition)
      .filter(({ definition }) => !phrase || definition.displayName.toLocaleLowerCase().includes(phrase))
      .filter(({ definition }) => !allowedTypes || allowedTypes.includes(definition.itemType))
    const compare = {
      [INVENTORY_SORT.NAME]: (a, b) => a.definition.displayName.localeCompare(b.definition.displayName),
      [INVENTORY_SORT.ITEM_TYPE]: (a, b) => a.definition.itemType.localeCompare(b.definition.itemType) || a.definition.displayName.localeCompare(b.definition.displayName),
      [INVENTORY_SORT.NEWEST]: (a, b) => String(b.instance.acquiredAt).localeCompare(String(a.instance.acquiredAt)),
      [INVENTORY_SORT.GOLD_VALUE]: (a, b) => b.definition.value - a.definition.value,
    }[sort]
    return compare ? entries.sort(compare) : entries
  }
}
