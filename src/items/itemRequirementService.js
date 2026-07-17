import { evaluateRequirement } from '../npc/trainingRequirementSystem.js'

export function evaluateItemRequirements(character, itemDefinition) {
  const requirements = (itemDefinition?.requirements ?? []).map((requirement) => evaluateRequirement(character, requirement))
  return { met: requirements.every((requirement) => requirement.met), requirements, blockers: requirements.filter((requirement) => !requirement.met) }
}
export const canEquipItem = (character, itemDefinition) => evaluateItemRequirements(character, itemDefinition)
