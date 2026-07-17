import { evaluateRequirement } from '../npc/trainingRequirementSystem.js'
import { resolveItemInstance } from '../items/itemInstance.js'

export function evaluatePoiRequirement(requirement, instance, context) {
  let result
  if (['poi_state', 'poi_flag', 'poi_counter', 'poi_discovered', 'world_flag', 'region_flag', 'item', 'item_tag', 'proficiency_base', 'proficiency_effective'].includes(requirement.type)) {
    const inventory = context.character?.inventory ?? []
    const values = { poi_state: instance.currentStateId === requirement.stateId, poi_flag: instance.localFlags[requirement.flag] === (requirement.value ?? true), poi_counter: (instance.interactionCounters[requirement.counter] ?? 0) >= requirement.minimum, poi_discovered: Boolean(context.getPoiInstance?.(requirement.instanceId)?.isDiscovered), world_flag: context.worldFlags?.[requirement.flag] === (requirement.value ?? true), region_flag: context.regionFlags?.[requirement.flag] === (requirement.value ?? true), item: inventory.reduce((n, item) => n + (item.definitionId === requirement.itemDefinitionId ? item.quantity : 0), 0) >= (requirement.quantity ?? 1), item_tag: inventory.some((item) => resolveItemInstance(item)?.tags.includes(requirement.tag)), proficiency_base: (context.proficiencyState?.[requirement.proficiency]?.baseValue ?? 0) >= requirement.minimum, proficiency_effective: (context.characterStats?.proficiencyValues?.[requirement.proficiency]?.effectiveValue ?? 0) >= requirement.minimum }
    result = { met: Boolean(values[requirement.type]), type: requirement.type, status: 'supported', required: requirement.displayText ?? 'Requirement not met.', current: '' }
  } else result = evaluateRequirement(context.character, requirement)
  return { ...result, displayText: requirement.displayText ?? result.required, showWhenMissing: requirement.showWhenMissing !== false, hidden: Boolean(requirement.hideRequirementType) }
}
