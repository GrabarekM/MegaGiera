import { getItemDefinition } from './itemDatabase.js'

let nextInstanceSequence = 1

export function createItemInstance(definitionId, options = {}) {
  if (!getItemDefinition(definitionId)) return { ok: false, code: 'ITEM_DEFINITION_NOT_FOUND' }
  const quantity = Math.max(1, Math.trunc(options.quantity ?? 1))
  return Object.freeze({
    instanceId: options.instanceId ?? `item-${Date.now()}-${nextInstanceSequence++}`,
    definitionId,
    quantity,
    favorite: Boolean(options.favorite),
    acquiredAt: options.acquiredAt ?? new Date().toISOString(),
    state: Object.freeze({ ...(options.state ?? {}) }),
    ...(options.creationSource ? { creationSource: options.creationSource } : {}),
    ...(options.craftedRecipeId ? { craftedRecipeId: options.craftedRecipeId } : {}),
    ...(options.craftedAtWorldDay !== undefined ? { craftedAtWorldDay: options.craftedAtWorldDay } : {}),
    ...(options.craftedAtWorldTime !== undefined ? { craftedAtWorldTime: options.craftedAtWorldTime } : {}),
  })
}
export function resolveItemInstance(instance) { return instance?.definitionId ? getItemDefinition(instance.definitionId) : null }

export function restoreItemInstance(value) {
  if (!value?.definitionId || !getItemDefinition(value.definitionId)) return null
  return createItemInstance(value.definitionId, value)
}
