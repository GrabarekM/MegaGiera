import { ATTRIBUTE_DEFINITIONS, EQUIPMENT_SLOTS, PROFICIENCY_NAMES, PROFICIENCY_RANKS } from '../data/characterCreation.js'

export const CHARACTER_DEFAULTS = Object.freeze({
  level: 1,
  experience: 0,
  maxHealth: 18,
  gold: 0,
  stats: Object.freeze(Object.fromEntries(ATTRIBUTE_DEFINITIONS.map(({ id }) => [id, 1]))),
})

const emptyEquipment = () => Object.fromEntries(EQUIPMENT_SLOTS.map(({ id }) => [id, null]))
const emptyProficiencies = () => Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, 'Untrained']))

export function createCharacterState({
  id, name = 'Hero', attributes = CHARACTER_DEFAULTS.stats, proficiencies = emptyProficiencies(),
  startingWeapon = null, equipment = emptyEquipment(), startingSkills = [],
}) {
  if (!id || !name.trim()) throw new Error('Character id and name are required.')
  return {
    id,
    name: name.trim(),
    level: CHARACTER_DEFAULTS.level,
    experience: CHARACTER_DEFAULTS.experience,
    health: { current: CHARACTER_DEFAULTS.maxHealth, max: CHARACTER_DEFAULTS.maxHealth },
    gold: CHARACTER_DEFAULTS.gold,
    stats: { ...CHARACTER_DEFAULTS.stats, ...attributes },
    proficiencies: { ...emptyProficiencies(), ...proficiencies },
    startingWeapon: startingWeapon ? { ...startingWeapon } : null,
    startingSkills: [...startingSkills],
    equipment: { ...emptyEquipment(), ...equipment },
    inventory: [],
    statuses: [],
    flags: {},
  }
}

export function cloneCharacterState(character) {
  return {
    ...character,
    health: { ...character.health },
    stats: { ...character.stats },
    proficiencies: { ...character.proficiencies },
    startingWeapon: character.startingWeapon ? { ...character.startingWeapon } : null,
    startingSkills: [...character.startingSkills],
    equipment: { ...character.equipment },
    inventory: [...character.inventory],
    statuses: character.statuses.map((status) => typeof status === 'object' ? { ...status } : status),
    flags: { ...character.flags },
  }
}

export function restoreCharacterState(saved, fallback) {
  if (!saved) return cloneCharacterState(fallback)
  const stats = Object.fromEntries(ATTRIBUTE_DEFINITIONS.map(({ id }) => [id, Number.isInteger(saved.stats?.[id]) ? saved.stats[id] : fallback.stats[id]]))
  const proficiencies = Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, PROFICIENCY_RANKS.includes(saved.proficiencies?.[name]) ? saved.proficiencies[name] : 'Untrained']))
  return cloneCharacterState({
    ...fallback, ...saved,
    health: { ...fallback.health, ...saved.health }, stats, proficiencies,
    startingWeapon: saved.startingWeapon ?? fallback.startingWeapon,
    startingSkills: Array.isArray(saved.startingSkills) ? saved.startingSkills : fallback.startingSkills,
    equipment: { ...fallback.equipment, ...saved.equipment },
    inventory: Array.isArray(saved.inventory) ? saved.inventory : [],
    statuses: Array.isArray(saved.statuses) ? saved.statuses : [],
    flags: saved.flags && typeof saved.flags === 'object' ? saved.flags : {},
  })
}

export function isValidCharacterState(character) {
  const trainedCount = PROFICIENCY_NAMES.filter((name) => character?.proficiencies?.[name] !== 'Untrained').length
  return Boolean(character && typeof character.id === 'string' && typeof character.name === 'string' && character.name.trim()
    && Number.isInteger(character.level) && character.level >= 1
    && Number.isInteger(character.experience) && character.experience >= 0
    && character.health?.current >= 0 && character.health?.current <= character.health?.max
    && Number.isInteger(character.gold) && character.gold >= 0
    && ATTRIBUTE_DEFINITIONS.every(({ id }) => Number.isInteger(character.stats?.[id]) && character.stats[id] >= 1 && character.stats[id] <= 5)
    && Object.keys(character.stats).length === ATTRIBUTE_DEFINITIONS.length
    && PROFICIENCY_NAMES.every((name) => PROFICIENCY_RANKS.includes(character.proficiencies?.[name])) && trainedCount >= 2
    && character.startingWeapon && typeof character.startingWeapon.id === 'string'
    && Array.isArray(character.startingSkills)
    && EQUIPMENT_SLOTS.every(({ id }) => id in character.equipment)
    && Array.isArray(character.inventory) && Array.isArray(character.statuses)
    && character.flags && typeof character.flags === 'object')
}
