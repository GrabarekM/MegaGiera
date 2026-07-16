import { ATTRIBUTE_DEFINITIONS, EQUIPMENT_SLOTS, PROFICIENCY_NAMES, STARTING_WEAPONS } from '../data/characterCreation.js'

export const ATTRIBUTE_POINTS = 8
export const ATTRIBUTE_MIN = 1
export const ATTRIBUTE_MAX = 5
export const NOVICE_PROFICIENCY_LIMIT = 2

export function createCharacterDraft() {
  return {
    name: '',
    attributes: Object.fromEntries(ATTRIBUTE_DEFINITIONS.map(({ id }) => [id, ATTRIBUTE_MIN])),
    noviceProficiencies: [],
    startingWeaponId: null,
  }
}

export function getPointsRemaining(attributes) {
  const spent = ATTRIBUTE_DEFINITIONS.reduce((total, { id }) => total + Math.max(0, (attributes[id] ?? ATTRIBUTE_MIN) - ATTRIBUTE_MIN), 0)
  return ATTRIBUTE_POINTS - spent
}

export function changeAttribute(draft, attributeId, change) {
  if (!ATTRIBUTE_DEFINITIONS.some(({ id }) => id === attributeId)) return false
  const next = draft.attributes[attributeId] + change
  if (next < ATTRIBUTE_MIN || next > ATTRIBUTE_MAX) return false
  if (change > 0 && getPointsRemaining(draft.attributes) < change) return false
  draft.attributes[attributeId] = next
  return true
}

export function toggleProficiency(draft, name) {
  if (!PROFICIENCY_NAMES.includes(name)) return false
  const index = draft.noviceProficiencies.indexOf(name)
  if (index >= 0) draft.noviceProficiencies.splice(index, 1)
  else if (draft.noviceProficiencies.length < NOVICE_PROFICIENCY_LIMIT) draft.noviceProficiencies.push(name)
  else return false
  return true
}

export function getSelectedWeapon(draft) {
  return STARTING_WEAPONS.find(({ id }) => id === draft.startingWeaponId) ?? null
}

export function canStartRun(draft) {
  return Boolean(draft.name.trim() && getPointsRemaining(draft.attributes) === 0
    && draft.noviceProficiencies.length === NOVICE_PROFICIENCY_LIMIT && getSelectedWeapon(draft))
}

export function buildCharacterCreation(draft) {
  if (!canStartRun(draft)) throw new Error('Character creation is incomplete.')
  const weapon = getSelectedWeapon(draft)
  return {
    name: draft.name.trim(), attributes: { ...draft.attributes },
    proficiencies: Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, draft.noviceProficiencies.includes(name) ? 'Novice' : 'Untrained'])),
    startingWeapon: { ...weapon, combatSkills: [...weapon.combatSkills] },
    startingSkills: [...weapon.combatSkills],
    equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(({ id }) => [id, null])),
  }
}
